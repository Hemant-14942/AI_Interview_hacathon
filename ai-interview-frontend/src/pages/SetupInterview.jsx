import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
// eslint-disable-next-line no-unused-vars -- motion used in JSX
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/api";
import debug from "../utils/debug";
import Navbar from "../components/Navbar";

const LOADING_MESSAGES = [
  "Setting up interview...",
  "Matching resume & JD...",
  "Generating smart questions...",
  "Are you excited?",
  "Almost there...",
];

/** Preset job descriptions – click a button to fill the JD form; user can edit after. */
const PRESET_JOBS = {
  "Full Stack": `We are looking for a Full Stack Developer to build and maintain web applications.

Responsibilities:
- Design and develop full-stack applications (React/Next.js, Node.js/Python)
- Write clean, maintainable code and participate in code reviews
- Collaborate with product and design teams
- Ensure performance, security, and scalability

Requirements:
- 2+ years experience with JavaScript/TypeScript and at least one backend language
- Experience with REST APIs, databases (SQL/NoSQL), and cloud (AWS/GCP)
- Strong problem-solving and communication skills`,

  "AI/ML": `We are hiring an AI/ML Engineer to work on machine learning systems and models.

Responsibilities:
- Design, train, and deploy ML models (NLP, computer vision, or recommendation systems)
- Work with large datasets and optimize model performance
- Collaborate with engineers to integrate ML into products
- Stay current with research and best practices in ML/AI

Requirements:
- Strong background in Python, TensorFlow/PyTorch, or similar frameworks
- Experience with ML pipelines, MLOps, and cloud ML services
- Solid understanding of statistics, linear algebra, and algorithms
- Good communication and documentation skills`,

  "DevOps": `We need a DevOps Engineer to own CI/CD, infrastructure, and reliability.

Responsibilities:
- Build and maintain CI/CD pipelines (GitHub Actions, Jenkins, or similar)
- Manage cloud infrastructure (AWS/GCP/Azure) with IaC (Terraform, CloudFormation)
- Monitor systems, set up alerting, and improve incident response
- Automate deployment, scaling, and security practices

Requirements:
- Experience with Docker, Kubernetes, and Linux
- Proficiency in scripting (Bash, Python) and automation
- Knowledge of networking, security, and cost optimization
- Strong troubleshooting and collaboration skills`,

  "Frontend": `We are looking for a Frontend Developer to create great user experiences.

Responsibilities:
- Build responsive, accessible UIs with React, Vue, or similar
- Work with designers and backend APIs to ship features
- Optimize performance (Core Web Vitals, bundle size)
- Write tests and maintain code quality

Requirements:
- Strong HTML, CSS, JavaScript/TypeScript and modern frameworks
- Experience with state management, REST/GraphQL, and build tools (Vite, Webpack)
- Eye for design and usability
- Good communication and teamwork`,

  "Backend": `We need a Backend Engineer to design and scale our services and APIs.

Responsibilities:
- Design and develop APIs and microservices (Node.js, Python, Go, or Java)
- Work with databases, caches, and message queues
- Ensure security, performance, and observability (logging, metrics)
- Participate in architecture decisions and on-call rotation

Requirements:
- 2+ years backend development experience
- Strong knowledge of databases, REST/GraphQL, and system design
- Experience with cloud services and DevOps practices
- Problem-solving mindset and clear communication`,
};

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function SetupInterview() {
  const [resume, setResume] = useState(null);
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [activePreset, setActivePreset] = useState(null);

  const navigate = useNavigate();

  debug.component("SetupInterview", "Screen load – resume & JD yahan bharenge");

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingMessageIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [loading]);

  const fillPreset = (key) => {
    setJd(PRESET_JOBS[key] ?? "");
    setActivePreset(key);
    setError("");
  };

  const submit = async (e) => {
    e?.preventDefault();
    if (!resume) {
      setError("Please upload your resume (PDF or DOCX).");
      toast.warning("Pehle resume upload karo.");
      return;
    }
    if (!jd.trim()) {
      setError("Please select a role or enter the job description.");
      toast.warning("Job description daalo ya preset choose karo.");
      return;
    }
    setError("");
    setLoading(true);
    debug.action("SetupInterview", "Form submit – interview create + setup-ai", { resumeName: resume.name, jdLength: jd.length });

    try {
      const formData = new FormData();
      formData.append("resume", resume);
      formData.append("job_description", jd.trim());

      const res = await api.post("/interviews/create", formData);
      const interviewId = res.data.interview_id;
      toast.info("Interview ban gaya, ab questions generate ho rahe hain...");

      await api.post(`/interviews/${interviewId}/setup-ai`);
      toast.success("Questions ready! Ab voice choose karo.");
      navigate(`/voice/${interviewId}`);
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = typeof detail === "string" ? detail : Array.isArray(detail) ? detail.map((x) => x.msg).join(", ") : "Failed to create interview. Please try again.";
      setError(msg);
      debug.error("SetupInterview", "Create/setup-ai fail", { detail });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center px-4 py-8 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 -right-40 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-5xl"
        >
          {/* Heading + subtitle above the two-column view */}
        <h1 className="font-display text-3xl font-bold text-center text-white mb-2">
          Setup Interview
        </h1>
        <p className="text-zinc-400 text-center text-sm mb-8 font-sans">
          Upload your resume and pick or paste a job description. We'll generate <span className="font-display text-violet-400">personalized</span> questions.
        </p>

        <div className="relative">
          <motion.div
            layout
            className={`rounded-2xl border border-zinc-800 bg-zinc-900/90 backdrop-blur p-6 md:p-8 shadow-xl shadow-black/20 transition-all duration-300 ${loading ? "blur-sm pointer-events-none select-none" : ""}`}
          >
            <form onSubmit={submit} className="space-y-6">
              {/* Two columns: resume left, JD right */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Resume upload + preview */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-zinc-400">Resume (PDF or DOCX)</label>
                  <label htmlFor="resume" className="flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed border-zinc-700 hover:border-violet-500/50 bg-zinc-800/50 cursor-pointer transition-colors">
                    <div className="flex flex-col items-center gap-2 text-zinc-400">
                      <svg className="w-10 h-10 text-violet-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-sm font-medium">Click to upload or drag and drop</span>
                      <span className="text-xs">PDF or DOCX</span>
                    </div>
                    <input
                      id="resume"
                      type="file"
                      accept=".pdf,.docx"
                      className="hidden"
                      onChange={(e) => {
                        setResume(e.target.files?.[0] ?? null);
                        setError("");
                      }}
                    />
                  </label>

                  {/* Resume preview – premium card when file is selected */}
                  <AnimatePresence mode="wait">
                    {resume ? (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-start gap-4"
                      >
                        <div className="shrink-0 w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center">
                          {resume.name.toLowerCase().endsWith(".pdf") ? (
                            <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white truncate">{resume.name}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">{formatFileSize(resume.size)}</p>
                          <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Ready for interview
                          </span>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4 text-center"
                      >
                        <p className="text-xs text-zinc-500">No file selected. Upload your resume above.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Right: Preset JD buttons + textarea */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-zinc-400">Job Description</label>
                  <p className="text-xs text-zinc-500 mb-2">Choose a role to auto-fill, or type your own below.</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(PRESET_JOBS).map((key) => (
                      <motion.button
                        key={key}
                        type="button"
                        onClick={() => fillPreset(key)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          activePreset === key
                            ? "bg-violet-600 text-white shadow-lg shadow-violet-600/25 ring-2 ring-violet-400/50"
                            : "bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-violet-500/50 hover:text-white"
                        }`}
                      >
                        {key}
                      </motion.button>
                    ))}
                  </div>
                  <textarea
                    id="jd"
                    placeholder="Paste or edit job description here..."
                    value={jd}
                    onChange={(e) => {
                      setJd(e.target.value);
                      setActivePreset(null);
                      setError("");
                    }}
                    rows={10}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-y transition font-sans text-sm"
                  />
                </div>
              </div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Generate button below the view */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold shadow-lg shadow-violet-600/25 disabled:opacity-70 flex items-center justify-center gap-2 transition"
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating questions...
                  </>
                ) : (
                  "Generate interview"
                )}
              </motion.button>
            </form>
          </motion.div>

          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-6 rounded-2xl bg-black/70 backdrop-blur-sm min-h-[320px]"
              >
                <div className="w-20 h-20 rounded-2xl bg-zinc-800/90 border-2 border-violet-500/40 flex items-center justify-center text-zinc-500 text-xs text-center">
                  [AI Robot]
                </div>
                <span className="w-12 h-12 border-3 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
                <AnimatePresence mode="wait">
                  <motion.p
                    key={loadingMessageIndex}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="text-lg font-semibold text-white text-center"
                  >
                    {LOADING_MESSAGES[loadingMessageIndex]}
                  </motion.p>
                </AnimatePresence>
                <p className="text-sm text-zinc-400">This may take a moment...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      </div>
    </div>
  );
}
