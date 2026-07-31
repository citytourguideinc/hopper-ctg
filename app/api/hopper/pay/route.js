export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Shared Stripe REST helper (mirrors checkout/route.js pattern)
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

// POST /api/hopper/pay
// Post-ride guest payment — existing completed request, optional tip.
// Does NOT create new hopper_requests or hopper_waivers rows.
export async function POST(req) {
  try {
    const { requestId, tipAmount, promoCode } = await req.json();

    // ── Input validation ─────────────────────────────────────────────────────
    if (!requestId) {
      return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
    }
    const tip = parseFloat(tipAmount);
    if (isNaN(tip) || tip < 0) {
      return NextResponse.json(
        { error: "Invalid tipAmount — must be a number >= 0" },
        { status: 400 }
      );
    }

    // ── Fetch existing request ───────────────────────────────────────────────
    const { data: rideReq, error: fetchErr } = await supabaseAdmin
      .from("hopper_requests")
      .select("id, status, offered_price, guest_name, guest_phone, guest_count, neighborhood, pickup_notes, dropoff_notes")
      .eq("id", requestId)
      .single();

    if (fetchErr || !rideReq) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // ── Status guard: only completed rides may pay ───────────────────────────
    if (rideReq.status !== "completed") {
      return NextResponse.json(
        { error: `Payment not available — ride status is "${rideReq.status}"` },
        { status: 409 }
      );
    }

    // ── Staging-only test code bypass (no Stripe call, no DB write) ─────────
    // Requires BOTH env vars to be set — structurally impossible on production.
    //   STAGING=true        → set only on staging Cloud Run revision
    //   TEST_PAY_CODE=...   → set only on staging Cloud Run revision
    if (promoCode) {
      const stagingCode = process.env.TEST_PAY_CODE;
      const isStaging   = process.env.STAGING === 'true';
      if (stagingCode && promoCode === stagingCode && isStaging) {
        console.log('[pay] STAGING TEST bypass — no Stripe call. request:', requestId);
        const origin = req.headers.get('origin') || 'https://staging---hopper-ctg-q2rksbyinq-ue.a.run.app';
        return NextResponse.json({ url: `${origin}/request/${requestId}?paid=1&test=1` });
      }
      // Wrong code or not staging — fall through to normal Stripe flow silently
    }
    // ── Compute amounts ──────────────────────────────────────────────────────
    const ridePrice  = parseFloat(rideReq.offered_price) || 0;
    const total      = ridePrice + tip;
    const totalCents = Math.round(total * 100);
    if (totalCents < 50) {
      return NextResponse.json(
        { error: "Total must be at least $0.50" },
        { status: 400 }
      );
    }

    // ── Build Stripe Checkout session ────────────────────────────────────────
    const origin   = req.headers.get("origin") || "https://hopper.citytourguide.app";
    const guests   = rideReq.guest_count || 1;
    const rideLine = rideReq.pickup_notes || rideReq.neighborhood || "Tampa";
    const dropLine = rideReq.dropoff_notes || "";
    const desc     = `${guests} guest${guests > 1 ? "s" : ""} · ${rideLine}${dropLine ? " → " + dropLine : ""}`;

    const session = await stripeRequest("checkout/sessions", {
      "payment_method_types[0]": "card",
      "mode":                    "payment",
      "line_items[0][price_data][currency]":                    "usd",
      "line_items[0][price_data][unit_amount]":                 String(totalCents),
      "line_items[0][price_data][product_data][name]":          `City Hopper Ride + Tip — ${rideReq.neighborhood || "Tampa"}`,
      "line_items[0][price_data][product_data][description]":   desc,
      "line_items[0][quantity]":                                "1",
      "metadata[request_id]":    requestId,
      "metadata[payment_type]":  "post_ride",   // ← webhook guard key
      "metadata[tip_amount]":    String(tip),
      "metadata[guest_name]":    rideReq.guest_name  || "",
      "metadata[guest_phone]":   rideReq.guest_phone || "",
      "metadata[neighborhood]":  rideReq.neighborhood || "",
      "success_url":             `${origin}/request/${requestId}?paid=1`,
      "cancel_url":              `${origin}/pay/${requestId}`,
    });

    if (session.error) {
      console.error("[pay] Stripe error:", session.error.message);
      return NextResponse.json({ error: session.error.message }, { status: 500 });
    }

    console.log("[pay] Stripe session created for request", requestId, "total $" + total.toFixed(2));
    return NextResponse.json({ url: session.url });

  } catch (e) {
    console.error("[pay]", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
