import { prisma } from "@/lib/db";
import { PaymentMethod, TransactionStatus } from "@prisma/client";

// Credit wallet (deposits)
export async function creditWallet(
  userId: string, 
  amount: number, 
  description: string, 
  type: string = "deposit",
  paymentMethod?: PaymentMethod
) {
  let wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) {
    wallet = await prisma.wallet.create({ 
      data: { 
        userId, 
        balance: 0,
        earnings: 0,
        currency: 'KES'
      } 
    });
  }
  
  const updated = await prisma.wallet.update({
    where: { userId },
    data: { balance: { increment: amount } },
  });

  await prisma.transaction.create({
    data: {
      userId,
      amount,
      type,
      description,
      status: TransactionStatus.COMPLETED,
      paymentMethod
    },
  });

  return updated;
}

// Credit earnings (from views, referrals etc)
export async function creditEarnings(userId: string, amount: number, description: string) {
  let wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) {
    wallet = await prisma.wallet.create({ 
      data: { 
        userId, 
        balance: 0,
        earnings: 0,
        currency: 'KES'
      } 
    });
  }
  const updated = await prisma.wallet.update({
    where: { userId },
    data: { earnings: { increment: amount } },
  });
  await prisma.transaction.create({
    data: {
      userId,
      amount,
      type: 'earning',
      description,
      status: 'COMPLETED'
    },
  });
  return updated;
}

// Debit wallet (withdrawals, payments)
export async function debitWallet(
  userId: string, 
  amount: number, 
  description: string, 
  type: string = "withdrawal",
  paymentMethod?: 'MPESA'
) {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet || wallet.balance < amount) {
    throw new Error("Insufficient balance");
  }
  const updated = await prisma.wallet.update({
    where: { userId },
    data: { balance: { decrement: amount } },
  });
  await prisma.transaction.create({
    data: {
      userId,
      amount: -amount,
      type,
      description,
      status: 'COMPLETED',
      paymentMethod
    },
  });
  return updated;
}

// Get user's wallet including balance and earnings
export async function getWalletDetails(userId: string) {
  let wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) {
    wallet = await prisma.wallet.create({ 
      data: { 
        userId, 
        balance: 0,
        earnings: 0,
        currency: 'KES'
      } 
    });
  }
  return wallet;
}

// Verify M-Pesa transaction status
export async function verifyMpesaTransaction(checkoutRequestId: string) {
  const transaction = await prisma.transaction.findFirst({
    where: { 
      mpesaRef: checkoutRequestId,
      status: 'PENDING'
    }
  });
  return transaction;
}
