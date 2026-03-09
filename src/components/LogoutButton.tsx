import React from "react";

interface LogoutButtonProps {
  onLogout: () => void;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ onLogout }) => (
  <button
    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
    onClick={onLogout}
  >
    Logout
  </button>
);

export default LogoutButton;
