import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/api";
import debug from "../utils/debug";

export default function VoiceSelect() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  debug.component("VoiceSelect", "Screen load – interviewer voice choose karenge", { interviewId: id });

  const start = async (voice) => {
    setError("");
    setLoading(true);

    debug.action("VoiceSelect", "Voice select – interview start karenge", { voice, interviewId: id });

    try {
      debug.api("Start interview", `POST /interviews/${id}/start?voice=${voice}`);
      await api.post(`/interviews/${id}/start`, null, { params: { voice } });

      debug.flow("Interview start ho gaya – ab live interview screen pe", { id, voice });
      toast.success("Interview shuru! Ab question aayega.");
      navigate(`/interview/${id}`);
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = typeof detail === "string" ? detail : "Failed to start interview.";
      setError(msg);
      debug.error("VoiceSelect", "Start interview fail", { detail });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Choose interviewer voice</h1>
        <p>Questions will be read aloud in the voice you select.</p>
      </div>

      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => start("male")}
            disabled={loading}
            style={{ flex: "1 1 140px", padding: "1.25rem" }}
          >
            Male voice
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => start("female")}
            disabled={loading}
            style={{ flex: "1 1 140px", padding: "1.25rem" }}
          >
            Female voice
          </button>
        </div>

        {loading && (
          <p style={{ textAlign: "center", marginTop: "1rem", color: "var(--text-muted)" }}>
            Starting interview...
          </p>
        )}
      </div>
    </div>
  );
}
