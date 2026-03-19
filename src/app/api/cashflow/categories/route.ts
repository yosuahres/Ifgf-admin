// app/api/cashflow/categories/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── GET /api/cashflow/categories ──────────────────────────────────────────────
export async function GET() {
  const { data, error } = await supabase
    .from("cashflow_categories")
    .select("id, name, type")
    .order("type")
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}