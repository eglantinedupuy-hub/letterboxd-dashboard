"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/films", label: "Films" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/lists", label: "Lists" },
];

/** Top navigation bar; highlights the current page. */
export function Nav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-10 border-b border-white/5 bg-background/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 py-3">
        <Link href="/" className="mr-4 flex shrink-0 items-center gap-2 font-bold">
          {/* three dots, a nod to Letterboxd */}
          <span className="flex gap-0.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-accent" />
            <span className="h-2.5 w-2.5 rounded-full bg-star" />
            <span className="h-2.5 w-2.5 rounded-full bg-link" />
          </span>
          My Films
        </Link>
        {LINKS.map((link) => {
          const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm transition ${
                active ? "bg-white text-black" : "text-muted hover:bg-card hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
