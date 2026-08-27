"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Avatar from "@/components/Avatar";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

export default function SettingsForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const supabase = createClient();
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/avatar", { method: "POST", body: formData });
    const body = await res.json();

    setUploading(false);
    e.target.value = "";

    if (!res.ok) {
      setError(body.error ?? "Upload failed.");
      return;
    }

    setAvatarUrl(body.avatar_url);
    router.refresh();
  }

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName || null })
      .eq("id", profile.id);

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Profile picture</h2>
        <div className="flex items-center gap-5">
          <Avatar url={avatarUrl} label={fullName || profile.email} id={profile.id} size="lg" />
          <div>
            <label className="inline-block cursor-pointer rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              {uploading ? "Uploading..." : "Upload new picture"}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={uploading}
                className="hidden"
              />
            </label>
            <p className="mt-2 text-xs text-slate-400">JPG, PNG, or GIF.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveName} className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Profile details</h2>
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">Full name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <input
            disabled
            value={profile.email}
            className="w-full max-w-sm rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
          />
        </div>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        {saved && <p className="mb-3 text-sm text-emerald-600">Saved.</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}
