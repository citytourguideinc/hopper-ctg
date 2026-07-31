export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const CANCELABLE = new Set([
  "pending_waivers",
  "pending",
  "waivers_complete",
  "confirmed",
  "pickup_started",
]);

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const { phone } = await req.json();

    if (!id) return NextResponse.json({ error: "Missing request id" }, { status: 400 });
    if (!phone) return NextResponse.json({ error: "Missing phone" }, { status: 400 });

    // Fetch the request
    const { data: hopreq, error: fetchErr } = await supabaseAdmin
      .from("hopper_requests")
      .select("id, status, guest_phone")
      .eq("id", id)
      .single();

    if (fetchErr || !hopreq) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Identity gate: submitted phone must match guest phone on record
    const normalize = (p) => (p || "").replace(/\D/g, "");
    if (normalize(phone) !== normalize(hopreq.guest_phone)) {
      return NextResponse.json({ error: "Not authorized to cancel this request" }, { status: 403 });
    }

    // Status guard: only cancelable statuses allowed
    if (!CANCELABLE.has(hopreq.status)) {
      return NextResponse.json(
        { error: "This request cannot be canceled at its current status (" + hopreq.status + ")" },
        { status: 409 }
      );
    }

    // Write canceled status (status-only — no canceled_at column required)
    const { error: updateErr } = await supabaseAdmin
      .from("hopper_requests")
      .update({ status: "canceled" })
      .eq("id", id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Event log (fire and forget)
    supabaseAdmin
      .from("hopper_events")
      .insert({ request_id: id, event_type: "cancel" })
      .then(() => {})
      .catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
