"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Bot, KeyRound, Mail, ArrowRight, ShieldAlert, CheckCircle } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Read URL params if redirected from dashboard or registered
  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccess("Account created successfully! Please sign in below.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      setSuccess("Sign-in successful! Redirecting you...");
      
      // Delay slightly for smooth transition
      setTimeout(() => {
        const from = searchParams.get("from") || "/dashboard/overview";
        router.push(from);
        router.refresh();
      }, 800);

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-2xl p-8">
      {/* Logo Header */}
      <div className="text-center mb-8 flex flex-col items-center">
        <Link href="/" className="flex items-center gap-2 mb-4">
          <span className="bg-blue-600 rounded-lg p-1.5 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-white" />
          </span>
          <span className="font-outfit font-extrabold text-lg tracking-tight text-slate-800">
            SupportIQ <span className="text-blue-600 font-bold">AI</span>
          </span>
        </Link>
        <h2 className="text-xl font-bold font-outfit text-slate-800">Sign in to your account</h2>
        <p className="text-xs text-slate-500 mt-1">Manage your customer support automation</p>
      </div>

      {/* Banners */}
      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex gap-2.5 items-start">
          <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex gap-2.5 items-start">
          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1.5">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition"
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Password</label>
            <a href="#" className="text-[11px] text-blue-600 font-semibold hover:underline">Forgot password?</a>
          </div>
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition"
              disabled={isLoading}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl text-sm transition flex items-center justify-center gap-1.5 mt-6 shadow"
        >
          {isLoading ? "Signing In..." : "Sign In"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Footer Links */}
      <div className="mt-8 text-center border-t border-slate-100 pt-6 text-xs text-slate-500">
        New to SupportIQ?{" "}
        <Link href="/register" className="text-blue-600 font-semibold hover:underline">
          Create an account
          </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-6 grid-bg">
      <Suspense fallback={
        <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-2xl p-8 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-medium">Loading session parameters...</p>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
