export const dynamic = "force-dynamic";
import { supabaseAdmin } from "@/lib/supabase";

const TEST_ALIAS = "test-token";
const TEST_UUID = "00000000-0000-4000-8000-000000000001";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    if (body.token !== TEST_ALIAS && body.token !== TEST_UUID) {
      return Response.json({ error: "Not allowed" }, { status: 403 });
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("hopper_waivers")
      .select("id, token, request_id, signed_at")
      .eq("token", TEST_UUID)
      .maybeSingle();

    if (existingError) {
      console.error("[staging-seed-waiver] lookup failed", existingError.message);
      return Response.json({ error: existingError.message }, { status: 500 });
    }

    if (existing) {
      if (existing.signed_at) {
        const { error: resetError } = await supabaseAdmin
          .from("hopper_waivers")
          .update({ signed_at: null, signature_data: null })
          .eq("id", existing.id);
        if (resetError) return Response.json({ error: resetError.message }, { status: 500 });
      }
      return Response.json({ success: true, token: TEST_UUID, request_id: existing.request_id, reused: true });
    }

    const rideDate = body.ride_date || new Date().toISOString().slice(0, 10);
    const startTime = body.start_time || "12:00";
    const scheduledAt = `${rideDate}T${startTime}:00-04:00`;

    const { data: requestRow, error: requestError } = await supabaseAdmin
      .from("hopper_requests")
      .insert({
        request_type: "scheduled",
        scheduled_at: scheduledAt,
        neighborhood: "STAGING TEST",
        guest_name: body.print_name || "Staging Test",
        guest_phone: body.phone || "0000000000",
        guest_count: 1,
        adults: 1,
        children: 0,
        offered_price: 0,
        status: "pending_waivers"
      })
      .select("id")
      .single();

    if (requestError || !requestRow?.id) {
      console.error("[staging-seed-waiver] request insert failed", requestError?.message);
      return Response.json({ error: requestError?.message || "Could not create staging request" }, { status: 500 });
    }

    const { data: waiverRow, error: waiverError } = await supabaseAdmin
      .from("hopper_waivers")
      .insert({
        request_id: requestRow.id,
        token: TEST_UUID,
        guest_index: 1,
        guest_name: body.print_name || "Staging Test",
        guest_phone: body.phone || null
      })
      .select("id, token, request_id")
      .single();

    if (waiverError || !waiverRow) {
      console.error("[staging-seed-waiver] waiver insert failed", waiverError?.message);
      await supabaseAdmin.from("hopper_requests").delete().eq("id", requestRow.id);
      return Response.json({ error: waiverError?.message || "Could not create staging waiver" }, { status: 500 });
    }

    return Response.json({ success: true, token: TEST_UUID, request_id: requestRow.id, reused: false });
  } catch (error) {
    console.error("[staging-seed-waiver]", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
