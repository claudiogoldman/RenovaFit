export type UserRole = 'super_admin' | 'branch_admin' | 'attendant' | 'viewer';

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  company_id: string;
  name: string;
  city?: string;
  state?: string;
  phone?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  company?: Company;
}

export interface Profile {
  id: string;
  company_id?: string;
  branch_id?: string;
  role: UserRole;
  full_name?: string;
  avatar_url?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  company?: Company;
  branch?: Branch;
}

export interface UserWithProfile {
  id: string;
  email: string;
  profile: Profile;
}

// Permissões por papel
export const ROLE_PERMISSIONS: Record<
  UserRole,
  {
    canManageCompanies: boolean;
    canManageBranches: boolean;
    canManageUsers: boolean;
    canViewAllBranches: boolean;
    canEditStudents: boolean;
    canViewReports: boolean;
  }
> = {
  super_admin: {
    canManageCompanies: true,
    canManageBranches: true,
    canManageUsers: true,
    canViewAllBranches: true,
    canEditStudents: true,
    canViewReports: true,
  },
  branch_admin: {
    canManageCompanies: false,
    canManageBranches: false,
    canManageUsers: true, // só da sua filial
    canViewAllBranches: false,
    canEditStudents: true,
    canViewReports: true,
  },
  attendant: {
    canManageCompanies: false,
    canManageBranches: false,
    canManageUsers: false,
    canViewAllBranches: false,
    canEditStudents: true,
    canViewReports: false,
  },
  viewer: {
    canManageCompanies: false,
    canManageBranches: false,
    canManageUsers: false,
    canViewAllBranches: false,
    canEditStudents: false,
    canViewReports: true,
  },
};
