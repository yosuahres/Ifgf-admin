import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
    }

    const { error: unlinkError } = await supabaseAdmin
      .from("jemaat")
      .update({ user_id: null })
      .eq("user_id", id);

    if (unlinkError) {
      return NextResponse.json(
        { error: `Gagal memutus tautan jemaat: ${unlinkError.message}` },
        { status: 500 }
      );
    }

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (authError) {
      return NextResponse.json(
        { error: `Gagal menghapus auth user: ${authError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Terjadi kesalahan." },
      { status: 500 }
    );
  }
}