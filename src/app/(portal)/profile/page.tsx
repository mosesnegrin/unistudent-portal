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
      <PageHeader title="Profile" description="Keep your profile and interests current for community matching." />
      <Panel className="max-w-2xl">
        <form action={updateProfile} className="space-y-4">
          <Field label="Full name" name="full_name" defaultValue={profile?.full_name} required />
          <Field label="Email" name="email" defaultValue={profile?.email} />
          <Field label="Phone" name="phone" defaultValue={profile?.phone} placeholder="+43 ..." />
          <TextArea label="Short bio" name="bio" defaultValue={profile?.bio} />
          <Field label="Interests" name="interests" defaultValue={interestNames} placeholder="finance, law, design" />
          <PrimaryButton>Save profile</PrimaryButton>
        </form>
      </Panel>
    </>
  );
}
