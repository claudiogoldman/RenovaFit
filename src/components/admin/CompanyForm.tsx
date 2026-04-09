'use client';
import { useEffect, useState } from 'react';
import { Company } from '@/lib/types/multitenancy';

interface CompanyFormProps {
  company?: Company;
  onSuccess: () => void;
}

export function CompanyForm({ company, onSuccess }: CompanyFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    logo_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        slug: company.slug,
        logo_url: company.logo_url || '',
      });
    }
  }, [company]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const method = company ? 'PATCH' : 'POST';
      const body = company
        ? { company_id: company.id, ...formData, active: company.active }
        : { ...formData };

      const res = await fetch('/api/admin/companies', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao salvar empresa');
      }

      setFormData({ name: '', slug: '', logo_url: '' });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
      {error && <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-gray-700">Nome</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Slug</label>
        <input
          type="text"
          name="slug"
          value={formData.slug}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">URL do Logo</label>
        <input
          type="text"
          name="logo_url"
          value={formData.logo_url}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
      >
        {loading ? 'Salvando...' : company ? 'Atualizar' : 'Criar'}
      </button>
    </form>
  );
}
