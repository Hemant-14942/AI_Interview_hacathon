"use client";

import React, { useState, KeyboardEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Container } from "@/components/Container";
import { createJob } from "@/lib/jobs";
import type { Mode, JobCreateRequest } from "@/types/jobs";

type JobFormState = {
  title: string;
  description: string;
  location: string;
  salary: string;
  experience: string;
  mode: Mode;
  skills: string[];
  skillsInput: string;
};

const modeOptions: { value: Mode; label: string; hint: string }[] = [
  { value: "remote", label: "Remote", hint: "Anywhere, async friendly" },
  { value: "onsite", label: "Onsite", hint: "Office first, in‑person" },
  { value: "hybrid", label: "Hybrid", hint: "Few days office, rest remote" },
];

const CreateJobsPage = () => {
  const router = useRouter();

  const [form, setForm] = useState<JobFormState>({
    title: "",
    description: "",
    location: "",
    salary: "",
    experience: "",
    mode: "remote",
    skills: [],
    skillsInput: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const addSkillFromInput = () => {
    const value = form.skillsInput.trim();
    if (!value) return;
    if (form.skills.includes(value)) {
      setForm((f) => ({ ...f, skillsInput: "" }));
      return;
    }
    setForm((f) => ({
      ...f,
      skills: [...f.skills, value],
      skillsInput: "",
    }));
  };

  const handleSkillsKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkillFromInput();
    } else if (e.key === "Backspace" && !form.skillsInput && form.skills.length > 0) {
      e.preventDefault();
      setForm((f) => ({
        ...f,
        skills: f.skills.slice(0, -1),
      }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.title.trim() || !form.description.trim() || !form.location.trim()) {
      setError("Title, description and location are required.");
      return;
    }

    const salaryNumber = Number(form.salary);
    const experienceNumber = Number(form.experience);

    if (Number.isNaN(salaryNumber) || salaryNumber <= 0) {
      setError("Please enter a valid positive salary.");
      return;
    }

    if (Number.isNaN(experienceNumber) || experienceNumber < 0) {
      setError("Experience years must be zero or a positive number.");
      return;
    }

    const payload: JobCreateRequest = {
      title: form.title.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      salary: salaryNumber,
      experience: experienceNumber,
      skills: form.skills,
      mode: form.mode,
    };

    setLoading(true);
    try {
      const response = await createJob(payload);
      setSuccess(response.message || "Job created successfully.");

      setForm({
        title: "",
        description: "",
        location: "",
        salary: "",
        experience: "",
        mode: "remote",
        skills: [],
        skillsInput: "",
      });

      setTimeout(() => {
        router.push("/dashboard");
      }, 900);
    } catch (err: unknown) {
      const maybeAxiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(
        maybeAxiosErr.response?.data?.detail ??
          maybeAxiosErr.message ??
          "Something went wrong while creating the job."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <Navbar />

      <Container className="py-10 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          {/* Left: AI interview themed context */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-100 backdrop-blur">
              <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              AI‑assisted interview pipeline
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Design a job your{" "}
              <span className="bg-linear-to-r from-emerald-300 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                AI interviewer
              </span>{" "}
              can understand.
            </h1>
            <p className="max-w-xl text-sm leading-6 text-slate-300">
              A clear job description helps candidates prepare better and allows the AI interviewer
              to evaluate more precisely. Use the form to define the role, skills and context in a
              crisp, structured way.
            </p>

            <div className="grid gap-4 text-xs text-slate-200 sm:grid-cols-3">
              <div className="group rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur transition hover:-translate-y-1 hover:border-emerald-300/60 hover:bg-emerald-300/10">
                <p className="font-semibold">Structured job description</p>
                <p className="mt-1 text-slate-300">
                  Title, level, work mode and compensation give the AI clear signals.
                </p>
              </div>
              <div className="group rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur transition hover:-translate-y-1 hover:border-sky-300/60 hover:bg-sky-300/10">
                <p className="font-semibold">Skill signals</p>
                <p className="mt-1 text-slate-300">
                  Tag skills as chips so the model can focus its questions on what matters.
                </p>
              </div>
              <div className="group rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur transition hover:-translate-y-1 hover:border-indigo-300/60 hover:bg-indigo-300/10">
                <p className="font-semibold">Interview ready</p>
                <p className="mt-1 text-slate-300">
                  Review and manage live roles directly from your recruiter dashboard.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Job create form */}
          <div className="flex items-stretch">
            <div className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-xl shadow-emerald-500/10 backdrop-blur">
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-sky-500/10 blur-3xl" />

              <div className="relative">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">Create a new role</h2>
                    <p className="mt-1 text-xs text-slate-300">
                      3–4 fields fill karo, rest AI + platform handle karega.
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
                    Recruiter · Studio
                  </span>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-200">
                      Job title
                    </label>
                    <input
                      type="text"
                      placeholder="Senior Backend Engineer"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs outline-none placeholder:text-slate-500 focus:border-emerald-300/70 focus:ring-1 focus:ring-emerald-400/60"
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-200">
                        Location
                      </label>
                      <input
                        type="text"
                        placeholder="Bengaluru · India"
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs outline-none placeholder:text-slate-500 focus:border-sky-300/70 focus:ring-1 focus:ring-sky-400/60"
                        value={form.location}
                        onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-200">
                        Mode
                      </label>
                      <div className="flex gap-1.5">
                        {modeOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, mode: option.value }))}
                            className={`flex-1 rounded-2xl border px-2.5 py-2 text-[11px] font-medium transition ${
                              form.mode === option.value
                                ? "border-emerald-300/80 bg-emerald-400/10 text-emerald-100 shadow-sm shadow-emerald-500/20"
                                : "border-white/10 bg-white/0 text-slate-300 hover:border-emerald-200/40 hover:bg-emerald-200/5"
                            }`}
                          >
                            <span className="block">{option.label}</span>
                            <span className="block text-[10px] text-slate-400">
                              {option.hint}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-200">
                        Salary (CTC)
                      </label>
                      <div className="flex rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs focus-within:border-indigo-300/70 focus-within:ring-1 focus-within:ring-indigo-400/60">
                        <span className="mt-px text-slate-400">₹</span>
                        <input
                          type="number"
                          min={0}
                          placeholder="3000000"
                          className="ml-1 w-full bg-transparent outline-none placeholder:text-slate-500"
                          value={form.salary}
                          onChange={(e) => setForm((f) => ({ ...f, salary: e.target.value }))}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Annual CTC in your base currency.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-200">
                        Experience (years)
                      </label>
                      <input
                        type="number"
                        min={0}
                        placeholder="3"
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs outline-none placeholder:text-slate-500 focus:border-indigo-300/70 focus:ring-1 focus:ring-indigo-400/60"
                        value={form.experience}
                        onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))}
                      />
                      <p className="text-[10px] text-slate-400">
                        The AI interviewer will calibrate its level based on this value.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-200">
                      Key skills
                    </label>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs focus-within:border-sky-300/70 focus-within:ring-1 focus-within:ring-sky-400/60">
                      <div className="flex flex-wrap gap-1.5">
                        {form.skills.map((skill) => (
                          <button
                            key={skill}
                            type="button"
                            className="group inline-flex items-center gap-1 rounded-full bg-slate-900/70 px-2.5 py-1 text-[11px] text-slate-100 ring-1 ring-white/10 transition hover:bg-emerald-500/10 hover:text-emerald-100 hover:ring-emerald-300/70"
                            onClick={() =>
                              setForm((f) => ({
                                ...f,
                                skills: f.skills.filter((s) => s !== skill),
                              }))
                            }
                          >
                            <span>{skill}</span>
                            <span className="text-[9px] text-slate-400 group-hover:text-emerald-200">
                              ×
                            </span>
                          </button>
                        ))}
                        <input
                          type="text"
                          value={form.skillsInput}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              skillsInput: e.target.value,
                            }))
                          }
                          onKeyDown={handleSkillsKeyDown}
                          placeholder={form.skills.length === 0 ? "Type skill & press Enter" : ""}
                          className="min-w-[120px] flex-1 bg-transparent px-1 py-1 text-xs outline-none placeholder:text-slate-500"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Example: <span className="font-mono">Node.js</span>,{" "}
                      <span className="font-mono">PostgreSQL</span>,{" "}
                      <span className="font-mono">System Design</span>.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-200">
                      Role description
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Describe what this hire will own, example projects, and what 'great' looks like after 6 months."
                      className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs outline-none placeholder:text-slate-500 focus:border-slate-100/80 focus:ring-1 focus:ring-slate-100/70"
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    />
                    <p className="text-[10px] text-slate-400">
                      This text gives direct context to the AI interviewer — keep it crisp and
                      realistic.
                    </p>
                  </div>

                  {error && (
                    <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-[11px] text-red-100">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-100">
                      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span>{success}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary h-10 w-full gap-2 rounded-2xl px-4 text-xs shadow-lg shadow-primary/30 transition hover:-translate-y-px"
                  >
                    {loading ? (
                      <>
                        <span className="h-3 w-3 animate-spin rounded-full border border-bg/25 border-t-bg" />
                        Creating role…
                      </>
                    ) : (
                      <>Create job &amp; go to dashboard</>
                    )}
                  </button>

                  <p className="text-[10px] text-slate-400">
                    This role is saved in your recruiter workspace. Candidate interview flows will
                    be configured from this definition.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default CreateJobsPage;
