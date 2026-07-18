"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Crosshair, LayoutList } from "lucide-react";

const items = [
  { href: "/", label: "Matches", icon: LayoutList },
  { href: "/scout", label: "Scout", icon: Crosshair },
  { href: "/saved", label: "Saved", icon: Bookmark },
] as const;

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t border-[var(--border)] bg-[rgba(7,11,20,0.92)] backdrop-blur-md"
      style={{ paddingBottom: "var(--safe-bottom)" }}
      aria-label="Primary"
    >
      <ul className="grid h-[var(--nav-height)] grid-cols-3 px-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/" || pathname.startsWith("/match/")
              : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <li key={href}>
              <Link
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                  active
                    ? "text-[var(--accent)]"
                    : "text-[var(--text-dim)] hover:text-[var(--text-muted)]"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${active ? "scale-105" : ""} transition-transform`}
                  aria-hidden
                />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
