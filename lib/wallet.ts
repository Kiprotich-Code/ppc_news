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
  return wallet;
}

// Transfer earnings to wallet balance
export async function transferEarningsToWallet(userId: string, amount: number) {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet || wallet.earnings < amount) {
    throw new Error("Insufficient earnings");
  }
  
  const updated = await prisma.wallet.update({
    where: { userId },
    data: {
      earnings: { decrement: amount },
      balance: { increment: amount }
    }
  });

  await prisma.transaction.create({
    data: {
      userId,
      amount,
      type: 'transfer',
      description: 'Transfer earnings to wallet',
      status: 'COMPLETED'
    },
  });

  return updated;
}

// Invest funds (move from balance to investment)
export async function investFunds(userId: string, amount: number) {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet || wallet.balance < amount) {
    throw new Error("Insufficient balance");
  }
  
  // Use raw SQL to work around TypeScript issues
  const updated = await prisma.$executeRaw`
    UPDATE "Wallet" 
    SET balance = balance - ${amount}, investment = investment + ${amount}, "updatedAt" = NOW()
    WHERE "userId" = ${userId}
  `;

  await prisma.transaction.create({
    data: {
      userId,
      amount: -amount, // Negative to show it was deducted from balance
      type: 'investment',
      description: 'Investment (Hold & Earn)',
      status: 'COMPLETED'
    },
  });

  // Return updated wallet
  const updatedWallet = await prisma.wallet.findUnique({ where: { userId } });
  return updatedWallet;
}

// Withdraw from investment to balance
export async function withdrawInvestment(userId: string, amount: number) {
  // Use raw SQL to check investment balance
  const walletData = await prisma.$queryRaw<Array<{investment: number}>>`
    SELECT investment FROM "Wallet" WHERE "userId" = ${userId}
  `;
  
  if (!walletData || walletData.length === 0 || walletData[0].investment < amount) {
    throw new Error("Insufficient investment balance");
  }
  
  // Use raw SQL to update
  await prisma.$executeRaw`
    UPDATE "Wallet" 
    SET investment = investment - ${amount}, balance = balance + ${amount}, "updatedAt" = NOW()
    WHERE "userId" = ${userId}
  `;

  await prisma.transaction.create({
    data: {
      userId,
      amount,
      type: 'investment_withdrawal',
      description: 'Withdrawal from Investment',
      status: 'COMPLETED'
    },
  });

  // Return updated wallet
  const updatedWallet = await prisma.wallet.findUnique({ where: { userId } });
  return updatedWallet;
}

// Credit investment interest (2% monthly for example)
export async function creditInvestmentInterest(userId: string) {
  // Use raw SQL to check investment balance
  const walletData = await prisma.$queryRaw<Array<{investment: number}>>`
    SELECT investment FROM "Wallet" WHERE "userId" = ${userId}
  `;
  
  if (!walletData || walletData.length === 0 || walletData[0].investment <= 0) {
    throw new Error("No investment balance");
  }
  
  const interestRate = 0.02; // 2%
  const interestAmount = walletData[0].investment * interestRate;
  
  // Use raw SQL to update
  await prisma.$executeRaw`
    UPDATE "Wallet" 
    SET investment = investment + ${interestAmount}, "updatedAt" = NOW()
    WHERE "userId" = ${userId}
  `;

  await prisma.transaction.create({
    data: {
      userId,
      amount: interestAmount,
      type: 'interest',
      description: 'Investment Interest (2%)',
      status: 'COMPLETED'
    },
  });

  // Return updated wallet
  const updatedWallet = await prisma.wallet.findUnique({ where: { userId } });
  return updatedWallet;
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
