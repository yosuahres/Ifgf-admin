// app/api/users/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, 
);

export async function POST(req: NextRequest) {
  try {
    const { email, password, full_name, role } = await req.json();

    const trimmedEmail = email?.trim?.() || "";
    const trimmedFullName = full_name?.trim?.() || "";
    const trimmedRole = role?.trim?.() || "";
    
    if (!trimmedEmail || !password || !trimmedFullName || !trimmedRole) {
      const missing = [];
      if (!trimmedEmail) missing.push("email");
      if (!password) missing.push("password");
      if (!trimmedFullName) missing.push("full_name");
      if (!trimmedRole) missing.push("role");
      
      console.error("Validation failed - missing fields:", missing, { email, password, full_name, role });
      
      return NextResponse.json(
        { error: `Field wajib diisi: ${missing.join(", ")}` },
        { status: 400 },
      );
    }

    const validRoles = ["admin", "pastor", "leader", "usher", "finance"];
    if (!validRoles.includes(trimmedRole)) {
      return NextResponse.json(
        { error: `Role tidak valid. Pilihan: ${validRoles.join(", ")}` },
        { status: 400 },
      );
    }

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: trimmedEmail,
        password,
        email_confirm: true,
      });

    if (authError) {
      console.error("Auth creation error:", authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;
    console.log("Created auth user:", userId);

    const { data: profileData, error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        { 
          id: userId, 
          full_name: trimmedFullName, 
          role: trimmedRole, 
          email: trimmedEmail 
        },
        { onConflict: "id" }
      )
      .select();

    console.log("Profile upsert result:", { profileData, profileError });

    if (profileError) {
      console.error("Profile error details:", profileError);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: `Auth user dibuat tapi profil gagal: ${profileError.message || JSON.stringify(profileError)}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, id: userId }, { status: 201 }); 
  } catch (err: any) {
    console.error("Create user exception:", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}