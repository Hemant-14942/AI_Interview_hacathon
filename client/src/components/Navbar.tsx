import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { Container } from "@/components/Container";
import type React from "react";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
    >
      {children}
    </Link>
  );
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-slate-950/50">
      <Container className="flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <BrandLogo />
          <nav className="hidden items-center gap-6 md:flex">
            <NavLink href="/#features">Features</NavLink>
            <NavLink href="/#how-it-works">How it works</NavLink>
            <NavLink href="/#pricing">Pricing</NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10 sm:inline-flex"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            Register
          </Link>
        </div>
      </Container>
    </header>
  );
}

