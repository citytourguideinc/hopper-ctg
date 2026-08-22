export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

async function stripeRequest(endpoint, body) {
  const sk = process.env.STRIPE_SECRET_KEY;
  if (!sk) throw new Error("STRIPE_SECRET_KEY not configured");
  const res = await fetch(`https://api.stripe.com/v1/${endpoint}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${sk}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body).toString(),
  });
  return res.json();
}

export async function POST(req) {
  try {
    const { requestId, tipAmount, promoCode } = await req.json();
    if (!requestId) return NextResponse.json({ error: "Missing requestId" }, { status: 400 });

    const tip = parseFloat(tipAmount);
    if (isNaN(tip) || tip < 0) {
      return NextResponse.json({ error: "Invalid tipAmount - must be a number >= 0" }, { status: 400 });
    }

    const { data: rideReq, error: fetchErr } = await supabaseAdmin
      .from("karaoke_ride_requests")
      .select("id, status, offered_price, guest_name, guest_phone, guest_count, neighborhood, pickup_notes, dropoff_notes")
      .eq("id", requestId)
      .single();

    if (fetchErr || !rideReq) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    if (rideReq.status !== "completed") {
      return NextResponse.json({ error: `Payment not available - ride status is "${rideReq.status}"` }, { status: 409 });
    }

    if (promoCode) {
      const stagingCode = process.env.TEST_PAY_CODE;
      const isStaging = process.env.STAGING === 'true';
      if (stagingCode && promoCode === stagingCode && isStaging) {
        const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        return NextResponse.json({ url: `${origin}/request/${requestId}?paid=1&test=1` });
      }
    }

    const ridePrice = parseFloat(rideReq.offered_price) || 0;
    const total = ridePrice + tip;
    const totalCents = Math.round(total * 100);
    if (totalCents < 50) return NextResponse.json({ error: "Total must be at least $0.50" }, { status: 400 });

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "https://citytourguide.app";
    const guests = rideReq.guest_count || 1;
    const rideLine = rideReq.pickup_notes || rideReq.neighborhood || "Tampa";
    const dropLine = rideReq.dropoff_notes || "";
    const desc = `${guests} guest${guests > 1 ? "s" : ""} - ${rideLine}${dropLine ? " to " + dropLine : ""}`;

    const session = await stripeRequest("checkout/sessions", {
      "payment_method_types[0]": "card",
      "mode": "payment",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(totalCents),
      "line_items[0][price_data][product_data][name]": `Karaoke Ride + Tip - ${rideReq.neighborhood || "Tampa"}`,
      "line_items[0][price_data][product_data][description]": desc,
      "line_items[0][quantity]": "1",
      "metadata[request_id]": requestId,
      "metadata[payment_type]": "post_ride",
      "metadata[service]": "karaoke_ride",
      "metadata[tip_amount]": String(tip),
      "metadata[guest_name]": rideReq.guest_name || "",
      "metadata[guest_phone]": rideReq.guest_phone || "",
      "metadata[neighborhood]": rideReq.neighborhood || "",
      "success_url": `${origin}/request/${requestId}?paid=1`,
      "cancel_url": `${origin}/pay/${requestId}`,
    });

    if (session.error) return NextResponse.json({ error: session.error.message }, { status: 500 });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
