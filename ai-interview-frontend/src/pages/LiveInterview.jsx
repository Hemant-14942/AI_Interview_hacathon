import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api, { BASE_URL } from "../api/api";
import debug from "../utils/debug";

import Recorder from "../components/Recorder";
import Timer from "../components/Timer";
import QuestionCard from "../components/QuestionCard";

export default function LiveInterview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [question, setQuestion] = useState(null);
  const [videoBlob, setVideoBlob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [initialLoad, setInitialLoad] = useState(true);
  const audioRef = useRef(null);

  debug.component("LiveInterview", "Screen load – question load karenge", { interviewId: id });

  const loadQuestion = useCallback(async () => {
    setError("");
    debug.api("Next question", `GET /interviews/${id}/next-question`);
    try {
      const res = await api.get(`/interviews/${id}/next-question`);
      debug.apiResponse(`GET /interviews/${id}/next-question`, res.status, res.data);

      if (res.data.message === "Interview completed") {
        debug.flow("Interview complete – result page pe jaa rahe hain", { id });
        toast.success("Interview khatam! Ab report dekho.");
        navigate(`/result/${id}`);
        return;
      }
      setQuestion(res.data);
      setVideoBlob(null);
      debug.flow("Naya question mila – UI update", {
        question_number: res.data.question_number,
        question_id: res.data.question_id,
      });
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Failed to load question.");
      debug.error("LiveInterview", "Next question load fail", { detail });
      toast.error("Question load nahi hua. Dobara try karo.");
    } finally {
      setInitialLoad(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

  // TTS – question aate hi audio play
  useEffect(() => {
    if (!question?.question_text || !question?.voice) return;

    let cancelled = false;
    const playTTS = async () => {
      try {
        debug.action("LiveInterview", "TTS generate – question sunayenge", {
          voice: question.voice,
          textLength: question.question_text?.length,
        });
        const { data } = await api.post("/tts/generate", {
          text: question.question_text,
          voice: question.voice,
        });
        const audioPath = data.audio_path;
        const url = audioPath.startsWith("http") ? audioPath : `${BASE_URL}/${audioPath}`;
        if (audioRef.current && !cancelled) {
          audioRef.current.src = url;
          await audioRef.current.play();
          debug.flow("TTS play ho raha hai", { url });
        }
      } catch (err) {
        debug.warn("LiveInterview", "TTS fail – skip, UI block nahi karenge", err);
      }
    };
    playTTS();
    return () => {
      cancelled = true;
    };
  }, [question?.question_text, question?.voice]);

  const uploadAndNext = async () => {
    setError("");

    if (!videoBlob) {
      debug.action("LiveInterview", "Skip – bina video next question");
      try {
        await api.post(`/interviews/${id}/answer-complete`);
        toast.info("Skipped. Next question load ho raha hai.");
        await loadQuestion();
      } catch (err) {
        const detail = err.response?.data?.detail;
        setError(typeof detail === "string" ? detail : "Failed to advance.");
        toast.error("Next pe jaane mein error.");
      }
      return;
    }

    setLoading(true);
    debug.action("LiveInterview", "Video upload + answer-complete – phir next question", {
      question_id: question?.question_id,
      blobSize: videoBlob?.size,
    });

    try {
      const formData = new FormData();
      formData.append("video", videoBlob, "answer.webm");

      debug.api("Upload video", `POST /interviews/${id}/questions/${question.question_id}/upload-video`, "[FormData video]");
      await api.post(
        `/interviews/${id}/questions/${question.question_id}/upload-video`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      debug.flow("Video upload success – ab answer-complete");
      await api.post(`/interviews/${id}/answer-complete`);
      toast.success("Answer save ho gaya! Next question.");
      await loadQuestion();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Upload failed. Try again.");
      debug.error("LiveInterview", "Video upload / answer-complete fail", { detail });
      toast.error("Upload fail. Dobara try karo.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoad && !question) {
    debug.component("LiveInterview", "Initial load – loading dikha rahe hain");
    return (
      <div className="page">
        <div className="loading-wrap">
          <span className="spinner" />
          <p>Loading question...</p>
        </div>
      </div>
    );
  }

  if (error && !question) {
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

  if (!question) {
    return null;
  }

  return (
    <div className="page" style={{ justifyContent: "flex-start", paddingTop: "1.5rem" }}>
      <div className="page-header" style={{ marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.35rem" }}>Question {question.question_number}</h1>
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Record your answer, then click Next or skip.
        </p>
      </div>

      <QuestionCard number={question.question_number} text={question.question_text} />

      <div className="card" style={{ marginTop: "1rem" }}>
        <Recorder onStop={(blob) => setVideoBlob(blob)} />
      </div>

      <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
        <Timer seconds={120} onTimeout={uploadAndNext} />
        <button
          type="button"
          className="btn btn-primary"
          onClick={uploadAndNext}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              Uploading...
            </>
          ) : (
            "Next / Skip"
          )}
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginTop: "1rem" }}>{error}</div>}

      <button
        type="button"
        className="btn btn-secondary btn-block"
        style={{ marginTop: "1rem" }}
        onClick={() => {
          debug.action("LiveInterview", "End interview early – result pe");
          toast.info("Interview yahi khatam kiya. Report dekho.");
          navigate(`/result/${id}`);
        }}
      >
        End interview early
      </button>

      <audio ref={audioRef} style={{ display: "none" }} />
    </div>
  );
}
