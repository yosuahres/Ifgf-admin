// admin/icare-groups/page.tsx
'use client';
import MasterDataTable from '@/components/MasterDataTable';
import ModalForm from '@/components/ModalForm';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';
import { useEffect, useState } from 'react';

type IcareRow = Database['public']['Tables']['icare_groups']['Row'];
type LeaderOption = { value: string; label: string };

export default function IcareGroupsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<IcareRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leaderOptions, setLeaderOptions] = useState<LeaderOption[]>([]);

  const supabase = createClient();

  useEffect(() => {
    const loadLeaders = async () => {
      const { data } = await supabase
        .from('jemaat')
        .select('id, nama_lengkap')
        .order('nama_lengkap');
      setLeaderOptions(
        (data ?? []).map((j) => ({ value: j.id, label: j.nama_lengkap }))
      );
    };
    loadLeaders();
  }, [supabase]);

  const columns = [
    { key: 'nama_icare', label: 'Nama iCare' },
    {
      key: 'leader_id',
      label: 'Leader',
      render: (_: unknown, item: IcareRow) => item.jemaat?.nama_lengkap ?? '-',
    },
    { key: 'hari_pertemuan', label: 'Hari Pertemuan' },
    {
      key: 'jam_pertemuan',
      label: 'Jam',
      render: (value: string) => value ? value.slice(0, 5) : '-',
    },
    { key: 'lokasi_pertemuan', label: 'Lokasi' },
    {
      key: 'created_at',
      label: 'Dibuat',
      render: (value: string) =>
        value ? new Date(value).toLocaleDateString('id-ID') : '-',
    },
  ];

  const fields = [
    {
      name: 'nama_icare',
      label: 'Nama iCare',
      type: 'text' as const,
      required: true,
      placeholder: 'e.g. iCare Menteng',
    },
    {
      name: 'leader_id',
      label: 'Leader',
      type: 'select' as const,
      required: false,
      options: [
        { value: '', label: '— Pilih Leader —' },
        ...leaderOptions,
      ],
    },
    {
      name: 'hari_pertemuan',
      label: 'Hari Pertemuan',
      type: 'select' as const,
      required: false,
      options: [
        { value: '', label: '— Pilih Hari —' },
        ...['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(d => ({
          value: d,
          label: d,
        })),
      ],
    },
    {
      name: 'jam_pertemuan',
      label: 'Jam Pertemuan',
      type: 'time' as const,
      required: false,
    },
    {
      name: 'lokasi_pertemuan',
      label: 'Lokasi Pertemuan',
      type: 'text' as const,
      required: false,
      placeholder: 'Alamat / nama tempat',
    },
    {
      name: 'deskripsi',
      label: 'Deskripsi',
      type: 'textarea' as const,
      required: false,
      placeholder: 'Deskripsi singkat tentang grup ini...',
    },
  ];

  const handleAdd = () => {
    setEditItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: IcareRow) => {
    setEditItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm('Yakin ingin menghapus iCare group ini?')) return;
    const { error } = await supabase
      .from('icare_groups')
      .delete()
      .eq('id', id as string);
    if (error) alert(`Gagal menghapus: ${error.message}`);
  };

  const handleSubmit = async (data: Record<string, string | null>) => {
    setIsSubmitting(true);

    const payload = {
      nama_icare:       data.nama_icare as string,
      leader_id:        data.leader_id        || null,
      hari_pertemuan:   data.hari_pertemuan   || null,
      jam_pertemuan:    data.jam_pertemuan    || null,
      lokasi_pertemuan: data.lokasi_pertemuan || null,
      deskripsi:        data.deskripsi        || null,
    };

    const { error } = editItem
      ? await supabase.from('icare_groups').update(payload).eq('id', editItem.id)
      : await supabase.from('icare_groups').insert([payload]);

    if (error) {
      alert(`Gagal menyimpan: ${error.message}`);
    } else {
      setIsModalOpen(false);
      setEditItem(null);
    }

    setIsSubmitting(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">iCare Groups</h1>
        <p className="text-sm text-gray-500">Kelola kelompok iCare dan penugasan leader</p>
      </div>

      <MasterDataTable
        title="iCare Groups"
        endpoint="/api/icare-groups"
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <ModalForm
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditItem(null); }}
        title={editItem ? 'Edit iCare Group' : 'Tambah iCare Group'}
        fields={fields}
        initialData={editItem}
        onSubmit={handleSubmit}
        submitText={editItem ? 'Simpan Perubahan' : 'Tambah Group'}
        isLoading={isSubmitting}
      />
    </div>
  );
}