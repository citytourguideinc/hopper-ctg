export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

async function stripeRequest(endpoint, body) {
  const sk = process.env.STRIPE_SECRET_KEY;
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
    const { name, phone, guests, neighborhood, venue, pickupNotes, dropoffNotes, type, scheduledAt, price, guestContacts } = await req.json();
    if (!name || !phone || !neighborhood || !price) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const priceInCents = Math.round(parseFloat(price) * 100);
    if (isNaN(priceInCents) || priceInCents < 100) {
      return NextResponse.json({ error: "Invalid price â€” minimum $1.00" }, { status: 400 });
    }

    // Pre-create ride request in Supabase
    const { data: guest } = await supabaseAdmin.from("hopper_guests")
      .upsert({ phone, name }, { onConflict: "phone" }).select().single();

    const { data: rideRequest, error: reqError } = await supabaseAdmin.from("hopper_requests").insert({
      request_type: type || "now",
      scheduled_at: scheduledAt || null,
      neighborhood, venue_name: venue || null,
      guest_id: guest?.id || null,
      guest_name: name,
      guest_contacts: guestContacts ? JSON.stringify(guestContacts) : "[]", guest_phone: phone,
      guest_count: guests || 1,
      pickup_notes: pickupNotes || null,
      dropoff_notes: dropoffNotes || null,
      pickup_landmark: pickupNotes || null,
      dropoff_landmark: dropoffNotes || null,
      offered_price: price,
      status: "pending_payment",
    }).select().single();

    if (reqError) return NextResponse.json({ error: reqError.message }, { status: 500 });

    // Create Stripe Checkout Session via REST API
    const origin = req.headers.get("origin") || "https://hopper.citytourguide.app";
    const session = await stripeRequest("checkout/sessions", {
      "payment_method_types[0]": "card",
      "mode": "payment",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(priceInCents),
      "line_items[0][price_data][product_data][name]": `City Hopper Ride â€“ ${neighborhood}`,
      "line_items[0][price_data][product_data][description]": `${guests} guest${guests > 1 ? "s" : ""} Â· ${type === "scheduled" ? "Scheduled" : "On-demand"}${venue ? " Â· " + venue : ""}`,
      "line_items[0][quantity]": "1",
      "metadata[request_id]": rideRequest.id,
      "metadata[guest_name]": name,
      "metadata[guest_phone]": phone,
      "metadata[neighborhood]": neighborhood,
      "metadata[guests]": String(guests),
      "success_url": `${origin}/ride-confirmed?session_id={CHECKOUT_SESSION_ID}&request_id=${rideRequest.id}`,
      "cancel_url": `${origin}/?cancelled=1`,
    });

    if (session.error) return NextResponse.json({ error: session.error.message }, { status: 500 });
    return NextResponse.json({ url: session.url, requestId: rideRequest.id });
  } catch (e) {
    console.error("[checkout]", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
