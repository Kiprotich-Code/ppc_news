import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { mpesa } from "@/lib/mpesa";

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { courseId, paymentMethod, phoneNumber } = await req.json();
  if (!courseId || !paymentMethod || !phoneNumber) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const userId = session.user.id;

  try {
    // Get course details
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const reference = `COURSE${Date.now()}`;

    if (paymentMethod === 'MPESA') {
      const stkResponse = await mpesa.initiateSTKPush(phoneNumber, course.price, reference);
      
      // Create pending transaction
      await prisma.transaction.create({
        data: {
          userId,
          amount: course.price,
          type: 'course_payment',
          description: `Payment for course: ${course.title}`,
          status: 'PENDING',
          paymentMethod: 'MPESA',
          mpesaRef: stkResponse.CheckoutRequestID
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Please complete the payment on your phone',
        checkoutRequestId: stkResponse.CheckoutRequestID
      });
    }

    return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
  } catch (error) {
    console.error('Course payment error:', error);
    return NextResponse.json({ error: "Failed to process payment" }, { status: 500 });
  }
}
