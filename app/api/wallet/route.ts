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
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json({ balance: wallet?.balance || 0, transactions });
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
