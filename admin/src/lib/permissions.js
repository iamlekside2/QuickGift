// Mirrors the backend RBAC for the UI. The per-user permission list comes from
// the login / auth-me response (user.permissions); owner/admin get ['*'].

export function hasPerm(user, perm) {
  if (!user) return false
  const perms = user.permissions || []
  return perms.includes('*') || perms.includes(perm)
}

/** Any admin-area staff member (has a staff role / permission list). */
export function isStaff(user) {
  if (!user) return false
  if (user.is_staff) return true
  return Array.isArray(user.permissions) && user.permissions.length > 0
}

// Friendly labels/descriptions for the role <select> on the Team screen.
// Must stay in sync with the backend permissions.ts.
export const ROLE_OPTIONS = [
  { value: 'admin', label: 'Administrator', description: 'Full access to run the business and manage workers.' },
  { value: 'operations', label: 'Operations', description: 'Handles orders, bookings, deliveries and disputes.' },
  { value: 'support', label: 'Support', description: 'Helps customers and providers; manages users and applications.' },
  { value: 'catalog', label: 'Catalog Manager', description: 'Manages products, providers and provider applications.' },
  { value: 'finance', label: 'Finance', description: 'Handles transactions, payouts and withdrawals.' },
  { value: 'viewer', label: 'Staff (view only)', description: 'Read-only access to the day-to-day screens.' },
]

// Owner is shown but only an owner can assign it (enforced server-side too).
export const OWNER_OPTION = { value: 'owner', label: 'Owner', description: 'Full access to everything, including the team.' }

export const ROLE_LABELS = {
  owner: 'Owner',
  admin: 'Administrator',
  operations: 'Operations',
  support: 'Support',
  catalog: 'Catalog Manager',
  finance: 'Finance',
  viewer: 'Staff (view only)',
}

export function roleLabel(role) {
  return ROLE_LABELS[role] || role || '—'
}

/** Colour chip per role for the Team table. */
export const ROLE_BADGE = {
  owner: 'badge-green',
  admin: 'badge-blue',
  operations: 'badge-yellow',
  support: 'badge-blue',
  catalog: 'badge-yellow',
  finance: 'badge-green',
  viewer: 'badge-gray',
}
