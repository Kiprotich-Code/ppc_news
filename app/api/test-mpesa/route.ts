import { NextResponse } from "next/server";
import { mpesa } from "@/lib/mpesa";

export async function GET() {
  try {
    console.log('Testing M-pesa configuration...');
    
    // Test getting access token
    const token = await (mpesa as any).getAccessToken();
    
    return NextResponse.json({
      success: true,
      message: 'M-pesa configuration is working',
      hasToken: !!token
    });
  } catch (error: any) {
    console.error('M-pesa test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 