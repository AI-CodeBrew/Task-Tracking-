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

  if (!file) {
    return NextResponse.json({ error: "file is required." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed." }, { status: 400 });
  }

  const zone = process.env.BUNNY_STORAGE_ZONE_NAME!;
  const extension = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "jpg";
  const storagePath = `avatars/${user.id}.${extension}`;

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

  // Cache-bust so the new image shows immediately even though the path is stable.
  const avatarUrl = `https://${process.env.BUNNY_PULL_ZONE_URL}/${storagePath}?v=${Date.now()}`;

  const { error } = await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ avatar_url: avatarUrl });
}
