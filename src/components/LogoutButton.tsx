"use client";

import { LogOut } from "lucide-react";
import type React from "react";
import { handleLogout } from "@/app/auth/action";

const LogoutButton: React.FC = () => (
  <button
    onClick={async () => await handleLogout()}
    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
  >
    <LogOut size={14} />
    <span>Sign out</span>
  </button>
);

export default LogoutButton;
