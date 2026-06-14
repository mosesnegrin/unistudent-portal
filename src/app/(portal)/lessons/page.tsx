import { createLesson, requestLesson } from "@/app/actions";
import { getSessionContext } from "@/lib/auth";
import { EmptyState, Field, PageHeader, Panel, PrimaryButton, SelectField, TextArea } from "@/components/ui";

export default async function LessonsPage() {
  const { supabase, profile } = await getSessionContext();
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id,course_name,tutor_name,grade_background,description,price_cents,session_type,availability")
    .eq("moderation_status", "approved")
    .eq("university_id", profile?.university_id)
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader title="Private lessons" description="Find study help or offer lessons to students at your university." />
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          {lessons?.length ? lessons.map((lesson) => (
            <Panel key={lesson.id}>
              <h2 className="font-semibold">{lesson.course_name}</h2>
              <p className="mt-1 text-sm text-muted">{lesson.tutor_name} · {lesson.session_type}</p>
              <p className="mt-3 text-sm leading-6 text-muted">{lesson.description}</p>
              <p className="mt-3 text-sm">Price: {lesson.price_cents ? `EUR ${(lesson.price_cents / 100).toFixed(2)}` : "Free"}</p>
              {lesson.availability ? <p className="mt-1 text-sm text-muted">Availability: {lesson.availability}</p> : null}
              <form action={requestLesson} className="mt-4 space-y-3">
                <input type="hidden" name="lesson_id" value={lesson.id} />
                <TextArea label="Message" name="message" />
                <PrimaryButton>Request lesson</PrimaryButton>
              </form>
            </Panel>
          )) : <EmptyState title="No approved lessons yet" description="Approved private lesson listings will appear here." />}
        </div>
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
      </div>
    </>
  );
}
