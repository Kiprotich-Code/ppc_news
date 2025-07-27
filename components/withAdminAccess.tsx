// Admin access control HOC
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

export function withAdminAccess<T extends {}>(Component: React.ComponentType<T>) {
  const AdminProtected = (props: T) => {
    const { data: session, status } = useSession();
    const router = useRouter();
    useEffect(() => {
      if (status === 'authenticated' && session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPERADMIN') {
        router.replace('/');
      }
    }, [status, session, router]);
    if (status === 'loading') return <div>Loading...</div>;
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN')) return null;
    return <Component {...props} />;
  };
  return AdminProtected as React.ComponentType<T>;
}