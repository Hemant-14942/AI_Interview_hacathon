"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Container } from "@/components/Container";
import { getJobs } from "@/app/lib/jobs";
import type { Job } from "@/app/types/jobs";

const JobsPage = () => {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchJobs = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getJobs();
        if (mounted) {
          setJobs(response.data ?? []);
        }
      } catch (err: unknown) {
        const maybeAxiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
        if (mounted) {
          setError(
            maybeAxiosErr.response?.data?.detail ??
              maybeAxiosErr.message ??
              "Something went wrong while fetching jobs.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchJobs();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <Container className="py-10 lg:py-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/80">
              Candidate · Opportunities
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Practice for roles with{" "}
              <span className="bg-linear-to-r from-emerald-300 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                AI-powered interviews
              </span>
              .
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
              Browse live roles, understand what each job expects, and launch an AI practice
              interview tailored to that job description.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 text-xs text-slate-300">
            <p>
              Showing{" "}
              <span className="font-semibold text-slate-100">
                {loading ? "…" : jobs.length}
              </span>{" "}
              role(s)
            </p>
            <Link
              href="/profile"
              className="inline-flex h-9 items-center justify-center rounded-2xl bg-white px-4 text-[11px] font-semibold text-slate-950 shadow-md shadow-emerald-500/20 hover:bg-slate-100"
            >
              View profile &amp; history
            </Link>
          </div>
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="space-y-3">
              <div className="h-2 w-24 animate-pulse rounded-full bg-slate-700/60" />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-40 animate-pulse rounded-2xl bg-slate-800/70"
                  />
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          ) : jobs.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-slate-950/80 px-6 py-10 text-center text-sm text-slate-300">
              <p className="text-base font-medium text-slate-100">
                No roles are available yet.
              </p>
              <p className="mt-2 text-[13px] text-slate-400">
                As new roles go live, you will be able to launch AI-powered practice interviews
                directly from here.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => router.push(`/interview-setup/${job.id}`)}
                  className="group flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-left shadow-sm shadow-emerald-500/10 transition hover:-translate-y-1 hover:border-emerald-300/60 hover:bg-slate-900"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-50 line-clamp-1">
                          {job.title}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {job.location} ·{" "}
                          <span className="capitalize">{job.mode.toLowerCase()}</span>
                        </p>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-400/50">
                        Practice ready
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      {job.description}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-300">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-slate-900/80 px-2 py-0.5 font-mono text-[10px] text-slate-200 ring-1 ring-white/10">
                        ₹ {job.salary.toLocaleString?.("en-IN") ?? job.salary}
                      </span>
                      <span className="rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] text-slate-200 ring-1 ring-white/10">
                        {job.experience} yrs experience
                      </span>
                      {job.skills?.slice(0, 2).map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] text-slate-200 ring-1 ring-white/10"
                        >
                          {skill}
                        </span>
                      ))}
                      {job.skills && job.skills.length > 2 && (
                        <span className="rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] text-slate-300 ring-1 ring-white/10">
                          +{job.skills.length - 2} more
                        </span>
                      )}
                    </div>

                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Start AI interview
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};

export default JobsPage;
