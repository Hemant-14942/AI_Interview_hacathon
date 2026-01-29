import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/api";
import { AuthContext } from "../context/AuthContext";
import debug from "../utils/debug";

export default function Login() {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  debug.component("Login", `Screen load hua, mode = ${mode}`);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    debug.action("Login", mode === "register" ? "Register form submit" : "Login form submit", { email });

    try {
      if (mode === "register") {
        debug.api("Register API call", "POST /auth/register", { name, email });
        const res = await api.post("/auth/register", { name, email, password });
        debug.flow("Register success – token mila, ab setup pe jaa rahe hain");
        login(res.data.access_token);
        toast.success("Account ban gaya! Setup pe ja rahe hain.");
        navigate("/setup");
      } else {
        debug.api("Login API call", "POST /auth/login", { email });
        const res = await api.post("/auth/login", { email, password });
        debug.flow("Login success – token mila, ab setup pe jaa rahe hain");
        login(res.data.access_token);
        toast.success("Login ho gaya! Setup pe ja rahe hain.");
        navigate("/setup");
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg =
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
            ? detail.map((x) => x.msg).join(", ")
            : mode === "register"
              ? "Registration failed"
              : "Invalid email or password";
      setError(msg);
      debug.error("Login", "Auth fail – backend se error", { detail, msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>AI Interview</h1>
        <p>Practice with AI-powered interview questions</p>
      </div>

      <div className="card">
        <div className="tabs">
          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            onClick={() => {
              setMode("login");
              setError("");
              debug.action("Login", "Tab switch – Login");
            }}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === "register" ? "active" : ""}
            onClick={() => {
              setMode("register");
              setError("");
              debug.action("Login", "Tab switch – Register");
            }}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <div className="input-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                placeholder="Your name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
          )}

          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
            />
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                {mode === "register" ? "Creating account..." : "Logging in..."}
              </>
            ) : mode === "register" ? (
              "Create account"
            ) : (
              "Login"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
