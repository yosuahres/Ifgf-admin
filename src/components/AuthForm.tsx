import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database.types";

interface AuthFormProps {
  type: "login" | "signup";
}

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
    // Only login logic
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else if (data?.user) {
      // Fetch user role from profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle<{ role: "admin" | "pastor" | "leader" | "user" }>();
      if (profileError) {
        setError(profileError.message);
      } else if (!profile) {
        setError("Profile not found. Please contact support.");
      } else if (profile && typeof profile.role === "string") {
        localStorage.setItem("role", profile.role);
        if (profile.role === "admin") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/";
        }
      }
    }
    setLoading(false);
  };

  return (
    <form className="space-y-4 w-full max-w-xs" onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="input input-bordered w-full"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="input input-bordered w-full"
        required
      />
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <button type="submit" className="btn btn-primary w-full" disabled={loading}>
        {loading ? "Loading..." : "Login"}
      </button>
    </form>
  );
}
