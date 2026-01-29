import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/api";
import debug from "../utils/debug";

export default function SetupInterview() {
  const [resume, setResume] = useState(null);
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  debug.component("SetupInterview", "Screen load – resume & JD yahan bharenge");

  const submit = async (e) => {
    e?.preventDefault();
    if (!resume) {
      setError("Please upload your resume (PDF or DOCX).");
      debug.warn("SetupInterview", "Submit without resume – user ko bata rahe hain");
      toast.warning("Pehle resume upload karo.");
      return;
    }
    if (!jd.trim()) {
      setError("Please enter the job description.");
      debug.warn("SetupInterview", "Submit without JD – user ko bata rahe hain");
      toast.warning("Job description daalo.");
      return;
    }

    setError("");
    setLoading(true);

    debug.action("SetupInterview", "Form submit – interview create + setup-ai call karenge", {
      resumeName: resume.name,
      jdLength: jd.length,
    });

    try {
      const formData = new FormData();
      formData.append("resume", resume);
      formData.append("job_description", jd.trim());

      debug.api("Interview create", "POST /interviews/create", "[FormData resume+jd]");
      const res = await api.post("/interviews/create", formData);
      const interviewId = res.data.interview_id;

      debug.flow("Interview create success – interview_id mila", { interviewId });
      toast.info("Interview ban gaya, ab questions generate ho rahe hain...");

      debug.api("Setup AI", `POST /interviews/${interviewId}/setup-ai`);
      await api.post(`/interviews/${interviewId}/setup-ai`);

      debug.flow("Setup AI done – ab voice select pe jaa rahe hain", { interviewId });
      toast.success("Questions ready! Ab voice choose karo.");
      navigate(`/voice/${interviewId}`);
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg =
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
            ? detail.map((x) => x.msg).join(", ")
            : "Failed to create interview. Please try again.";
      setError(msg);
      debug.error("SetupInterview", "Create/setup-ai fail", { detail });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Setup Interview</h1>
        <p>Upload your resume and paste the job description. We'll generate personalized questions.</p>
      </div>

      <div className="card">
        <form onSubmit={submit}>
          <div className="input-group">
            <label htmlFor="resume">Resume (PDF or DOCX)</label>
            <input
              id="resume"
              type="file"
              accept=".pdf,.docx"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setResume(file);
                setError("");
                debug.action("SetupInterview", "Resume file select", file ? file.name : "clear");
              }}
              style={{ padding: "0.5rem 0" }}
            />
            {resume && (
              <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Selected: {resume.name}
              </p>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="jd">Job Description</label>
            <textarea
              id="jd"
              placeholder="Paste the full job description here..."
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              rows={6}
            />
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                Generating questions...
              </>
            ) : (
              "Generate interview"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
