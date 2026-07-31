export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req) {
  try {
    const { type, scheduledAt, neighborhood, venue, dropoffNeighborhood, dropoffLandmark,
            name, phone, guests, adults: adultsRaw, children: childrenRaw,
            pickupNotes, dropoffNotes, price } = await req.json();
    if (!name || !phone || !neighborhood) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    let guestId = null;
    try {
      const { data: g } = await supabaseAdmin.from("hopper_guests").upsert({ phone, name }, { onConflict: "phone" }).select("id").single();
      guestId = g?.id || null;
    } catch {}

    const dropoffFull = [dropoffNeighborhood, dropoffLandmark].filter(Boolean).join(" - ");

    // Wave H: block on-demand requests when driver is Off Duty.
    // Also fetch driver_phone here for downstream SMS notification.
    let dutyDriverPhone = null;
    if (!type || type === 'ondemand') {
      try {
        const { data: duty } = await supabaseAdmin
          .from('hopper_duty').select('is_on_duty, driver_phone').eq('id', 1).single();
        if (!duty?.is_on_duty) {
          return NextResponse.json(
            { error: 'City Hopper is not live right now. Please schedule a future hop.' },
            { status: 409 }
          );
        }
        dutyDriverPhone = duty?.driver_phone || null;
      } catch { /* if duty check fails, allow through — fail open */ }
    } else {
      // Scheduled request: still try to grab driver phone for SMS, but don't gate on duty
      try {
        const { data: duty } = await supabaseAdmin
          .from('hopper_duty').select('driver_phone').eq('id', 1).single();
        dutyDriverPhone = duty?.driver_phone || null;
      } catch {}
    }

    // CP3: adults+children breakdown. Falls back to legacy guests field.
    const hasBreakdown = adultsRaw != null;
    const adults   = hasBreakdown ? Math.min(Math.max(Number(adultsRaw)||1, 1), 8) : null;
    const children = hasBreakdown ? Math.min(Math.max(Number(childrenRaw)||0, 0), 8) : null;
    const total    = hasBreakdown ? adults + children : Math.min(Number(guests)||1, 8);
    const count    = total; // total for capacity; waiver slots = adults only
    const waiverSlots = hasBreakdown ? adults : count;

    // CP3-V: hard cap — maximum 5 guests per ride
    if (count > 5) return NextResponse.json({ error: 'Maximum 5 guests per ride' }, { status: 400 });

    const { data, error } = await supabaseAdmin.from("hopper_requests").insert({
      request_type: type, scheduled_at: scheduledAt||null,
      neighborhood, venue_name: venue||null,
      guest_id: guestId, guest_name: name, guest_phone: phone,
      guest_count: count,
      adults:   adults,
      children: children,
      pickup_notes: pickupNotes||venue||null,
      dropoff_notes: dropoffFull||dropoffNotes||null,
      offered_price: Number(price)||15,
      status: "pending_waivers"
    }).select("id").single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const waiverRows = Array.from({ length: waiverSlots }, (_,i) => ({
      request_id: data.id,
      guest_index: i+1,
      guest_name: i===0 ? name : null,
      guest_phone: i===0 ? phone : null
    }));
    const { data: waivers } = await supabaseAdmin.from("hopper_waivers").insert(waiverRows).select("id,token,guest_index,guest_name");

    // Waiver bypass disabled for first rollout — all guests sign via waiver.citytourguide.app.
    // signed_at and signature_data are written only by the waiver signing submit flow.
    const waiverSkipped = false;

    // Fire and forget event log
    supabaseAdmin.from("hopper_events").insert({ request_id:data.id, guest_id:guestId, event_type:"request", neighborhood, offered_price:Number(price)||15 }).then(()=>{}).catch(()=>{});

    // ─────────────────────────────────────────────────────────
    // New request notification: driver SMS + ops SMS + in-session message
    // Fire and forget; any failure logs but never fails the guest request.
    // ─────────────────────────────────────────────────────────
    try {
      // Compose message bodies
      const adultStr = adults != null ? `${adults} adults` : `${count} adults`;
      const childStr = children != null && children > 0 ? ` ${children} children` : '';
      const hopOn    = [neighborhood, pickupNotes||venue].filter(Boolean).join(' - ');
      const hopOff   = dropoffFull || dropoffNotes || '';
      const fullMsg  = `🛺 New Hop Request\nGuest: ${name}\nGuests: ${adultStr}${childStr} (${count} total)\nHop On: ${hopOn}\nHop Off: ${hopOff}\nOffer: $${Number(price)||15}/person`;
      const shortMsg = `🛺 New Hop Request — ${name}, ${count} guest${count===1?'':'s'}\nhopper.citytourguide.app/driver`;

      // (1) In-session message: create thread + insert system message
      const { data: newThread } = await supabaseAdmin.from('message_threads').insert({
        session_type: 'hopper',
        hopper_request_id: data.id,
        guest_name: name,
        guest_phone: phone,
        status: 'active',
        matched_by: 'request_id',
        last_message_at: new Date().toISOString(),
      }).select('id').single();

      if (newThread?.id) {
        await supabaseAdmin.from('hopper_messages').insert({
          thread_id: newThread.id,
          request_id: data.id,
          guest_phone: phone,
          direction: 'outbound',
          sender: 'system',
          body: fullMsg,
          delivery_status: 'sent',
        });
      }

      // (2) + (3) SMS sends to driver-on-duty and CTG ops line
      const GHL_KEY = process.env.GHL_API_KEY;
      if (GHL_KEY) {
        const GHL_LOC = process.env.GHL_LOCATION_ID || 'pY5diwHyCzufYtay5JaC';
        const GHL_H   = { 'Authorization': 'Bearer '+GHL_KEY, 'Content-Type': 'application/json', 'Version': '2021-04-15' };

        const sendSMS = async (toPhone, contactName, body) => {
          if (!toPhone) return;
          try {
            // Find or create GHL contact
            const sr = await fetch('https://services.leadconnectorhq.com/contacts/?locationId='+GHL_LOC+'&query='+encodeURIComponent(toPhone),{headers:GHL_H});
            const sd = await sr.json();
            let cId = sd?.contacts?.[0]?.id;
            if (!cId) {
              const cr = await fetch('https://services.leadconnectorhq.com/contacts/',{method:'POST',headers:GHL_H,body:JSON.stringify({locationId:GHL_LOC,phone:toPhone,name:contactName})});
              cId = (await cr.json())?.contact?.id;
            }
            if (cId) {
              await fetch('https://services.leadconnectorhq.com/conversations/messages',{method:'POST',headers:GHL_H,body:JSON.stringify({type:'SMS',contactId:cId,locationId:GHL_LOC,message:body})});
            }
          } catch(smsOneErr) { console.error('[new-request SMS] '+contactName+':', smsOneErr.message); }
        };

        // (2) Driver SMS — from hopper_duty.driver_phone (the on-duty driver)
        if (dutyDriverPhone) {
          await sendSMS(dutyDriverPhone, 'CTG Driver', shortMsg);
        } else {
          console.warn('[new-request SMS] No driver_phone in hopper_duty — skipping driver SMS');
        }

        // (3) CTG ops SMS — hardcoded ops line
        await sendSMS('+18338138687', 'CTG Ops', shortMsg);
      }
    } catch(notifyErr) { console.error('[new-request notify] Error:', notifyErr.message); }

    return NextResponse.json({ id: data.id, waivers: waivers||[], waiver_skipped: waiverSkipped });

  } catch(e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
