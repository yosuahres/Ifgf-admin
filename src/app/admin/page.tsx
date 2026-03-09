import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 bg-zinc-50 dark:bg-black">
          {/* Dashboard content goes here */}
          <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
          <p>Welcome to the admin dashboard!</p>
        </main>
      </div>
      <Footer />
    </div>
  );
}
