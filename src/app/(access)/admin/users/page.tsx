'use client';

import { useEffect, useState } from 'react';
import MasterDataTable from '@/components/MasterDataTable';
import ModalForm from '@/components/ModalForm';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

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

  const handleModalSubmit = async (data: Record<string, string>) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .insert({ 
          id: data.user_id, 
          full_name: data.full_name, 
          role: data.role as Profile['role'] 
        });

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
}