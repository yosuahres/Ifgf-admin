'use client'
import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md p-8 bg-white rounded shadow">
        <h1 className="text-2xl font-semibold mb-6">Login</h1>
        <AuthForm type="login" />
      </div>
    </div>
  );
}
