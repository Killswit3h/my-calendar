export default function MobileCheck() {
  return (
    <main className="min-h-screen safe-p">
      <div className="container space-y-4">
        <h1>Mobile Scale Check</h1>
        <input placeholder="Input" />
        <select>
          <option>Option</option>
        </select>
        <button>Button</button>
        <div className="rounded-xl border border-white/10 p-4">No horizontal scroll. Content fits.</div>
      </div>
    </main>
  );
}
