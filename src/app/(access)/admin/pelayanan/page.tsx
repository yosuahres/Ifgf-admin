"use client";
import { ChevronRight, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type LeaderOption = { value: string; label: string };

type Department = {
  id: string;
  nama_pelayanan: string;
  deskripsi: string | null;
  leader_id: string | null;
  created_at: string | null;
  jemaat?: { nama_lengkap: string } | null;
  member_count?: number;
};

export default function PelayananPage() {
  const router = useRouter();
  const supabase = createClient();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [leaderOptions, setLeaderOptions] = useState<LeaderOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Department form
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [deptName, setDeptName] = useState("");
  const [deptDesc, setDeptDesc] = useState("");
  const [deptLeader, setDeptLeader] = useState("");
  const [deptSubmitting, setDeptSubmitting] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadDepartments(), loadLeaderOptions()]);
    setLoading(false);
  };

  const loadDepartments = async () => {
    const { data } = await supabase
      .from("departments")
      .select(
        "id, nama_pelayanan, deskripsi, leader_id, created_at, jemaat(nama_lengkap), department_members(count)",
      )
      .order("nama_pelayanan");

    const mapped = (data ?? []).map((d: any) => ({
      ...d,
      member_count: d.department_members?.[0]?.count ?? 0,
    }));

    setDepartments(mapped as Department[]);
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

  // Department CRUD
  const openAddDept = () => {
    setEditDept(null);
    setDeptName("");
    setDeptDesc("");
    setDeptLeader("");
    setShowDeptForm(true);
  };

  const openEditDept = (e: React.MouseEvent, dept: Department) => {
    e.stopPropagation();
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

  const handleDeleteDept = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (
      !confirm(
        "Yakin ingin menghapus pelayanan ini? Semua anggota akan ikut terhapus.",
      )
    )
      return;
    const { error } = await supabase.from("departments").delete().eq("id", id);
    if (error) alert("Gagal menghapus: " + error.message);
    else await loadDepartments();
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
            Kelola departemen pelayanan gereja
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
        {departments.map((dept) => (
          <div
            key={dept.id}
            onClick={() => router.push(`/admin/pelayanan/${dept.id}`)}
            className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:border-purple-200 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4 px-5 py-4">
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
              <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-medium shrink-0">
                {dept.member_count} anggota
              </span>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => openEditDept(e, dept)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={(e) => handleDeleteDept(e, dept.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
                <ChevronRight size={14} className="text-gray-300 ml-1" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}