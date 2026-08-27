import { createClient } from "@/lib/supabase/server";
import SettingsForm from "@/components/SettingsForm";
import type { Profile } from "@/lib/types";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single<Profile>();

  return (
    <main className="mx-auto max-w-2xl px-8 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Settings</h1>
      <SettingsForm profile={profile!} />
    </main>
  );
}
