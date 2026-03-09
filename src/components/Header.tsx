export default function Header() {
  return (
    <header className="w-full bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between">
      <div className="text-xl font-bold text-zinc-900 dark:text-zinc-50">IFGF Admin Dashboard</div>
      <div className="flex items-center gap-4">
        {/* Add user info, notifications, etc. here */}
        <span className="text-zinc-700 dark:text-zinc-300">Admin</span>
      </div>
    </header>
  );
}
