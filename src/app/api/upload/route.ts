import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function bunnyEndpoint() {
  const region = process.env.BUNNY_STORAGE_REGION;
  return region ? `https://${region}.storage.bunnycdn.com` : "https://storage.bunnycdn.com";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const issueId = formData.get("issueId") as string | null;

  if (!file || !issueId) {
    return NextResponse.json({ error: "file and issueId are required." }, { status: 400 });
  }

  // Confirms the caller is a project member for this issue via RLS on the select below.
  const { data: issue } = await supabase
    .from("issues")
    .select("id, project_id")
    .eq("id", issueId)
    .maybeSingle();

  if (!issue) {
    return NextResponse.json({ error: "Issue not found or access denied." }, { status: 404 });
  }

  const zone = process.env.BUNNY_STORAGE_ZONE_NAME!;
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const storagePath = `issues/${issueId}/${randomUUID()}-${safeName}`;

  const bytes = Buffer.from(await file.arrayBuffer());

  const uploadRes = await fetch(`${bunnyEndpoint()}/${zone}/${storagePath}`, {
    method: "PUT",
    headers: {
      AccessKey: process.env.BUNNY_STORAGE_API_KEY!,
      "Content-Type": "application/octet-stream",
    },
    body: bytes,
  });

  if (!uploadRes.ok) {
    return NextResponse.json({ error: "Upload to storage failed." }, { status: 502 });
  }

  const fileUrl = `https://${process.env.BUNNY_PULL_ZONE_URL}/${storagePath}`;

  const { data: attachment, error } = await supabase
    .from("attachments")
    .insert({
      issue_id: issueId,
      file_name: file.name,
      file_url: fileUrl,
      file_size: file.size,
      content_type: file.type,
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ attachment });
}
