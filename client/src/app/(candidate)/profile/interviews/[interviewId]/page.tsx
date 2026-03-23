"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Container } from "@/components/Container";
import { getInterviewReport } from "@/app/lib/interviews";
import type { InterviewReport } from "@/app/lib/interviews";

type PageParams = {
  interviewId: string;
};

const InterviewReportPage = () => {
  const params = useParams<PageParams>();
  const interviewId = params?.interviewId;

  const [report, setReport] = useState<InterviewReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!interviewId) return;

    let mounted = true;
    const fetchReport = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getInterviewReport(String(interviewId));
        if (mounted) {
          setReport(data);
        }
      } catch (err: unknown) {
        const maybeAxiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
        if (mounted) {
          setError(
            maybeAxiosErr.response?.data?.detail ??
              maybeAxiosErr.message ??
              "Something went wrong while loading the report.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchReport();
    return () => {
      mounted = false;
    };
  }, [interviewId]);

  const isProcessing = report?.status === "processing";
  const isIncomplete = report?.status === "incomplete";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <Container className="py-10 lg:py-12">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/80">
              Candidate · Interview report
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              Session {typeof interviewId === "string" ? interviewId.slice(0, 8) : ""}
            </h1>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-slate-950/80 px-6 py-10 text-center text-sm text-slate-300">
            Loading report…
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-400/40 bg-red-500/10 px-6 py-4 text-sm text-red-100">
            {error}
          </div>
        ) : !report ? (
          <div className="rounded-3xl border border-white/10 bg-slate-950/80 px-6 py-10 text-center text-sm text-slate-300">
            Report is not available.
          </div>
        ) : isProcessing || isIncomplete ? (
          <div className="rounded-3xl border border-amber-400/40 bg-amber-500/10 px-6 py-6 text-sm text-amber-50">
            <p className="text-base font-semibold">
              {report.message ?? "Your interview analysis is still in progress."}
            </p>
            <p className="mt-2 text-[13px] text-amber-100/80">
              Please check back in a little while. Once the analysis is completed, you will see
              detailed scores and feedback here.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1.1fr)]">
            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Decision
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-slate-50">
                      {report.decision ?? "N/A"}
                    </p>
                  </div>
                  {report.scores && (
                    <div className="flex gap-4 text-xs text-slate-200">
                      <div>
                        <p className="text-[11px] text-slate-400">Technical</p>
                        <p className="text-lg font-semibold">
                          {report.scores.technical.toFixed(1)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400">Communication</p>
                        <p className="text-lg font-semibold">
                          {report.scores.communication.toFixed(1)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400">Behavior</p>
                        <p className="text-lg font-semibold">
                          {report.scores.behavior.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                {report.summary && (
                  <p className="mt-3 text-[13px] text-slate-300">{report.summary}</p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-emerald-400/40 bg-emerald-500/10 p-4 text-xs">
                  <p className="text-[11px] font-semibold text-emerald-100">Strengths</p>
                  {report.strengths && report.strengths.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-emerald-100/90">
                      {report.strengths.map((item, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-[11px] text-emerald-100/80">
                      Once analysis finishes, key strengths will appear here.
                    </p>
                  )}
                </div>

                <div className="rounded-3xl border border-rose-400/40 bg-rose-500/10 p-4 text-xs">
                  <p className="text-[11px] font-semibold text-rose-100">Areas to improve</p>
                  {report.gaps && report.gaps.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-rose-100/90">
                      {report.gaps.map((item, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-rose-300" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-[11px] text-rose-100/80">
                      Detailed improvement points will appear once your interview is fully scored.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <aside className="space-y-4 text-xs">
              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4">
                <p className="text-[11px] font-semibold text-slate-200">
                  Question-by-question feedback
                </p>
                {report.questions && report.questions.length > 0 ? (
                  <ul className="mt-3 space-y-3 text-[11px] text-slate-200">
                    {report.questions.slice(0, 10).map((q) => (
                      <li
                        key={q.question_id}
                        className="rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2"
                      >
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                          <span>Technical: {q.accuracy}</span>
                          <span>Communication: {q.communication}</span>
                          <span>Behavior: {q.behavior}</span>
                        </div>
                        {q.feedback && (
                          <p className="mt-1 text-[11px] text-slate-200">{q.feedback}</p>
                        )}
                      </li>
                    ))}
                    {report.questions.length > 10 && (
                      <li className="text-[11px] text-slate-400">
                        Only the first 10 questions are shown here.
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="mt-2 text-[11px] text-slate-400">
                    Question-level feedback will appear here once the analysis is completed.
                  </p>
                )}
              </div>
            </aside>
          </div>
        )}
      </Container>
    </div>
  );
};

export default InterviewReportPage;

