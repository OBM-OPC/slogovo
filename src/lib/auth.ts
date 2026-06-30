import { supabase } from "./supabase";

export async function getCurrentUser(token?: string) {
  if (!token) return null;

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  return user;
}
