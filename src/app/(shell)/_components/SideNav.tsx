'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  // ...existing
  { href: '/estimates', label: 'Estimates' },
  { href: '/change-orders', label: 'Change Orders' },
]

export default function SideNav() {
  const path = usePathname() ?? ''
  return (
    <nav className="space-y-2 p-4">
      {links.map(link => (
        <Link
          key={link.href}
          href={link.href}
          className={`block rounded px-3 py-2 text-sm ${
            path.startsWith(link.href) ? 'bg-zinc-800 text-white' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
