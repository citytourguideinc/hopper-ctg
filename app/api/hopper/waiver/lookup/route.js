export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("hopper_waivers")
    .select("token, request_id, guest_name, guest_phone, guest_index, signed_at")
    .eq("token", token)
    .single();

  if (error || !data) return NextResponse.json({ error: "Waiver not found" }, { status: 404 });

  // Also get neighborhood from the request
  let neighborhood = null;
  if (data.request_id) {
    const { data: req2 } = await supabaseAdmin
      .from("hopper_requests")
      .select("neighborhood")
      .eq("id", data.request_id)
      .single();
    if (req2) neighborhood = req2.neighborhood;
  }

  return NextResponse.json({ ...data, neighborhood });
}
