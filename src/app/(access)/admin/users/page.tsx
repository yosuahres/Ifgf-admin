// app/(access)/admin/users/page.tsx
"use client";
import { useEffect, useState } from "react";
import MasterDataTable from "@/components/MasterDataTable";
import ModalForm from "@/components/ModalForm";
import { exportTemplate } from "@/utils/exportutils";
import type { ColumnSchema } from "@/utils/exportutils";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// user_id must be a valid Supabase auth UUID — import only works for
// pre-existing auth users whose profiles haven't been created yet.
const USERS_SCHEMA: ColumnSchema[] = [
  { key: "id",        label: "User ID (UUID)",  type: "string", required: true },
  { key: "full_name", label: "Full Name",        type: "string", required: true },
  { key: "role",      label: "Role",             type: "string", required: true },
];

const ROLE_OPTIONS = [
  { value: "admin",   label: "Admin" }, //gembala
  { value: "pastor",  label: "Pastor" }, //dibawah gembala
  { value: "leader",  label: "Leader" }, //icare-leader, and other leader
  { value: "user",  label: "User" }, //finance dll.
];

export default function UsersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();

  const columns = [
    { key: "full_name", label: "Full Name" },
    { key: "id",        label: "User ID" },
    {
      key: "role",
      label: "Role",
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          value === "admin"  ? "bg-red-100 text-red-800"    :
          value === "pastor" ? "bg-blue-100 text-blue-800"  :
          value === "leader" ? "bg-yellow-100 text-yellow-800" :
                               "bg-green-100 text-green-800"
        }`}>
          {value?.charAt(0).toUpperCase() + value?.slice(1)}
        </span>
      ),
    },
    {
      key: "updated_at",
      label: "Last Updated",
      render: (value: string) => value ? new Date(value).toLocaleDateString() : "Never",
    },
  ];

  const fields = [
    {
      name: "user_id", label: "User ID (dari Supabase Auth)", type: "text" as const,
      required: true, placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    },
    {
      name: "full_name", label: "Full Name", type: "text" as const,
      required: true, placeholder: "Nama lengkap",
    },
    {
      name: "role", label: "Role", type: "select" as const,
      required: true, options: ROLE_OPTIONS,
    },
  ];

  const handleSubmit = async (data: Record<string, string>) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("profiles").insert({
        id:        data.user_id,
        full_name: data.full_name,
        role:      data.role as Profile["role"],
      });
      if (error) alert(`Gagal menyimpan: ${error.message}`);
      else setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bulk-create profiles for existing auth users
  // The `id` column must match a real auth.users UUID
  const handleImport = async (rows: Record<string, any>[]) => {
    const payload = rows.map((row) => ({
      id:        row.id?.trim(),
      full_name: row.full_name?.trim(),
      role:      row.role?.trim().toLowerCase() || "user",
    }));

    // Validate roles
    const validRoles = new Set(["admin", "pastor", "leader", "user"]);
    const invalidRows = payload.filter((r) => !validRoles.has(r.role));
    if (invalidRows.length > 0) {
      throw new Error(
        `Invalid role value(s): ${invalidRows.map((r) => `"${r.role}"`).join(", ")}. ` +
        `Allowed: admin, pastor, leader, user.`
      );
    }

    const { error } = await supabase.from("profiles").insert(payload);
    if (error) throw new Error(error.message);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Users</h1>
          <p className="text-sm text-gray-500">
            Kelola profil pengguna dan role akses
          </p>
        </div>
        <button
          onClick={() => exportTemplate("Users", USERS_SCHEMA)}
          className="text-sm text-gray-500 hover:text-blue-600 underline underline-offset-2"
        >
          Unduh Template Import
        </button>
      </div>

      <MasterDataTable
        title="Users"
        endpoint="/api/profiles"
        columns={columns}
        exportSchema={USERS_SCHEMA}
        onAdd={() => setIsModalOpen(true)}
        onImport={handleImport}
      />

      <ModalForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tambah User Profile"
        fields={fields}
        onSubmit={handleSubmit}
        submitText="Tambah User"
        isLoading={isSubmitting}
      />
    </div>
  );
}