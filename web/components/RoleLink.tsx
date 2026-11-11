'use client';

import type { AnchorHTMLAttributes } from 'react';
import { useRole, type Role } from './RoleContext';

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'role'> & { role: Role };

/** A link to the waitlist that also preselects "Buyer" or "Provider" in the form. */
export default function RoleLink({ role, onClick, children, ...rest }: Props) {
  const { setRole } = useRole();
  return (
    <a
      {...rest}
      onClick={(e) => {
        setRole(role);
        onClick?.(e);
      }}
    >
      {children}
    </a>
  );
}
