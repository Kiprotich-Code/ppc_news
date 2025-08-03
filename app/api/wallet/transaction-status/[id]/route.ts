import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params; // Resolve the Promise to get the id
    const transaction = await prisma.transaction.findFirst({
      where: { 
        id,
        userId: session.user.id 
      }
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: transaction.id,
      status: transaction.status,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt
    });
  } catch (error) {
    console.error('Error fetching transaction status:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}