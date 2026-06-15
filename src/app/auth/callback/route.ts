import { NextResponse } from "next/server";
import { finalizeAuthenticatedProfile } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
    await finalizeAuthenticatedProfile();
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
