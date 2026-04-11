import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { Branch } from '@/lib/types/multitenancy';

export async function DashboardContent() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [branchesResult, companiesResult, usersResult] = await Promise.all([
    supabase
      .from('branches')
      .select('id, name, city, state, active', { count: 'exact' })
      .order('name'),
    supabase.from('companies').select('id', { count: 'exact' }),
    supabase.from('profiles').select('id', { count: 'exact' }),
  ]);

  if (branchesResult.error) throw new Error(branchesResult.error.message);
  if (companiesResult.error) throw new Error(companiesResult.error.message);
  if (usersResult.error) throw new Error(usersResult.error.message);

  const branches: Branch[] = (branchesResult.data || []) as Branch[];
  const stats = {
    totalCompanies: companiesResult.count || 0,
    totalBranches: branchesResult.count || 0,
    totalUsers: usersResult.count || 0,
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Empresas</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {stats.totalCompanies}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Filiais</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {stats.totalBranches}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Usuários</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {stats.totalUsers}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Filiais Recentes</h3>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {branches.slice(0, 5).map((branch) => (
                <tr key={branch.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {branch.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {branch.city || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {branch.state || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        branch.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {branch.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
