export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const name    = searchParams.get("name")  || "Test Guest";
  const phone   = searchParams.get("phone") || "+18135550001";
  const guests  = Math.min(parseInt(searchParams.get("guests") || "1"), 5);
  const secret  = searchParams.get("secret");

  if (secret !== "ctgtest2026") {
    return NextResponse.json({ error: "Add ?secret=ctgtest2026 to use this endpoint" }, { status: 401 });
  }

  try {
    // Create a test request
    const { data: request, error: reqErr } = await supabaseAdmin
      .from("hopper_requests")
      .insert({
        request_type: "on_demand",
        neighborhood: "Test - Ybor City",
        guest_name: name,
        guest_phone: phone,
        guest_count: guests,
        offered_price: 15,
        status: "pending_waivers",
        pickup_notes: "Test booking - do not dispatch",
      })
      .select("id")
      .single();

    if (reqErr) return NextResponse.json({ error: reqErr.message }, { status: 500 });

    // Create waiver rows with tokens
    const waiverRows = Array.from({ length: guests }, (_, i) => ({
      request_id: request.id,
      token: crypto.randomUUID(),
      guest_index: i + 1,
      guest_name: i === 0 ? name : `Guest ${i + 1}`,
      guest_phone: i === 0 ? phone : null,
    }));

    const { data: waivers } = await supabaseAdmin
      .from("hopper_waivers")
      .insert(waiverRows)
      .select("token, guest_index, guest_name");

    if (!waivers?.length) return NextResponse.json({ error: "Failed to create waiver records" }, { status: 500 });

    const base = "https://waiver.citytourguide.app/sign";
    const links = waivers.map(w => ({
      guest: w.guest_name,
      index: w.guest_index,
      url: `${base}/${w.token}`,
    }));

    // Redirect main guest to their waiver directly
    const mainToken = waivers[0].token;
    return NextResponse.redirect(`${base}/${mainToken}`);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}