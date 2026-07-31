export const dynamic = "force-dynamic";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req, { params }) {
  const { token } = await params; // Next.js 15: params is a Promise
  try {
    const { data, error } = await supabaseAdmin
      .from("hopper_waivers")
      .select("request_id, guest_name, guest_phone, guest_index, signed_at")
      .eq("token", token)
      .single();

    if (error || !data) return Response.json({ error: "Not found" }, { status: 404 });
    if (data.signed_at) return Response.json({ error: "Already signed" });

    // Count total waivers for this request to know total_guests
    let total_guests = 1;
    if (data.request_id) {
      const { count } = await supabaseAdmin
        .from("hopper_waivers")
        .select("id", { count: "exact", head: true })
        .eq("request_id", data.request_id);
      if (count) total_guests = count;
    }

    return Response.json({
      request_id:  data.request_id,
      guest_name:  data.guest_name  || null,
      guest_phone: data.guest_phone || null,
      guest_index: data.guest_index || 1,
      total_guests,
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}