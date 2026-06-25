import { supabase } from "./supabase";

export interface AuthUser {
  id:       string;
  email:    string;
  username: string;
}

export async function signUp(
  username: string,
  email: string,
  password: string,
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export function userFromSession(session: Awaited<ReturnType<typeof getSession>>): AuthUser | null {
  if (!session?.user) return null;
  const u = session.user;
  return {
    id:       u.id,
    email:    u.email ?? "",
    username: (u.user_metadata as { username?: string })?.username ?? u.email ?? "User",
  };
}
