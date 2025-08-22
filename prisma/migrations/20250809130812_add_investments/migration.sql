-- CreateEnum
CREATE TYPE "public"."InvestmentPeriod" AS ENUM ('ONE_WEEK', 'TWO_WEEKS', 'ONE_MONTH');

-- CreateEnum
CREATE TYPE "public"."InvestmentStatus" AS ENUM ('ACTIVE', 'MATURED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "public"."investments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "period" "public"."InvestmentPeriod" NOT NULL,
    "interestRate" DOUBLE PRECISION NOT NULL,
    "status" "public"."InvestmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "earnedInterest" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalReturn" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."investments" ADD CONSTRAINT "investments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
