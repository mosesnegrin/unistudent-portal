import { getSessionContext } from "@/lib/auth";
import { EmptyState, PageHeader, Panel } from "@/components/ui";

export default async function CommunityPage() {
  const { supabase, profile, user } = await getSessionContext();
  const { data: myInterests } = await supabase
    .from("user_interests")
    .select("interest_id")
    .eq("user_id", user.id);
  const interestIds = (myInterests ?? []).map((item) => item.interest_id);

  const { data: matches } = interestIds.length
    ? await supabase
        .from("user_interests")
        .select("profiles(id,full_name,bio),interests(name)")
        .in("interest_id", interestIds)
        .neq("user_id", user.id)
        .eq("profiles.university_id", profile?.university_id)
        .limit(30)
    : { data: [] };

  return (
    <>
      <PageHeader title="Community" description="Find students at your university with similar interests." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {matches?.length ? matches.map((match, index) => {
          const profileRow = match.profiles as unknown as { id: string; full_name: string; bio: string | null } | { id: string; full_name: string; bio: string | null }[] | null;
          const interestRow = match.interests as unknown as { name: string } | { name: string }[] | null;
          const matchedProfile = Array.isArray(profileRow) ? profileRow[0] : profileRow;
          const interest = Array.isArray(interestRow) ? interestRow[0] : interestRow;
          return matchedProfile ? (
            <Panel key={`${matchedProfile.id}-${index}`}>
              <h2 className="font-semibold">{matchedProfile.full_name}</h2>
              <p className="mt-1 text-sm text-muted">Shared interest: {interest?.name}</p>
              {matchedProfile.bio ? <p className="mt-3 text-sm leading-6 text-muted">{matchedProfile.bio}</p> : null}
            </Panel>
          ) : null;
        }) : <div className="sm:col-span-2 lg:col-span-3"><EmptyState title="No interest matches yet" description="Add interests on your profile. Matching students appear only when real users share interests." /></div>}
      </div>
    </>
  );
}
