/**
 * Role-based access control for the admin console ("workers").
 *
 * Every admin-area staff member is a `users` row whose `role` is one of
 * ADMIN_ROLES. Each role maps to a set of permission strings. `owner` and
 * `admin` get the wildcard '*' (everything). The limited roles get only what
 * their job needs. This map is the single source of truth: the API enforces it
 * via PermGuard and the frontend mirrors the per-user permission list it gets
 * back at login to show/hide nav and screens.
 */

export type Permission =
  | 'orders.view'
  | 'orders.manage'
  | 'bookings.view'
  | 'bookings.manage'
  | 'products.view'
  | 'products.manage'
  | 'providers.view'
  | 'providers.manage'
  | 'applications.view'
  | 'applications.manage'
  | 'users.view'
  | 'users.manage'
  | 'finance.view'
  | 'finance.manage'
  | 'disputes.view'
  | 'disputes.manage'
  | 'settings.manage'
  | 'team.manage';

// Order matters only for display; 'owner' is the top of the hierarchy.
export const ADMIN_ROLES = [
  'owner',
  'admin',
  'operations',
  'support',
  'catalog',
  'finance',
  'viewer',
] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

/** Roles that may create/edit/delete other staff (team management). */
export const TEAM_MANAGER_ROLES: AdminRole[] = ['owner', 'admin'];

/**
 * Protected roles that only an `owner` may assign, modify, or remove. An
 * `admin` can manage every other role (including other admins) but cannot touch
 * an Owner or mint one — that keeps the founder account safe from other staff.
 */
export const ELEVATED_ROLES: string[] = ['owner'];

export const ROLE_LABELS: Record<AdminRole, string> = {
  owner: 'Owner',
  admin: 'Administrator',
  operations: 'Operations',
  support: 'Support',
  catalog: 'Catalog Manager',
  finance: 'Finance',
  viewer: 'Staff (view only)',
};

export const ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  owner: 'Full access to everything, including billing and the team.',
  admin: 'Full access to run the business and manage workers.',
  operations: 'Handles orders, bookings, deliveries and disputes.',
  support: 'Helps customers and providers; manages users and applications.',
  catalog: 'Manages products, providers and provider applications.',
  finance: 'Handles transactions, payouts and withdrawals.',
  viewer: 'Read-only access to the day-to-day screens.',
};

export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  owner: ['*'],
  admin: ['*'],
  operations: [
    'orders.view',
    'orders.manage',
    'bookings.view',
    'bookings.manage',
    'disputes.view',
    'disputes.manage',
    'providers.view',
    'users.view',
    'applications.view',
  ],
  support: [
    'users.view',
    'users.manage',
    'applications.view',
    'applications.manage',
    'disputes.view',
    'disputes.manage',
    'orders.view',
    'bookings.view',
    'providers.view',
  ],
  catalog: [
    'products.view',
    'products.manage',
    'providers.view',
    'providers.manage',
    'applications.view',
    'applications.manage',
  ],
  finance: [
    'finance.view',
    'finance.manage',
    'orders.view',
    'bookings.view',
  ],
  viewer: [
    'orders.view',
    'bookings.view',
    'products.view',
    'providers.view',
    'applications.view',
    'users.view',
  ],
};

export function isAdminRole(role?: string | null): boolean {
  return !!role && (ADMIN_ROLES as readonly string[]).includes(role);
}

/** The flat permission list for a role (wildcard roles return ['*']). */
export function permissionsForRole(role?: string | null): string[] {
  if (!role) return [];
  return ROLE_PERMISSIONS[role as AdminRole] || [];
}

/** True if the role grants the given permission (handles the '*' wildcard). */
export function roleHasPermission(
  role: string | null | undefined,
  permission: string,
): boolean {
  const perms = permissionsForRole(role);
  return perms.includes('*') || perms.includes(permission);
}
