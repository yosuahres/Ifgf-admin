"use client";
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type IcareGroup = {
  id: string;
  nama_icare: string;
  hari_pertemuan: string | null;
  lokasi_pertemuan: string | null;
};

type Jemaat = {
  id: string;
  nama_lengkap: string;
};

type Meeting = {
  id: string;
  tanggal: string;
  topik: string | null;
  jumlah_hadir: number;
  catatan: string | null;
  lokasi: string | null;
};

type AttendanceEntry = {
  nama: string;
  hadir: boolean;
  keterangan: string | null;
};

type AttendanceMap = Record<string, boolean>;

export default function IcareMeetingsPage() {
  const [authorized, setAuthorized] = useState(false);
  const [group, setGroup] = useState<IcareGroup | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [members, setMembers] = useState<Jemaat[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);

  // New meeting form
  const [showForm, setShowForm] = useState(false);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [topik, setTopik] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [catatan, setCatatan] = useState("");
  const [attendance, setAttendance] = useState<AttendanceMap>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [meetingAttendance, setMeetingAttendance] = useState<Record<string, AttendanceEntry[]>>({});

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [editingAttendanceId, setEditingAttendanceId] = useState<string | null>(null);
  const [editAttendanceMap, setEditAttendanceMap] = useState<AttendanceMap>({});
  const [savingAttendance, setSavingAttendance] = useState(false);

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoadingPage(false); return; }

    const { data: jemaatSelf } = await supabase
      .from("jemaat").select("id").eq("user_id", user.id).maybeSingle();
    if (!jemaatSelf) { setLoadingPage(false); return; }

    const { data: groupData } = await supabase
      .from("icare_groups")
      .select("id, nama_icare, hari_pertemuan, lokasi_pertemuan")
      .eq("leader_id", jemaatSelf.id)
      .maybeSingle();
    if (!groupData) { setLoadingPage(false); return; }

    setGroup(groupData);
    setLokasi(groupData.lokasi_pertemuan ?? "");

    const { data: icareMembers } = await supabase
      .from("icare_members")
      .select("jemaat(id, nama_lengkap)")
      .eq("icare_id", groupData.id)
      .order("join_date", { ascending: true });

    const membersData: Jemaat[] = (icareMembers ?? [])
      .map((row: any) => row.jemaat)
      .filter(Boolean)
      .sort((a: Jemaat, b: Jemaat) => a.nama_lengkap.localeCompare(b.nama_lengkap));

    setMembers(membersData);

    const initMap: AttendanceMap = {};
    membersData.forEach((m) => { initMap[m.id] = false; });
    setAttendance(initMap);

    const { data: meetingsData } = await supabase
      .from("icare_meetings")
      .select("id, tanggal, topik, jumlah_hadir, catatan, lokasi")
      .eq("icare_id", groupData.id)
      .order("tanggal", { ascending: false });

    setMeetings(meetingsData ?? []);
    setLoadingPage(false);
  };

  const loadMeetingAttendance = async (meetingId: string) => {
    if (meetingAttendance[meetingId]) return;
    const { data } = await supabase
      .from("icare_attendance")
      .select("hadir, keterangan, jemaat(nama_lengkap)")
      .eq("meeting_id", meetingId)
      .order("hadir", { ascending: false });

    const entries: AttendanceEntry[] = (data ?? []).map((r: any) => ({
      nama: r.jemaat?.nama_lengkap ?? "—",
      hadir: r.hadir,
      keterangan: r.keterangan,
    }));
    setMeetingAttendance((prev) => ({ ...prev, [meetingId]: entries }));
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setEditingAttendanceId(null);
      setConfirmDeleteId(null);
    } else {
      setExpandedId(id);
      setConfirmDeleteId(null);
      loadMeetingAttendance(id);
    }
  };

  const toggleAttendance = (id: string) =>
    setAttendance((prev) => ({ ...prev, [id]: !prev[id] }));

  const selectAll = () => {
    const all: AttendanceMap = {};
    members.forEach((m) => { all[m.id] = true; });
    setAttendance(all);
  };

  const clearAll = () => {
    const none: AttendanceMap = {};
    members.forEach((m) => { none[m.id] = false; });
    setAttendance(none);
  };

  const handleSubmit = async () => {
    if (!group) return;
    if (!tanggal) { setFormError("Tanggal wajib diisi."); return; }
    setFormError("");
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    const jumlah_hadir = Object.values(attendance).filter(Boolean).length;

    const { data: meeting, error: meetingError } = await supabase
      .from("icare_meetings")
      .insert({
        icare_id: group.id,
        tanggal,
        topik: topik || null,
        lokasi: lokasi || null,
        catatan: catatan || null,
        jumlah_hadir,
        created_by: user?.id ?? null,
      } as any)
      .select()
      .single();

    if (meetingError) {
      setFormError(meetingError.message);
      setSubmitting(false);
      return;
    }

    if (members.length > 0) {
      const rows = members.map((m) => ({
        meeting_id: meeting.id,
        jemaat_id: m.id,
        hadir: attendance[m.id] ?? false,
        keterangan: null,
      }));
      const { error: attErr } = await supabase.from("icare_attendance").insert(rows as any);
      if (attErr) {
        setFormError("Pertemuan tersimpan, tapi gagal simpan kehadiran: " + attErr.message);
        setSubmitting(false);
        return;
      }
    }

    await loadData();
    setShowForm(false);
    setTopik("");
    setCatatan("");
    setSubmitting(false);
  };

  const handleDelete = async (meetingId: string) => {
    setDeletingId(meetingId);
    await supabase.from("icare_attendance").delete().eq("meeting_id", meetingId);
    const { error } = await supabase.from("icare_meetings").delete().eq("id", meetingId);
    if (error) { console.error(error.message); setDeletingId(null); setConfirmDeleteId(null); return; }
    setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
    setMeetingAttendance((prev) => { const n = { ...prev }; delete n[meetingId]; return n; });
    if (expandedId === meetingId) setExpandedId(null);
    setDeletingId(null);
    setConfirmDeleteId(null);
  };

  const startEditAttendance = (meetingId: string) => {
    const list = meetingAttendance[meetingId] ?? [];
    const map: AttendanceMap = {};
    members.forEach((m) => {
      const entry = list.find((a) => a.nama === m.nama_lengkap);
      map[m.id] = entry?.hadir ?? false;
    });
    setEditAttendanceMap(map);
    setEditingAttendanceId(meetingId);
    setConfirmDeleteId(null);
  };

  const handleSaveAttendance = async (meetingId: string) => {
    setSavingAttendance(true);
    const updates = members.map((m) => ({
      meeting_id: meetingId,
      jemaat_id: m.id,
      hadir: editAttendanceMap[m.id] ?? false,
      keterangan: null,
    }));

    const { error } = await supabase
      .from("icare_attendance")
      .upsert(updates as any, { onConflict: "meeting_id,jemaat_id" });

    if (error) { console.error(error.message); setSavingAttendance(false); return; }

    const jumlah_hadir = Object.values(editAttendanceMap).filter(Boolean).length;
    await supabase.from("icare_meetings").update({ jumlah_hadir } as any).eq("id", meetingId);

    const updatedEntries: AttendanceEntry[] = members.map((m) => ({
      nama: m.nama_lengkap,
      hadir: editAttendanceMap[m.id] ?? false,
      keterangan: null,
    }));
    setMeetingAttendance((prev) => ({ ...prev, [meetingId]: updatedEntries }));
    setMeetings((prev) => prev.map((mt) => mt.id === meetingId ? { ...mt, jumlah_hadir } : mt));
    setEditingAttendanceId(null);
    setSavingAttendance(false);
  };

  const presentCount = Object.values(attendance).filter(Boolean).length;

  if (!authorized || loadingPage) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">iCare Group</p>
          <h1 className="text-2xl font-semibold text-gray-900">
            {group ? group.nama_icare : "Grup Tidak Ditemukan"}
          </h1>
          {group && (
            <p className="text-sm text-gray-500 mt-1">
              {group.hari_pertemuan && <span>{group.hari_pertemuan}</span>}
              {group.hari_pertemuan && group.lokasi_pertemuan && <span> · </span>}
              {group.lokasi_pertemuan && <span>{group.lokasi_pertemuan}</span>}
            </p>
          )}
        </div>
        {group && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={16} />
            Catat Pertemuan
          </button>
        )}
      </div>

      {!group && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-sm text-yellow-800">
          Anda belum ditugaskan sebagai leader di iCare group manapun. Hubungi admin.
        </div>
      )}

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800">Catat Pertemuan Baru</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Tanggal *</label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Lokasi</label>
              <input
                type="text"
                value={lokasi}
                onChange={(e) => setLokasi(e.target.value)}
                placeholder={group?.lokasi_pertemuan ?? "Lokasi pertemuan"}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-gray-600">Topik / Firman</label>
              <input
                type="text"
                value={topik}
                onChange={(e) => setTopik(e.target.value)}
                placeholder="Topik atau judul firman"
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-gray-600">Catatan</label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows={2}
                placeholder="Catatan tambahan..."
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          <div className="px-6 pb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-600">Kehadiran</label>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                  {presentCount} / {members.length} hadir
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-xs text-blue-600 hover:underline">Semua Hadir</button>
                <span className="text-gray-300">|</span>
                <button onClick={clearAll} className="text-xs text-gray-400 hover:underline">Reset</button>
              </div>
            </div>
            {members.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-xs text-gray-400 text-center">
                Belum ada anggota di grup ini.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1">
                {members.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleAttendance(m.id)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm text-left transition-colors ${
                      attendance[m.id]
                        ? "bg-blue-50 border-blue-300 text-blue-800"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                      attendance[m.id] ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"
                    }`}>
                      {attendance[m.id] && <Check size={10} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className="truncate">{m.nama_lengkap}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {formError && (
            <div className="mx-6 mb-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm text-red-700">
              <span>⚠</span>
              <span>{formError}</span>
            </div>
          )}

          <div className="px-6 pb-6 flex justify-end gap-3">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {submitting && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {submitting ? "Menyimpan..." : "Simpan Pertemuan"}
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {meetings.length === 0 && !showForm && group && (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
          <Calendar size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Belum ada pertemuan yang dicatat.</p>
          <button onClick={() => setShowForm(true)} className="mt-4 text-sm text-blue-600 hover:underline">
            Catat pertemuan pertama
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {meetings.map((meeting) => {
          const attendanceList = meetingAttendance[meeting.id];
          const hadirList = attendanceList?.filter((a) => a.hadir) ?? [];
          const tidakHadirList = attendanceList?.filter((a) => !a.hadir) ?? [];
          const isExpanded = expandedId === meeting.id;
          const isConfirming = confirmDeleteId === meeting.id;
          const isDeleting = deletingId === meeting.id;
          const isEditingAttendance = editingAttendanceId === meeting.id;

          return (
            <div key={meeting.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleExpand(meeting.id)}
                onKeyDown={(e) => e.key === "Enter" && toggleExpand(meeting.id)}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer select-none"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[0.6rem] text-blue-500 font-medium uppercase leading-none">
                    {new Date(meeting.tanggal).toLocaleString("id-ID", { month: "short" })}
                  </span>
                  <span className="text-sm font-bold text-blue-700 leading-tight">
                    {new Date(meeting.tanggal).getDate()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {meeting.topik ?? "Pertemuan iCare"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(meeting.tanggal).toLocaleDateString("id-ID", {
                      weekday: "long", year: "numeric", month: "long", day: "numeric",
                    })}
                    {meeting.lokasi && ` · ${meeting.lokasi}`}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Users size={13} className="text-gray-400" />
                  <span className="text-sm font-semibold text-gray-700">{meeting.jumlah_hadir}</span>
                  <span className="text-xs text-gray-400 mr-2">hadir</span>
                  {isExpanded
                    ? <ChevronUp size={14} className="text-gray-400" />
                    : <ChevronDown size={14} className="text-gray-400" />}
                </div>
              </div>

              {isExpanded && (
                <div
                  className="border-t border-gray-100 px-5 py-4 bg-gray-50 flex flex-col gap-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  {!isEditingAttendance && (
                    <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                      <button
                        onClick={() => startEditAttendance(meeting.id)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Pencil size={13} />
                        Edit Kehadiran
                      </button>

                      {isConfirming ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-gray-500 font-medium">Hapus?</span>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2.5 py-1 text-[11px] font-bold border border-gray-300 rounded bg-white hover:bg-gray-50"
                          >
                            Batal
                          </button>
                          <button
                            onClick={() => handleDelete(meeting.id)}
                            disabled={isDeleting}
                            className="px-2.5 py-1 text-[11px] font-bold bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                          >
                            {isDeleting ? "..." : "Ya, Hapus"}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(meeting.id)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <Trash2 size={13} />
                          Hapus Pertemuan
                        </button>
                      )}
                    </div>
                  )}

                  {meeting.catatan && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-gray-700">Catatan: </span>
                      {meeting.catatan}
                    </p>
                  )}

                  {isEditingAttendance ? (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium text-gray-600">Edit Kehadiran</p>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                            {Object.values(editAttendanceMap).filter(Boolean).length} / {members.length} hadir
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const all: AttendanceMap = {};
                              members.forEach((m) => { all[m.id] = true; });
                              setEditAttendanceMap(all);
                            }}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Semua Hadir
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => {
                              const none: AttendanceMap = {};
                              members.forEach((m) => { none[m.id] = false; });
                              setEditAttendanceMap(none);
                            }}
                            className="text-xs text-gray-400 hover:underline"
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1 mb-3">
                        {members.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setEditAttendanceMap((prev) => ({ ...prev, [m.id]: !prev[m.id] }))}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm text-left transition-colors ${
                              editAttendanceMap[m.id]
                                ? "bg-blue-50 border-blue-300 text-blue-800"
                                : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                              editAttendanceMap[m.id] ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"
                            }`}>
                              {editAttendanceMap[m.id] && <Check size={10} className="text-white" strokeWidth={3} />}
                            </div>
                            <span className="truncate">{m.nama_lengkap}</span>
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingAttendanceId(null)}
                          disabled={savingAttendance}
                          className="px-3 py-1.5 text-xs text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
                        >
                          Batal
                        </button>
                        <button
                          onClick={() => handleSaveAttendance(meeting.id)}
                          disabled={savingAttendance}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg transition-colors"
                        >
                          {savingAttendance && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                          {savingAttendance ? "Menyimpan..." : "Simpan"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">
                          Hadir
                          <span className="ml-1.5 bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-[0.65rem]">
                            {attendanceList ? hadirList.length : "…"}
                          </span>
                        </p>
                        {!attendanceList ? (
                          <p className="text-xs text-gray-400">Memuat...</p>
                        ) : hadirList.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {hadirList.map((a, i) => (
                              <span key={i} className="text-xs bg-white border border-green-200 text-green-800 px-2.5 py-1 rounded-full">
                                {a.nama}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400">—</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">
                          Tidak Hadir
                          <span className="ml-1.5 bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full text-[0.65rem]">
                            {attendanceList ? tidakHadirList.length : "…"}
                          </span>
                        </p>
                        {!attendanceList ? (
                          <p className="text-xs text-gray-400">Memuat...</p>
                        ) : tidakHadirList.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {tidakHadirList.map((a, i) => (
                              <span key={i} className="text-xs bg-white border border-red-200 text-red-700 px-2.5 py-1 rounded-full">
                                {a.nama}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400">—</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}