// admin/pelayanan/page.tsx
"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ChevronDown,
  ChevronUp,
  UserPlus,
  UserMinus,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
} from "lucide-react";

type LeaderOption = { value: string; label: string };

type Department = {
  id: string;
  nama_pelayanan: string;
  deskripsi: string | null;
  leader_id: string | null;
  created_at: string | null;
  jemaat?: { nama_lengkap: string } | null;
};

type DepartmentMember = {
  id: string;
  jemaat_id: string;
  role_pelayanan: string | null;
  tanggal_join: string | null;
  jemaat?: {
    nama_lengkap: string;
    gender: string | null;
    phone_number: string | null;
  } | null;
};

type Jemaat = {
  id: string;
  nama_lengkap: string;
  gender: string | null;
  phone_number: string | null;
};

export default function PelayananPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [leaderOptions, setLeaderOptions] = useState<LeaderOption[]>([]);
  const [allJemaat, setAllJemaat] = useState<Jemaat[]>([]);
  const [loading, setLoading] = useState(true);

  // Department form
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [deptName, setDeptName] = useState("");
  const [deptDesc, setDeptDesc] = useState("");
  const [deptLeader, setDeptLeader] = useState("");
  const [deptSubmitting, setDeptSubmitting] = useState(false);

  // Expanded department
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [members, setMembers] = useState<Record<string, DepartmentMember[]>>(
    {},
  );
  const [memberSearch, setMemberSearch] = useState<Record<string, string>>({});
  const [addSearch, setAddSearch] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<Record<string, "members" | "add">>(
    {},
  );
  const [roleInput, setRoleInput] = useState<Record<string, string>>({});
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([
      loadDepartments(),
      loadLeaderOptions(),
      loadAllJemaat(),
    ]);
    setLoading(false);
  };

  const loadDepartments = async () => {
    const { data } = await supabase
      .from("departments")
      .select(
        "id, nama_pelayanan, deskripsi, leader_id, created_at, jemaat(nama_lengkap)",
      )
      .order("nama_pelayanan");
    setDepartments((data as any) ?? []);
  };

  const loadLeaderOptions = async () => {
    const { data } = await supabase
      .from("jemaat")
      .select("id, nama_lengkap")
      .order("nama_lengkap");
    setLeaderOptions(
      (data ?? []).map((j: any) => ({ value: j.id, label: j.nama_lengkap })),
    );
  };

  const loadAllJemaat = async () => {
    const { data } = await supabase
      .from("jemaat")
      .select("id, nama_lengkap, gender, phone_number")
      .order("nama_lengkap");
    setAllJemaat((data as any) ?? []);
  };

  const loadMembers = async (deptId: string) => {
    const { data } = await supabase
      .from("department_members")
      .select(
        "id, jemaat_id, role_pelayanan, tanggal_join, jemaat(nama_lengkap, gender, phone_number)",
      )
      .eq("department_id", deptId)
      .order("tanggal_join", { ascending: false });
    setMembers((prev) => ({ ...prev, [deptId]: (data as any) ?? [] }));
  };

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      if (!members[id]) await loadMembers(id);
      setActiveTab((prev) => ({ ...prev, [id]: prev[id] ?? "members" }));
    }
  };

  // Department CRUD
  const openAddDept = () => {
    setEditDept(null);
    setDeptName("");
    setDeptDesc("");
    setDeptLeader("");
    setShowDeptForm(true);
  };

  const openEditDept = (dept: Department) => {
    setEditDept(dept);
    setDeptName(dept.nama_pelayanan);
    setDeptDesc(dept.deskripsi ?? "");
    setDeptLeader(dept.leader_id ?? "");
    setShowDeptForm(true);
  };

  const handleDeptSubmit = async () => {
    if (!deptName.trim()) return;
    setDeptSubmitting(true);

    const payload = {
      nama_pelayanan: deptName.trim(),
      deskripsi: deptDesc || null,
      leader_id: deptLeader || null,
    };

    const { error } = editDept
      ? await supabase
          .from("departments")
          .update(payload as any)
          .eq("id", editDept.id)
      : await supabase.from("departments").insert(payload as any);

    if (error) {
      alert("Gagal menyimpan: " + error.message);
    } else {
      setShowDeptForm(false);
      await loadDepartments();
    }
    setDeptSubmitting(false);
  };

  const handleDeleteDept = async (id: string) => {
    if (
      !confirm(
        "Yakin ingin menghapus pelayanan ini? Semua anggota akan ikut terhapus.",
      )
    )
      return;
    const { error } = await supabase.from("departments").delete().eq("id", id);
    if (error) alert("Gagal menghapus: " + error.message);
    else {
      if (expandedId === id) setExpandedId(null);
      await loadDepartments();
    }
  };

  // Member CRUD
  const handleAddMember = async (deptId: string, jemaatId: string) => {
    setLoadingAction(jemaatId);
    const role = roleInput[jemaatId] || null;

    const { error } = await supabase.from("department_members").insert({
      department_id: deptId,
      jemaat_id: jemaatId,
      role_pelayanan: role,
    } as any);

    if (error) {
      alert("Gagal menambah anggota: " + error.message);
    } else {
      setRoleInput((prev) => {
        const n = { ...prev };
        delete n[jemaatId];
        return n;
      });
      await loadMembers(deptId);
    }
    setLoadingAction(null);
  };

  const handleRemoveMember = async (deptId: string, memberId: string) => {
    if (!confirm("Yakin ingin mengeluarkan anggota ini dari pelayanan?"))
      return;
    setLoadingAction(memberId);
    const { error } = await supabase
      .from("department_members")
      .delete()
      .eq("id", memberId);
    if (error) alert("Gagal menghapus: " + error.message);
    else await loadMembers(deptId);
    setLoadingAction(null);
  };

  if (loading) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Pelayanan
          </h1>
          <p className="text-sm text-gray-500">
            Kelola departemen pelayanan dan penugasan anggota
          </p>
        </div>
        <button
          onClick={openAddDept}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={16} />
          Tambah Pelayanan
        </button>
      </div>

      {/* Department form modal */}
      {showDeptForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800">
                {editDept ? "Edit Pelayanan" : "Tambah Pelayanan Baru"}
              </h2>
              <button
                onClick={() => setShowDeptForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">
                  Nama Pelayanan *
                </label>
                <input
                  type="text"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="e.g. Tim Worship, Multimedia, Usher"
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">
                  Leader
                </label>
                <select
                  value={deptLeader}
                  onChange={(e) => setDeptLeader(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">— Pilih Leader —</option>
                  {leaderOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">
                  Deskripsi
                </label>
                <textarea
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  rows={3}
                  placeholder="Deskripsi singkat tentang pelayanan ini..."
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="px-6 pb-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDeptForm(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleDeptSubmit}
                disabled={deptSubmitting || !deptName.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {deptSubmitting && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {editDept ? "Simpan Perubahan" : "Tambah Pelayanan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {departments.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Plus size={20} className="text-blue-400" />
          </div>
          <p className="text-sm text-gray-500 mb-3">
            Belum ada pelayanan. Mulai dengan menambah pelayanan baru.
          </p>
          <button
            onClick={openAddDept}
            className="text-sm text-blue-600 hover:underline"
          >
            Tambah pelayanan pertama
          </button>
        </div>
      )}

      {/* Department list */}
      <div className="flex flex-col gap-3">
        {departments.map((dept) => {
          const deptMembers = members[dept.id] ?? [];
          const isExpanded = expandedId === dept.id;
          const tab = activeTab[dept.id] ?? "members";
          const mSearch = memberSearch[dept.id] ?? "";
          const aSearch = addSearch[dept.id] ?? "";
          const memberJemaatIds = new Set(deptMembers.map((m) => m.jemaat_id));

          const filteredMembers = deptMembers.filter((m) =>
            m.jemaat?.nama_lengkap
              .toLowerCase()
              .includes(mSearch.toLowerCase()),
          );

          const availableJemaat = allJemaat.filter(
            (j) =>
              !memberJemaatIds.has(j.id) &&
              j.nama_lengkap.toLowerCase().includes(aSearch.toLowerCase()),
          );

          return (
            <div
              key={dept.id}
              className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
            >
              {/* Department row */}
              <div className="flex items-center gap-4 px-5 py-4">
                <button
                  onClick={() => toggleExpand(dept.id)}
                  className="flex-1 flex items-center gap-4 text-left min-w-0"
                >
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-purple-600">
                      {dept.nama_pelayanan.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {dept.nama_pelayanan}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {(dept as any).jemaat?.nama_lengkap
                        ? `Leader: ${(dept as any).jemaat.nama_lengkap}`
                        : "Belum ada leader"}
                      {dept.deskripsi && ` · ${dept.deskripsi}`}
                    </p>
                  </div>

                  {/* Member count badge */}
                  <div className="flex items-center gap-1.5 shrink-0 mr-2">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
                      {isExpanded && members[dept.id]
                        ? `${members[dept.id].length} anggota`
                        : "···"}
                    </span>
                    {isExpanded ? (
                      <ChevronUp size={14} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={14} className="text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEditDept(dept)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteDept(dept.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Expanded panel */}
              {isExpanded && (
                <div className="border-t border-gray-100">
                  {/* Tabs */}
                  <div className="flex gap-1 px-5 pt-4">
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
                      <button
                        onClick={() =>
                          setActiveTab((prev) => ({
                            ...prev,
                            [dept.id]: "members",
                          }))
                        }
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          tab === "members"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        Anggota ({deptMembers.length})
                      </button>
                      <button
                        onClick={() =>
                          setActiveTab((prev) => ({
                            ...prev,
                            [dept.id]: "add",
                          }))
                        }
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          tab === "add"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        <UserPlus size={11} />
                        Tambah Anggota
                      </button>
                    </div>
                  </div>

                  <div className="p-5">
                    {/* Members tab */}
                    {tab === "members" && (
                      <div>
                        {deptMembers.length > 4 && (
                          <div className="relative mb-3">
                            <Search
                              size={13}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                              type="text"
                              value={mSearch}
                              onChange={(e) =>
                                setMemberSearch((prev) => ({
                                  ...prev,
                                  [dept.id]: e.target.value,
                                }))
                              }
                              placeholder="Cari anggota..."
                              className="w-full pl-8 pr-4 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        )}

                        {filteredMembers.length === 0 ? (
                          <div className="py-8 text-center text-xs text-gray-400">
                            {mSearch
                              ? "Anggota tidak ditemukan."
                              : "Belum ada anggota di pelayanan ini."}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {filteredMembers.map((m) => (
                              <div
                                key={m.id}
                                className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-100"
                              >
                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                                  <span className="text-xs font-semibold text-purple-600">
                                    {m.jemaat?.nama_lengkap
                                      .charAt(0)
                                      .toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {m.jemaat?.nama_lengkap}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {m.role_pelayanan ? (
                                      <span className="text-purple-600 font-medium">
                                        {m.role_pelayanan}
                                      </span>
                                    ) : (
                                      "Anggota"
                                    )}
                                    {m.jemaat?.phone_number &&
                                      ` · ${m.jemaat.phone_number}`}
                                    {m.tanggal_join && (
                                      <span className="ml-1.5 text-gray-300">
                                        ·
                                      </span>
                                    )}
                                    {m.tanggal_join && (
                                      <span className="ml-1.5">
                                        Bergabung{" "}
                                        {new Date(
                                          m.tanggal_join,
                                        ).toLocaleDateString("id-ID", {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric",
                                        })}
                                      </span>
                                    )}
                                  </p>
                                </div>
                                <button
                                  onClick={() =>
                                    handleRemoveMember(dept.id, m.id)
                                  }
                                  disabled={loadingAction === m.id}
                                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 shrink-0"
                                >
                                  {loadingAction === m.id ? (
                                    <span className="w-3 h-3 border-2 border-red-200 border-t-red-500 rounded-full animate-spin" />
                                  ) : (
                                    <UserMinus size={11} />
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
                        <div className="relative mb-3">
                          <Search
                            size={13}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          />
                          <input
                            type="text"
                            value={aSearch}
                            onChange={(e) =>
                              setAddSearch((prev) => ({
                                ...prev,
                                [dept.id]: e.target.value,
                              }))
                            }
                            placeholder="Cari dari data jemaat..."
                            className="w-full pl-8 pr-4 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {availableJemaat.length === 0 ? (
                          <div className="py-8 text-center text-xs text-gray-400">
                            {aSearch
                              ? "Jemaat tidak ditemukan."
                              : "Semua jemaat sudah menjadi anggota pelayanan ini."}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {availableJemaat.map((j) => (
                              <div
                                key={j.id}
                                className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-100"
                              >
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                                  <span className="text-xs font-semibold text-gray-500">
                                    {j.nama_lengkap.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {j.nama_lengkap}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {j.gender === "L"
                                      ? "Laki-laki"
                                      : j.gender === "P"
                                        ? "Perempuan"
                                        : "—"}
                                    {j.phone_number && ` · ${j.phone_number}`}
                                  </p>
                                </div>

                                {/* Role input + add button */}
                                <div className="flex items-center gap-2 shrink-0">
                                  <input
                                    type="text"
                                    value={roleInput[j.id] ?? ""}
                                    onChange={(e) =>
                                      setRoleInput((prev) => ({
                                        ...prev,
                                        [j.id]: e.target.value,
                                      }))
                                    }
                                    placeholder="Role (opsional)"
                                    className="w-32 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                  <button
                                    onClick={() =>
                                      handleAddMember(dept.id, j.id)
                                    }
                                    disabled={loadingAction === j.id}
                                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
                                  >
                                    {loadingAction === j.id ? (
                                      <span className="w-3 h-3 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                                    ) : (
                                      <UserPlus size={11} />
                                    )}
                                    Tambah
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
