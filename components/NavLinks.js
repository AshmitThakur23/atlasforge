"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-4 text-sm font-medium">
      <Link
        className={
          pathname === "/"
            ? "border-b-2 border-indigo-600 pb-1 font-semibold text-indigo-600"
            : "text-slate-600 hover:text-indigo-600"
        }
        href="/"
      >
        Analyze
      </Link>
      <Link
        className={
          pathname.startsWith("/papers")
            ? "border-b-2 border-indigo-600 pb-1 font-semibold text-indigo-600"
            : "text-slate-600 hover:text-indigo-600"
        }
        href="/papers"
      >
        My Papers
      </Link>
    </nav>
  );
}
