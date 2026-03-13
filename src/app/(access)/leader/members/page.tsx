"use client";
import { Search, UserMinus, UserPlus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type IcareGroup = {
  id: string;
  nama_icare: string;
};

type Jemaat = {
  id: string;
  nama_lengkap: string;
  gender: string | null;
  phone_number: string | null;
};

type Member = Jemaat & {
  member_id: string;
  join_date: string;
};

export default function IcareMembersPage() {
  const [authorized, setAuthorized] = useState(false);
  const [group, setGroup] = useState<IcareGroup | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [allJemaat, setAllJemaat] = useState<Jemaat[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [tab, setTab] = useState<"members" | "add">("members");
  const [search, setSearch] = useState("");
  const [addSearch, setAddSearch] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "leader") {
      window.location.href = "/login";
      return;
    }
    setAuthorized(true);
    loadData();
  }, []);

  const loadData = async () => {
    setLoadingPage(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoadingPage(false);
      return;
    }

    // Get jemaat.id from auth user
    const { data: jemaatSelf } = await supabase
      .from("jemaat")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!jemaatSelf) {
      setLoadingPage(false);
      return;
    }

    // Get icare group led by this leader
    const { data: groupData } = await supabase
      .from("icare_groups")
      .select("id, nama_icare")
      .eq("leader_id", jemaatSelf.id)
      .maybeSingle();

    if (!groupData) {
      setLoadingPage(false);
      return;
    }
    setGroup(groupData);

    await loadMembers(groupData.id);
    await loadAllJemaat();

    setLoadingPage(false);
  };

  const loadMembers = async (icareId: string) => {
    const { data } = await supabase
      .from("icare_members")
      .select("id, join_date, jemaat(id, nama_lengkap, gender, phone_number)")
      .eq("icare_id", icareId)
      .order("join_date", { ascending: false });

    const mapped: Member[] = (data ?? []).map((row: any) => ({
      member_id: row.id,
      join_date: row.join_date,
      id: row.jemaat.id,
      nama_lengkap: row.jemaat.nama_lengkap,
      gender: row.jemaat.gender,
      phone_number: row.jemaat.phone_number,
    }));
    setMembers(mapped);
  };

  const loadAllJemaat = async () => {
    const { data } = await supabase
      .from("jemaat")
      .select("id, nama_lengkap, gender, phone_number")
      .order("nama_lengkap");
    setAllJemaat(data ?? []);
  };

  const handleAdd = async (jemaatId: string) => {
    if (!group) return;
    setLoadingAction(jemaatId);
    const { error } = await supabase.from("icare_members").insert({
      icare_id: group.id,
      jemaat_id: jemaatId,
    } as any);
    if (error) {
      alert("Gagal menambah anggota: " + error.message);
    } else {
      await loadMembers(group.id);
    }
    setLoadingAction(null);
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm("Yakin ingin mengeluarkan anggota ini dari grup?")) return;
    setLoadingAction(memberId);
    const { error } = await supabase
      .from("icare_members")
      .delete()
      .eq("id", memberId);
    if (error) {
      alert("Gagal menghapus anggota: " + error.message);
    } else {
      await loadMembers(group!.id);
    }
    setLoadingAction(null);
  };

  const memberIds = new Set(members.map((m) => m.id));

  const filteredMembers = members.filter((m) =>
    m.nama_lengkap.toLowerCase().includes(search.toLowerCase()),
  );

  const availableJemaat = allJemaat.filter(
    (j) =>
      !memberIds.has(j.id) &&
      j.nama_lengkap.toLowerCase().includes(addSearch.toLowerCase()),
  );

  if (!authorized || loadingPage) return null;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">
          iCare Group
        </p>
        <h1 className="text-2xl font-semibold text-gray-900">
          {group ? group.nama_icare : "Grup Tidak Ditemukan"}
        </h1>
        {group && (
          <p className="text-sm text-gray-500 mt-1">
            {members.length} anggota terdaftar
          </p>
        )}
      </div>

      {!group && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-sm text-yellow-800">
          Anda belum ditugaskan sebagai leader di iCare group manapun. Hubungi
          admin.
        </div>
      )}

      {group && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
            <button
              onClick={() => setTab("members")}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === "members"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Users size={14} />
              Anggota ({members.length})
            </button>
            <button
              onClick={() => setTab("add")}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === "add"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <UserPlus size={14} />
              Tambah Anggota
            </button>
          </div>

          {/* Members tab */}
          {tab === "members" && (
            <div>
              {/* Search */}
              <div className="relative mb-4">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari anggota..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {filteredMembers.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
                  <Users size={32} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">
                    {search
                      ? "Anggota tidak ditemukan."
                      : "Belum ada anggota. Tambah dari tab Tambah Anggota."}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {filteredMembers.map((m) => (
                    <div
                      key={m.member_id}
                      className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-4"
                    >
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold text-blue-600">
                          {m.nama_lengkap.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {m.nama_lengkap}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {m.gender === "L"
                            ? "Laki-laki"
                            : m.gender === "P"
                              ? "Perempuan"
                              : "—"}
                          {m.phone_number && ` · ${m.phone_number}`}
                          <span className="ml-2 text-gray-300">·</span>
                          <span className="ml-2">
                            Bergabung{" "}
                            {new Date(m.join_date).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </p>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => handleRemove(m.member_id)}
                        disabled={loadingAction === m.member_id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 shrink-0"
                      >
                        {loadingAction === m.member_id ? (
                          <span className="w-3 h-3 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                        ) : (
                          <UserMinus size={12} />
                        )}
                        Keluarkan
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Add members tab */}
          {tab === "add" && (
            <div>
              {/* Search */}
              <div className="relative mb-4">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={addSearch}
                  onChange={(e) => setAddSearch(e.target.value)}
                  placeholder="Cari dari data jemaat..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {availableJemaat.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
                  <UserPlus size={32} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">
                    {addSearch
                      ? "Jemaat tidak ditemukan."
                      : "Semua jemaat sudah menjadi anggota grup ini."}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {availableJemaat.map((j) => (
                    <div
                      key={j.id}
                      className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-4"
                    >
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold text-gray-500">
                          {j.nama_lengkap.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {j.nama_lengkap}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {j.gender === "L"
                            ? "Laki-laki"
                            : j.gender === "P"
                              ? "Perempuan"
                              : "—"}
                          {j.phone_number && ` · ${j.phone_number}`}
                        </p>
                      </div>

                      {/* Add */}
                      <button
                        onClick={() => handleAdd(j.id)}
                        disabled={loadingAction === j.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 shrink-0"
                      >
                        {loadingAction === j.id ? (
                          <span className="w-3 h-3 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                        ) : (
                          <UserPlus size={12} />
                        )}
                        Tambah
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
