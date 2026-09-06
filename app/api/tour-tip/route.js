export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

const ALLOWED_TOUR_GUIDES = ["Michele Frasure"];

export async function POST(req) {
  try {
    const body = await req.json();
    const tipAmount = Number(body.tipAmount);
    const guestName = String(body.guestName || "").trim().slice(0, 100);
    const tourGuide = String(body.tourGuide || "").trim().slice(0, 100);
    const tourDateTime = String(body.tourDateTime || "").trim().slice(0, 40);

    if (!Number.isFinite(tipAmount) || tipAmount < 1) {
      return NextResponse.json({ error: "Gratuity must be at least $1.00" }, { status: 400 });
    }
    if (!ALLOWED_TOUR_GUIDES.includes(tourGuide)) {
      return NextResponse.json({ error: "Please select your tour guide" }, { status: 400 });
    }
    if (!tourDateTime) {
      return NextResponse.json({ error: "Tour date and time are required" }, { status: 400 });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    const origin = req.headers.get("origin") || "https://tip.citytourguide.app";
    const amountCents = Math.round(tipAmount * 100);

    const params = new URLSearchParams({
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": amountCents.toString(),
      "line_items[0][price_data][product_data][name]": `Gratuity for ${tourGuide}`,
      "line_items[0][price_data][product_data][description]": "City Tour Guide tour gratuity",
      "line_items[0][quantity]": "1",
      mode: "payment",
      success_url: `${origin}/tour-tip?tip_success=1`,
      cancel_url: `${origin}/tour-tip`,
      "metadata[payment_type]": "tour_gratuity",
      "metadata[guest_name]": guestName,
      "metadata[tour_guide]": tourGuide,
      "metadata[tour_date_time]": tourDateTime,
      "payment_intent_data[description]": `Tour gratuity for ${tourGuide}${guestName ? ` - Guest ${guestName}` : ""} - Tour ${tourDateTime}`,
    });

    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const session = await stripeResponse.json();
    if (!stripeResponse.ok || session.error || !session.url) {
      return NextResponse.json({ error: session.error?.message || "Could not create secure payment" }, { status: 400 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[tour-tip]", error);
    return NextResponse.json({ error: "Could not create gratuity payment" }, { status: 500 });
  }
}
