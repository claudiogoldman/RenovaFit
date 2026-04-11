import type { NextRequest } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

export async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    throw new Error('Missing bearer token');
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    throw new Error('Invalid bearer token');
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new Error(error?.message || 'Unauthorized');
  }

  return data.user;
}
