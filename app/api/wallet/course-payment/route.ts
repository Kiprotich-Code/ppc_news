import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PayHeroService } from "@/lib/payhero";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    logger.info('PayHero course payment request started');
    
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      logger.error('Unauthorized course payment attempt');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Expected body: { courseId, paymentMethod, phoneNumber }
    const body = await req.json();
    logger.debug('Course payment request received');
    
    const { courseId, paymentMethod, phoneNumber } = body;
    if (!courseId || !paymentMethod) {
      logger.error('Missing required fields for course payment');
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (paymentMethod !== 'MPESA') {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
    }
    
    // Get course details
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Handle free courses - enroll directly without payment
    if (course.isFree || course.price <= 0) {
      try {
        // Check if already enrolled
        const existingEnrollment = await prisma.courseEnrollment.findUnique({
          where: {
            userId_courseId: {
              userId,
              courseId
            }
          }
        });

        if (existingEnrollment) {
          return NextResponse.json({ 
            success: true, 
            message: 'You are already enrolled in this course',
            alreadyEnrolled: true 
          });
        }

        // Create free enrollment
        await prisma.courseEnrollment.create({
          data: {
            userId,
            courseId,
            enrolledAt: new Date(),
            progress: 0
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Successfully enrolled in free course!',
          freeEnrollment: true
        });
      } catch (error) {
        console.error('Free course enrollment error:', error);
        return NextResponse.json({ error: "Failed to enroll in course" }, { status: 500 });
      }
    }

    // For paid courses, phone number is required
    if (!phoneNumber) {
      console.error('Phone number required for paid courses:', { userId, courseId, paymentMethod });
      return NextResponse.json({ error: "Phone number is required for paid courses" }, { status: 400 });
    }

    if (course.price <= 0) {
      console.error('Invalid course price:', course.price);
      return NextResponse.json({ error: "Invalid course price" }, { status: 400 });
    }
    
    logger.payment('Initiating PayHero operation');
    
    // Generate unique reference
    const reference = `COURSE_${Date.now()}_${userId}_${courseId}`;
    console.log('Generated reference:', reference);
    
    // Initiate PayHero STK push
    console.log('Creating PayHero service...');
    let service;
    try {
      service = new PayHeroService();
      console.log('PayHero service created successfully');
    } catch (serviceError: any) {
      console.error('Failed to create PayHero service:', serviceError);
      return NextResponse.json({ 
        error: `PayHero configuration error: ${serviceError?.message || 'Unknown error'}` 
      }, { status: 500 });
    }
    
    console.log('Calling PayHero initiateDeposit...');
    const payResponse = await service.initiateDeposit({
      amount: course.price,
      phoneNumber,
      reference,
      description: `Payment for course: ${course.title}`
    });
    
    logger.debug('PayHero response received');
    
    // Check if PayHero returned an error
    if (payResponse.error) {
      logger.error('PayHero operation failed');
      return NextResponse.json({ 
        error: payResponse.error 
      }, { status: 500 });
    }
    
    // PayHero success response should contain: success, status, reference, CheckoutRequestID
    if (!payResponse.success || !payResponse.CheckoutRequestID) {
      console.error('Invalid PayHero response:', payResponse);
      return NextResponse.json({ 
        error: 'Invalid PayHero response' 
      }, { status: 500 });
    }
    
    // Record pending transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount: course.price,
        type: 'course_payment',
        status: 'PENDING',
        description: `Payment for course: ${course.title}`,
        paymentMethod: 'MPESA',
        reference: payResponse.CheckoutRequestID,
        mpesaRequestId: payResponse.CheckoutRequestID,
        mpesaMerchantRequestId: payResponse.reference || '',
        // Store course ID for later reference
        metadata: JSON.stringify({ courseId: courseId })
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'M-Pesa STK push sent to your phone. Check your phone to complete payment.',
      transactionId: transaction.id,
      checkoutRequestId: payResponse.CheckoutRequestID,
      status: payResponse.status
    });
    
  } catch (error: any) {
    console.error('Course payment endpoint error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}
