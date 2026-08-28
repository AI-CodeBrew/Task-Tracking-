import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const VALID_ROLES = ["owner", "member", "viewer"];

export async function POST(request: Request) {
  const { projectId, email, role = "member" } = await request.json();

  if (!projectId || !email) {
    return NextResponse.json({ error: "projectId and email are required." }, { status: 400 });
  }

  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || membership.role !== "owner") {
    return NextResponse.json({ error: "Only the project owner can add members." }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json(
      { error: "No account found for that email. They need to sign up first." },
      { status: 404 }
    );
  }

  const { error: insertError } = await admin
    .from("project_members")
    .insert({ project_id: projectId, user_id: profile.id, role });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "Already a member of this project." }, { status: 409 });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
