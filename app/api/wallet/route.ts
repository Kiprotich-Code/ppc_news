import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { mpesa } from "@/lib/mpesa";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  
  // Get or create wallet
  let wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) {
    // Create wallet using Prisma ORM
    wallet = await prisma.wallet.create({
      data: {
        userId,
        balance: 0,
        earnings: 0,
        currency: 'KES'
      }
    });
  }

  // Get wallet data with investment field using raw SQL
  const walletData = await prisma.$queryRaw<Array<{
    balance: number;
    earnings: number;
    investment: number;
    currency: string;
  }>>`
    SELECT balance, earnings, investment, currency 
    FROM "Wallet" 
    WHERE "userId" = ${userId}
  `;

  const currentWallet = walletData[0];

  // Calculate actual earnings from articles (from Earning table)
  const articleEarnings = await prisma.earning.aggregate({
    where: { userId },
    _sum: { amount: true }
  });

  // Calculate what's already been transferred to wallet from earnings
  const transferredEarnings = await prisma.transaction.aggregate({
    where: { 
      userId,
      type: 'transfer',
      status: 'COMPLETED',
      description: 'Transfer earnings to wallet'
    },
    _sum: { amount: true }
  });

  // Available earnings = total article earnings - already transferred earnings
  const totalArticleEarnings = articleEarnings._sum.amount || 0;
  const alreadyTransferred = transferredEarnings._sum.amount || 0;
  const availableArticleEarnings = Math.max(0, totalArticleEarnings - alreadyTransferred);
  
  // Calculate referral earnings (wallet earnings that aren't from articles)
  const totalWalletEarnings = currentWallet.earnings || 0;
  const referralEarnings = Math.max(0, totalWalletEarnings - availableArticleEarnings);
  
  // Total available earnings = article earnings + referral earnings
  const availableEarnings = availableArticleEarnings + referralEarnings;

  // Get recent transactions
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Calculate pending withdrawals
  const pendingWithdrawals = await prisma.transaction.findMany({
    where: { 
      userId,
      type: 'WITHDRAWAL',
      status: 'PENDING'
    }
  });
  
  const totalPendingWithdrawals = pendingWithdrawals.reduce((sum, txn) => sum + txn.amount, 0);

  // Calculate total deposits and withdrawals
  const allTransactions = await prisma.transaction.findMany({
    where: { userId }
  });

  const totalDeposits = allTransactions
    .filter(txn => txn.type === 'DEPOSIT' && txn.status === 'COMPLETED')
    .reduce((sum, txn) => sum + txn.amount, 0);

  const totalWithdrawals = allTransactions
    .filter(txn => txn.type === 'WITHDRAWAL' && txn.status === 'COMPLETED')
    .reduce((sum, txn) => sum + txn.amount, 0);

  return NextResponse.json({ 
    wallet: {
      balance: currentWallet.balance,
      investment: currentWallet.investment,
      earnings: availableEarnings, // Use calculated available earnings
      pendingWithdrawals: totalPendingWithdrawals,
      totalDeposits,
      totalWithdrawals,
      currency: currentWallet.currency
    },
    transactions 
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { amount, paymentMethod, phoneNumber, description, type } = await req.json();
    const userId = session.user.id;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    // Validate phone number format (should start with 254)
    const phoneRegex = /^254[0-9]{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return NextResponse.json({ error: "Invalid phone number format. Use format: 254712345678" }, { status: 400 });
    }

    // Check if user has sufficient balance for withdrawal
    if (type === 'withdrawal') {
      const wallet = await prisma.wallet.findUnique({ where: { userId } });
      if (!wallet || wallet.balance < amount) {
        return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
      }
      
      // Deduct amount from wallet for withdrawal
      await prisma.wallet.update({
        where: { userId },
        data: { balance: { decrement: amount } }
      });
    }

    // Generate a unique reference for the transaction
    const reference = `TXN_${Date.now()}_${userId}`;

    console.log(`Initiating M-pesa ${type} for user ${userId}, amount: ${amount}, phone: ${phoneNumber}`);

    // Initiate M-pesa STK push
    const mpesaResponse = await mpesa.initiateSTKPush(phoneNumber, amount, reference);

    console.log('M-pesa response:', mpesaResponse);

    if (!mpesaResponse.CheckoutRequestID) {
      throw new Error('Failed to initiate M-pesa payment');
    }

    // Create a pending transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount,
        type: type.toUpperCase(),
        status: 'PENDING',
        description: description || `${type} via M-pesa`,
        paymentMethod: 'MPESA',
        reference: mpesaResponse.CheckoutRequestID,
        mpesaRequestId: mpesaResponse.CheckoutRequestID,
        mpesaMerchantRequestId: mpesaResponse.MerchantRequestID
      }
    });

    console.log('Created transaction:', {
      id: transaction.id,
      userId: transaction.userId,
      amount: transaction.amount,
      type: transaction.type,
      status: transaction.status,
      mpesaRequestId: transaction.mpesaRequestId
    });

    return NextResponse.json({
      success: true,
      message: `M-pesa ${type} initiated successfully`,
      transactionId: transaction.id,
      checkoutRequestId: mpesaResponse.CheckoutRequestID,
      merchantRequestId: mpesaResponse.MerchantRequestID
    });

  } catch (error: any) {
    console.error('M-pesa payment error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to initiate M-pesa payment' 
    }, { status: 500 });
  }
}
