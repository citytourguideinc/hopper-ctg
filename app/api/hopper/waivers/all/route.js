export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const date  = searchParams.get("date");
    const phone = searchParams.get("phone");
    const name  = searchParams.get("name");

    // Get all hopper_waivers with request info
    let q = supabaseAdmin
      .from("hopper_waivers")
      .select("id, token, guest_index, guest_name, guest_phone, signed_at, signature, created_at, request_id")
      .order("created_at", { ascending: false })
      .limit(500);

    if (phone) q = q.ilike("guest_phone", `%${phone}%`);
    if (name)  q = q.ilike("guest_name",  `%${name}%`);
    if (date)  q = q.gte("created_at", date + "T00:00:00").lte("created_at", date + "T23:59:59");

    const { data: waivers, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Get related request info
    const requestIds = [...new Set((waivers||[]).map(w => w.request_id).filter(Boolean))];
    let requestMap = {};
    if (requestIds.length > 0) {
      const { data: reqs } = await supabaseAdmin
        .from("hopper_requests")
        .select("id, guest_name, guest_phone, neighborhood, venue_name, offered_price, guest_count, status, created_at, scheduled_at, request_type")
        .in("id", requestIds);
      (reqs||[]).forEach(r => { requestMap[r.id] = r; });
    }

    // Cross-reference with waivers table (full waiver data) by phone
    const phones = [...new Set((waivers||[]).map(w => w.guest_phone).filter(Boolean))];
    let fullWaiverMap = {};
    if (phones.length > 0) {
      const { data: fullWaivers } = await supabaseAdmin
        .from("waivers")
        .select("id, print_name, phone, dob, address, city, state, zip, created_at, referral_source")
        .in("phone", phones)
        .order("created_at", { ascending: false });
      (fullWaivers||[]).forEach(w => {
        if (!fullWaiverMap[w.phone]) fullWaiverMap[w.phone] = w;
      });
    }

    // Merge data
    const enriched = (waivers||[]).map(w => ({
      ...w,
      neighborhood:   requestMap[w.request_id]?.neighborhood,
      venue_name:     requestMap[w.request_id]?.venue_name,
      offered_price:  requestMap[w.request_id]?.offered_price,
      guest_count:    requestMap[w.request_id]?.guest_count,
      ride_status:    requestMap[w.request_id]?.status,
      ride_created:   requestMap[w.request_id]?.created_at,
      main_guest:     requestMap[w.request_id]?.guest_name,
      full_waiver:    w.guest_phone ? fullWaiverMap[w.guest_phone] : null,
    }));

    // Group by request_id for ride view
    const byRide = {};
    enriched.forEach(w => {
      const key = w.request_id || "unknown";
      if (!byRide[key]) byRide[key] = {
        request_id: key,
        neighborhood: w.neighborhood,
        venue_name: w.venue_name,
        offered_price: w.offered_price,
        guest_count: w.guest_count,
        ride_status: w.ride_status,
        ride_created: w.ride_created,
        main_guest: w.main_guest,
        guests: []
      };
      byRide[key].guests.push(w);
    });

    // Sort guests by guest_index within each ride
    Object.values(byRide).forEach(r => r.guests.sort((a,b) => a.guest_index - b.guest_index));

    return NextResponse.json({
      waivers: enriched,
      byRide: Object.values(byRide).sort((a,b) => new Date(b.ride_created||0) - new Date(a.ride_created||0)),
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}