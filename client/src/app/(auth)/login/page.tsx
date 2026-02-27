"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { getMe, login } from "@/app/lib/auth"
import { toast } from "sonner"
import Image from "next/image"
import Link from "next/link"
import { Navbar } from "@/components/Navbar"
import { Container } from "@/components/Container"
import type { LoginRequest } from "@/app/types/auth"
export default function LoginPage() {
  const router = useRouter()
  const [loginRequest, setLoginRequest] = useState<LoginRequest>({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      await login(loginRequest)
      const { data: user, message } = await getMe()
      if (user.role === "candidate") {
        router.push("/jobs")
      } else {
        router.push("/dashboard")
      }
      toast.success(message)
    } catch (error) {
      console.error(error)
      toast.error("Login failed")
    }
  }


  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-white">
      <Navbar />

      <Container className="grid gap-10 py-12 lg:grid-cols-2 lg:py-16">
        <div className="hidden lg:block">
          <div className="sticky top-24 rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-8 dark:border-white/10 dark:from-white/5 dark:to-white/0">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Welcome back
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Continue your interview prep.
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Hinglish-friendly UI, clean theme, and role-based navigation after login.
            </p>
            <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
              <Image
                src="/illustrations/auth.svg"
                alt="Auth illustration"
                width={1200}
                height={900}
                className="h-auto w-full"
                priority
              />
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-full">
            <div className="mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-white/5">
              <h2 className="text-2xl font-semibold tracking-tight">Login</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-semibold text-slate-900 underline-offset-4 hover:underline dark:text-white">
                  Register
                </Link>
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="you@company.com"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:placeholder:text-slate-500 dark:focus:border-white/20"
                    value={loginRequest.email}
                    onChange={(e) => setLoginRequest({ ...loginRequest, email: e.target.value })}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>

                  <input
                    placeholder="••••••••"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:placeholder:text-slate-500 dark:focus:border-white/20"
                    value={loginRequest.password}
                    type={showPassword ? "text" : "password"}
                    onChange={(e) => setLoginRequest({ ...loginRequest, password: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  Login
                </button>
              </form>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}