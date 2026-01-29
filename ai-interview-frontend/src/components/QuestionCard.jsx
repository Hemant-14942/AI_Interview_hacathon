import debug from "../utils/debug";

export default function QuestionCard({ number, text }) {
  debug.component("QuestionCard", `Question #${number} dikha rahe hain`, { textLength: text?.length });
  return (
    <div className="card" style={{ borderLeft: "4px solid var(--accent)" }}>
      <p style={{ margin: "0 0 0.5rem", fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>
        Question {number}
      </p>
      <p style={{ margin: 0, fontSize: "1.1rem", lineHeight: 1.5 }}>
        {text}
      </p>
    </div>
  );
}
