export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req) {
  const secret = new URL(req.url).searchParams.get("secret");
  if (secret !== "setup2026ctg") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Use Supabase Management API to run raw SQL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  // Extract project ref from URL: https://xxxx.supabase.co -> xxxx
  const projectRef  = supabaseUrl.replace("https://", "").split(".")[0];

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${serviceKey}`,
    "apikey": serviceKey,
  };

  const migrations = [
    // hopper_requests columns
    "ALTER TABLE hopper_requests ADD COLUMN IF NOT EXISTS eta_minutes int DEFAULT 15",
    "ALTER TABLE hopper_requests ADD COLUMN IF NOT EXISTS decline_reason text",
    "ALTER TABLE hopper_requests ADD COLUMN IF NOT EXISTS stripe_session_id text",
    "ALTER TABLE hopper_requests ADD COLUMN IF NOT EXISTS paid_at timestamptz",
    "ALTER TABLE hopper_requests ADD COLUMN IF NOT EXISTS driver_phone text",
    "ALTER TABLE hopper_requests ADD COLUMN IF NOT EXISTS started_at timestamptz",
    "ALTER TABLE hopper_requests ADD COLUMN IF NOT EXISTS completed_at timestamptz",
    // hopper_waivers columns
    "ALTER TABLE hopper_waivers ADD COLUMN IF NOT EXISTS waiver_type text DEFAULT 'adult_only'",
    "ALTER TABLE hopper_waivers ADD COLUMN IF NOT EXISTS marketing_opt_in boolean DEFAULT true",
    "ALTER TABLE hopper_waivers ADD COLUMN IF NOT EXISTS referral_source text",
    "ALTER TABLE hopper_waivers ADD COLUMN IF NOT EXISTS dob date",
    "ALTER TABLE hopper_waivers ADD COLUMN IF NOT EXISTS address text",
    "ALTER TABLE hopper_waivers ADD COLUMN IF NOT EXISTS city text",
    "ALTER TABLE hopper_waivers ADD COLUMN IF NOT EXISTS state_code text",
    "ALTER TABLE hopper_waivers ADD COLUMN IF NOT EXISTS zip text",
    "ALTER TABLE hopper_waivers ADD COLUMN IF NOT EXISTS contact_type text",
    "ALTER TABLE hopper_waivers ADD COLUMN IF NOT EXISTS minors_json text",
  ];

  const results = [];
  for (const sql of migrations) {
    try {
      // Use Supabase's pg REST endpoint
      const res = await fetch(
        `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
        { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${serviceKey}` },
          body: JSON.stringify({ query: sql }) }
      );
      const text = await res.text();
      results.push({ sql: sql.slice(0, 55), status: res.status, ok: res.ok, msg: text.slice(0, 80) });
    } catch (e) {
      results.push({ sql: sql.slice(0, 55), error: e.message });
    }
  }

  // Also verify tables exist via supabaseAdmin
  const checks = {};
  try {
    const { count: rc } = await supabaseAdmin.from("hopper_requests").select("*", { count: "exact", head: true });
    checks.hopper_requests = rc ?? "exists";
  } catch (e) { checks.hopper_requests = "ERROR: " + e.message; }
  try {
    const { count: wc } = await supabaseAdmin.from("hopper_waivers").select("*", { count: "exact", head: true });
    checks.hopper_waivers = wc ?? "exists";
  } catch (e) { checks.hopper_waivers = "ERROR: " + e.message; }

  return NextResponse.json({ done: true, table_counts: checks, migrations: results });
}