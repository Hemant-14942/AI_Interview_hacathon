"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Container } from "@/components/Container";
import { startInterview, type VoiceOption } from "@/lib/interviews";

type PageParams = {
  interviewId: string;
};

const options: {
  voice: VoiceOption;
  label: string;
  description: string;
}[] = [
  { voice: "male", label: "Male voice", description: "Deep, clear tone" },
  { voice: "female", label: "Female voice", description: "Warm, clear tone" },
];

const VoicePage = () => {
  const params = useParams<PageParams>();
  const router = useRouter();
  const interviewId = params?.interviewId;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (voice: VoiceOption) => {
    if (!interviewId) return;
    setError(null);
    setLoading(true);
    try {
      await startInterview(String(interviewId), voice);
      router.push(`/interview/${interviewId}`);
    } catch (err: unknown) {
      const maybeAxiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(
        maybeAxiosErr.response?.data?.detail ??
          maybeAxiosErr.message ??
          "Failed to start interview.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <Container className="flex min-h-[calc(100vh-4rem)] items-center py-10">
        <div className="mx-auto w-full max-w-3xl">
          <h1 className="text-center text-3xl font-bold">Choose interviewer voice</h1>
          <p className="mt-2 text-center text-sm text-slate-400">
            Questions will be spoken in your selected voice.
          </p>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {options.map((opt) => (
              <button
                key={opt.voice}
                type="button"
                disabled={loading}
                onClick={() => handleSelect(opt.voice)}
                className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 text-left transition hover:-translate-y-1 hover:border-emerald-400/60 hover:bg-slate-900 disabled:opacity-70"
              >
                <p className="text-lg font-semibold text-slate-100">{opt.label}</p>
                <p className="mt-1 text-sm text-slate-400">{opt.description}</p>
                <p className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-emerald-300">
                  Select and continue
                  <span>→</span>
                </p>
              </button>
            ))}
          </div>

          {loading && (
            <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-900/80 py-3 text-sm text-slate-300">
              <span className="h-4 w-4 animate-spin rounded-full border border-slate-400/40 border-t-slate-200" />
              Starting interview...
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};

export default VoicePage;

