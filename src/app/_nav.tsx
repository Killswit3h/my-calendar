import { NotifyBell } from '@/app/_notify-bell'

export function AppNav() {
  return (
    <header className="hidden border-b border-white/10 bg-black/40 text-sm text-white md:block">
      <div className="mx-auto flex max-w-7xl items-center justify-end px-6 py-3">
        <NotifyBell />
      </div>
    </header>
  )
}
