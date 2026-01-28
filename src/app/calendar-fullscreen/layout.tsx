export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[rgba(23,23,23,1)] text-white">
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
