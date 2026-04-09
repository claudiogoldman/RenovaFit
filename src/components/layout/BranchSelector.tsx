'use client';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { useProfile } from '@/lib/auth/useProfile';
import type { Branch } from '@/lib/types/multitenancy';

export function BranchSelector() {
  const { profile, loading } = useProfile();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [loadingBranches, setLoadingBranches] = useState(false);
  const supabase = createSupabaseBrowserClient();

  // Só aparece para super_admin
  if (!loading && profile?.role !== 'super_admin') {
    return null;
  }

  useEffect(() => {
    if (profile?.role !== 'super_admin') return;

    const fetchBranches = async () => {
      setLoadingBranches(true);
      try {
        const { data } = await supabase
          .from('branches')
          .select('*, company:companies(name)')
          .eq('active', true)
          .order('name');

        if (data) {
          setBranches(data);
        }
      } finally {
        setLoadingBranches(false);
      }
    };

    fetchBranches();
  }, [profile?.role, supabase]);

  if (loading || loadingBranches) {
    return <div className="text-xs text-slate-400">Carregando filiais...</div>;
  }

  return (
    <select
      value={selected}
      onChange={(e) => setSelected(e.target.value)}
      disabled={loadingBranches}
      className="text-sm border border-slate-600 rounded px-3 py-2 bg-slate-900 text-white hover:border-slate-500 disabled:opacity-50"
    >
      <option value="">— Todas as filiais —</option>
      {branches.map((b) => (
        <option key={b.id} value={b.id}>
          {b.company?.name} — {b.name}
        </option>
      ))}
    </select>
  );
}
