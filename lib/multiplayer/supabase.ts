import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anon);

// When keys are absent we still construct a client against a dummy URL so imports
// never crash; calls will fail and callers fall back gracefully.
export const supabase = createClient(
  url ?? "https://placeholder.supabase.co",
  anon ?? "placeholder-anon-key"
);
