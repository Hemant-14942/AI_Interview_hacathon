"use client"
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import type React from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logoutUser } from "@/store/slices/authSlice";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-900/6 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
    >
      {children}
    </Link>
  );
}

export function Navbar() {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();

// handle logout
  const handleLogout = async() => {
    try {
      await dispatch(logoutUser()).unwrap();
      router.push("/login");
      toast.success("Logout successful");
    } catch (error) {
      toast.error(typeof error === "string" ? error : (error as Error).message);
    }
  }

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 pb-3 sm:px-6 lg:px-8">
      <div
        className="relative mx-auto flex h-13 max-w-6xl items-center px-3 sm:h-14 sm:px-4 rounded-full border border-slate-200/70 bg-white/75 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.08),0_12px_40px_-12px_rgba(15,23,42,0.1)] backdrop-blur-2xl dark:border-white/8 dark:bg-slate-950/70 dark:shadow-[0_4px_32px_-4px_rgba(0,0,0,0.55),inset_0_0_0_1px_rgba(255,255,255,0.06)]"
      >
        {/* Left: logo + site name only */}
        <div className="relative z-10 flex min-w-0 flex-1 items-center justify-start">
          <BrandLogo />
        </div>

        {/* Center: Features, How it works, Pricing (md+) */}
        <nav
          aria-label="Primary"
          className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-0.5 md:flex"
        >
          <NavLink href="/#features">Features</NavLink>
          <NavLink href="/#how-it-works">How it works</NavLink>
          <NavLink href="/#pricing">Pricing</NavLink>
        </nav>

        {/* Right: auth */}
        <div className="relative z-10 flex min-w-0 flex-1 items-center justify-end gap-1 sm:gap-2">
          {user ? (
            <button type="button" onClick={handleLogout} className="btn-primary px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm">
              Logout
            </button>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-full px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-900/6 dark:text-slate-200 dark:hover:bg-white/10 sm:inline-flex"
              >
                Login
              </Link>
              <Link href="/register" className="btn-primary px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

