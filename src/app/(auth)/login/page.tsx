"use client";
import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-blue-600">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <img 
              src="assets/ifgf-logo2.png" 
              alt="ifgf-logo" 
            />
          </div>
          <span className="text-white font-semibold text-sm">Batam</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold text-white leading-snug mb-3">
            IFGF Batam
            <br />
            administrator
          </h2>
        </div>
        <p className="text-blue-300 text-xs">
          &copy; {new Date().getFullYear()} IFGF Batam. All rights reserved.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 lg:flex-none lg:w-[480px] items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">IF</span>
            </div>
            <span className="font-semibold text-gray-900 text-sm">
              IFGF Batam
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">
              Welcome back
            </h1>
            <p className="text-sm text-gray-500">
              Sign in to your account to continue
            </p>
          </div>

          <AuthForm type="login" />
        </div>
      </div>
    </div>
  );
}
