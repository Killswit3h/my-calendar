export default function AppTopbar() {
  return (
    <header className="sticky top-0 z-10 px-4 py-3 backdrop-blur-xl border-b border-white/10 bg-black/20">
      <div className="mx-auto max-w-7xl flex items-center gap-3">
        <input
          placeholder="Search…"
          className="w-full md:max-w-md bg-white/5 border border-white/10 rounded-md px-3 py-2 outline-none focus:border-white/20"
        />
        <button className="btn">Quick Add</button>
        <div className="size-9 rounded-full bg-white/10" aria-label="User" />
      </div>
    </header>
  );
}