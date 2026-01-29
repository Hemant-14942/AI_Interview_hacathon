import { useEffect, useRef, useState } from "react";
import debug from "../utils/debug";

export default function Recorder({ onStop }) {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let stream = null;
    async function initCamera() {
      debug.component("Recorder", "Camera/mic access maang rahe hain");
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size) chunksRef.current.push(e.data);
        };
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "video/webm" });
          chunksRef.current = [];
          debug.action("Recorder", "Recording band – blob parent ko bhej rahe hain", { blobSize: blob?.size });
          onStop(blob);
        };
        debug.flow("Recorder – camera ready, video dikh raha hoga");
      } catch (err) {
        setError("Camera or microphone access denied.");
        debug.error("Recorder", "Camera/mic permission nahi mila", err);
      }
    }
    initCamera();
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      debug.component("Recorder", "Unmount – camera tracks band");
    };
  }, [onStop]);

  const start = () => {
    setError("");
    if (mediaRecorderRef.current?.state === "inactive") {
      mediaRecorderRef.current.start();
      setRecording(true);
      debug.action("Recorder", "Recording start – user bol raha hai");
    }
  };

  const stop = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      setRecording(false);
      debug.action("Recorder", "Recording stop – blob banega");
    }
  };

  return (
    <div>
      <div
        style={{
          position: "relative",
          borderRadius: "var(--radius-sm)",
          overflow: "hidden",
          background: "var(--bg)",
          aspectRatio: "16/10",
          maxWidth: "100%",
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: "scaleX(-1)",
          }}
        />
        {recording && (
          <div
            style={{
              position: "absolute",
              top: "0.5rem",
              left: "0.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(0,0,0,0.7)",
              color: "var(--error)",
              padding: "0.35rem 0.75rem",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "currentColor", animation: "pulse 1s infinite" }} />
            Recording
          </div>
        )}
      </div>
      {error && <p style={{ color: "var(--error)", fontSize: "0.9rem", margin: "0.5rem 0 0" }}>{error}</p>}
      <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
        {!recording ? (
          <button type="button" className="btn btn-primary" onClick={start} disabled={!!error}>
            Start recording
          </button>
        ) : (
          <button type="button" className="btn btn-secondary" onClick={stop}>
            Stop recording
          </button>
        )}
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );
}
