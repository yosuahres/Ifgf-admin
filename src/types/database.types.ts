// Example Database type for Supabase
export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json }
	| Json[];

export interface Database {
	public: {
		Tables: {
			users: {
				Row: {
					id: string;
					email: string;
					created_at: string;
				};
				Insert: {
					email: string;
				};
				Update: {
					email?: string;
				};
			};
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: "admin" | "pastor" | "leader" | "user";
          updated_at: string | null;
        };
        Insert: {
          id: string;
          full_name: string;
          role?: "admin" | "pastor" | "leader" | "user";
          updated_at?: string | null;
        };
        Update: {
          full_name?: string;
          role?: "admin" | "pastor" | "leader" | "user";
          updated_at?: string | null;
        };
      };
		};
		Views: {};
		Functions: {};
	};
}
