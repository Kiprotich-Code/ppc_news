import { NextResponse } from "next/server";

export async function GET() {
  const requiredEnvVars = {
    MPESA_CONSUMER_KEY: process.env.MPESA_CONSUMER_KEY,
    MPESA_CONSUMER_SECRET: process.env.MPESA_CONSUMER_SECRET,
    MPESA_PASS_KEY: process.env.MPESA_PASS_KEY,
    MPESA_SHORT_CODE: process.env.MPESA_SHORT_CODE,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    DATABASE_URL: process.env.DATABASE_URL
  };

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  return NextResponse.json({
    success: missingVars.length === 0,
    missingVariables: missingVars,
    allVariables: Object.fromEntries(
      Object.entries(requiredEnvVars).map(([key, value]) => [
        key, 
        value ? '***SET***' : '***MISSING***'
      ])
    )
  });
} 