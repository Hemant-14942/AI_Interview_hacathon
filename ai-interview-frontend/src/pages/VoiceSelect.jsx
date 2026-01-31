import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import api from "../api/api";
import debug from "../utils/debug";

export default function VoiceSelect() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  debug.component("VoiceSelect", "Screen load – interviewer voice choose", { interviewId: id });

  const start = async (voice) => {
    setError("");
    setLoading(true);
    try {
      await api.post(`/interviews/${id}/start`, null, { params: { voice } });
      toast.success("Interview shuru! Ab question aayega.");
      navigate(`/interview/${id}`);
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = typeof detail === "string" ? detail : "Failed to start interview.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const options = [
    {
      voice: "male",
      image: "/malevoice.jpeg",
      label: "Male voice",
      description: "Deep, clear tone",
      accent: "zinc",
    },
    {
      voice: "female",
      image: "/femalevoice.jpeg",
      label: "Female voice",
      description: "Warm, clear tone",
      accent: "violet",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-2xl"
      >
        <h1 className="font-display text-3xl md:text-4xl font-bold text-center text-white mb-2">
          Choose interviewer voice
        </h1>
        <p className="text-zinc-400 text-center text-sm mb-8 font-sans">
          Questions will be read aloud in the voice you select. Pick the one you’re comfortable with.
        </p>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 mb-6 text-center"
          >
            {error}
          </motion.p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {options.map((opt, index) => (
            <motion.button

              key={opt.voice}
              type="button"
              onClick={() => start(opt.voice)}
              disabled={loading}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
              whileHover={!loading ? { scale: 1.03, y: -4 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              className={`group relative cursor-pointer rounded-2xl overflow-hidden text-left transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:opacity-70 disabled:cursor-not-allowed ${
                opt.accent === "violet"
                  ? "bg-zinc-900/90 border-2 border-violet-500/50 shadow-xl shadow-violet-600/20 hover:border-violet-400 hover:shadow-violet-600/30"
                  : "bg-zinc-900/90 border-2 border-zinc-700 hover:border-violet-500/50 hover:shadow-xl hover:shadow-violet-600/10"
              }`}
            >
              {/* Image container – consistent aspect ratio, rounded top */}
              <div className="relative aspect-[4/3] overflow-hidden bg-zinc-800">
                <img
                  src={opt.image}
                  alt={opt.label}
                  className="w-full h-full object-cover object-center transition-transform duration-200 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 via-transparent to-transparent opacity-80" />
                {/* Optional: small badge */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-lg bg-black/50 px-2.5 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
                  <svg className="w-3.5 h-3.5 text-violet-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                  Voice
                </div>
              </div>

              {/* Label + description */}
              <div className="p-5">
                <p className="font-display text-lg font-bold text-white">{opt.label}</p>
                <p className="text-sm text-zinc-400 mt-0.5 font-sans">{opt.description}</p>
                <span className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Select
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </motion.button>
          ))}
        </div>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 flex items-center justify-center gap-3 rounded-xl bg-zinc-800/80 py-3 text-zinc-400 text-sm"
          >
            <span className="w-5 h-5 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
            Starting interview...
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
