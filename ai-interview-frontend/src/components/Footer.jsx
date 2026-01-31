import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="w-full border-t border-zinc-800 bg-zinc-950 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-zinc-500 text-sm font-sans">
            © {new Date().getFullYear()} AI Interview. Practice with AI-powered questions.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/" className="text-zinc-500 hover:text-violet-400 text-sm font-medium transition">
              Home
            </Link>
            <a href="#about" className="text-zinc-500 hover:text-violet-400 text-sm font-medium transition">
              About
            </a>
            <Link to="/setup" className="text-zinc-500 hover:text-violet-400 text-sm font-medium transition">
              Setup
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
