"use client";

import React, { useEffect, useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Container } from "@/components/Container";
import { getJobById } from "@/app/lib/jobs";
import { createInterview, setupInterviewAI } from "@/app/lib/interviews";
import type { Job } from "@/app/types/jobs";

type PageParams = {
  jobId: string;
};

const InterviewSetupPage = () => {
  const params = useParams<PageParams>();
  const router = useRouter();
  const jobId = params?.jobId;

  const [job, setJob] = useState<Job | null>(null);
  const [resume, setResume] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadingMessages = [
    "Setting up your interview...",
    "Matching your resume with the job description...",
    "Generating role-specific questions...",
    "Preparing interviewer context...",
    "Almost ready...",
  ];

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingMessageIndex((i) => (i + 1) % loadingMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [loading, loadingMessages.length]);

  useEffect(() => {
    if (!jobId) return;

    let mounted = true;
    const fetchJob = async () => {
      setError(null);
      try {
        const response = await getJobById(String(jobId));
        if (mounted) {
          setJob(response.data);
        }
      } catch (err: unknown) {
        const maybeAxiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
        if (mounted) {
          setError(
            maybeAxiosErr.response?.data?.detail ??
              maybeAxiosErr.message ??
              "Something went wrong while loading the job.",
          );
        }
      }
    };

    fetchJob();
    return () => {
      mounted = false;
    };
  }, [jobId]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!job) {
      setError("Job could not be loaded.");
      return;
    }

    if (!resume) {
      setError("Please upload your resume (PDF or DOCX).");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("resume", resume);
      formData.append("job_description", job.description);

      const created = await createInterview(formData);
      await setupInterviewAI(created.interview_id);

      setSuccess("Interview setup completed.");

      setTimeout(() => {
        router.push(`/voice/${created.interview_id}`);
      }, 1000);
    } catch (err: unknown) {
      const maybeAxiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(
        maybeAxiosErr.response?.data?.detail ??
          maybeAxiosErr.message ??
          "Failed to set up the interview. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <Container className="py-10 lg:py-12">
        <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/80">
              Candidate · Interview setup
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Prepare for{" "}
              <span className="bg-linear-to-r from-emerald-300 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                {job?.title ?? "this role"}
              </span>
            </h1>
            <p className="max-w-xl text-sm leading-6 text-slate-300">
              Upload your resume and we will generate an AI-powered practice interview aligned to
              this job description. Use it to rehearse before the real conversation.
            </p>

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 p-5 shadow-lg shadow-emerald-500/15">
              {job ? (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-50">{job.title}</p>
                      <p className="text-[11px] text-slate-400">
                        {job.location} ·{" "}
                        <span className="capitalize">{job.mode.toLowerCase()}</span>
                      </p>
                    </div>
                    <div className="text-right text-[11px] text-slate-300">
                      <p>
                        <span className="font-mono">
                          ₹ {job.salary.toLocaleString?.("en-IN") ?? job.salary}
                        </span>
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {job.experience} yrs experience
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-[11px] text-slate-400 line-clamp-4">{job.description}</p>

                  {job.skills?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {job.skills.slice(0, 6).map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] text-slate-200 ring-1 ring-white/10"
                        >
                          {skill}
                        </span>
                      ))}
                      {job.skills.length > 6 && (
                        <span className="rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] text-slate-300 ring-1 ring-white/10">
                          +{job.skills.length - 6} more
                        </span>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-400">Loading job details…</p>
              )}
            </div>
          </div>

          <div className="flex items-stretch">
            <div className="w-full rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-xl shadow-emerald-500/20">
              <h2 className="text-lg font-semibold">Upload your resume</h2>
              <p className="mt-1 text-xs text-slate-400">
                Supported formats: PDF and DOCX. We only use it to tailor your interview questions.
              </p>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
                <div>
                  <label
                    htmlFor="resume"
                    className="flex h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 bg-slate-900/80 text-center transition hover:border-emerald-400/60 hover:bg-slate-900"
                  >
                    <div className="flex flex-col items-center gap-2 text-slate-300">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/40">
                        ⬆
                      </span>
                      <span className="text-xs font-semibold">
                        Click to upload or drag &amp; drop
                      </span>
                      <span className="text-[11px] text-slate-500">PDF or DOCX</span>
                    </div>
                    <input
                      id="resume"
                      type="file"
                      accept=".pdf,.docx"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        setResume(file);
                        setError(null);
                      }}
                    />
                  </label>
                  <div className="mt-3 rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-[11px] text-slate-300">
                    {resume ? (
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-100">
                            {resume.name}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {(resume.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-400/40">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          Ready
                        </span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500">
                        No file selected yet. Your resume will stay private to this interview.
                      </p>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-[11px] text-red-100">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-100">
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 text-xs font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:-translate-y-px hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <span className="h-3 w-3 animate-spin rounded-full border border-slate-900/20 border-t-slate-900" />
                      Setting up interview…
                    </>
                  ) : (
                    <>Generate AI practice interview</>
                  )}
                </button>

                <p className="text-[10px] text-slate-500">
                  After setup, you will choose interviewer voice and then start the live
                  interview.
                </p>
              </form>
            </div>
          </div>
        </div>

        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-3xl bg-slate-950/70 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950/90 p-6 text-center shadow-xl shadow-emerald-500/20">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/40 bg-emerald-400/10">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-300/30 border-t-emerald-300" />
              </div>
              <p className="text-sm font-semibold text-slate-100">
                {loadingMessages[loadingMessageIndex]}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                This usually takes a few seconds.
              </p>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};

export default InterviewSetupPage;

