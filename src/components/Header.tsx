"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="p-4 bg-gray-100">
      <nav className="flex gap-4">
        <Link href="/weather" className="btn">Weather</Link>
        <Link href="/employees" className="btn">Employees</Link>
      </nav>
    </header>
  );
}

