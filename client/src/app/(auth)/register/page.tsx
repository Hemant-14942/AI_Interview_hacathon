"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register } from "@/app/lib/auth";
import { Role, RegisterRequest, RecruiterInfo } from "@/app/types/auth";
import { Navbar } from "@/components/Navbar";
import { Container } from "@/components/Container";

type RegisterFormState = {
  name: string;
  email: string;
  password: string;
  role: Role;
  recruiter_info: RecruiterInfo; // keep in state even if candidate; we won't send it for candidate
};

const RegisterPage = () => {
  const router = useRouter();

  const [form, setForm] = useState<RegisterFormState>({
    name: "",
    email: "",
    password: "",
    role: Role.candidate,
    recruiter_info: {
      company_name: "",
      website_url: "",
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRecruiter = form.role === Role.recruiter;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload: RegisterRequest =
        form.role === Role.recruiter
          ? {
              name: form.name,
              email: form.email,
              password: form.password,
              role: Role.recruiter,
              recruiter_info: form.recruiter_info,
            }
          : {
              name: form.name,
              email: form.email,
              password: form.password,
              role: Role.candidate,
            };

      await register(payload);

      // route groups don't show in URL; these resolve to "/dashboard" and "/jobs"
      router.push(form.role === Role.recruiter ? "/dashboard" : "/jobs");
    } catch (err: unknown) {
      const maybeAxiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(maybeAxiosErr.response?.data?.detail ?? maybeAxiosErr.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-white">
      <Navbar />

      <Container className="grid gap-10 py-12 lg:grid-cols-2 lg:py-16">
        <div className="hidden lg:block">
          <div className="sticky top-24 rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-8 dark:border-white/10 dark:from-white/5 dark:to-white/0">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Create your account
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Start practicing with InterviewAI.
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Candidate ho to mock interview + feedback. Recruiter ho to sessions
              manage karo. Same theme, same smooth UX.
            </p>
            <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
              <Image
                src="/illustrations/auth.svg"
                alt="Register illustration"
                width={1200}
                height={900}
                className="h-auto w-full"
                priority
              />
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-full">
            <div className="mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-white/5">
              <h2 className="text-2xl font-semibold tracking-tight">Register</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-slate-900 underline-offset-4 hover:underline dark:text-white"
                >
                  Login
                </Link>
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-white">
                      <input
                        type="radio"
                        name="role"
                        checked={form.role === Role.candidate}
                        onChange={() => setForm((f) => ({ ...f, role: Role.candidate }))}
                      />
                      Candidate
                    </label>

                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-white">
                      <input
                        type="radio"
                        name="role"
                        checked={form.role === Role.recruiter}
                        onChange={() => setForm((f) => ({ ...f, role: Role.recruiter }))}
                      />
                      Recruiter
                    </label>
                  </div>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                    Tip: role switch kar sakte ho — submit pe payload auto-correct.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Name
                  </label>
                  <input
                    type="text"
                    placeholder="Your name"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:placeholder:text-slate-500 dark:focus:border-white/20"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="you@company.com"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:placeholder:text-slate-500 dark:focus:border-white/20"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:placeholder:text-slate-500 dark:focus:border-white/20"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  />
                </div>

                {isRecruiter && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Recruiter details
                    </p>
                    <div className="mt-3 space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                          Company name
                        </label>
                        <input
                          type="text"
                          placeholder="Acme Inc."
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:placeholder:text-slate-500 dark:focus:border-white/20"
                          value={form.recruiter_info.company_name}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              recruiter_info: { ...f.recruiter_info, company_name: e.target.value },
                            }))
                          }
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                          Website URL (optional)
                        </label>
                        <input
                          type="text"
                          placeholder="https://acme.com"
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:placeholder:text-slate-500 dark:focus:border-white/20"
                          value={form.recruiter_info.website_url}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              recruiter_info: { ...f.recruiter_info, website_url: e.target.value },
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  {loading ? "Creating..." : "Create account"}
                </button>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  By continuing, you agree to basic terms (demo/hackathon).
                </p>
              </form>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default RegisterPage;