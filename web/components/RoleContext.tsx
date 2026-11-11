'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type Role = 'customer' | 'provider';

interface RoleState {
  role: Role;
  setRole: (role: Role) => void;
}

const RoleContext = createContext<RoleState | null>(null);

/**
 * Remembers whether the visitor is here as a buyer or a provider. The
 * "Join as a founding provider" buttons set it, and the waitlist form reads it,
 * so the form opens on the right option.
 */
export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('customer');
  const value = useMemo(() => ({ role, setRole }), [role]);
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleState {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used inside <RoleProvider>');
  return ctx;
}
