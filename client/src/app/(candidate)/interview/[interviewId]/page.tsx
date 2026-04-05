"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  completeAnswer,
  endInterview,
  generateTTS,
  getAnswerStatus,
  getNextQuestion,
  skipQuestion,
  uploadAnswerVideo,
  type NextQuestionResponse,
} from "@/lib/interviews";

type PageParams = {
  interviewId: string;
};

const QUESTION_TIME_SECONDS = 120;

const pickSupportedRecorderMimeType = (): string | undefined => {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") {
    return undefined;
  }
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];
  return candidates.find((mime) => MediaRecorder.isTypeSupported(mime));
};

const LiveInterviewPage = () => {
  const params = useParams<PageParams>();
  const router = useRouter();
  const interviewId = params?.interviewId;

  const [question, setQuestion] = useState<NextQuestionResponse | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_SECONDS);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(3);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const processedQuestionIdRef = useRef<string | null>(null);

  const parseError = (err: unknown, fallback: string) => {
    const maybeAxiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
    return maybeAxiosErr.response?.data?.detail ?? maybeAxiosErr.message ?? fallback;
  };

  const stopAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsSpeaking(false);
  };

  const setupCamera = useCallback(async () => {
    if (streamRef.current) return;
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play().catch(() => {});
    }
  }, []);

  const startRecording = () => {
    if (!streamRef.current || recorderRef.current?.state === "recording") return;

    chunksRef.current = [];
    let recorder: MediaRecorder;
    const mimeType = pickSupportedRecorderMimeType();
    try {
      recorder = mimeType
        ? new MediaRecorder(streamRef.current, { mimeType })
        : new MediaRecorder(streamRef.current);
    } catch {
      setError("Recording could not be started. Please use a supported browser.");
      return;
    }

    recorder.ondataavailable = (e: BlobEvent) => {
      if (e.data?.size > 0) chunksRef.current.push(e.data);
    };
    recorder.start();
    recorderRef.current = recorder;
  };

  const stopRecordingAndGetBlob = () =>
    new Promise<Blob | null>((resolve) => {
      const rec = recorderRef.current;
      if (!rec || rec.state !== "recording") {
        resolve(null);
        return;
      }
      rec.onstop = () => {
        const blob = chunksRef.current.length > 0 ? new Blob(chunksRef.current, { type: "video/webm" }) : null;
        chunksRef.current = [];
        resolve(blob);
      };
      rec.stop();
    });

  const loadNextQuestion = useCallback(async () => {
    if (!interviewId) return;
    setError(null);
    setLoadingQuestion(true);
    try {
      const data = await getNextQuestion(String(interviewId));
      if ("message" in data && data.message === "Interview completed") {
        router.push(`/result/${interviewId}`);
        return;
      }
      setQuestion(data);
      setTimeLeft(QUESTION_TIME_SECONDS);
      setCountdown(data.question_number === 1 ? 3 : null);
      processedQuestionIdRef.current = null;
    } catch (err: unknown) {
      setError(parseError(err, "Failed to load question."));
    } finally {
      setLoadingQuestion(false);
    }
  }, [interviewId, router]);

  const waitForAnswerProcessed = async (qid: string) => {
    if (!interviewId) return;
    const start = Date.now();
    while (Date.now() - start < 120000) {
      const status = await getAnswerStatus(String(interviewId), qid);
      if (status.status === "completed") return;
      if (status.status === "failed") {
        throw new Error("Answer processing failed.");
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
    throw new Error("Answer processing timed out.");
  };

  const submitCurrentAnswer = useCallback(async () => {
    if (!interviewId || !question || submitting) return;
    if (processedQuestionIdRef.current === question.question_id) return;
    processedQuestionIdRef.current = question.question_id;

    setSubmitting(true);
    setError(null);
    try {
      setLoadingText("Uploading your answer...");
      const blob = await stopRecordingAndGetBlob();

      if (!blob || blob.size === 0) {
        throw new Error("No answer was recorded. Please allow camera/microphone and try again.");
      }

      await uploadAnswerVideo(String(interviewId), question.question_id, blob);
      setLoadingText("Analyzing your answer...");
      await waitForAnswerProcessed(question.question_id);

      setLoadingText("Loading next question...");
      await completeAnswer(String(interviewId));
      await loadNextQuestion();
    } catch (err: unknown) {
      setError(parseError(err, "Failed to submit answer."));
      processedQuestionIdRef.current = null;
    } finally {
      setSubmitting(false);
      setLoadingText("");
    }
  }, [interviewId, question, submitting, loadNextQuestion]);

  useEffect(() => {
    loadNextQuestion();
  }, [loadNextQuestion]);

  useEffect(() => {
    setupCamera().catch(() => setError("Camera access is required to continue."));
    return () => {
      stopAudio();
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [setupCamera]);

  useEffect(() => {
    if (!question || countdown !== null) return;
    startRecording();
    generateTTS(question.question_text, question.voice)
      .then((tts) => {
        if (!audioRef.current) return;
        audioRef.current.onplay = () => setIsSpeaking(true);
        audioRef.current.onended = () => setIsSpeaking(false);
        audioRef.current.onpause = () => setIsSpeaking(false);
        audioRef.current.onerror = () => setIsSpeaking(false);
        audioRef.current.src = tts.audio_url;
        return audioRef.current.play();
      })
      .catch(() => {
        setIsSpeaking(false);
      });
  }, [question, countdown]);

  useEffect(() => {
    if (countdown == null || countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => (c && c > 1 ? c - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  useEffect(() => {
    if (submitting || !question || countdown !== null) return;
    if (timeLeft <= 0) {
      submitCurrentAnswer();
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, submitting, question, countdown, submitCurrentAnswer]);

  const handleSkip = async () => {
    if (!interviewId || !question || submitting) return;
    setSubmitting(true);
    setError(null);
    stopAudio();
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    try {
      await skipQuestion(String(interviewId), question.question_id);
      await loadNextQuestion();
    } catch (err: unknown) {
      setError(parseError(err, "Failed to skip question."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnd = async () => {
    if (!interviewId) return;
    try {
      await endInterview(String(interviewId));
    } catch {
      // keep redirect behavior even if already ended
    }
    router.push(`/result/${interviewId}`);
  };

  if (loadingQuestion && !question) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        Loading question...
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-red-200">
        {error ?? "Question not available."}
      </div>
    );
  }

  if (countdown !== null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white">
        <p className="mb-2 text-slate-400">Starting in</p>
        <p className="text-7xl font-bold text-emerald-300">{countdown}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Question {question.question_number}</h1>
          <p className="text-sm text-slate-400">Answer clearly. You can skip if needed.</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5">
          <p className="text-base leading-7 text-slate-100">{question.question_text}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold">AI interviewer</p>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300 ring-1 ring-emerald-400/40">
                {isSpeaking ? "Speaking" : "Idle"}
              </span>
            </div>
            <div className="flex h-72 items-center justify-center rounded-xl border border-white/10 bg-slate-950/70 text-slate-400">
              AI voice output
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
            <p className="mb-3 font-semibold">Your camera</p>
            <video ref={videoRef} muted playsInline className="h-72 w-full rounded-xl bg-black object-cover" />
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-2 text-sm text-red-100">
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="rounded-xl border border-white/10 bg-slate-900/80 px-4 py-2 text-sm">
            Time left: <span className="font-semibold text-emerald-300">{timeLeft}s</span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={handleSkip}
              className="rounded-xl border border-white/15 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-700 disabled:opacity-70"
            >
              Skip
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={submitCurrentAnswer}
              className="btn-primary rounded-xl px-4 py-2 text-sm disabled:opacity-70"
            >
              {submitting ? loadingText || "Processing..." : "Next"}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleEnd}
          className="w-full rounded-xl border border-white/10 bg-slate-900/80 py-3 text-sm text-slate-300 hover:bg-slate-800"
        >
          End interview early
        </button>
      </div>

      <audio ref={audioRef} className="hidden" />
    </div>
  );
};

export default LiveInterviewPage;

