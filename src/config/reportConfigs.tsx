// config/reportConfigs.tsx
import type { ReportConfig } from "@/types/report.types";

export const REPORT_CONFIGS: ReportConfig[] = [
  // ─── JEMAAT ────────────────────────────────────────────────────────────────
  {
    id: "jemaat",
    label: "Data Jemaat",
    table: "jemaat",
    select: "*",
    searchColumn: "nama_lengkap",
    defaultSort: { column: "nama_lengkap", ascending: true },
    filters: [
      {
        key: "gender",
        label: "Jenis Kelamin",
        type: "select",
        options: [
          { value: "L", label: "Laki-laki" },
          { value: "P", label: "Perempuan" },
        ],
      },
      {
        key: "status_jemaat",
        label: "Status Jemaat",
        type: "multiselect",
        options: [
          { value: "aktif",       label: "Aktif" },
          { value: "tidak aktif", label: "Tidak Aktif" },
          { value: "pindah",      label: "Pindah" },
          { value: "meninggal",   label: "Meninggal" },
        ],
      },
      {
        key: "is_baptized",
        label: "Status Baptis",
        type: "select",
        options: [
          { value: "true",  label: "Sudah Baptis" },
          { value: "false", label: "Belum Baptis" },
        ],
      },
      {
        key: "marital_status",
        label: "Status Pernikahan",
        type: "multiselect",
        options: [
          { value: "single",   label: "Single" },
          { value: "married",  label: "Menikah" },
          { value: "divorced", label: "Cerai" },
          { value: "widowed",  label: "Janda/Duda" },
        ],
      },
      {
        key: "discipleship_stage",
        label: "Tahap Pemuridan",
        type: "text",
        placeholder: "Cari tahap pemuridan...",
      },
      {
        key: "tanggal_join",
        label: "Tanggal Join",
        type: "date_range",
      },
      {
        key: "dob",
        label: "Tanggal Lahir",
        type: "date_range",
      },
      {
        key: "alamat",
        label: "Alamat",
        type: "text",
        placeholder: "Cari berdasarkan alamat...",
      },
    ],
    columns: [
      { key: "nama_lengkap", label: "Nama Lengkap" },
      { key: "email",        label: "Email" },
      { key: "phone_number", label: "No. Telepon" },
      {
        key: "gender",
        label: "Gender",
        render: (v) => (v === "L" ? "Laki-laki" : v === "P" ? "Perempuan" : "-"),
      },
      {
        key: "status_jemaat",
        label: "Status",
        render: (v) => (
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
            v === "aktif" ? "bg-green-100 text-green-800" :
            v === "tidak aktif" ? "bg-red-100 text-red-800" :
            "bg-gray-100 text-gray-600"
          }`}>
            {v ?? "-"}
          </span>
        ),
      },
      {
        key: "is_baptized",
        label: "Baptis",
        render: (v) => (
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
            v ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-500"
          }`}>
            {v ? "Sudah" : "Belum"}
          </span>
        ),
      },
      { key: "marital_status",     label: "Status Nikah" },
      { key: "discipleship_stage", label: "Pemuridan" },
      {
        key: "tanggal_join",
        label: "Tanggal Join",
        render: (v) => v ? new Date(v).toLocaleDateString("id-ID") : "-",
      },
      { key: "alamat", label: "Alamat" },
    ],
  },

  // ─── ICARE GROUPS ──────────────────────────────────────────────────────────
  {
    id: "icare_groups",
    label: "iCare Groups",
    table: "icare_groups",
    select: "*, jemaat(nama_lengkap)",
    searchColumn: "nama_icare",
    defaultSort: { column: "nama_icare", ascending: true },
    filters: [
      {
        key: "hari_pertemuan",
        label: "Hari Pertemuan",
        type: "multiselect",
        options: ["Senin","Selasa","Rabu","Kamis","Jumat","Sabtu","Minggu"].map(
          (d) => ({ value: d, label: d })
        ),
      },
      {
        key: "lokasi_pertemuan",
        label: "Lokasi",
        type: "text",
        placeholder: "Cari lokasi...",
      },
      {
        key: "nama_icare",
        label: "Nama iCare",
        type: "text",
        placeholder: "Cari nama iCare...",
      },
    ],
    columns: [
      { key: "nama_icare", label: "Nama iCare" },
      {
        key: "leader_id",
        label: "Leader",
        render: (_, row) => row.jemaat?.nama_lengkap ?? "-",
      },
      { key: "hari_pertemuan",   label: "Hari" },
      {
        key: "jam_pertemuan",
        label: "Jam",
        render: (v) => v ? v.slice(0, 5) : "-",
      },
      { key: "lokasi_pertemuan", label: "Lokasi" },
      { key: "deskripsi",        label: "Deskripsi" },
    ],
  },

  // ─── EVENTS ────────────────────────────────────────────────────────────────
  {
    id: "events",
    label: "Events",
    table: "events",
    select: "*",
    searchColumn: "event_name",
    defaultSort: { column: "event_date", ascending: false },
    filters: [
      {
        key: "event_type",
        label: "Tipe Event",
        type: "multiselect",
        options: [
          "Ibadah Umum","Ibadah Pemuda","Ibadah Anak","Retreat",
          "Seminar","Konser","Baptisan","Pernikahan","Lainnya",
        ].map((d) => ({ value: d, label: d })),
      },
      {
        key: "event_date",
        label: "Tanggal Event",
        type: "date_range",
      },
      {
        key: "location",
        label: "Lokasi",
        type: "text",
        placeholder: "Cari lokasi event...",
      },
    ],
    columns: [
      { key: "event_name", label: "Nama Event" },
      {
        key: "event_type",
        label: "Tipe",
        render: (v) => v ? (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
            {v}
          </span>
        ) : "-",
      },
      {
        key: "event_date",
        label: "Tanggal",
        render: (v) => v ? new Date(v).toLocaleDateString("id-ID", {
          day: "numeric", month: "long", year: "numeric"
        }) : "-",
      },
      {
        key: "start_time",
        label: "Waktu",
        render: (v, row) => {
          if (!v) return "-";
          const fmt = (t: string) => t.slice(0, 5);
          return row.end_time ? `${fmt(v)} – ${fmt(row.end_time)}` : fmt(v);
        },
      },
      { key: "location",    label: "Lokasi" },
      { key: "description", label: "Deskripsi" },
    ],
  },

  // ─── OFFERINGS ─────────────────────────────────────────────────────────────
  {
    id: "offerings",
    label: "Persembahan",
    table: "offerings",
    select: "*, jemaat(nama_lengkap)",
    searchColumn: "offering_type",
    defaultSort: { column: "transaction_date", ascending: false },
    filters: [
      {
        key: "offering_type",
        label: "Jenis Persembahan",
        type: "multiselect",
        options: [
          { value: "perpuluhan",  label: "Perpuluhan" },
          { value: "persembahan", label: "Persembahan Umum" },
          { value: "diakonia",    label: "Diakonia" },
          { value: "misi",        label: "Misi" },
          { value: "bangunan",    label: "Bangunan" },
        ],
      },
      {
        key: "payment_method",
        label: "Metode Bayar",
        type: "multiselect",
        options: [
          { value: "cash",     label: "Cash" },
          { value: "transfer", label: "Transfer" },
          { value: "qris",     label: "QRIS" },
        ],
      },
      {
        key: "transaction_date",
        label: "Tanggal Transaksi",
        type: "date_range",
      },
      {
        key: "amount",
        label: "Jumlah (Rp)",
        type: "number_range",
      },
    ],
    columns: [
      {
        key: "jemaat_id",
        label: "Nama Jemaat",
        render: (_, row) => row.jemaat?.nama_lengkap ?? "-",
      },
      {
        key: "amount",
        label: "Jumlah",
        render: (v) => v != null
          ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v)
          : "-",
      },
      { key: "offering_type",  label: "Jenis" },
      { key: "payment_method", label: "Metode" },
      {
        key: "transaction_date",
        label: "Tanggal",
        render: (v) => v ? new Date(v).toLocaleDateString("id-ID") : "-",
      },
    ],
  },

  // ─── BAPTISM RECORDS ───────────────────────────────────────────────────────
  {
    id: "baptism_records",
    label: "Data Baptisan",
    table: "baptism_records",
    select: "*, jemaat(nama_lengkap, gender)",
    searchColumn: "baptized_by",
    defaultSort: { column: "baptism_date", ascending: false },
    filters: [
      {
        key: "baptism_date",
        label: "Tanggal Baptis",
        type: "date_range",
      },
      {
        key: "baptized_by",
        label: "Dibaptis Oleh",
        type: "text",
        placeholder: "Nama pendeta / gembala...",
      },
      {
        key: "location",
        label: "Lokasi",
        type: "text",
        placeholder: "Lokasi baptisan...",
      },
    ],
    columns: [
      {
        key: "jemaat_id",
        label: "Nama Jemaat",
        render: (_, row) => row.jemaat?.nama_lengkap ?? "-",
      },
      {
        key: "baptism_date",
        label: "Tanggal Baptis",
        render: (v) => v ? new Date(v).toLocaleDateString("id-ID", {
          day: "numeric", month: "long", year: "numeric"
        }) : "-",
      },
      { key: "baptized_by",       label: "Dibaptis Oleh" },
      { key: "location",          label: "Lokasi" },
      { key: "certificate_number", label: "No. Sertifikat" },
    ],
  },
];