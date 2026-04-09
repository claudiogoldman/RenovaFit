'use client';
import { useProfile } from '@/lib/auth/useProfile';
import type { UserRole } from '@/lib/types/multitenancy';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children, fallback = null }: RoleGuardProps) {
  const { profile, loading } = useProfile();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
        <span className="ml-3 text-slate-300">Carregando...</span>
      </div>
    );
  }

  if (!profile || !allowedRoles.includes(profile.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
