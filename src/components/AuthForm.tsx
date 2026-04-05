// src/components/AuthForm.tsx
"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface AuthFormProps {
  type: "login" | "signup";
}

const roleRedirect: Record<string, string> = {
  admin: "/admin",
  leader: "/leader",
  pastor: "/",
  finance: "/finance",
  usher: "/usher",
};

export default function AuthForm({ type }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else if (data?.user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle<{ role: "admin" | "pastor" | "leader" | "finance" | "usher" }>();

      if (profileError) {
        setError(profileError.message);
      } else if (!profile) {
        setError("Profile not found. Please contact support.");
      } else if (profile && typeof profile.role === "string") {
        localStorage.setItem("role", profile.role);
        window.location.href = roleRedirect[profile.role] ?? "/";
      }
    }

    setLoading(false);
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">
          Email address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Password</label>
          <a
            href="/forgot-password"
            className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
          >
            Forgot password?
          </a>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm text-red-700">
          <span className="shrink-0 mt-px">⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors mt-1"
      >
        {loading && (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
