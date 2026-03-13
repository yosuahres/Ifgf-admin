export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-gray-200 px-6 h-10 flex items-center shrink-0">
      <span className="text-xs text-gray-400">
        &copy; {new Date().getFullYear()} IFGF. All rights reserved.
      </span>
    </footer>
  );
}
