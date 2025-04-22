'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAccessCode } from '@/context/AccessCodeContext';

// Public routes that don't need authentication
const PUBLIC_ROUTES = ['/access'];

type AppRouteProtectorProps = {
  children: ReactNode;
};

export const AppRouteProtector = ({ children }: AppRouteProtectorProps) => {
  const { isAuthenticated, isLoading } = useAccessCode();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
      
      // If not authenticated and trying to access a protected route, redirect to access code page
      if (!isAuthenticated && !isPublicRoute) {
        router.push('/access');
      }
      
      // If already authenticated and trying to access the access code page, redirect to home
      if (isAuthenticated && isPublicRoute) {
        router.push('/');
      }
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  // Show nothing while checking authentication to prevent flickering
  if (isLoading) {
    return null;
  }

  return <>{children}</>;
}; 