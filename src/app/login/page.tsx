import { GraduationCap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/login-form";
import type { University } from "@/lib/types";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: universities } = await supabase
    .from("universities")
    .select("id,name,allowed_email_domain,is_active")
    .eq("is_active", true)
    .order("name")
    .returns<University[]>();

  return (
    <main className="grid min-h-screen place-items-center bg-surface px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-line bg-white p-5 shadow-soft">
        <div className="mb-6">
          <span className="grid size-11 place-items-center rounded-lg bg-ink text-white">
            <GraduationCap size={22} />
          </span>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">UniStudent Portal</h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Sign in with your verified university email to access your private student community.
          </p>
        </div>
        {universities?.length ? (
          <LoginForm universities={universities} />
        ) : (
          <div className="rounded-lg border border-dashed border-line bg-surface p-4 text-sm leading-6 text-muted">
            No active universities are available yet. Add your first university in Supabase, then return here.
          </div>
        )}
      </section>
    </main>
  );
}
