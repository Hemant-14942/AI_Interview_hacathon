import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero / Landing */}
        <section className="relative overflow-hidden border-b border-zinc-800">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 -left-40 w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 -right-40 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="font-display text-4xl md:text-5xl font-bold text-white mb-4 leading-tight"
                >
                  Practice interviews with <span className="text-violet-400">AI</span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-zinc-400 text-lg font-sans mb-8"
                >
                  Upload your resume, get personalized questions, and record your answers. Get scores and feedback to improve.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="flex flex-wrap gap-4"
                >
                  <button
                    type="button"
                    onClick={() => navigate("/setup")}
                    className="px-6 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold shadow-lg shadow-violet-600/25 transition"
                  >
                    Start Interview
                  </button>
                  <button
                    type="button"
                    onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}
                    className="px-6 py-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold border border-zinc-700 transition"
                  >
                    Explore
                  </button>
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="rounded-2xl   flex items-center justify-center overflow-hidden"
              >
                <img
                  src="/homepagepic.gif"
                  alt="Demo of AI interview process"
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Why choose us */}
        <section id="about" className="border-b border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <h2 className="font-display text-3xl font-bold text-center text-white mb-12">Why choose us</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6"
              >
                <div className="w-12 h-12 rounded-xl bg-violet-600/20 flex items-center justify-center text-violet-400 mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-display text-lg font-bold text-white mb-2">Personalized questions</h3>
                <p className="text-zinc-400 text-sm font-sans">We match questions to your resume and the job description so you practice what matters.</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6"
              >
                <div className="w-12 h-12 rounded-xl bg-violet-600/20 flex items-center justify-center text-violet-400 mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-display text-lg font-bold text-white mb-2">Video answers</h3>
                <p className="text-zinc-400 text-sm font-sans">Record your answers on camera. We analyze content and delivery for better feedback.</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6"
              >
                <div className="w-12 h-12 rounded-xl bg-violet-600/20 flex items-center justify-center text-violet-400 mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-display text-lg font-bold text-white mb-2">Scores & feedback</h3>
                <p className="text-zinc-400 text-sm font-sans">Get technical, communication, and behavior scores plus actionable feedback after each interview.</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* User feedback */}
        <section className="border-b border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <h2 className="font-display text-3xl font-bold text-center text-white mb-12">What users say</h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6"
              >
                <p className="text-zinc-300 font-sans mb-4">&ldquo;Questions were tailored to my resume. Felt like a real interview.&rdquo;</p>
                <p className="text-sm text-violet-400 font-medium">— Practice user</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6"
              >
                <p className="text-zinc-300 font-sans mb-4">&ldquo;Report helped me see where I need to improve. Very useful.&rdquo;</p>
                <p className="text-sm text-violet-400 font-medium">— Candidate</p>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
