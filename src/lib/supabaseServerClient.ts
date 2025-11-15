import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Validasi environment variables
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Missing Supabase URL or Service Role Key in .env.local"
    );
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,  
      persistSession: false      
    }
  });
}

export const supabase = getSupabaseAdmin();