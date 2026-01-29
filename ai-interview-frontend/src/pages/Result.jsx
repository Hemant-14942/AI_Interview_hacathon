import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/api";
import { AuthContext } from "../context/AuthContext";
import debug from "../utils/debug";

export default function Result() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  debug.component("Result", "Screen load – report fetch karenge", { interviewId: id });

  // Fetch report; if status is "processing" (background scoring), poll until "completed" or "incomplete"
  useEffect(() => {
    let cancelled = false;
    let pollTimeoutId = null;
    const POLL_INTERVAL_MS = 4000;
    const MAX_POLL_ATTEMPTS = 60; // ~4 min max
    let pollAttempts = 0;

    const fetchOnce = () => {
      debug.api("Report fetch", `GET /interviews/${id}/report`);
      return api.get(`/interviews/${id}/report`);
    };

    const run = () => {
      fetchOnce()
        .then((res) => {
          if (cancelled) return;
          const data = res.data;
          setReport(data);
          setLoading(false);
          debug.flow("Report mil gaya", { status: data?.status, decision: data?.decision });

          if (data?.status === "completed") {
            toast.success("Report load ho gaya!");
            return;
          }
          if (data?.status === "processing" && pollAttempts < MAX_POLL_ATTEMPTS) {
            pollAttempts += 1;
            debug.flow("Report abhi processing – " + POLL_INTERVAL_MS / 1000 + "s baad dobara fetch");
            pollTimeoutId = setTimeout(run, POLL_INTERVAL_MS);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            const detail = err.response?.data?.detail;
            setError(typeof detail === "string" ? detail : "Failed to load report.");
            setLoading(false);
            debug.error("Result", "Report fetch fail", { detail });
            toast.error("Report load nahi hua.");
          }
        });
    };

    run();
    return () => {
      cancelled = true;
      if (pollTimeoutId) clearTimeout(pollTimeoutId);
      debug.component("Result", "Unmount – cleanup");
    };
  }, [id]);

  if (loading) {
    return (
      <div className="page">
        <div className="loading-wrap">
          <span className="spinner" />
          <p>Loading your report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="card">
          <div className="alert alert-error">{error}</div>
          <button type="button" className="btn btn-primary btn-block" onClick={() => navigate("/setup")}>
            Back to setup
          </button>
        </div>
      </div>
    );
  }

  const notReady = report?.status === "incomplete" || report?.status === "processing";
  const isProcessing = report?.status === "processing";

  return (
    <div className="page" style={{ justifyContent: "flex-start", paddingTop: "1.5rem" }}>
      <div className="page-header">
        <h1>Interview Report</h1>
        <p>
          {notReady
            ? isProcessing
              ? "Analysis in progress – we'll refresh automatically."
              : "Your answers are not available yet."
            : "Here's how you did."}
        </p>
      </div>

      {notReady ? (
        <div className="card">
          <p style={{ margin: 0, color: "var(--text-muted)" }}>{report?.message ?? "No answers found."}</p>
          {isProcessing && (
            <p style={{ margin: "0.75rem 0 0", fontSize: "0.9rem", color: "var(--accent)" }}>
              Background scoring is running. This page will update when the report is ready.
            </p>
          )}
          {!isProcessing && (
            <p style={{ margin: "0.75rem 0 0", fontSize: "0.9rem", color: "var(--text-muted)" }}>
              You can come back later to view the full report.
            </p>
          )}
          {isProcessing && (
            <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
              <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Refreshing in a few seconds...</span>
            </div>
          )}
          <button type="button" className="btn btn-primary btn-block" style={{ marginTop: "1.5rem" }} onClick={() => navigate("/setup")}>
            Start a new interview
          </button>
        </div>
      ) : (
        <>
          <div
            className="card"
            style={{
              borderLeft: "4px solid",
              borderLeftColor:
                report?.decision === "HIRE"
                  ? "var(--success)"
                  : report?.decision === "BORDERLINE"
                    ? "var(--warning)"
                    : "var(--error)",
            }}
          >
            <p style={{ margin: "0 0 0.25rem", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>
              Decision
            </p>
            <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700 }}>
              {report?.decision ?? "—"}
            </p>
            {report?.summary && (
              <p style={{ margin: "0.75rem 0 0", color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.5 }}>
                {report.summary}
              </p>
            )}
          </div>

          {report?.scores && (
            <div className="card" style={{ marginTop: "1rem" }}>
              <p style={{ margin: "0 0 0.75rem", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>
                Scores
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
                <div style={{ textAlign: "center", padding: "0.75rem", background: "var(--bg)", borderRadius: "var(--radius-sm)" }}>
                  <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "var(--accent)" }}>{report.scores.technical ?? "—"}</p>
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>Technical</p>
                </div>
                <div style={{ textAlign: "center", padding: "0.75rem", background: "var(--bg)", borderRadius: "var(--radius-sm)" }}>
                  <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700 }}>{report.scores.communication ?? "—"}</p>
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>Communication</p>
                </div>
                <div style={{ textAlign: "center", padding: "0.75rem", background: "var(--bg)", borderRadius: "var(--radius-sm)" }}>
                  <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700 }}>{report.scores.behavior ?? "—"}</p>
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>Behavior</p>
                </div>
              </div>
            </div>
          )}

          {report?.strengths?.length > 0 && (
            <div className="card" style={{ marginTop: "1rem" }}>
              <p style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>
                Strengths
              </p>
              <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "var(--text)" }}>
                {report.strengths.map((s, i) => (
                  <li key={i} style={{ marginBottom: "0.25rem" }}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {report?.gaps?.length > 0 && (
            <div className="card" style={{ marginTop: "1rem" }}>
              <p style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>
                Areas to improve
              </p>
              <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "var(--text)" }}>
                {report.gaps.map((g, i) => (
                  <li key={i} style={{ marginBottom: "0.25rem" }}>{g}</li>
                ))}
              </ul>
            </div>
          )}

          {report?.questions?.length > 0 && (
            <div className="card" style={{ marginTop: "1rem" }}>
              <p style={{ margin: "0 0 0.75rem", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>
                Per-question feedback
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {report.questions.map((q, i) => (
                  <div
                    key={q.question_id ?? i}
                    style={{
                      padding: "0.75rem",
                      background: "var(--bg)",
                      borderRadius: "var(--radius-sm)",
                      borderLeft: "3px solid var(--accent)",
                    }}
                  >
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.35rem" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        Accuracy: {q.accuracy ?? "—"}
                      </span>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        Communication: {q.communication ?? "—"}
                      </span>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        Behavior: {q.behavior ?? "—"}
                      </span>
                    </div>
                    {q.feedback && (
                      <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.4 }}>{q.feedback}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                debug.action("Result", "Start new interview – setup pe");
                navigate("/setup");
              }}
            >
              Start new interview
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                debug.action("Result", "Logout – token clear, login pe");
                logout();
                toast.info("Logout ho gaya.");
                navigate("/");
              }}
            >
              Logout
            </button>
          </div>
        </>
      )}
    </div>
  );
}
