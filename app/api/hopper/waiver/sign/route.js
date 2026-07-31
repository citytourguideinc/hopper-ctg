export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req) {
  const body = await req.json();
  const { token, guest_name, guardian_name, guest_phone, guest_email } = body;
  // Accept both 'signature' (direct callers) and 'signature_data' (ctg-waiver baseline form)
  const signature = body.signature || body.signature_data || null;

  if (!token || !guest_name) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const ua = req.headers.get("user-agent") || "";

  // ── Token validation: verify token exists and is unsigned before writing ──
  const { data: existing, error: lookupErr } = await supabaseAdmin
    .from("hopper_waivers")
    .select("id, signed_at")
    .eq("token", token)
    .single();

  if (lookupErr || !existing) {
    return NextResponse.json(
      { ok: false, error: "Invalid or expired waiver link" },
      { status: 404 }
    );
  }
  if (existing.signed_at) {
    return NextResponse.json(
      { ok: false, error: "This waiver has already been signed" },
      { status: 409 }
    );
  }

  // Build update with core columns + new detail columns (added in Wave 4 migration)
  const update = {
    guest_name,
    signature_data: signature || null,
    signed_at: new Date().toISOString(),
  };
  if (guest_phone)             update.guest_phone  = guest_phone;
  // Wave 4 — store full waiver form data for later PDF reproduction
  if (body.dob)                update.dob          = body.dob;
  if (body.guest_email || body.email) update.email = body.guest_email || body.email;
  if (body.address)            update.address      = body.address;
  if (body.city)               update.city         = body.city;
  if (body.state)              update.state        = body.state;
  if (body.zip)                update.zip          = body.zip;
  if (body.waiver_type)        update.waiver_type  = body.waiver_type;
  if (body.minors !== undefined) update.minors     = body.minors || [];

  // Try adding optional columns that may or may not exist
  const { error } = await supabaseAdmin
    .from("hopper_waivers")
    .update(update)
    .eq("token", token)
    .is("signed_at", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Coverage-count completion: covered riders (1 adult + minors.length) >= guest_count
  const { data: waiver } = await supabaseAdmin
    .from("hopper_waivers").select("request_id").eq("token", token).single();

  if (waiver?.request_id) {
    const [{ data: allWaivers }, { data: reqRow }] = await Promise.all([
      supabaseAdmin
        .from("hopper_waivers")
        .select("signed_at, waiver_type, minors")
        .eq("request_id", waiver.request_id),
      supabaseAdmin
        .from("hopper_requests")
        .select("guest_count")
        .eq("id", waiver.request_id)
        .single(),
    ]);
    const guestCount = reqRow?.guest_count || 1;
    const coveredCount = (allWaivers || [])
      .filter(w => w.signed_at)
      .reduce((sum, w) => {
        const minorCount = Array.isArray(w.minors) ? w.minors.length : 0;
        return sum + 1 + minorCount;
      }, 0);
    if (coveredCount >= guestCount) {
      await supabaseAdmin.from("hopper_requests")
        .update({ status: "pending" })
        .eq("id", waiver.request_id)
        .eq("status", "pending_waivers");
    }
  }
  return NextResponse.json({ ok: true });
}