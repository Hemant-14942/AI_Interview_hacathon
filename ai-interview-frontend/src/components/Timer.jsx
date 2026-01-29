import { useEffect, useState, useRef } from "react";
import debug from "../utils/debug";

export default function Timer({ seconds, onTimeout }) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const hasTimedOut = useRef(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (!hasTimedOut.current) {
        hasTimedOut.current = true;
        debug.action("Timer", "Time khatam – auto next question / upload");
        onTimeout();
      }
      return;
    }
    const interval = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, onTimeout]);

  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  const isLow = timeLeft <= 30;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem 0.75rem",
        background: isLow ? "rgba(239, 68, 68, 0.15)" : "var(--bg-elevated)",
        border: `1px solid ${isLow ? "var(--error)" : "var(--border)"}`,
        borderRadius: "var(--radius-sm)",
        color: isLow ? "var(--error)" : "var(--text-muted)",
        fontWeight: 600,
        fontSize: "0.95rem",
      }}
    >
      <span style={{ opacity: 0.8 }}>Time left</span>
      <span>
        {m}:{s.toString().padStart(2, "0")}
      </span>
    </div>
  );
}
