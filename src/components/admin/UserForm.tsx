'use client';
import { useEffect, useState } from 'react';
import { Branch, UserRole } from '@/lib/types/multitenancy';

interface User {
  id: string;
  email: string;
  profile: {
    full_name?: string;
    role: UserRole;
    branch_id?: string;
    active: boolean;
  };
}

interface UserFormProps {
  user?: User;
  branches: Branch[];
  onSuccess: () => void;
}

export function UserForm({ user, branches, onSuccess }: UserFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'viewer' as UserRole,
    branch_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        password: '',
        full_name: user.profile.full_name || '',
        role: user.profile.role,
        branch_id: user.profile.branch_id || '',
      });
    }
  }, [user]);

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
      if (user) {
        // Update user
        const res = await fetch('/api/admin/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            role: formData.role,
            active: user.profile.active,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Erro ao atualizar usuário');
        }
      } else {
        // Create user
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            full_name: formData.full_name,
            role: formData.role,
            branch_id: formData.branch_id || null,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Erro ao criar usuário');
        }
      }

      setFormData({
        email: '',
        password: '',
        full_name: '',
        role: 'viewer',
        branch_id: '',
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
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={!!user}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border px-3 py-2 disabled:bg-gray-100"
        />
      </div>

      {!user && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Senha</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required={!user}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border px-3 py-2"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
        <input
          type="text"
          name="full_name"
          value={formData.full_name}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Papel</label>
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border px-3 py-2"
        >
          <option value="super_admin">Super Admin</option>
          <option value="branch_admin">Admin de Filial</option>
          <option value="attendant">Atendente</option>
          <option value="viewer">Visualizador</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Filial</label>
        <select
          name="branch_id"
          value={formData.branch_id}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border px-3 py-2"
        >
          <option value="">Nenhuma (Super Admin)</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
      >
        {loading ? 'Salvando...' : user ? 'Atualizar' : 'Criar'}
      </button>
    </form>
  );
}
