import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET: List members and details
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');
    if (userId) {
      // Get full details for one user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          articles: true,
          withdrawals: true,
          earnings: true,
          auditLogs: true,
          profile: true,
        },
      });
      return NextResponse.json({ user });
    }
    // List all members (basic info with profile details)
    const users = await prisma.user.findMany({
      include: {
        profile: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ users });
  } catch (error) {
    console.error("Admin members API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Suspend or flag account
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, action } = body;
    if (!id || !action) {
      return NextResponse.json({ error: 'Missing id or action' }, { status: 400 });
    }

    // Check if user exists first
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let updateData: any = {};
    let additionalActions = [];

    if (action === 'suspend') {
      updateData.role = 'SUSPENDED';
    } else if (action === 'flag') {
      updateData.role = 'FLAGGED';
      
      // Also update or create profile with flagged status
      if (existingUser.profile) {
        additionalActions.push(
          prisma.profile.update({
            where: { userId: id },
            data: { tags: 'FLAGGED' },
          })
        );
      } else {
        // Create profile if it doesn't exist
        additionalActions.push(
          prisma.profile.create({
            data: {
              userId: id,
              tags: 'FLAGGED',
            },
          })
        );
      }
    }

    if (!Object.keys(updateData).length) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Execute all operations
    const operations = [
      prisma.user.update({
        where: { id },
        data: updateData,
      }),
      ...additionalActions,
    ];

    const results = await Promise.all(operations);
    const updated = results[0]; // The user update result

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error('Error in POST /api/admin/members:', error);
    
    // More specific error handling
    if (error instanceof Error) {
      if (error.message.includes('Record to update not found')) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json({ error: 'Profile already exists' }, { status: 400 });
      }
    }
    
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE: Delete a user account
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        articles: true,
        profile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Prevent deletion of the current admin user
    if (user.id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Delete user and related data (cascade delete through Prisma schema)
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ 
      message: "User deleted successfully",
      deletedUser: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}