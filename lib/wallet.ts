import { prisma } from "@/lib/db";

// Credit wallet (earnings, deposits)
export async function creditWallet(userId: string, amount: number, description: string, type: string = "earning") {
  let wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) {
    wallet = await prisma.wallet.create({ data: { userId, balance: 0 } });
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
    },
  });
  return updated.balance;
}

// Debit wallet (deductions, payments)
export async function debitWallet(userId: string, amount: number, description: string, type: string = "deduction") {
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
    },
  });
  return updated.balance;
}
