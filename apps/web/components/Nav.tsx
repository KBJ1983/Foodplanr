'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/planer', label: 'Planer' },
  { href: '/arkiv', label: 'Arkiv' },
  { href: '/indkob', label: 'Indkøb' },
  { href: '/profil', label: 'Profil' },
] as const;

/** Word navigation in the top; active = 3px underline. No icon tab bar. */
export function Nav() {
  const path = usePathname();
  return (
    <nav className="nav" aria-label="Hovedmenu">
      <Link href="/" className="logo desk-only" aria-label="foodplanr forside">
        foodplanr
      </Link>
      {ITEMS.map((it) => {
        const active = path === it.href || path.startsWith(it.href + '/');
        return (
          <Link key={it.href} href={it.href} aria-current={active ? 'page' : undefined}>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
