// admin/page.tsx
"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Cake, PartyPopper, CalendarDays, Users } from "lucide-react";

interface BirthdayPerson {
  id: string;
  nama_lengkap: string;
  dob: string;
  daysUntil: number;
  age: number;
}

function getDaysUntilBirthday(dob: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const birth = new Date(dob);
  const next = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getAge(dob: string): number {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age + 1; // turning age
}

function formatBirthDate(dob: string): string {
  return new Date(dob).toLocaleDateString("id-ID", { day: "numeric", month: "long" });
}

function BirthdayCard({ person }: { person: BirthdayPerson }) {
  const isToday = person.daysUntil === 0;
  const isTomorrow = person.daysUntil === 1;

  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-all ${
        isToday
          ? "bg-amber-50 border-amber-200 shadow-sm"
          : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
          isToday ? "bg-amber-400 text-white" : "bg-gray-100 text-gray-500"
        }`}
      >
        {person.nama_lengkap.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{person.nama_lengkap}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {formatBirthDate(person.dob)} · Usia {person.age}
        </p>
      </div>

      <div
        className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
          isToday
            ? "bg-amber-400 text-white"
            : isTomorrow
              ? "bg-orange-100 text-orange-700"
              : "bg-gray-100 text-gray-500"
        }`}
      >
        {isToday ? "🎉 Hari ini!" : isTomorrow ? "Besok" : `${person.daysUntil} hari lagi`}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [authorized, setAuthorized] = useState(false);
  const [birthdays, setBirthdays] = useState<BirthdayPerson[]>([]);
  const [loadingBirthdays, setLoadingBirthdays] = useState(true);
  const [totalActive, setTotalActive] = useState<number | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role === "admin") setAuthorized(true);
    else window.location.href = "/login";
  }, []);

  useEffect(() => {
    if (!authorized) return;

    const fetchData = async () => {
      setLoadingBirthdays(true);

      // Single query — reuse for both total count and birthday filtering
      const { data, error, count } = await supabase
        .from("jemaat")
        .select("id, nama_lengkap, dob", { count: "exact" })
        .eq("status_jemaat", "aktif");

      if (!error && data) {
        setTotalActive(count ?? data.length);

        const upcoming = data
          .filter((j) => j.dob !== null)
          .map((j) => ({
            id: j.id,
            nama_lengkap: j.nama_lengkap,
            dob: j.dob!,
            daysUntil: getDaysUntilBirthday(j.dob!),
            age: getAge(j.dob!),
          }))
          .filter((j) => j.daysUntil <= 7)
          .sort((a, b) => a.daysUntil - b.daysUntil);

        setBirthdays(upcoming);
      }

      setLoadingBirthdays(false);
    };

    fetchData();
  }, [authorized]);

  if (!authorized) return null;

  const todayCount = birthdays.filter((b) => b.daysUntil === 0).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back! Here's what's happening.</p>
      </div>

      {/* Stat Cards Row */}
      <div className="flex flex-wrap gap-4 mb-8">
        {/* Total Active Jemaat */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-6 py-5 flex items-center gap-4 min-w-[200px]">
          <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
            <Users size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
              Jemaat Aktif
            </p>
            {totalActive === null ? (
              <div className="h-7 w-16 bg-gray-100 rounded animate-pulse" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">{totalActive.toLocaleString("id-ID")}</p>
            )}
          </div>
        </div>
      </div>

      {/* Birthday Widget */}
      <div className="max-w-md">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Widget header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
                <Cake size={15} className="text-amber-600" />
              </div>
              <span className="text-sm font-semibold text-gray-800">Ulang Tahun Minggu Ini</span>
            </div>
            {todayCount > 0 && (
              <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                <PartyPopper size={11} />
                {todayCount} hari ini
              </span>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            {loadingBirthdays ? (
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : birthdays.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <CalendarDays size={32} className="text-gray-200" />
                <p className="text-sm text-gray-400">Tidak ada ulang tahun dalam 7 hari ke depan</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                {birthdays.map((person) => (
                  <BirthdayCard key={person.id} person={person} />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {!loadingBirthdays && birthdays.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-400">
                {birthdays.length} jemaat berulang tahun dalam 7 hari ke depan
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
