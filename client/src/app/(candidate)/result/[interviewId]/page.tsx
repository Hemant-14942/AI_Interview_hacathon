"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Container } from "@/components/Container";
import { getInterviewReport, type InterviewReport } from "@/lib/interviews";

type PageParams = {
  interviewId: string;
};

const ResultPage = () => {
  const params = useParams<PageParams>();
  const interviewId = params?.interviewId;

  const [report, setReport] = useState<InterviewReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!interviewId) return;
    let stopped = false;
    let attempts = 0;

    const poll = async () => {
      try {
        const data = await getInterviewReport(String(interviewId));
        if (stopped) return;
        setReport(data);
        setLoading(false);

        if (data.status === "processing" && attempts < 40) {
          attempts += 1;
          setTimeout(poll, 4000);
        }
      } catch (err: unknown) {
        const maybeAxiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
        if (!stopped) {
          setError(
            maybeAxiosErr.response?.data?.detail ??
              maybeAxiosErr.message ??
              "Failed to load report.",
          );
          setLoading(false);
        }
      }
    };

    poll();
    return () => {
      stopped = true;
    };
  }, [interviewId]);

  const notReady = report?.status === "processing" || report?.status === "incomplete";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <Container className="py-10">
        <div className="mx-auto max-w-4xl space-y-5">
          <h1 className="text-center text-3xl font-bold">Interview report</h1>

          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 px-6 py-10 text-center text-slate-300">
              Loading your report...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-red-100">
              {error}
            </div>
          ) : notReady ? (
            <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 px-5 py-5">
              <p className="font-semibold text-amber-100">
                {report?.message ?? "Report is not ready yet."}
              </p>
              <p className="mt-2 text-sm text-amber-100/80">
                Keep this page open. It refreshes automatically while analysis is running.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Decision</p>
                <p className="mt-1 text-2xl font-semibold">{report?.decision ?? "N/A"}</p>
                {report?.summary && <p className="mt-2 text-sm text-slate-300">{report.summary}</p>}
              </div>

              {report?.scores && (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-violet-400/40 bg-violet-500/10 p-4">
                    <p className="text-xs text-violet-100/80">Technical</p>
                    <p className="mt-1 text-2xl font-semibold text-violet-100">{report.scores.technical}</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4">
                    <p className="text-xs text-emerald-100/80">Communication</p>
                    <p className="mt-1 text-2xl font-semibold text-emerald-100">{report.scores.communication}</p>
                  </div>
                  <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4">
                    <p className="text-xs text-amber-100/80">Behavior</p>
                    <p className="mt-1 text-2xl font-semibold text-amber-100">{report.scores.behavior}</p>
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4">
                  <p className="text-xs font-semibold text-emerald-100">Strengths</p>
                  <ul className="mt-2 space-y-1 text-sm text-emerald-100/90">
                    {(report?.strengths ?? []).map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                    {(report?.strengths ?? []).length === 0 && <li>Not available yet.</li>}
                  </ul>
                </div>
                <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 p-4">
                  <p className="text-xs font-semibold text-rose-100">Areas to improve</p>
                  <ul className="mt-2 space-y-1 text-sm text-rose-100/90">
                    {(report?.gaps ?? []).map((g, i) => (
                      <li key={i}>• {g}</li>
                    ))}
                    {(report?.gaps ?? []).length === 0 && <li>Not available yet.</li>}
                  </ul>
                </div>
              </div>
            </>
          )}

          <div className="flex flex-wrap gap-3">
            <Link
              href="/jobs"
              className="rounded-xl border border-white/10 bg-slate-900/80 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
            >
              Back to jobs
            </Link>
            <Link
              href="/profile"
              className="btn-primary rounded-xl px-4 py-2 text-sm"
            >
              View profile history
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default ResultPage;

