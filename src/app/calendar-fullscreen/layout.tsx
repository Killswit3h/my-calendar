import Link from 'next/link'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[rgba(23,23,23,1)] text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-sm">
        <Link href="/" className="btn">
          ← Back to Dashboard
        </Link>
        <div />
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
