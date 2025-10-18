"use client";
import { useRouter } from "next/navigation";

export default function BackButton({ href = "/" }: { href?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => (history.length > 1 ? router.back() : router.push(href))}
      className="btn"
      aria-label="Back"
    >
      ← Back
    </button>
  );
}