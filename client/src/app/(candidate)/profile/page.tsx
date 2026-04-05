"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Container } from "@/components/Container";
import { getMe } from "@/lib/auth";
import { listInterviews, type InterviewListItem } from "@/lib/interviews";
import type { User } from "@/types/auth";

interface ProfileStats {
  totalInterviews: number;
  completedReports: number;
  pendingReports: number;
  daysWithInterviews: number;
}

const computeStats = (interviews: InterviewListItem[]): ProfileStats => {
  const totalInterviews = interviews.length;
  const completedReports = interviews.filter((i) => i.report_status === "completed").length;
  const pendingReports = interviews.filter((i) => i.report_status !== "completed").length;

  const days = new Set<string>();
  interviews.forEach((i) => {
    if (!i.started_at) return;
    const d = new Date(i.started_at);
    if (!Number.isNaN(d.getTime())) {
      days.add(d.toISOString().slice(0, 10));
    }
  });

  return {
    totalInterviews,
    completedReports,
    pendingReports,
    daysWithInterviews: days.size,
  };
};

const ProfilePage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [interviews, setInterviews] = useState<InterviewListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [meRes, interviewsRes] = await Promise.all([getMe(), listInterviews()]);
        if (!mounted) return;
        setUser(meRes.data);
        setInterviews(interviewsRes.interviews ?? []);
      } catch (err: unknown) {
        const maybeAxiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
        if (mounted) {
          setError(
            maybeAxiosErr.response?.data?.detail ??
              maybeAxiosErr.message ??
              "Something went wrong while loading your profile.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => computeStats(interviews), [interviews]);

  const initials =
    user?.name
      ?.split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "C";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <Container className="py-10 lg:py-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/15 text-lg font-semibold text-emerald-200 ring-1 ring-emerald-400/40">
              {initials}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/80">
                Candidate · Profile
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                {user?.name ?? "Your profile"}
              </h1>
              {user?.email && (
                <p className="text-xs text-slate-400">{user.email}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 text-xs text-slate-300">
            <Link
              href="/jobs"
              className="btn-primary h-9 rounded-2xl px-4 text-[11px] shadow-md shadow-primary/30 transition hover:-translate-y-px"
            >
              Browse jobs
            </Link>
            <p className="text-[11px] text-slate-500">
              Your interview history and progress are based on this account.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.1fr)]">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
                <p className="text-[11px] font-medium text-slate-400">Total interviews</p>
                <p className="mt-2 text-2xl font-semibold text-slate-50">
                  {loading ? "…" : stats.totalInterviews}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  All AI-powered sessions you have started.
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4">
                <p className="text-[11px] font-medium text-emerald-100">Completed reports</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-50">
                  {loading ? "…" : stats.completedReports}
                </p>
                <p className="mt-1 text-[11px] text-emerald-100/80">
                  Sessions where your interview analysis is ready.
                </p>
              </div>

              <div className="rounded-2xl border border-sky-400/40 bg-sky-500/10 p-4">
                <p className="text-[11px] font-medium text-sky-100">
                  Days with interviews
                </p>
                <p className="mt-2 text-2xl font-semibold text-sky-50">
                  {loading ? "…" : stats.daysWithInterviews}
                </p>
                <p className="mt-1 text-[11px] text-sky-100/80">
                  Unique days on which you practiced.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-50">
                    Interview history
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Click an interview to open its detailed report.
                  </p>
                </div>
              </div>

              <div className="mt-4">
                {loading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="h-12 animate-pulse rounded-2xl bg-slate-800/70"
                      />
                    ))}
                  </div>
                ) : interviews.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-6 text-center text-xs text-slate-300">
                    <p>No interviews yet.</p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Start from the jobs page to see AI-powered practice sessions here.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-2 text-xs">
                    {interviews.map((item) => (
                      <li key={item.interview_id}>
                        <Link
                          href={`/profile/interviews/${item.interview_id}`}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-left text-xs text-slate-200 hover:border-emerald-400/60 hover:bg-slate-900"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-50">
                              {item.label || item.interview_id}
                            </p>
                            {item.started_at && (
                              <p className="text-[11px] text-slate-500">
                                {new Date(item.started_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                              </p>
                            )}
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${
                              item.report_status === "completed"
                                ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/50"
                                : "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/50"
                            }`}
                          >
                            {item.report_status === "completed"
                              ? "Report ready"
                              : "Report pending"}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-4 text-xs">
            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4">
              <p className="text-[11px] font-semibold text-slate-200">
                How your profile helps you improve
              </p>
              <ul className="mt-2 space-y-2 text-[11px] text-slate-300">
                <li>
                  <span className="font-semibold text-emerald-200">
                    Progress overview:
                  </span>{" "}
                  Track how often you practice and how many interviews have a completed report.
                </li>
                <li>
                  <span className="font-semibold text-emerald-200">
                    Consistency signal:
                  </span>{" "}
                  Use &quot;Days with interviews&quot; as a simple streak-style metric for your own
                  accountability.
                </li>
                <li>
                  <span className="font-semibold text-emerald-200">
                    Deep dives:
                  </span>{" "}
                  Open any interview to see scores, strengths and gaps in detail.
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </Container>
    </div>
  );
};

export default ProfilePage;

