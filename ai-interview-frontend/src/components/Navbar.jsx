import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
  const { user, userProfile, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate("/");
  };

  const initial = (userProfile?.name || "U").trim().charAt(0).toUpperCase();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 md:h-16">
          <div className="flex items-center gap-6">
            <Link to="/" className="font-display text-xl font-bold text-white hover:text-violet-400 transition">
              AI Interview
            </Link>
            <div className="hidden sm:flex items-center gap-1">
              <Link to="/" className="px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 text-sm font-medium transition">
                Home
              </Link>
              <a href="#about" className="px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 text-sm font-medium transition">
                About Us
              </a>
              <Link to="/setup" className="px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 text-sm font-medium transition">
                Setup
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!user ? (
              <>
                <Link to="/login" className="px-4 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 text-sm font-medium transition">
                  Login
                </Link>
                <Link to="/login" className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition">
                  Sign up
                </Link>
              </>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-zinc-800 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                >
                  <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white font-semibold text-sm">
                    {initial}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-white max-w-[120px] truncate">
                    {userProfile?.name || "User"}
                  </span>
                  <svg className={`w-4 h-4 text-zinc-400 transition ${dropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} aria-hidden="true" />
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute right-0 mt-2 w-52 rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl z-50 py-1"
                      >
                        <button
                          type="button"
                          onClick={() => { setDropdownOpen(false); navigate("/history"); }}
                          className="w-full px-4 py-2.5 text-left text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
                        >
                          View History
                        </button>
                        <button
                          type="button"
                          onClick={() => { setDropdownOpen(false); navigate("/setup"); }}
                          className="w-full px-4 py-2.5 text-left text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
                        >
                          Start Interview
                        </button>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-zinc-800 transition"
                        >
                          Logout
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
