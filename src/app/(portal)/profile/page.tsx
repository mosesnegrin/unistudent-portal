import { updateProfile } from "@/app/actions";
import { getSessionContext } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { ChangePasswordForm } from "@/components/change-password-form";
import { Field, PageHeader, Panel, PrimaryButton } from "@/components/ui";

export default async function ProfilePage() {
  const { profile, user, isAdmin, isCompany, supabase } = await getSessionContext();
  const { data: university } = profile?.university_id && !isCompany
    ? await supabase.from("universities").select("name").eq("id", profile.university_id).maybeSingle()
    : { data: null };

  return (
    <>
      <PageHeader title="Profile" description="Keep your profile and contact information current." />
      <Panel className="mx-auto max-w-2xl">
        <ActionForm action={updateProfile} successMessage="Profile updated successfully." className="space-y-4">
          <Field label="Full name" name="full_name" defaultValue={profile?.full_name} required />
          <div className="rounded-xl border border-line bg-surface px-3 py-3">
            <p className="text-sm font-medium">University</p>
            <p className="mt-1 text-sm text-muted">{isCompany ? "Company account" : university?.name ?? "No university selected"}</p>
          </div>
          <div className="rounded-xl border border-line bg-surface px-3 py-3">
            <p className="text-sm font-medium">Email</p>
            <p className="mt-1 break-all text-sm text-muted">{profile?.email ?? user.email}</p>
          </div>
          <Field label="Phone" name="phone" defaultValue={profile?.phone} placeholder="+43 ..." />
          <PrimaryButton>Save profile</PrimaryButton>
        </ActionForm>
      </Panel>
      {!isAdmin ? (
        <Panel className="mx-auto mt-4 max-w-2xl">
          <h2 className="font-semibold">Change my password</h2>
          <div className="mt-4">
            <ChangePasswordForm />
          </div>
        </Panel>
      ) : null}
    </>
  );
}
