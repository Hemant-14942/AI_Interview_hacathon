import { motion } from "framer-motion";
import debug from "../utils/debug";

export default function QuestionCard({ number, text }) {
  debug.component("QuestionCard", `Question #${number} dikha rahe hain`, { textLength: text?.length });
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-zinc-800 bg-zinc-900/90 backdrop-blur p-5 pl-6 border-l-4 border-l-violet-500 shadow-lg shadow-black/10"
    >
      <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-2">
        Question {number}
      </p>
      <p className="text-zinc-100 text-base leading-relaxed font-sans">
        {text}
      </p>
    </motion.div>
  );
}
