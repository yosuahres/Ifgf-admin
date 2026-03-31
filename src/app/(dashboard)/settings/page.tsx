//app/(dashboard)/settings/page.tsx
"use client";
import { useEffect, useState } from "react";
import { User, Lock, CheckCircle, AlertCircle, Eye, EyeOff, Shield, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

type Profile = {
  full_name: string;
  role: string;
  email: string;
};

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  admin:  { label: "Administrator", color: "bg-purple-100 text-purple-700" },
  pastor: { label: "Pastor",        color: "bg-blue-100 text-blue-700"   },
  leader: { label: "Leader",        color: "bg-green-100 text-green-700" },
  user:   { label: "Member",        color: "bg-gray-100 text-gray-600"   },
};

type Toast = { type: "success" | "error"; message: string } | null;
type ActiveTab = "profile" | "account";

function Toast({ toast }: { toast: Toast }) {
  if (!toast) return null;
  return (
    <div
      className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium shadow-md border animate-fade-in
        ${toast.type === "success"
          ? "bg-green-50 border-green-200 text-green-800"
          : "bg-red-50 border-red-200 text-red-800"}`}
    >
      {toast.type === "success"
        ? <CheckCircle size={16} className="shrink-0 text-green-600" />
        : <AlertCircle size={16} className="shrink-0 text-red-500" />}
      {toast.message}
    </div>
  );
}

function PasswordInput({
  value, onChange, placeholder, autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "••••••••"}
        autoComplete={autoComplete}
        className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const supabase = createClient();
  const isMobile = useIsMobile();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("profile");

  // Profile form
  const [fullName, setFullName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileToast, setProfileToast] = useState<Toast>(null);

  // Password form
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordToast, setPasswordToast] = useState<Toast>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: p } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .maybeSingle();

      if (p) {
        const profileData: Profile = {
          full_name: p.full_name ?? "",
          role: p.role ?? "user",
          email: user.email ?? "",
        };
        setProfile(profileData);
        setFullName(p.full_name ?? "");
      }
      setLoadingProfile(false);
    };
    load();
  }, []);

  const showToast = (
    setter: (t: Toast) => void,
    toast: NonNullable<Toast>
  ) => {
    setter(toast);
    setTimeout(() => setter(null), 4000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    setSavingProfile(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim() })
      .eq("id", user.id);

    setSavingProfile(false);
    if (error) {
      showToast(setProfileToast, { type: "error", message: error.message });
    } else {
      setProfile((prev) => prev ? { ...prev, full_name: fullName.trim() } : prev);
      showToast(setProfileToast, { type: "success", message: "Profile updated successfully." });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      showToast(setPasswordToast, { type: "error", message: "Password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast(setPasswordToast, { type: "error", message: "Passwords do not match." });
      return;
    }

    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);

    if (error) {
      showToast(setPasswordToast, { type: "error", message: error.message });
    } else {
      setNewPassword("");
      setConfirmPassword("");
      showToast(setPasswordToast, { type: "success", message: "Password changed successfully." });
    }
  };

  const roleInfo = ROLE_LABELS[profile?.role ?? "user"] ?? ROLE_LABELS.user;

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Public profile", icon: <User size={16} /> },
    { id: "account", label: "Account",        icon: <Lock size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top back bar */}
      <div className="max-w-5xl mx-auto px-4 pt-4 pb-2 md:pt-6">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={15} />
          Back
        </button>
      </div>

      {/* Mobile: stacked layout; Desktop: sidebar + content side by side */}
      <div className="max-w-5xl mx-auto px-4 pb-12 flex flex-col md:flex-row gap-0 md:gap-8">

        {/* ── Nav: horizontal pill tabs on mobile, sidebar on desktop ── */}
        {isMobile ? (
          <nav className="flex gap-1 p-1 bg-white border border-gray-200 rounded-xl mb-4 w-full">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center justify-center gap-2 flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors
                  ${activeTab === item.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                  }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        ) : (
          <aside className="w-56 shrink-0 pt-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Settings</p>
            <nav className="flex flex-col gap-0.5">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${activeTab === item.id
                      ? "bg-blue-50 text-blue-700 border border-blue-100"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                >
                  <span className={activeTab === item.id ? "text-blue-600" : "text-gray-400"}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>
        )}

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0 md:pt-2 space-y-6">

          {/* PUBLIC PROFILE TAB */}
          {activeTab === "profile" && (
            <>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Public profile</h1>
                <p className="text-sm text-gray-500 mt-0.5">Update your display name and view your account details.</p>
              </div>

              <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 md:px-6 py-4 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <User size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Profile Information</h2>
                    <p className="text-xs text-gray-400">Update your display name.</p>
                  </div>
                </div>

                <div className="px-4 md:px-6 py-5 space-y-5">
                  {/* Avatar + role badge */}
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
                      {profile?.full_name?.charAt(0).toUpperCase() ?? "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{profile?.full_name}</p>
                      <p className="text-xs text-gray-400 mb-1.5 truncate">{profile?.email}</p>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${roleInfo.color}`}>
                        <Shield size={11} />
                        {roleInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Read-only role info */}
                  <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-start gap-2.5 text-xs text-gray-500">
                    <AlertCircle size={14} className="shrink-0 mt-px text-gray-400" />
                    Your role is assigned by an administrator and cannot be changed from this page.
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    {/* Single column on mobile, two columns on sm+ */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Full Name</label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          placeholder="Your full name"
                          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Email Address</label>
                        <input
                          type="email"
                          value={profile?.email ?? ""}
                          readOnly
                          disabled
                          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {/* On mobile: toast above button, stacked; on desktop: side by side */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                      <Toast toast={profileToast} />
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        {savingProfile && (
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        )}
                        {savingProfile ? "Saving…" : "Save changes"}
                      </button>
                    </div>
                  </form>
                </div>
              </section>
            </>
          )}

          {/* ACCOUNT TAB */}
          {activeTab === "account" && (
            <>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Account</h1>
                <p className="text-sm text-gray-500 mt-0.5">Manage your password and account security.</p>
              </div>

              <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 md:px-6 py-4 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Lock size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Change Password</h2>
                    <p className="text-xs text-gray-400">Choose a strong password (min. 8 characters).</p>
                  </div>
                </div>

                <div className="px-4 md:px-6 py-5">
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">New Password</label>
                      <PasswordInput
                        value={newPassword}
                        onChange={setNewPassword}
                        placeholder="New password"
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                      <PasswordInput
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        placeholder="Confirm new password"
                        autoComplete="new-password"
                      />
                    </div>

                    {/* Password strength hint */}
                    {newPassword.length > 0 && (
                      <div className="flex gap-1.5 items-center">
                        {[4, 8, 12].map((threshold, i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              newPassword.length >= threshold
                                ? i === 0 ? "bg-red-400" : i === 1 ? "bg-yellow-400" : "bg-green-500"
                                : "bg-gray-200"
                            }`}
                          />
                        ))}
                        <span className="text-xs text-gray-400 ml-1">
                          {newPassword.length < 4 ? "Too short" : newPassword.length < 8 ? "Weak" : newPassword.length < 12 ? "Fair" : "Strong"}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                      <Toast toast={passwordToast} />
                      <button
                        type="submit"
                        disabled={savingPassword}
                        className="w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        {savingPassword && (
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        )}
                        {savingPassword ? "Updating…" : "Update password"}
                      </button>
                    </div>
                  </form>
                </div>
              </section>
            </>
          )}

        </main>
      </div>
    </div>
  );
}