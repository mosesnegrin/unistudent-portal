import { updateProfile } from "@/app/actions";
import { getSessionContext } from "@/lib/auth";
import { Field, PageHeader, Panel, PrimaryButton, TextArea } from "@/components/ui";

export default async function ProfilePage() {
  const { supabase, profile, user } = await getSessionContext();
  const { data: interests } = await supabase
    .from("user_interests")
    .select("interests(name)")
    .eq("user_id", user.id);
  const interestNames = (interests ?? [])
    .map((item) => (item.interests as { name?: string } | null)?.name)
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <PageHeader title="Profile" description="Keep your profile and contact information current." />
      <Panel className="max-w-2xl">
        <form action={updateProfile} className="space-y-4">
          <Field label="Full name" name="full_name" defaultValue={profile?.full_name} required />
          <div className="rounded-xl border border-line bg-surface px-3 py-3">
            <p className="text-sm font-medium">Email</p>
            <p className="mt-1 break-all text-sm text-muted">{profile?.email ?? user.email}</p>
          </div>
          <Field label="Phone" name="phone" defaultValue={profile?.phone} placeholder="+43 ..." />
          <TextArea label="Short bio" name="bio" defaultValue={profile?.bio} />
          <Field label="Interests" name="interests" defaultValue={interestNames} placeholder="finance, law, design" />
          <PrimaryButton>Save profile</PrimaryButton>
        </form>
      </Panel>
    </>
  );
}
