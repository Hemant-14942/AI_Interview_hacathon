import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import debug from "../utils/debug";

export default function Timer({ seconds, onTimeout }) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const hasTimedOut = useRef(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (!hasTimedOut.current) {
        hasTimedOut.current = true;
        debug.action("Timer", "Time khatam – auto next/upload");
        onTimeout();
      }
      return;
    }
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timeLeft, onTimeout]);

  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  const isLow = timeLeft <= 30;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm ${
        isLow
          ? "bg-red-500/15 border border-red-500/40 text-red-400"
          : "bg-zinc-800 border border-zinc-700 text-zinc-400"
      }`}
    >
      <span className="opacity-80">Time left</span>
      <span>
        {m}:{s.toString().padStart(2, "0")}
      </span>
    </motion.div>
  );
}
