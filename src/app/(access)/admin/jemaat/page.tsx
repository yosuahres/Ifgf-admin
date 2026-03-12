// admin/jemaat/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { type Database } from '@/types/database.types';
import MasterDataTable from '@/components/MasterDataTable';
import ModalForm from '@/components/ModalForm';

type Jemaat = Database['public']['Tables']['jemaat']['Row'];
type ProfileOption = { value: string; label: string };

export default function JemaatPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Jemaat | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileOptions, setProfileOptions] = useState<ProfileOption[]>([]);
  const [assignedUserIds, setAssignedUserIds] = useState<Set<string>>(new Set());

  const supabase = createClient();

  useEffect(() => {
    loadProfileOptions();
  }, []);

  const loadProfileOptions = async () => {
    // Get all profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .order('full_name');

    // Get all user_ids already assigned to jemaat
    const { data: jemaatList } = await supabase
      .from('jemaat')
      .select('user_id')
      .not('user_id', 'is', null);

    const usedIds = new Set(
      (jemaatList ?? []).map((j: any) => j.user_id).filter(Boolean)
    );
    setAssignedUserIds(usedIds);

    setProfileOptions(
      (profiles ?? []).map((p: any) => ({
        value: p.id,
        label: `${p.full_name} (${p.role})`,
      }))
    );
  };

  // Filter out already-assigned profiles, but keep current editItem's user_id available
  const availableProfileOptions = [
    { value: '', label: '— Tidak Dihubungkan —' },
    ...profileOptions.filter(
      p => !assignedUserIds.has(p.value) || p.value === (editItem?.user_id ?? '')
    ),
  ];

  const columns = [
    { key: 'nama_lengkap', label: 'Nama Lengkap' },
    { key: 'email', label: 'Email' },
    { key: 'phone_number', label: 'No. Telepon' },
    {
      key: 'gender',
      label: 'Gender',
      render: (value: string) =>
        value === 'L' ? 'Laki-laki' : value === 'P' ? 'Perempuan' : '-',
    },
    {
      key: 'status_jemaat',
      label: 'Status',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          value === 'aktif'     ? 'bg-green-100 text-green-800' :
          value === 'nonaktif' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-600'
        }`}>
          {value ? value.charAt(0).toUpperCase() + value.slice(1) : '-'}
        </span>
      ),
    },
    {
      key: 'is_baptized',
      label: 'Baptis',
      render: (value: boolean) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          value ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'
        }`}>
          {value ? 'Sudah' : 'Belum'}
        </span>
      ),
    },
    {
      key: 'tanggal_join',
      label: 'Tanggal Join',
      render: (value: string) =>
        value ? new Date(value).toLocaleDateString('id-ID') : '-',
    },
    { key: 'alamat', label: 'Alamat' },
  ];

  const fields = [
    {
      name: 'user_id',
      label: 'Akun Pengguna',
      type: 'select' as const,
      required: false,
      options: availableProfileOptions,
    },
    {
      name: 'nama_lengkap',
      label: 'Nama Lengkap',
      type: 'text' as const,
      required: true,
      placeholder: 'Nama lengkap',
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email' as const,
      required: false,
      placeholder: 'email@example.com',
    },
    {
      name: 'phone_number',
      label: 'No. Telepon',
      type: 'text' as const,
      required: false,
      placeholder: '08xxxxxxxxxx',
    },
    {
      name: 'gender',
      label: 'Gender',
      type: 'select' as const,
      required: false,
      options: [
        { value: '', label: '— Pilih Gender —' },
        { value: 'L', label: 'Laki-laki' },
        { value: 'P', label: 'Perempuan' },
      ],
    },
    {
      name: 'dob',
      label: 'Tanggal Lahir',
      type: 'date' as const,
      required: true,
    },
    {
      name: 'alamat',
      label: 'Alamat',
      type: 'textarea' as const,
      required: false,
      placeholder: 'Alamat lengkap',
    },
    {
      name: 'status_jemaat',
      label: 'Status',
      type: 'select' as const,
      required: false,
      options: [
        { value: 'aktif',    label: 'Aktif' },
        { value: 'nonaktif', label: 'Nonaktif' },
      ],
    },
    {
      name: 'marital_status',
      label: 'Status Pernikahan',
      type: 'select' as const,
      required: false,
      options: [
        { value: '',         label: '— Pilih Status —' },
        { value: 'single',   label: 'Single' },
        { value: 'married',  label: 'Menikah' },
        { value: 'divorced', label: 'Cerai' },
        { value: 'widowed',  label: 'Janda/Duda' },
      ],
    },
    {
      name: 'is_baptized',
      label: 'Sudah Baptis?',
      type: 'select' as const,
      required: false,
      options: [
        { value: 'false', label: 'Belum' },
        { value: 'true',  label: 'Sudah' },
      ],
    },
    {
      name: 'tanggal_baptis',
      label: 'Tanggal Baptis',
      type: 'date' as const,
      required: false,
    },
    {
      name: 'discipleship_stage',
      label: 'Tahap Pemuridan',
      type: 'text' as const,
      required: false,
      placeholder: 'e.g. Foundation',
    },
    {
      name: 'notes',
      label: 'Catatan',
      type: 'textarea' as const,
      required: false,
      placeholder: 'Catatan tambahan',
    },
  ];

  const handleAdd = () => {
    setEditItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: Jemaat) => {
    setEditItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm('Yakin ingin menghapus data jemaat ini?')) return;
    const { error } = await supabase.from('jemaat').delete().eq('id', id as string);
    if (error) alert('Gagal menghapus: ' + error.message);
    else loadProfileOptions(); // refresh assigned list
  };

  const handleSubmit = async (data: Record<string, any>) => {
    setIsSubmitting(true);

    const payload = {
      user_id:            data.user_id            || null,
      nama_lengkap:       data.nama_lengkap,
      email:              data.email              || null,
      phone_number:       data.phone_number       || null,
      gender:             data.gender             || null,
      dob:                data.dob,
      alamat:             data.alamat             || null,
      status_jemaat:      data.status_jemaat      || 'aktif',
      marital_status:     data.marital_status     || null,
      is_baptized:        data.is_baptized === 'true',
      tanggal_baptis:     data.tanggal_baptis     || null,
      discipleship_stage: data.discipleship_stage || null,
      notes:              data.notes              || null,
    };

    const { error } = editItem
      ? await supabase.from('jemaat').update(payload).eq('id', editItem.id)
      : await supabase.from('jemaat').insert(payload);

    if (error) {
      alert('Gagal menyimpan: ' + error.message);
    } else {
      setIsModalOpen(false);
      setEditItem(null);
      loadProfileOptions(); // refresh assigned list after save
    }

    setIsSubmitting(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Data Jemaat</h1>
        <p className="text-sm text-gray-500">Kelola data anggota jemaat gereja</p>
      </div>

      <MasterDataTable
        title="Jemaat"
        endpoint="/api/jemaat"
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <ModalForm
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditItem(null); }}
        title={editItem ? 'Edit Jemaat' : 'Tambah Jemaat'}
        fields={fields}
        initialData={editItem ? {
          ...editItem,
          is_baptized: editItem.is_baptized ? 'true' : 'false',
          dob: editItem.dob ?? '',
          tanggal_baptis: editItem.tanggal_baptis ?? '',
        } : undefined}
        onSubmit={handleSubmit}
        submitText={editItem ? 'Simpan Perubahan' : 'Tambah Jemaat'}
        isLoading={isSubmitting}
      />
    </div>
  );
}