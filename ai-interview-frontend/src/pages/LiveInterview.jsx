import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";

import api, { BASE_URL } from "../api/api";
import debug from "../utils/debug";
import QuestionCard from "../components/QuestionCard";
import Recorder from "../components/Recorder";
import Timer from "../components/Timer";

export default function LiveInterview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [question, setQuestion] = useState(null);
  const [, setVideoBlob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [error, setError] = useState("");
  const [initialLoad, setInitialLoad] = useState(true);

  const [countdown, setCountdown] = useState(null);
  const countdownDoneRef = useRef(false);

  const audioRef = useRef(null);
  const recorderRef = useRef(null);
  const handledStoppedRef = useRef(null);
  const isProcessingRef = useRef(false);

  const [isSpeaking, setIsSpeaking] = useState(false);

  debug.component("LiveInterview", "Screen load", { interviewId: id });

  const stopTts = () => {
    const a = audioRef.current;
    if (!a) return;
    try {
      a.pause();
      a.currentTime = 0;
    } catch {
      // ignore
    }
  };

  const loadQuestion = useCallback(async () => {
    setError("");
    try {
      const res = await api.get(`/interviews/${id}/next-question`);
      if (res.data.message === "Interview completed") {
        toast.success("Interview khatam! Ab report dekho.");
        navigate(`/result/${id}`);
        return;
      }
      setQuestion(res.data);
      setVideoBlob(null);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Failed to load question.");
      toast.error("Question load nahi hua. Dobara try karo.");
    } finally {
      setInitialLoad(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

  // Reset handled-stopped ref only when a new question is set
  useEffect(() => {
    handledStoppedRef.current = null;
  }, [question?.question_id]);

  // Countdown: first question only, once
  useEffect(() => {
    if (!question) return;
    if (question.question_number === 1 && !countdownDoneRef.current) {
      setCountdown(3);
      countdownDoneRef.current = true;
    } else if (question.question_number !== 1) {
      setCountdown(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.question_number]);

  useEffect(() => {
    if (countdown == null || countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => (c === 1 ? null : c - 1)), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Wire audio events to isSpeaking.
  // Important: on first question, countdown screen renders WITHOUT <audio>, so we re-run when countdown changes.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    const onPlay = () => setIsSpeaking(true);
    const onStop = () => setIsSpeaking(false);

    a.addEventListener("play", onPlay);
    a.addEventListener("playing", onPlay);
    a.addEventListener("ended", onStop);
    a.addEventListener("pause", onStop);
    a.addEventListener("error", onStop);

    return () => {
      a.removeEventListener("play", onPlay);
      a.removeEventListener("playing", onPlay);
      a.removeEventListener("ended", onStop);
      a.removeEventListener("pause", onStop);
      a.removeEventListener("error", onStop);
    };
  }, [question?.question_id, countdown]);

  // Auto-play TTS for each question (after countdown)
  useEffect(() => {
    if (!question?.question_text || !question?.voice || countdown !== null) return;
    let cancelled = false;

    const playTts = async () => {
      try {
        const { data } = await api.post("/tts/generate", {
          text: question.question_text,
          voice: question.voice,
        });
        const url = data.audio_path.startsWith("http")
          ? data.audio_path
          : `${BASE_URL}/${data.audio_path}`;

        if (audioRef.current && !cancelled) {
          audioRef.current.src = url;
          await audioRef.current.play();
        }
      } catch {
        // TTS optional
      }
    };

    playTts();
    return () => {
      cancelled = true;
    };
  }, [question?.question_text, question?.voice, countdown]);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const waitForAnswerCompleted = async (
    interviewId,
    questionId,
    { timeoutMs = 120000, intervalMs = 1500 } = {},
  ) => {
    const start = Date.now();
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (Date.now() - start > timeoutMs) {
        throw new Error("Processing timeout. Please try again.");
      }
      const res = await api.get(
        `/interviews/${interviewId}/questions/${questionId}/answer-status`,
      );
      const status = res.data?.status;
      if (status === "completed") return res.data;
      if (status === "failed") throw new Error("Processing failed. Please re-upload.");
      await sleep(intervalMs);
    }
  };

  const handleStoppedAndReady = async (blob) => {
    if (isProcessingRef.current) return;
    if (handledStoppedRef.current === question?.question_id) return;

    handledStoppedRef.current = question?.question_id;
    isProcessingRef.current = true;

    setError("");
    setLoading(true);
    setLoadingText("Uploading your answer...");
    toast.info("Uploading your answer...");

    try {
      if (blob && blob.size > 0) {
        const formData = new FormData();
        formData.append("video", blob, "answer.webm");

        await api.post(
          `/interviews/${id}/questions/${question.question_id}/upload-video`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } },
        );

        setLoadingText("Analyzing your answer...");
        toast.info("Analyzing your answer...");
        await waitForAnswerCompleted(id, question.question_id);
      }

      setLoadingText("Loading next question...");
      await api.post(`/interviews/${id}/answer-complete`);
      if (blob && blob.size > 0) toast.success("Answer saved. Loading next question.");
      else toast.success("Loading next question.");
      await loadQuestion();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Upload failed. Try again.");
      toast.error("Upload fail. Dobara try karo.");
      handledStoppedRef.current = null;
    } finally {
      setLoading(false);
      setLoadingText("");
      isProcessingRef.current = false;
    }
  };

  const handleNext = () => {
    setError("");
    setLoading(true);
    stopTts();
    setLoadingText("Preparing your answer...");
    recorderRef.current?.stopAndGetBlob();
  };

  const handleSkip = async () => {
    setError("");
    setLoading(true);
    stopTts();
    setLoadingText("Skipping...");
    try {
      await api.post(`/interviews/${id}/questions/${question.question_id}/skip`);
      toast.info("Skipped. Next question load ho raha hai.");
      await loadQuestion();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Failed to skip.");
      toast.error("Skip pe error.");
    } finally {
      setLoading(false);
      setLoadingText("");
    }
  };

  const handleTimerTimeout = () => {
    recorderRef.current?.stopAndGetBlob();
    setLoading(true);
    stopTts();
    setLoadingText("Time up. Submitting your answer...");
  };

  if (initialLoad && !question) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4 text-zinc-400"
        >
          <span className="w-12 h-12 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          <p className="font-sans">Loading question...</p>
        </motion.div>
      </div>
    );
  }

  if (error && !question) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6"
        >
          <p className="text-red-400 mb-4">{error}</p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/setup")}
            className="w-full py-3 rounded-xl bg-violet-600 text-white font-semibold"
          >
            Back to setup
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (!question) return null;

  // Countdown screen: first question only
  if (countdown !== null && countdown > 0) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
        <motion.div
          key={countdown}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <p className="text-zinc-400 font-sans text-lg mb-2">Starting in</p>
          <p className="font-display text-6xl md:text-8xl font-bold text-violet-400">
            {countdown}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div>
          <h1 className="font-display text-2xl font-bold text-white mb-1">
            Question {question.question_number}
          </h1>
          <p className="text-zinc-400 text-sm font-sans">
            Recording starts automatically. Click Next when done, or Skip if you don&apos;t
            know.
          </p>
        </div>

        <QuestionCard number={question.question_number} text={question.question_text} />

        <div className="w-full flex flex-col md:flex-row gap-6 md:items-stretch">
          {/* LEFT: AI panel */}
          <div className="w-full md:w-1/2 flex">
            <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4 shadow-lg flex flex-col min-h-[360px] h-full">
              <div className="flex items-center justify-between w-full">
                <p className="text-white font-semibold">AI Assistant</p>
                <span
                  className={`text-xs px-2 py-1 rounded-full border ${
                    isSpeaking
                      ? "bg-violet-500/15 text-violet-300 border-violet-500/30"
                      : "bg-zinc-800 text-zinc-300 border-zinc-700"
                  }`}
                >
                  {isSpeaking ? "Speaking" : "Idle"}
                </span>
              </div>

              <div
                className={`mt-6 flex-1 flex items-center justify-center ${
                  isSpeaking ? "animate-pulse" : ""
                }`}
              >
                {isSpeaking ? (
                  <img
                    src="/aispeaker.gif"
                    alt="AI Speaker"
                    className="w-40 h-40 object-contain opacity-100"
                  />
                ) : (
                  <img
                    src="/aiwoman1.png"
                    alt="AI Speaker (idle)"
                    className="w-40 h-40 object-contain opacity-90"
                  />
                )}
              </div>

              <p className="mt-4 text-center text-zinc-400 text-sm font-sans">
                {isSpeaking ? "AI is speaking..." : "AI is listening..."}
              </p>
            </div>
          </div>

          {/* RIGHT: Recorder panel */}
          <div className="w-full md:w-1/2 flex">
            <motion.div
              layout
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4 shadow-lg min-h-[360px] h-full"
            >
              <Recorder
                key={question.question_id}
                ref={recorderRef}
                onStop={(blob) => setVideoBlob(blob)}
                onStoppedAndReady={handleStoppedAndReady}
              />
            </motion.div>
          </div>
        </div>

        {loading && (
          <p className="text-sm text-violet-400 font-sans">{loadingText || "Working..."}</p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <Timer key={question.question_id} seconds={120} onTimeout={handleTimerTimeout} />
          <div className="flex gap-3">
            <motion.button
              onClick={handleSkip}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-5 py-2.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white font-semibold border border-zinc-600 disabled:opacity-70 transition"
            >
              Skip
            </motion.button>
            <motion.button
              onClick={handleNext}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold shadow-lg shadow-violet-600/25 disabled:opacity-70 flex items-center gap-2 transition"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {loadingText || "Working..."}
                </>
              ) : (
                "Next"
              )}
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={async () => {
            stopTts();
            try {
              await api.post(`/interviews/${id}/end`);
              toast.info("Interview yahi khatam kiya. Report dekho.");
              navigate(`/result/${id}`);
            } catch (err) {
              const detail = err.response?.data?.detail;
              toast.error(typeof detail === "string" ? detail : "Could not end interview. Try again.");
              navigate(`/result/${id}`);
            }
          }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700/80 font-medium transition"
        >
          End interview early
        </motion.button>
      </motion.div>

      <audio ref={audioRef} className="hidden" />
    </div>
  );
}

