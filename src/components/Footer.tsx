export default function Footer() {
  return (
    <footer className="w-full bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
      &copy; {new Date().getFullYear()} IFGF. All rights reserved.
    </footer>
  );
}
