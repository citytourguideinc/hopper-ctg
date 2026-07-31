export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import crypto from "crypto";

function verifyStripeSignature(payload, sigHeader, secret) {
  try {
    const parts = {};
    sigHeader.split(",").forEach(p => { const [k,v] = p.split("="); parts[k] = v; });
    const timestamp = parts.t;
    const signature = parts.v1;
    if (!timestamp || !signature) return false;
    const signedPayload = `${timestamp}.${payload}`;
    const expected = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
  } catch { return false; }
}

export async function POST(req) {
  try {
    const body = await req.text();
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    
    // Verify Stripe signature if secret is configured
    if (secret) {
      const sigHeader = req.headers.get("stripe-signature") || "";
      if (!verifyStripeSignature(body, sigHeader, secret)) {
        console.error("[webhook] Invalid Stripe signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    }

    let event;
    try { event = JSON.parse(body); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

    if (event.type === "checkout.session.completed") {
      const session = event.data?.object;
      const requestId = session?.metadata?.request_id;
      const guests = parseInt(session?.metadata?.guests || "1");
      const name = session?.metadata?.guest_name;
      const phone = session?.metadata?.guest_phone;
      const neighborhood = session?.metadata?.neighborhood;
      const paymentType  = session?.metadata?.payment_type;  // used to guard post_ride

      // post_ride payments (guest pays after ride completion) must not create
      // new hopper_requests or hopper_waivers rows — they are handled separately.
      if (requestId && paymentType !== "post_ride") {
        const guestContactsRaw = session?.metadata?.guest_contacts || "[]";
        let guestContactsList = [];
        try { guestContactsList = JSON.parse(guestContactsRaw); } catch {}

        await supabaseAdmin.from("hopper_requests").update({
          status: "pending_waivers",
          stripe_session_id: session.id,
          paid_at: new Date().toISOString(),
        }).eq("id", requestId);

        const waiverRows = Array.from({ length: guests }, (_, i) => {
          const gc = i > 0 ? guestContactsList[i-1] : null;
          return {
            request_id: requestId,
            token: crypto.randomUUID(),
            guest_index: i + 1,
            guest_name: i === 0 ? name : (gc?.name || null),
            guest_phone: i === 0 ? phone : (gc?.type === "phone" ? gc.contact : null),
            guest_email: i === 0 ? null : (gc?.type === "email" ? gc.contact : null),
            contact_type: i === 0 ? "phone" : (gc?.type || null),
          };
        });

        const { data: waivers } = await supabaseAdmin.from("hopper_waivers").insert(waiverRows).select();

        // Send waiver links via GHL SMS
        if (waivers && waivers.length > 0) {
          const WAIVER_BASE = "https://waiver.citytourguide.app/sign";
          const GHL_KEY = process.env.GHL_API_KEY;
          const GHL_LOC = process.env.GHL_LOCATION_ID || "pY5diwHyCzufYtay5JaC";
          if (GHL_KEY) {
            const GHL_H = { "Authorization": "Bearer "+GHL_KEY, "Content-Type": "application/json", "Version": "2021-04-15" };
            for (const w of waivers) {
              const wUrl = `${WAIVER_BASE}/${w.token}`;
              const gLabel = w.guest_index === 1 ? name : `Guest ${w.guest_index}`;
              const msg = `Hi ${gLabel}! Sign your City Hopper waiver here (60 sec): ${wUrl}`;
              const contact = w.guest_phone || w.guest_email;
              if (!contact) continue;
              try {
                const sr = await fetch(`https://services.leadconnectorhq.com/contacts/search?query=${encodeURIComponent(contact)}&locationId=${GHL_LOC}`, { headers: GHL_H });
                const sd = await sr.json();
                let cId = sd?.contacts?.[0]?.id;
                if (!cId) {
                  const body = { locationId: GHL_LOC, name: gLabel };
                  if (w.guest_phone) body.phone = w.guest_phone; else body.email = w.guest_email;
                  const cr = await fetch("https://services.leadconnectorhq.com/contacts/", { method: "POST", headers: GHL_H, body: JSON.stringify(body) });
                  cId = (await cr.json())?.contact?.id;
                }
                if (cId) {
                  const msgBody = { contactId: cId, locationId: GHL_LOC, message: msg, type: w.guest_phone ? "SMS" : "Email" };
                  if (!w.guest_phone) { msgBody.subject = "City Hopper - Sign Your Waiver"; }
                  await fetch("https://services.leadconnectorhq.com/conversations/messages", { method: "POST", headers: GHL_H, body: JSON.stringify(msgBody) });
                  console.log("[GHL] Waiver link sent guest", w.guest_index, "via", msgBody.type);
                }
              } catch(e) { console.error("[GHL] SMS error guest", w.guest_index, e.message); }
            }
          }
        }

        await supabaseAdmin.from("hopper_events").insert({
          request_id: requestId,
          event_type: "paid",
          neighborhood,
          offered_price: (session.amount_total || 0) / 100,
        });

        console.log(`[webhook] Ride ${requestId} paid. ${guests} waiver(s) created.`);
      }
    }
    // Handle tip payment
    if (event.type === "checkout.session.completed" && event.data?.object?.metadata?.payment_type === "tip") {
      const session = event.data.object;
      const requestId = session?.metadata?.request_id;
      const tipAmount = parseFloat(session?.metadata?.tip_amount || "0");
      if (requestId && tipAmount > 0) {
        await supabaseAdmin.from("hopper_requests").update({ tip_amount: tipAmount }).eq("id", requestId);
        await supabaseAdmin.from("hopper_events").insert({
          request_id: requestId,
          event_type: "tip_paid",
          offered_price: tipAmount,
        });
        console.log(`[webhook] Tip ${tipAmount} confirmed for ride ${requestId}`);
      }
    }

    // Handle post-ride payment (guest pays after ride is completed)
    // Logs a hopper_event only — does NOT create new waivers or requests.
    if (event.type === "checkout.session.completed" && event.data?.object?.metadata?.payment_type === "post_ride") {
      const session    = event.data.object;
      const requestId  = session?.metadata?.request_id;
      const tipAmount  = parseFloat(session?.metadata?.tip_amount  || "0");
      const totalPaid  = (session.amount_total || 0) / 100;
      if (requestId) {
        await supabaseAdmin.from("hopper_events").insert({
          request_id:  requestId,
          event_type:  "post_ride_paid",
          offered_price: totalPaid,
        });
        if (tipAmount > 0) {
          await supabaseAdmin.from("hopper_requests")
            .update({ tip_amount: tipAmount })
            .eq("id", requestId);
        }
        console.log(`[webhook] Post-ride payment ${totalPaid} confirmed for ${requestId}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("[webhook] Error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}