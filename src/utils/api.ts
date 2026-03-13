import { createClient } from "@supabase/supabase-js";
import { type Database } from "../types/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export async function fetchFromBackend(url: string) {
  try {
    console.log("Fetching from:", url);

    const urlObj = new URL(url, "http://localhost");
    const pathname = urlObj.pathname;
    const searchParams = urlObj.searchParams;

    const tableName = pathname.replace("/api/", "").replace(/-/g, "_");

    // Build query with joins where needed
    let query =
      tableName === "icare_groups"
        ? supabase
            .from("icare_groups")
            .select("*, jemaat(nama_lengkap)", { count: "exact" })
        : supabase.from(tableName as any).select("*", { count: "exact" });

    // Apply pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    if (limit !== 10000) {
      query = query.range(offset, offset + limit - 1);
    }

    // Apply search if provided
    const search = searchParams.get("search");
    if (search) {
      if (tableName === "profiles") {
        query = query.ilike("full_name", `%${search}%`);
      } else if (tableName === "icare_groups") {
        query = query.ilike("nama_icare", `%${search}%`);
      } else if (tableName === "jemaat") {
        query = query.ilike("nama_lengkap", `%${search}%`);
      } else if (tableName === "events") {
        query = query.ilike("event_name", `%${search}%`);
      }
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
    };
  } catch (error) {
    console.error("API fetch error:", error);
    throw error;
  }
}
