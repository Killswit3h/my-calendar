import "./fullscreen.css";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fullscreen-layout">
      {children}
    </div>
  );
}
