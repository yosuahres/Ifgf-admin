"use client";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role === "admin") setAuthorized(true);
    else window.location.href = "/login";
  }, []);

  if (!authorized) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back! Here's what's happening.
        </p>
      </div>
    </div>
  );
}
