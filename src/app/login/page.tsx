import { GraduationCap } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { deactivatedUniversityMessage } from "@/lib/auth";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-surface px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-line bg-white p-5 shadow-soft">
        <div className="mb-6">
          <span className="grid size-11 place-items-center rounded-lg bg-ink text-white">
            <GraduationCap size={22} />
          </span>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">UniStudents Portal</h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Log in or create your account.
          </p>
        </div>
        {error === "deactivated" ? (
          <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {deactivatedUniversityMessage}
          </p>
        ) : null}
        <LoginForm />
      </section>
    </main>
  );
}
