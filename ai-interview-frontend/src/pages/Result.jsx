import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/api";
import { AuthContext } from "../context/AuthContext";
import debug from "../utils/debug";
import Navbar from "../components/Navbar";

export default function Result() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  debug.component("Result", "Screen load – report fetch", { interviewId: id });

  useEffect(() => {
    let cancelled = false;
    let pollTimeoutId = null;
    const POLL_INTERVAL_MS = 4000;
    const MAX_POLL_ATTEMPTS = 60;
    let pollAttempts = 0;

    const run = () => {
      api.get(`/interviews/${id}/report`)
        .then((res) => {
          if (cancelled) return;
          const data = res.data;
          setReport(data);
          setLoading(false);
          if (data?.status === "completed") toast.success("Report load ho gaya!");
          else if (data?.status === "processing" && pollAttempts < MAX_POLL_ATTEMPTS) {
            pollAttempts += 1;
            pollTimeoutId = setTimeout(run, POLL_INTERVAL_MS);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            const detail = err.response?.data?.detail;
            setError(typeof detail === "string" ? detail : "Failed to load report.");
            setLoading(false);
            toast.error("Report load nahi hua.");
          }
        });
    };
    run();
    return () => { cancelled = true; if (pollTimeoutId) clearTimeout(pollTimeoutId); };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-5 text-zinc-400">
          <span className="w-12 h-12 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          <p className="font-sans">Loading your report...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6">
          <p className="text-red-400 mb-4">{error}</p>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigate("/setup")} className="w-full py-3 rounded-xl bg-violet-600 text-white font-semibold">
            Back to setup
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const notReady = report?.status === "incomplete" || report?.status === "processing";
  const isProcessing = report?.status === "processing";

  const decisionColor = report?.decision === "HIRE" ? "border-emerald-500" : report?.decision === "BORDERLINE" ? "border-amber-500" : "border-red-500";

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar />
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
          <h1 className="font-display text-3xl font-bold text-center text-white">
          Interview Report
        </h1>
        <p className="text-zinc-400 text-center text-sm font-sans">
          {notReady ? (isProcessing ? "Analysis in progress – we'll refresh automatically." : "Your answers are not available yet.") : "Here's how you did."}
        </p>

        {notReady ? (
          <motion.div layout className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-xl">
            <p className="text-zinc-400 font-sans">{report?.message ?? "No answers found."}</p>
            {isProcessing && (
              <p className="mt-3 text-sm text-violet-400 font-sans">Background scoring is running. This page will update when the report is ready.</p>
            )}
            {!isProcessing && (
              <p className="mt-3 text-sm text-zinc-500 font-sans">You can come back later to view the full report.</p>
            )}
            {isProcessing && (
              <div className="mt-4 flex items-center gap-2 text-zinc-400 text-sm">
                <span className="w-5 h-5 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
                Refreshing in a few seconds...
              </div>
            )}
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigate("/setup")} className="w-full mt-6 py-3.5 rounded-xl bg-violet-600 text-white font-semibold">
              Start a new interview
            </motion.button>
          </motion.div>
        ) : (
          <>
            <motion.div layout className={`rounded-2xl border-l-4 ${decisionColor} border border-zinc-800 bg-zinc-900/90 p-6 shadow-xl`}>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Decision</p>
              <p className="font-display text-2xl font-bold text-white">{report?.decision ?? "—"}</p>
              {report?.summary && <p className="mt-3 text-zinc-400 text-sm font-sans leading-relaxed">{report.summary}</p>}
            </motion.div>

            {report?.scores && (
              <motion.div layout className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-xl">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Scores</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center py-4 rounded-xl bg-zinc-800/80">
                    <p className="text-2xl font-bold text-violet-400">{report.scores.technical ?? "—"}</p>
                    <p className="text-xs text-zinc-500 mt-1">Technical</p>
                  </div>
                  <div className="text-center py-4 rounded-xl bg-zinc-800/80">
                    <p className="text-2xl font-bold text-white">{report.scores.communication ?? "—"}</p>
                    <p className="text-xs text-zinc-500 mt-1">Communication</p>
                  </div>
                  <div className="text-center py-4 rounded-xl bg-zinc-800/80">
                    <p className="text-2xl font-bold text-white">{report.scores.behavior ?? "—"}</p>
                    <p className="text-xs text-zinc-500 mt-1">Behavior</p>
                  </div>
                </div>
              </motion.div>
            )}

            {report?.strengths?.length > 0 && (
              <motion.div layout className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-xl">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Strengths</p>
                <ul className="list-disc list-inside text-zinc-300 font-sans text-sm space-y-1">{report.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </motion.div>
            )}

            {report?.gaps?.length > 0 && (
              <motion.div layout className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-xl">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Areas to improve</p>
                <ul className="list-disc list-inside text-zinc-300 font-sans text-sm space-y-1">{report.gaps.map((g, i) => <li key={i}>{g}</li>)}</ul>
              </motion.div>
            )}

            {report?.questions?.length > 0 && (
              <motion.div layout className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-xl">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Per-question feedback</p>
                <div className="space-y-3">
                  {report.questions.map((q, i) => (
                    <div key={q.question_id ?? i} className="rounded-xl bg-zinc-800/80 p-4 border-l-4 border-violet-500/50">
                      <div className="flex flex-wrap gap-2 text-xs text-zinc-500 mb-2">
                        <span>Accuracy: {q.accuracy ?? "—"}</span>
                        <span>Communication: {q.communication ?? "—"}</span>
                        <span>Behavior: {q.behavior ?? "—"}</span>
                      </div>
                      {q.feedback && <p className="text-sm text-zinc-300 font-sans">{q.feedback}</p>}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* AI Robot placeholder – ADD YOUR IMAGE HERE (e.g. <img src="/robot-success.png" alt="AI" />) */}
            <div className="flex justify-center my-4">
              <div className="w-16 h-16 rounded-xl bg-zinc-800/80 border-2 border-violet-500/30 flex items-center justify-center text-zinc-500 text-xs text-center">
                [AI Robot]
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-4">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigate("/")} className="px-6 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 font-medium">
                Home
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigate("/history")} className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold shadow-lg shadow-violet-600/25">
                View History
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { logout(); toast.info("Logout ho gaya."); navigate("/"); }} className="px-6 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 font-medium">
                Logout
              </motion.button>
            </div>
          </>
        )}
        </motion.div>
      </div>
    </div>
  );
}
