// Admin access control HOC - Use withRoleAccess.tsx for new implementations
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { toast } from 'sonner';

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