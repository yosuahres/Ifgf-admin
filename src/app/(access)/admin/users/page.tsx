'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { type Database } from '@/types/database.types';
import MasterDataTable from '@/components/MasterDataTable';
import ModalForm from '@/components/ModalForm';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function UsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const columns = [
    { key: 'full_name', label: 'Full Name' },
    { key: 'id', label: 'User ID' },
    {
      key: 'role',
      label: 'Role',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          value === 'admin'  ? 'bg-red-100 text-red-800' :
          value === 'pastor' ? 'bg-blue-100 text-blue-800' :
          value === 'leader' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      )
    },
    {
      key: 'updated_at',
      label: 'Last Updated',
      render: (value: string) => value ? new Date(value).toLocaleDateString() : 'Never'
    }
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) console.error('Error loading profiles:', error);
      else setProfiles(data || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleModalSubmit = async (data: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      const { error } = await (supabase as any)
        .from('profiles')
        .insert({ id: data.user_id, full_name: data.full_name, role: data.role });

      if (error) {
        console.error('Error creating profile:', error);
        alert('Failed to create user profile');
      } else {
        setIsModalOpen(false);
        loadData();
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      alert('Failed to create user profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (profile: Profile) => {
    console.log('Edit profile:', profile);
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) {
        console.error('Error deleting profile:', error);
        alert('Failed to delete user');
      } else {
        setProfiles(prev => prev.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
      alert('Failed to delete user');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Users Management</h1>
        <p className="text-sm text-gray-500">Manage your application users and their roles</p>
      </div>

      <MasterDataTable
        title="Users"
        endpoint="/api/profiles"
        columns={columns}
        onAdd={() => setIsModalOpen(true)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <ModalForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New User"
        fields={[
          { name: 'user_id',   label: 'User ID',   type: 'text',   required: true, placeholder: 'Enter user ID from auth.users' },
          { name: 'full_name', label: 'Full Name', type: 'text',   required: true, placeholder: 'Enter full name' },
          { name: 'role',      label: 'Role',      type: 'select', required: true,
            options: [
              { value: 'admin',  label: 'Admin'  },
              { value: 'pastor', label: 'Pastor' },
              { value: 'leader', label: 'Leader' },
              { value: 'user',   label: 'User'   },
            ]
          }
        ]}
        onSubmit={handleModalSubmit}
        submitText="Create User"
        isLoading={isSubmitting}
      />
    </div>
  );
}