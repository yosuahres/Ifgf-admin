// app/api/users/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// Service-role client — NEVER expose this key to the browser
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // server-only env var
);

export async function POST(req: NextRequest) {
  try {
    const { email, password, full_name, role } = await req.json();

    // --- Validation ---
    if (!email || !password || !full_name || !role) {
      return NextResponse.json(
        { error: "email, password, full_name, dan role wajib diisi." },
        { status: 400 },
      );
    }

    const validRoles = ["admin", "pastor", "leader", "usher", "user"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Role tidak valid. Pilihan: ${validRoles.join(", ")}` },
        { status: 400 },
      );
    }

    // --- 1. Create auth user ---
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // skip confirmation email
      });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // --- 2. Upsert profile ---
    // Using upsert in case a trigger already inserted a bare profile row
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId, full_name, role });

    if (profileError) {
      // Roll back: delete the auth user so we don't leave an orphan
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: `Auth user dibuat tapi profil gagal: ${profileError.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, user_id: userId }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}