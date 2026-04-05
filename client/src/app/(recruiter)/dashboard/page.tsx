"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Container } from "@/components/Container";
import { getJobs } from "@/lib/jobs";
import type { Job } from "@/types/jobs";

const DashboardPage = () => {
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
              "Something went wrong while fetching jobs."
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

  const activeCount = jobs.length;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <Container className="py-10 lg:py-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/80">
              Recruiter · Command Center
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Your roles,{" "}
              <span className="bg-linear-to-r from-emerald-300 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                ready for AI interviews
              </span>
              .
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
              View all of your active roles here. Each job description feeds directly into the AI
              interviewer, giving candidates a consistent and fair experience.
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-xs">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-300/20 text-sm font-semibold text-emerald-100">
                {activeCount}
              </span>
              <div className="space-y-0.5">
                <p className="font-medium text-emerald-100">Active roles</p>
                <p className="text-[10px] text-emerald-100/80">
                  Each role can have dedicated AI interview flows configured.
                </p>
              </div>
            </div>

            <Link
              href="/create-jobs"
              className="btn-primary h-10 gap-2 rounded-2xl px-4 text-xs shadow-lg shadow-primary/30 transition hover:-translate-y-px"
            >
              <span className="h-4 w-4 rounded-full bg-bg text-center text-[11px] font-bold text-primary">
                +
              </span>
              Post new role
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1.1fr)]">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <p>
                Showing{" "}
                <span className="font-semibold text-slate-100">
                  {loading ? "…" : activeCount}
                </span>{" "}
                role(s)
              </p>
              <p className="text-[11px] text-slate-400">
                Soon: filters by mode, skill, seniority.
              </p>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80">
              {loading ? (
                <div className="space-y-3 p-4 text-xs">
                  <div className="h-2 w-24 animate-pulse rounded-full bg-slate-700/60" />
                  <div className="space-y-2">
                    <div className="h-10 animate-pulse rounded-2xl bg-slate-800/70" />
                    <div className="h-10 animate-pulse rounded-2xl bg-slate-800/70" />
                    <div className="h-10 animate-pulse rounded-2xl bg-slate-800/70" />
                  </div>
                </div>
              ) : jobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center text-xs text-slate-300">
                  <p className="text-sm font-medium text-slate-100">
                    No roles yet — perfect time to post your first one.
                  </p>
                  <p className="max-w-md text-[11px] text-slate-400">
                    Create a clear, well-defined role to start screening candidates through AI
                    simulated interviews. Every new job can be linked directly to practice and
                    evaluation flows.
                  </p>
                  <Link
                    href="/create-jobs"
                    className="mt-1 inline-flex h-9 items-center justify-center rounded-2xl bg-emerald-400/90 px-4 text-[11px] font-semibold text-slate-950 shadow-md shadow-emerald-500/30 transition hover:bg-emerald-300"
                  >
                    Create your first job
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-white/5">
                  {jobs.map((job) => (
                    <li
                      key={job.id}
                      className="group flex items-start gap-4 px-4 py-4 text-xs transition hover:bg-white/5"
                    >
                      <div className="mt-1 h-6 w-6 shrink-0 rounded-xl bg-emerald-400/15 text-[11px] font-semibold text-emerald-200 ring-1 ring-emerald-400/40 group-hover:bg-emerald-400/25 group-hover:text-emerald-50">
                        <div className="flex h-full w-full items-center justify-center">
                          {job.title
                            .split(" ")
                            .map((w) => w[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col gap-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-50">{job.title}</p>
                            <p className="text-[11px] text-slate-400">
                              {job.location} ·{" "}
                              <span className="capitalize">{job.mode.toLowerCase()}</span>
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 text-right">
                            <p className="text-[11px] text-slate-300">
                              ₹{" "}
                              <span className="font-mono">
                                {job.salary.toLocaleString?.("en-IN") ?? job.salary}
                              </span>
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {job.experience} yr experience signal
                            </p>
                          </div>
                        </div>

                        {job.skills?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {job.skills.slice(0, 6).map((skill) => (
                              <span
                                key={skill}
                                className="inline-flex items-center rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] text-slate-200 ring-1 ring-white/10"
                              >
                                {skill}
                              </span>
                            ))}
                            {job.skills.length > 6 && (
                              <span className="inline-flex items-center rounded-full bg-slate-900/60 px-2 py-0.5 text-[10px] text-slate-300 ring-1 ring-white/10">
                                +{job.skills.length - 6} more
                              </span>
                            )}
                          </div>
                        )}

                        <p className="line-clamp-2 text-[11px] text-slate-400">
                          {job.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {error && (
              <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-xs text-red-100">
                {error}
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-slate-900 via-slate-900 to-slate-950 p-4 text-xs">
              <p className="text-[11px] font-semibold text-slate-200">How this dashboard helps</p>
              <ul className="mt-2 space-y-2 text-[11px] text-slate-300">
                <li>
                  <span className="font-semibold text-emerald-200">Overview:</span> See all roles in
                  one place and quickly scan the hiring pipeline.
                </li>
                <li>
                  <span className="font-semibold text-emerald-200">Alignment:</span> Keep job
                  skills and the AI interviewer&apos;s question bank tightly aligned.
                </li>
                <li>
                  <span className="font-semibold text-emerald-200">Next:</span> Unlock per-role
                  analytics, candidate funnels and interview scorecards.
                </li>
              </ul>
            </div>

            <div className="rounded-3xl border border-indigo-400/30 bg-indigo-500/10 p-4 text-xs">
              <p className="text-[11px] font-semibold text-indigo-100">
                Coming soon · Interview insights
              </p>
              <p className="mt-2 text-[11px] text-indigo-100/80">
                This dashboard will surface which roles see the most candidate drop-off, which
                questions are the toughest, and which signals correlate with the best hires.
              </p>
            </div>
          </aside>
        </div>
      </Container>
    </div>
  );
};

export default DashboardPage;
