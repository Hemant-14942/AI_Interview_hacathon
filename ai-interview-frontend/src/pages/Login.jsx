import { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
// eslint-disable-next-line no-unused-vars -- motion used as motion.div/button
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/api";
import { AuthContext } from "../context/AuthContext";
import debug from "../utils/debug";

export default function Login() {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  debug.component("Login", `Screen load hua, mode = ${mode}`);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    debug.action("Login", mode === "register" ? "Register form submit" : "Login form submit", { email });
    try {
      if (mode === "register") {
        const res = await api.post("/auth/register", { name, email, password });
        login(res.data.access_token);
        toast.success("Account ban gaya! Setup pe ja rahe hain.");
        navigate("/setup");
      } else {
        const res = await api.post("/auth/login", { email, password });
        login(res.data.access_token);
        toast.success("Login ho gaya! Setup pe ja rahe hain.");
        navigate("/setup");
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = typeof detail === "string" ? detail : Array.isArray(detail) ? detail.map((x) => x.msg).join(", ") : mode === "register" ? "Registration failed" : "Invalid email or password";
      setError(msg);
      debug.error("Login", "Auth fail", { detail, msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      <Link to="/" className="absolute top-4 left-4 text-sm text-zinc-400 hover:text-violet-400 font-medium transition z-20">
        ← Back to Home
      </Link>
      {/* Subtle gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* AI Robot placeholder – ADD YOUR IMAGE HERE (e.g. <img src="/robot.png" alt="AI" />) */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-2xl bg-zinc-800/80  flex items-center justify-center text-zinc-500 text-xs text-center px-2">
            <img src="/loginrobot.png" alt="AI" className="w-full h-full object-cover" />
          </div>
        </div>

        <h1 className="font-display text-4xl font-bold text-center text-white mb-1 tracking-tight">
          AI Interview
        </h1>
        <p className="text-zinc-400 text-center text-sm mb-8 font-sans">
          Practice with <span className="font-display text-violet-400">AI-powered</span> interview questions
        </p>

        <motion.div
          layout
          className="bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-2xl p-6 shadow-xl shadow-black/20"
        >
          <div className="flex gap-1 p-1 rounded-xl bg-zinc-800/60 mb-6">
            {["login", "register"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(""); debug.action("Login", "Tab switch – " + m); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${mode === m ? "bg-violet-600 text-white shadow-lg shadow-violet-600/25" : "text-zinc-400 hover:text-white"}`}
              >
                {m === "login" ? "Login" : "Register"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === "register" && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label htmlFor="name" className="block text-sm font-medium text-zinc-400">Name</label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-zinc-400">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-zinc-400">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
              />
            </div>

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
                {error}
              </motion.p>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold shadow-lg shadow-violet-600/25 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {mode === "register" ? "Creating account..." : "Logging in..."}
                </>
              ) : mode === "register" ? "Create account" : "Login"}
            </motion.button>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
}
