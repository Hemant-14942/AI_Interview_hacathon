import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import api from "../api/api";
import debug from "../utils/debug";
import Navbar from "../components/Navbar";

export default function InterviewHistory() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  debug.component("InterviewHistory", "Screen load – list fetch");

  useEffect(() => {
    let cancelled = false;
    api
      .get("/interviews")
      .then((res) => {
        if (!cancelled) setInterviews(res.data?.interviews ?? []);
      })
      .catch((err) => {
        if (!cancelled) {
          const detail = err.response?.data?.detail;
          setError(typeof detail === "string" ? detail : "Failed to load history.");
          toast.error("History load nahi hua.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 text-zinc-400">
          <span className="w-12 h-12 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          <p className="font-sans">Loading interview history...</p>
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

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar />
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h1 className="font-display text-2xl font-bold text-white">Interview History</h1>
          <motion.button
            type="button"
            onClick={() => navigate("/setup")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 font-medium text-sm"
          >
            New interview
          </motion.button>
        </div>
        <p className="text-zinc-400 text-sm font-sans">Click an interview to view report. Pending reports will load when ready.</p>

        {interviews.length === 0 ? (
          <motion.div layout className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-8 text-center">
            <p className="text-zinc-500 font-sans">No interviews yet. Start one from Setup.</p>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigate("/setup")} className="mt-4 px-6 py-3 rounded-xl bg-violet-600 text-white font-semibold">
              Go to Setup
            </motion.button>
          </motion.div>
        ) : (
          <ul className="space-y-3">
            {interviews.map((item, index) => (
              <motion.li
                key={item.interview_id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <motion.button
                  type="button"
                  onClick={() => navigate(`/result/${item.interview_id}`)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4 text-left shadow-lg hover:border-violet-500/40 transition flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="font-display font-semibold text-white truncate">{item.label || item.interview_id}</p>
                    {item.started_at && (
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {new Date(item.started_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 px-3 py-1 rounded-lg text-xs font-semibold ${
                      item.report_status === "completed"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                    }`}
                  >
                    {item.report_status === "completed" ? "Report Ready" : "Report Pending"}
                  </span>
                </motion.button>
              </motion.li>
            ))}
          </ul>
        )}
        </motion.div>
      </div>
    </div>
  );
}
