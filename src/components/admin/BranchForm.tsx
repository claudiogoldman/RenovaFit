'use client';
import { useEffect, useState } from 'react';
import { Branch, Company } from '@/lib/types/multitenancy';

interface BranchFormProps {
  branch?: Branch;
  companies: Company[];
  onSuccess: () => void;
}

export function BranchForm({ branch, companies, onSuccess }: BranchFormProps) {
  const [formData, setFormData] = useState({
    company_id: '',
    name: '',
    city: '',
    state: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (branch) {
      setFormData({
        company_id: branch.company_id,
        name: branch.name,
        city: branch.city || '',
        state: branch.state || '',
        phone: branch.phone || '',
      });
    }
  }, [branch]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const method = branch ? 'PATCH' : 'POST';
      const body = branch
        ? { branch_id: branch.id, ...formData, active: branch.active }
        : formData;

      const res = await fetch('/api/admin/branches', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao salvar filial');
      }

      setFormData({
        company_id: '',
        name: '',
        city: '',
        state: '',
        phone: '',
      });
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
        <label className="block text-sm font-medium text-gray-700">Empresa</label>
        <select
          name="company_id"
          value={formData.company_id}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border px-3 py-2"
        >
          <option value="">Selecione uma empresa</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </div>

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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Cidade</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Estado</label>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Telefone</label>
        <input
          type="text"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
      >
        {loading ? 'Salvando...' : branch ? 'Atualizar' : 'Criar'}
      </button>
    </form>
  );
}
