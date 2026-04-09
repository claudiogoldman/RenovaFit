import type { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { Profile, UserRole } from '@/lib/types/multitenancy';
import { getAuthenticatedUser } from '@/lib/supabase-auth';

export async function getProfile(request: NextRequest): Promise<Profile | null> {
  try {
    const user = await getAuthenticatedUser(request);
    const supabase = createSupabaseServerClient();

    const { data } = await supabase
      .from('profiles')
      .select('*, company:companies(*), branch:branches(*)')
      .eq('id', user.id)
      .single();

    return data;
  } catch {
    return null;
  }
}

export async function requireRole(request: NextRequest, allowedRoles: UserRole[]): Promise<Profile> {
  const profile = await getProfile(request);
  if (!profile || !allowedRoles.includes(profile.role)) {
    throw new Error('Acesso negado');
  }
  return profile;
}
