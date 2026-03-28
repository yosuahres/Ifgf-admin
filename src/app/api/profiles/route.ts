// app/api/profiles/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_profiles_with_jemaat");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  console.log("First row:", JSON.stringify(data?.[0], null, 2)); // 👈 here

  return NextResponse.json(data ?? []);
}