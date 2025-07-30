import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { creditWallet } from "@/lib/wallet";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const { amount } = await req.json();
  if (!amount || amount <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  await creditWallet(userId, amount, "Manual deposit", "deposit");
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  const transactions = await prisma.transaction.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20 });
  return NextResponse.json({ balance: wallet?.balance || 0, transactions });
}
