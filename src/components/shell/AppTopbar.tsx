"use client";

type AppTopbarProps = {
  onToggleSidebar?: () => void;
  title?: string;
};

export default function AppTopbar({ onToggleSidebar, title = "Planner" }: AppTopbarProps) {
  return (
    <header className="safe-p sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-black/60 backdrop-blur md:hidden">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/20 text-white"
        aria-label="Toggle navigation"
      >
        ☰
      </button>
      <span className="text-sm font-semibold text-white">{title}</span>
      <div className="w-9" />
    </header>
  );
}
