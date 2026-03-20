// admin/events/page.tsx
"use client";
import { useState } from "react";
import MasterDataTable from "@/components/MasterDataTable";
import ModalForm from "@/components/ModalForm";
import { exportTemplate } from "@/utils/exportutils";
import type { ColumnSchema } from "@/utils/exportutils";
import { createClient } from "@/lib/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/types/database.types";

const EVENTS_SCHEMA: ColumnSchema[] = [
  { key: "event_name",  label: "Nama Event",   type: "string", required: true },
  { key: "event_type",  label: "Tipe Event",   type: "string" },
  { key: "event_date",  label: "Tanggal",      type: "date",   required: true },
  { key: "start_time",  label: "Jam Mulai",    type: "string" },
  { key: "end_time",    label: "Jam Selesai",  type: "string" },
  { key: "location",    label: "Lokasi",       type: "string" },
  { key: "description", label: "Deskripsi",    type: "string" },
];

export default function EventsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // ← drives table reload

  const supabase = createClient();

  const triggerRefresh = () => setRefreshTrigger((k) => k + 1);

  const columns = [
    { key: "event_name", label: "Nama Event" },
    {
      key: "event_type",
      label: "Tipe",
      render: (value: string) =>
        value ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
            {value}
          </span>
        ) : "-",
    },
    {
      key: "event_date",
      label: "Tanggal",
      render: (value: string) =>
        value
          ? new Date(value).toLocaleDateString("id-ID", {
              day: "numeric", month: "long", year: "numeric",
            })
          : "-",
    },
    {
      key: "start_time",
      label: "Waktu",
      render: (value: string, item: any) => {
        if (!value) return "-";
        const fmt = (t: string) => t.slice(0, 5);
        return item.end_time ? `${fmt(value)} – ${fmt(item.end_time)}` : fmt(value);
      },
    },
    { key: "location", label: "Lokasi" },
    {
      key: "created_at",
      label: "Dibuat",
      render: (value: string) =>
        value ? new Date(value).toLocaleDateString("id-ID") : "-",
    },
  ];

  const fields = [
    {
      name: "event_name", label: "Nama Event", type: "text" as const,
      required: true, placeholder: "e.g. Ibadah Natal 2025",
    },
    {
      name: "event_type", label: "Tipe Event", type: "select" as const,
      required: false,
      options: [
        "Ibadah Umum", "Ibadah Pemuda", "Ibadah Anak", "Retreat",
        "Seminar", "Konser", "Baptisan", "Pernikahan", "Lainnya",
      ].map((d) => ({ value: d, label: d })),
    },
    { name: "event_date", label: "Tanggal",     type: "date" as const, required: true },
    { name: "start_time", label: "Jam Mulai",   type: "time" as const, required: false },
    { name: "end_time",   label: "Jam Selesai", type: "time" as const, required: false },
    {
      name: "location", label: "Lokasi", type: "text" as const,
      required: false, placeholder: "Nama tempat / alamat",
    },
    {
      name: "description", label: "Deskripsi", type: "textarea" as const,
      required: false, placeholder: "Keterangan tambahan tentang event...",
    },
  ];

  const handleAdd = () => { setEditItem(null); setIsModalOpen(true); };
  const handleEdit = (item: any) => { setEditItem(item); setIsModalOpen(true); };

  const handleDelete = async (id: string | number) => {
    if (!confirm("Yakin ingin menghapus event ini?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id as string);
    if (error) alert(`Gagal menghapus: ${error.message}`);
    else triggerRefresh(); // ← re-fetch table
  };

  const handleSubmit = async (data: Record<string, string>) => {
    setIsSubmitting(true);
    const payload = {
      event_name:  data.event_name,
      event_type:  data.event_type  || null,
      event_date:  data.event_date,
      start_time:  data.start_time  || null,
      end_time:    data.end_time    || null,
      location:    data.location    || null,
      description: data.description || null,
    };
    const { error } = editItem
      ? await supabase.from("events").update(payload as TablesUpdate<"events">).eq("id", editItem.id)
      : await supabase.from("events").insert(payload as TablesInsert<"events">);
    if (error) alert(`Gagal menyimpan: ${error.message}`);
    else {
      setIsModalOpen(false);
      setEditItem(null);
      triggerRefresh(); // ← re-fetch table
    }
    setIsSubmitting(false);
  };

  const handleImport = async (rows: Record<string, any>[]) => {
    const payload: TablesInsert<"events">[] = rows.map((row) => ({
      event_name:  row.event_name,
      event_type:  row.event_type?.trim()  || null,
      event_date:  row.event_date,
      start_time:  row.start_time?.trim()  || null,
      end_time:    row.end_time?.trim()    || null,
      location:    row.location?.trim()    || null,
      description: row.description?.trim() || null,
    }));
    const { error } = await supabase.from("events").insert(payload);
    if (error) throw new Error(error.message);
    // MasterDataTable handles its own importKey refresh internally
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Events</h1>
          <p className="text-sm text-gray-500">Kelola jadwal dan kegiatan gereja</p>
        </div>
        <button
          onClick={() => exportTemplate("Events", EVENTS_SCHEMA)}
          className="text-sm text-gray-500 hover:text-blue-600 underline underline-offset-2"
        >
          Unduh Template Import
        </button>
      </div>

      <MasterDataTable
        title="Events"
        endpoint="/api/events"
        columns={columns}
        exportSchema={EVENTS_SCHEMA}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onImport={handleImport}
        refreshTrigger={refreshTrigger} // ← drives reload after edit/delete
      />

      <ModalForm
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditItem(null); }}
        title={editItem ? "Edit Event" : "Tambah Event"}
        fields={fields}
        onSubmit={handleSubmit}
        initialData={editItem}
        submitText={editItem ? "Simpan Perubahan" : "Tambah Event"}
        isLoading={isSubmitting}
      />
    </div>
  );
}