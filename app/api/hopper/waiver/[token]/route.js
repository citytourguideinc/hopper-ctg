export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req, { params }) {
  const { token } = await params;
  const { data: waiver, error } = await supabaseAdmin
    .from("hopper_waivers")
    .select("id,token,request_id,guest_index,guest_name,guest_phone,signed_at,signature_data,created_at")
    .eq("token", token).single();
  if (error || !waiver) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { data: request } = await supabaseAdmin
    .from("hopper_requests")
    .select("id,guest_name,guest_count,neighborhood,venue_name,pickup_notes,dropoff_notes,offered_price")
    .eq("id", waiver.request_id).single();
  return NextResponse.json({ waiver, request });
}

export async function POST(req, { params }) {
  const { token } = await params;
  const body = await req.json().catch(() => ({}));
  const { data: waiver, error } = await supabaseAdmin
    .from("hopper_waivers").select("*").eq("token", token).single();
  if (error || !waiver) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (waiver.signed_at) return NextResponse.json({ error: "Already signed" }, { status: 400 });
  const { error: signErr } = await supabaseAdmin.from("hopper_waivers")
    .update({ signed_at: new Date().toISOString(), guest_name: body.name || waiver.guest_name })
    .eq("token", token);
  if (signErr) return NextResponse.json({ error: signErr.message }, { status: 500 });
  const { data: allWaivers } = await supabaseAdmin.from("hopper_waivers")
    .select("signed_at").eq("request_id", waiver.request_id);
  const allSigned = allWaivers?.every(w => w.signed_at);
  if (allSigned) {
    await supabaseAdmin.from("hopper_requests").update({ status: "pending" }).eq("id", waiver.request_id);
  }
  return NextResponse.json({ ok: true, allSigned });
}