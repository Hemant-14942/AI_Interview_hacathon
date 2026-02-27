import Link from "next/link";

export function BrandLogo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-sm">
        <span className="text-sm font-semibold">AI</span>
      </span>
      <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
        InterviewAI
      </span>
    </Link>
  );
}

