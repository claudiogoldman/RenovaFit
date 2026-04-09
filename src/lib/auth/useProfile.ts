'use client';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { Profile } from '@/lib/types/multitenancy';
import { ROLE_PERMISSIONS } from '@/lib/types/multitenancy';

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error: queryError } = await supabase
          .from('profiles')
          .select('*, company:companies(*), branch:branches(*)')
          .eq('id', user.id)
          .single();

        if (queryError) {
          setError(queryError.message);
          setLoading(false);
          return;
        }

        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [supabase]);

  const can = (permission: keyof (typeof ROLE_PERMISSIONS)[keyof typeof ROLE_PERMISSIONS]): boolean => {
    if (!profile) return false;
    return ROLE_PERMISSIONS[profile.role][permission];
  };

  return { profile, loading, error, can };
}
