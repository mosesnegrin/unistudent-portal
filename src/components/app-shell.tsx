import Link from "next/link";
import { GraduationCap, LogOut } from "lucide-react";
import type { NavigationItem } from "@/lib/types";

export function AppShell({
  children,
  navigation,
  title,
  userName
}: {
  children: React.ReactNode;
  navigation: NavigationItem[];
  title: string;
  userName?: string | null;
}) {
  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-ink text-white">
              <GraduationCap size={19} />
            </span>
            <span className="truncate text-sm font-semibold sm:text-base">{title}</span>
          </Link>
          <div className="flex items-center gap-2">
            {userName ? <span className="hidden max-w-40 truncate text-sm text-muted sm:block">{userName}</span> : null}
            <form action="/logout" method="post">
              <button
                className="focus-ring grid size-10 place-items-center rounded-lg border border-line bg-white text-muted transition hover:text-ink"
                title="Sign out"
              >
                <LogOut size={18} />
              </button>
            </form>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="focus-ring whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-surface hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}
