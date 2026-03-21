// admin/icare-groups/page.tsx
"use client";
import { useEffect, useState } from "react";
import MasterDataTable from "@/components/MasterDataTable";
import ModalForm from "@/components/ModalForm";
import { exportTemplate } from "@/utils/exportutils";
import type { ColumnSchema } from "@/utils/exportutils";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database.types";

type IcareRow = Database["public"]["Tables"]["icare_groups"]["Row"] & {
  jemaat?: { nama_lengkap: string } | null;
};
type LeaderOption = { value: string; label: string };

const ICARE_SCHEMA: ColumnSchema[] = [
  { key: "nama_icare",       label: "Nama iCare",       type: "string", required: true },
  { key: "hari_pertemuan",   label: "Hari Pertemuan",   type: "string" },
  { key: "jam_pertemuan",    label: "Jam Pertemuan",    type: "string" },
  { key: "lokasi_pertemuan", label: "Lokasi Pertemuan", type: "string" },
  { key: "deskripsi",        label: "Deskripsi",        type: "string" },
];

export default function IcareGroupsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<IcareRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leaderOptions, setLeaderOptions] = useState<LeaderOption[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0); 

  const supabase = createClient();

  const triggerRefresh = () => setRefreshTrigger((k) => k + 1);

  useEffect(() => {
    const loadLeaders = async () => {
      const { data } = await supabase
        .from("jemaat")
        .select("id, nama_lengkap")
        .order("nama_lengkap");
      setLeaderOptions(
        (data ?? []).map((j) => ({ value: j.id, label: j.nama_lengkap })),
      );
    };
    loadLeaders();
  }, [supabase]);

  const columns = [
    { key: "nama_icare", label: "Nama iCare" },
    {
      key: "leader_id",
      label: "Leader",
      render: (_: unknown, item: IcareRow) => item.jemaat?.nama_lengkap ?? "-",
    },
    { key: "hari_pertemuan", label: "Hari Pertemuan" },
    {
      key: "jam_pertemuan",
      label: "Jam",
      render: (value: string) => (value ? value.slice(0, 5) : "-"),
    },
    { key: "lokasi_pertemuan", label: "Lokasi" },
    {
      key: "created_at",
      label: "Dibuat",
      render: (value: string) =>
        value ? new Date(value).toLocaleDateString("id-ID") : "-",
    },
  ];

  const fields = [
    {
      name: "nama_icare",
      label: "Nama iCare",
      type: "text" as const,
      required: true,
      placeholder: "e.g. iCare Menteng",
    },
    {
      name: "leader_id",
      label: "Leader",
      type: "select" as const,
      required: false,
      options: [{ value: "", label: "— Pilih Leader —" }, ...leaderOptions],
    },
    {
      name: "hari_pertemuan",
      label: "Hari Pertemuan",
      type: "select" as const,
      required: false,
      options: [
        { value: "", label: "— Pilih Hari —" },
        ...["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"].map(
          (d) => ({ value: d, label: d }),
        ),
      ],
    },
    {
      name: "jam_pertemuan",
      label: "Jam Pertemuan",
      type: "time" as const,
      required: false,
    },
    {
      name: "lokasi_pertemuan",
      label: "Lokasi Pertemuan",
      type: "text" as const,
      required: false,
      placeholder: "Alamat / nama tempat",
    },
    {
      name: "deskripsi",
      label: "Deskripsi",
      type: "textarea" as const,
      required: false,
      placeholder: "Deskripsi singkat tentang grup ini...",
    },
  ];

  const handleAdd = () => { setEditItem(null); setIsModalOpen(true); };
  const handleEdit = (item: IcareRow) => { setEditItem(item); setIsModalOpen(true); };

  const handleDelete = async (id: string | number) => {
    if (!confirm("Yakin ingin menghapus iCare group ini?")) return;
    const { error } = await supabase.from("icare_groups").delete().eq("id", id as string);
    if (error) alert(`Gagal menghapus: ${error.message}`);
    else triggerRefresh(); // ← re-fetch table
  };

  const handleSubmit = async (data: Record<string, string | null>) => {
    setIsSubmitting(true);
    const payload = {
      nama_icare: data.nama_icare as string,
      leader_id: data.leader_id || null,
      hari_pertemuan: data.hari_pertemuan || null,
      jam_pertemuan: data.jam_pertemuan || null,
      lokasi_pertemuan: data.lokasi_pertemuan || null,
      deskripsi: data.deskripsi || null,
    };
    const { error } = editItem
      ? await supabase.from("icare_groups").update(payload).eq("id", editItem.id)
      : await supabase.from("icare_groups").insert([payload]);
    if (error) {
      alert(`Gagal menyimpan: ${error.message}`);
    } else {
      setIsModalOpen(false);
      setEditItem(null);
      triggerRefresh(); // ← re-fetch table
    }
    setIsSubmitting(false);
  };

  const handleImport = async (rows: Record<string, any>[]) => {
    const payload = rows.map((row) => ({
      nama_icare: row.nama_icare,
      hari_pertemuan: row.hari_pertemuan?.trim() || null,
      jam_pertemuan: row.jam_pertemuan?.trim() || null,
      lokasi_pertemuan: row.lokasi_pertemuan?.trim() || null,
      deskripsi: row.deskripsi?.trim() || null,
      leader_id: null,
    }));
    const { error } = await supabase.from("icare_groups").insert(payload);
    if (error) throw new Error(error.message);
    // MasterDataTable handles its own importKey refresh internally
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">iCare Groups</h1>
          <p className="text-sm text-gray-500">Kelola kelompok iCare dan penugasan leader</p>
        </div>
        <button
          onClick={() => exportTemplate("iCare_Groups", ICARE_SCHEMA)}
          className="text-sm text-gray-500 hover:text-blue-600 underline underline-offset-2"
        >
          Unduh Template Import
        </button>
      </div>

      <MasterDataTable
        title="iCare Groups"
        endpoint="/api/icare-groups"
        columns={columns}
        exportSchema={ICARE_SCHEMA}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onImport={handleImport}
        refreshTrigger={refreshTrigger} // ← drives reload after edit/delete
      />

      <ModalForm
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditItem(null); }}
        title={editItem ? "Edit iCare Group" : "Tambah iCare Group"}
        fields={fields}
        initialData={editItem}
        onSubmit={handleSubmit}
        submitText={editItem ? "Simpan Perubahan" : "Tambah Group"}
        isLoading={isSubmitting}
      />
    </div>
  );
}