"use client"

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { toast } from 'sonner';

type Role = 'ADMIN' | 'SUPERADMIN' | 'WRITER';

interface RoleAccessConfig {
  allowedRoles: Role[];
  redirectPath: string;
  redirectMessage?: string;
}

// Admin access control HOC - improved version
export function withAdminAccess<T extends {}>(Component: React.ComponentType<T>) {
  const AdminProtected = (props: T) => {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
      if (status === 'loading') return;

      if (!session) {
        router.replace('/auth/signin');
        return;
      }

      if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
        toast.error('Access denied. You need administrator privileges to access this page.');
        router.replace('/auth/signin');
        return;
      }
    }, [status, session, router]);

    if (status === 'loading') {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN')) {
      return null;
    }

    return <Component {...props} />;
  };

  return AdminProtected as React.ComponentType<T>;
}

// Writer/User access control HOC - prevents admins from accessing dashboard
export function withUserAccess<T extends {}>(Component: React.ComponentType<T>) {
  const UserProtected = (props: T) => {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
      if (status === 'loading') return;

      if (!session) {
        router.replace('/auth/signin');
        return;
      }

      // If user is ADMIN or SUPERADMIN, redirect to admin
      if (session.user.role === 'ADMIN' || session.user.role === 'SUPERADMIN') {
        toast.info('Redirecting to admin dashboard...');
        router.replace('/admin');
        return;
      }
    }, [status, session, router]);

    if (status === 'loading') {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    if (!session) {
      return null;
    }

    // If user is admin, show nothing (they'll be redirected)
    if (session.user.role === 'ADMIN' || session.user.role === 'SUPERADMIN') {
      return null;
    }

    return <Component {...props} />;
  };

  return UserProtected as React.ComponentType<T>;
}

// Generic role access control HOC
export function withRoleAccess<T extends {}>(
  Component: React.ComponentType<T>, 
  config: RoleAccessConfig
) {
  const RoleProtected = (props: T) => {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
      if (status === 'loading') return;

      if (!session) {
        router.replace('/auth/signin');
        return;
      }

      if (!config.allowedRoles.includes(session.user.role as Role)) {
        if (config.redirectMessage) {
          toast.error(config.redirectMessage);
        }
        router.replace(config.redirectPath);
        return;
      }
    }, [status, session, router]);

    if (status === 'loading') {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    if (!session || !config.allowedRoles.includes(session.user.role as Role)) {
      return null;
    }

    return <Component {...props} />;
  };

  return RoleProtected as React.ComponentType<T>;
}

// Hook for checking user role
export function useRole() {
  const { data: session } = useSession();
  
  return {
    role: session?.user?.role as Role | undefined,
    isAdmin: session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPERADMIN',
    isWriter: session?.user?.role === 'WRITER',
    isSuperAdmin: session?.user?.role === 'SUPERADMIN',
    hasRole: (roles: Role[]) => session?.user?.role && roles.includes(session.user.role as Role)
  };
}
