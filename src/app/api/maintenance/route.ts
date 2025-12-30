import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { status } = await request.json();

    // Pastikan Service Role Key ada
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Server misconfiguration: Missing Service Role Key" }, { status: 500 });
    }

    // Gunakan Service Role Key agar bisa bypass aturan RLS (Privilege Admin)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabaseAdmin
      .from('app_settings')
      .upsert({ key: 'maintenance_mode', value: status });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Maintenance API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}