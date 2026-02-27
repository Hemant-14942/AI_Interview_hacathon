import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Container } from "@/components/Container";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-white">
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-60 dark:opacity-20" />
          <div className="pointer-events-none absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-500/20 via-violet-500/15 to-fuchsia-500/20 blur-3xl" />

          <Container className="relative grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                AI mock interviews • instant feedback • role-based flows
              </p>

              <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
                Practice interviews with an{" "}
                <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
                  AI interviewer
                </span>{" "}
                that feels real.
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
                Candidate ho ya recruiter — same clean experience. Candidates get guided
                mock rounds + feedback. Recruiters manage sessions and evaluate faster.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/register"
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  Get started
                </Link>
                <Link
                  href="/#how-it-works"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  See how it works
                </Link>
              </div>

              <dl className="mt-10 grid grid-cols-3 gap-4 rounded-2xl border border-slate-200 bg-white/70 p-4 backdrop-blur dark:border-white/10 dark:bg-white/5">
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-400">Setup</dt>
                  <dd className="mt-1 text-sm font-semibold">2 min</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-400">Feedback</dt>
                  <dd className="mt-1 text-sm font-semibold">Instant</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-400">Roles</dt>
                  <dd className="mt-1 text-sm font-semibold">2 flows</dd>
                </div>
              </dl>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-indigo-500/15 via-violet-500/10 to-fuchsia-500/15 blur-2xl" />
              <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                  <span>Mock interview • Live</span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Recording
                  </span>
                </div>
                <div className="p-4">
                  <Image
                    src="/illustrations/hero.svg"
                    alt="Interview AI product preview"
                    width={1200}
                    height={800}
                    className="h-auto w-full"
                    priority
                  />
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Features */}
        <section id="features" className="border-t border-slate-200 dark:border-white/10">
          <Container className="py-16">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Everything you need for interview practice
              </h2>
              <p className="mt-3 text-slate-600 dark:text-slate-300">
                Clean UI, role-based register/login, and a landing theme that matches
                your product vibe.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "Role-based onboarding",
                  desc: "Candidate vs recruiter flows — payload stays type-safe.",
                },
                {
                  title: "Mock rounds",
                  desc: "Practice with structured questions and clear progress.",
                },
                {
                  title: "Instant feedback",
                  desc: "Actionable insights after every session (tone, clarity, gaps).",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5"
                >
                  <h3 className="text-sm font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="border-t border-slate-200 dark:border-white/10">
          <Container className="py-16">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              How it works
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {[
                { step: "01", title: "Create account", desc: "Choose your role and sign up." },
                { step: "02", title: "Start a session", desc: "Begin a mock interview or manage sessions." },
                { step: "03", title: "Get results", desc: "See feedback and next-step suggestions." },
              ].map((s) => (
                <div
                  key={s.step}
                  className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/5"
                >
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {s.step}
                  </p>
                  <h3 className="mt-2 text-sm font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* Pricing (placeholder) */}
        <section id="pricing" className="border-t border-slate-200 dark:border-white/10">
          <Container className="py-16">
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-10 dark:border-white/10 dark:from-white/5 dark:to-white/0">
              <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Ready to try it?
                  </h2>
                  <p className="mt-2 text-slate-600 dark:text-slate-300">
                    Start free. Upgrade later (hackathon friendly).
                  </p>
                </div>
                <Link
                  href="/register"
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  Create account
                </Link>
              </div>
            </div>
          </Container>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-10 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
        <Container className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} InterviewAI. Built for your hackathon.</p>
          <div className="flex gap-4">
            <Link href="/#features" className="hover:text-slate-900 dark:hover:text-white">
              Features
            </Link>
            <Link href="/login" className="hover:text-slate-900 dark:hover:text-white">
              Login
            </Link>
            <Link href="/register" className="hover:text-slate-900 dark:hover:text-white">
              Register
            </Link>
          </div>
        </Container>
      </footer>
    </div>
  );
}
