import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { motion } from "framer-motion";
import debug from "../utils/debug";

const Recorder = forwardRef(function Recorder({ onStop, onStoppedAndReady }, ref) {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");
  const streamRef = useRef(null);
  const onStopRef = useRef(onStop);
  const onStoppedAndReadyRef = useRef(onStoppedAndReady);
  onStopRef.current = onStop;
  onStoppedAndReadyRef.current = onStoppedAndReady;

  useImperativeHandle(ref, () => ({
    stopAndGetBlob() {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
        setRecording(false);
        debug.action("Recorder", "Stop (parent ne trigger kiya)");
      }
    },
  }), []);

  useEffect(() => {
    let stream = null;
    let timeoutId = null;
    async function initCamera() {
      debug.component("Recorder", "Camera/mic access maang rahe hain");
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size) chunksRef.current.push(e.data);
        };
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "video/webm" });
          chunksRef.current = [];
          debug.action("Recorder", "Recording band – blob bhej rahe hain", { blobSize: blob?.size });
          onStopRef.current?.(blob);
          onStoppedAndReadyRef.current?.(blob);
        };

        // Auto-start recording after short delay so user sees the question
        const t = setTimeout(() => {
          if (mediaRecorderRef.current?.state === "inactive") {
            mediaRecorderRef.current.start();
            setRecording(true);
            debug.action("Recorder", "Auto-start recording");
          }
        }, 500);
        timeoutId = t;
      } catch (err) {
        setError("Camera or microphone access denied.");
        debug.error("Recorder", "Camera/mic permission nahi mila", err);
      }
    }
    initCamera();
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
    // Intentionally run only on mount: callbacks via refs so parent re-renders don't cleanup stream and fire onstop
  }, []);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative rounded-xl overflow-hidden bg-zinc-900 aspect-video max-w-full border border-zinc-800"
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover scale-x-[-1]"
        />
        {recording && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-3 left-3 flex items-center gap-2 bg-black/70 text-red-400 px-3 py-1.5 rounded-lg text-sm font-semibold"
          >
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            Recording
          </motion.div>
        )}
      </motion.div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
});

export default Recorder;
