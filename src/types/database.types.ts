export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export type StatusJemaatType = 'aktif' | 'tidak_aktif' | 'pindah' | 'meninggal';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: 'admin' | 'pastor' | 'leader' | 'user' | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          full_name: string;
          role?: 'admin' | 'pastor' | 'leader' | 'user' | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: 'admin' | 'pastor' | 'leader' | 'user' | null;
          updated_at?: string | null;
        };
      };

      jemaat: {
        Row: {
          id: string;
          user_id: string | null;
          nama_lengkap: string;
          gender: 'L' | 'P' | null;
          dob: string;
          phone_number: string | null;
          email: string | null;
          alamat: string | null;
          is_baptized: boolean | null;
          tanggal_baptis: string | null;
          status_jemaat: StatusJemaatType | null;
          tanggal_join: string | null;
          photo_url: string | null;
          notes: string | null;
          marital_status: string | null;
          discipleship_stage: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          nama_lengkap: string;
          gender?: 'L' | 'P' | null;
          dob: string;
          phone_number?: string | null;
          email?: string | null;
          alamat?: string | null;
          is_baptized?: boolean | null;
          tanggal_baptis?: string | null;
          status_jemaat?: StatusJemaatType | null;
          tanggal_join?: string | null;
          photo_url?: string | null;
          notes?: string | null;
          marital_status?: string | null;
          discipleship_stage?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          nama_lengkap?: string;
          gender?: 'L' | 'P' | null;
          dob?: string;
          phone_number?: string | null;
          email?: string | null;
          alamat?: string | null;
          is_baptized?: boolean | null;
          tanggal_baptis?: string | null;
          status_jemaat?: StatusJemaatType | null;
          tanggal_join?: string | null;
          photo_url?: string | null;
          notes?: string | null;
          marital_status?: string | null;
          discipleship_stage?: string | null;
          created_at?: string | null;
        };
      };

      icare_groups: {
        Row: {
          id: string;
          nama_icare: string;
          leader_id: string | null;
          hari_pertemuan: string | null;
          lokasi_pertemuan: string | null;
          jam_pertemuan: string | null;
          deskripsi: string | null;
          created_at: string | null;
          jemaat?: { nama_lengkap: string } | null;
        };
        Insert: {
          id?: string;
          nama_icare: string;
          leader_id?: string | null;
          hari_pertemuan?: string | null;
          lokasi_pertemuan?: string | null;
          jam_pertemuan?: string | null;
          deskripsi?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          nama_icare?: string;
          leader_id?: string | null;
          hari_pertemuan?: string | null;
          lokasi_pertemuan?: string | null;
          jam_pertemuan?: string | null;
          deskripsi?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'icare_groups_leader_id_fkey';
            columns: ['leader_id'];
            referencedRelation: 'jemaat';
            referencedColumns: ['id'];
          }
        ];
      };

	  icare_members: {
		Row: {
			id: string;
			icare_id: string | null;
			jemaat_id: string | null;
			join_date: string | null;
		};
		Insert: {
			id?: string;
			icare_id?: string | null;
			jemaat_id?: string | null;
			join_date?: string | null;
		};
		Update: {
			id?: string;
			icare_id?: string | null;
			jemaat_id?: string | null;
			join_date?: string | null;
		};
		Relationships: [
			{
			foreignKeyName: 'icare_members_icare_id_fkey';
			columns: ['icare_id'];
			referencedRelation: 'icare_groups';
			referencedColumns: ['id'];
			},
			{
			foreignKeyName: 'icare_members_jemaat_id_fkey';
			columns: ['jemaat_id'];
			referencedRelation: 'jemaat';
			referencedColumns: ['id'];
			}
		];
		};

		events: {
		Row: {
			id: string;
			event_name: string;
			event_type: string | null;
			event_date: string;
			start_time: string | null;
			end_time: string | null;
			location: string | null;
			description: string | null;
			created_at: string | null;
		};
		Insert: {
			id?: string;
			event_name: string;
			event_type?: string | null;
			event_date: string;
			start_time?: string | null;
			end_time?: string | null;
			location?: string | null;
			description?: string | null;
			created_at?: string | null;
		};
		Update: {
			id?: string;
			event_name?: string;
			event_type?: string | null;
			event_date?: string;
			start_time?: string | null;
			end_time?: string | null;
			location?: string | null;
			description?: string | null;
			created_at?: string | null;
		};
		};

		departments: {
		Row: {
			id: string;
			nama_pelayanan: string;
			deskripsi: string | null;
			leader_id: string | null;
			created_at: string | null;
		};
		Insert: {
			id?: string;
			nama_pelayanan: string;
			deskripsi?: string | null;
			leader_id?: string | null;
			created_at?: string | null;
		};
		Update: {
			id?: string;
			nama_pelayanan?: string;
			deskripsi?: string | null;
			leader_id?: string | null;
			created_at?: string | null;
		};
		};

		department_members: {
		Row: {
			id: string;
			department_id: string | null;
			jemaat_id: string | null;
			role_pelayanan: string | null;
			tanggal_join: string | null;
		};
		Insert: {
			id?: string;
			department_id?: string | null;
			jemaat_id?: string | null;
			role_pelayanan?: string | null;
			tanggal_join?: string | null;
		};
		Update: {
			id?: string;
			department_id?: string | null;
			jemaat_id?: string | null;
			role_pelayanan?: string | null;
			tanggal_join?: string | null;
		};
		};
    };

    Views: Record<string, never>;
    Functions: Record<string, never>;

    Enums: {
      status_jemaat_type: StatusJemaatType;
    };
  };
}