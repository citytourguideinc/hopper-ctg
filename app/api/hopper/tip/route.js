export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req) {
  const { id, tipAmount } = await req.json();
  if (!id || !tipAmount || tipAmount <= 0) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const SK = process.env.STRIPE_SECRET_KEY;
  if (!SK) return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });

  // Get ride details
  const { data: ride } = await supabaseAdmin
    .from("hopper_requests")
    .select("guest_name, neighborhood, offered_price")
    .eq("id", id)
    .single();

  const origin = req.headers.get("origin") || "https://hopper.citytourguide.app";
  const amountCents = Math.round(tipAmount * 100);

  // Create Stripe Checkout session for the tip
  const params = new URLSearchParams({
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": amountCents.toString(),
    "line_items[0][price_data][product_data][name]": `Tip for your City Hopper driver`,
    "line_items[0][price_data][product_data][description]": `${ride?.neighborhood || "Tampa"} ride — Thank your driver!`,
    "line_items[0][quantity]": "1",
    "mode": "payment",
    "success_url": `${origin}/tip/${id}?tip_success=1&amount=${tipAmount}`,
    "cancel_url": `${origin}/tip/${id}`,
    "metadata[request_id]": id,
    "metadata[tip_amount]": tipAmount.toString(),
    "metadata[payment_type]": "tip",
    "metadata[guest_name]": ride?.guest_name || "",
    "submit_type": "donate",
    "payment_intent_data[description]": `City Hopper tip — ${ride?.guest_name || "Guest"}`,
  });

  const resp = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SK}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const session = await resp.json();
  if (session.error) {
    return NextResponse.json({ error: session.error.message }, { status: 400 });
  }

  // Pre-record tip in Supabase (will be confirmed by webhook)
  await supabaseAdmin.from("hopper_events").insert({
    request_id: id,
    event_type: "tip_pending",
    offered_price: tipAmount,
  });

  return NextResponse.json({ url: session.url });
}