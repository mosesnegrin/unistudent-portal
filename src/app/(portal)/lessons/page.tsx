import { createLesson, requestLesson } from "@/app/actions";
import { getSessionContext } from "@/lib/auth";
import { canCreate } from "@/lib/permissions";
import { ProviderInfo } from "@/components/provider-info";
import { SubNav } from "@/components/subnav";
import { EmptyState, Field, PageHeader, Panel, PrimaryButton, SelectField, TextArea } from "@/components/ui";

export default async function LessonsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: requestedTab } = await searchParams;
  const { supabase, profile, roles, user } = await getSessionContext();
  const canCreateLesson = canCreate(roles, "lessons");
  const activeTab = requestedTab === "requests" || (requestedTab === "create" && canCreateLesson) ? requestedTab : "all";
  const nav = [
    { href: "/lessons", label: "All lessons" },
    { href: "/lessons?tab=requests", label: "My lesson requests" },
    ...(canCreateLesson ? [{ href: "/lessons?tab=create", label: "Offer lesson" }] : [])
  ];
  const lessonSelect = "id,course_name,tutor_name,grade_background,description,price_cents,session_type,availability,profiles(full_name,email,phone,user_roles(roles(name)))";
  const { data } = activeTab === "requests"
    ? await supabase
        .from("lesson_requests")
        .select(`status,message,lessons(${lessonSelect})`)
        .eq("requester_id", user.id)
        .order("created_at", { ascending: false })
    : activeTab === "all"
      ? await supabase
          .from("lessons")
          .select(lessonSelect)
          .eq("moderation_status", "approved")
          .eq("university_id", profile?.university_id)
          .order("created_at", { ascending: false })
      : { data: [] };
  const lessons = (activeTab === "requests"
    ? ((data ?? []) as Array<Record<string, unknown>>).map((item) => {
        const lesson = item.lessons as Record<string, unknown> | Record<string, unknown>[] | null;
        return Array.isArray(lesson) ? lesson[0] : lesson;
      })
    : ((data ?? []) as Array<Record<string, unknown>>)
  ).filter(Boolean) as Array<Record<string, unknown>>;

  return (
    <>
      <PageHeader title="Private lessons" description="Find study help or offer lessons to students at your university." />
      <SubNav items={nav} active={activeTab} />
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          {activeTab !== "create" && lessons?.length ? lessons.map((lesson) => (
            <Panel key={String(lesson.id)}>
              <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                <div>
                  <h2 className="font-semibold">{String(lesson.course_name)}</h2>
                  <p className="mt-1 text-sm text-muted">{String(lesson.tutor_name)} · {String(lesson.session_type)}</p>
                  <p className="mt-3 text-sm leading-6 text-muted">{String(lesson.description)}</p>
                  <p className="mt-3 text-sm">Price: {lesson.price_cents ? `EUR ${(Number(lesson.price_cents) / 100).toFixed(2)}` : "Free"}</p>
                  {lesson.availability ? <p className="mt-1 text-sm text-muted">Availability: {String(lesson.availability)}</p> : null}
                </div>
                <ProviderInfo provider={lesson.profiles as never} label="Offered by" />
              </div>
              {activeTab === "all" ? <form action={requestLesson} className="mt-4 space-y-3">
                <input type="hidden" name="lesson_id" value={String(lesson.id)} />
                <TextArea label="Message" name="message" />
                <PrimaryButton>Request lesson</PrimaryButton>
              </form> : null}
            </Panel>
          )) : activeTab !== "create" ? <EmptyState title="No lessons found" description="Lessons for this view will appear here." /> : null}
        </div>
        {activeTab === "create" && canCreateLesson ? (
          <Panel>
            <h2 className="font-semibold">Offer a lesson</h2>
            <form action={createLesson} className="mt-4 space-y-4">
              <Field label="Course name" name="course_name" required />
              <Field label="Tutor name" name="tutor_name" required />
              <Field label="Grade/background" name="grade_background" />
              <TextArea label="Description" name="description" required />
              <Field label="Price in cents" name="price_cents" type="number" placeholder="0 for free" />
              <SelectField label="Session type" name="session_type" required defaultValue="one_time">
                <option value="one_time">One-time</option>
                <option value="multiple_sessions">Multiple sessions</option>
              </SelectField>
              <Field label="Availability" name="availability" />
              <PrimaryButton>Submit for approval</PrimaryButton>
            </form>
          </Panel>
        ) : null}
      </div>
    </>
  );
}
