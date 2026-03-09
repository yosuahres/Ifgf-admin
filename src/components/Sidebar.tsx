export default function Sidebar() {
  return (
    <aside className="w-64 h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 p-6 flex flex-col">
      <nav className="flex flex-col gap-4">
        <a href="/admin" className="font-medium text-zinc-900 dark:text-zinc-50 hover:text-blue-600">Dashboard</a>
        <a href="/admin/users" className="font-medium text-zinc-900 dark:text-zinc-50 hover:text-blue-600">Users</a>
        <a href="/admin/events" className="font-medium text-zinc-900 dark:text-zinc-50 hover:text-blue-600">Events</a>
        <a href="/admin/settings" className="font-medium text-zinc-900 dark:text-zinc-50 hover:text-blue-600">Settings</a>
      </nav>
    </aside>
  );
}
