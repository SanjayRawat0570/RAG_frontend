"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Supabase automatically exchanges the code/hash in the URL for a session.
    // onAuthStateChange fires once the session is established.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          router.replace("/");
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-violet-500" />
      <p className="text-sm text-zinc-400">Verifying your account…</p>
    </div>
  );
}
