export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req) {
  try {
    const { type, scheduledAt, neighborhood, venue, dropoffNeighborhood, dropoffLandmark,
            name, phone, guests, adults: adultsRaw, children: childrenRaw,
            pickupNotes, dropoffNotes, price } = await req.json();

    if (!name || !phone || !neighborhood) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let guestId = null;
    try {
      const { data: g } = await supabaseAdmin
        .from("karaoke_ride_guests")
        .upsert({ phone, name }, { onConflict: "phone" })
        .select("id")
        .single();
      guestId = g?.id || null;
    } catch {}

    const dropoffFull = [dropoffNeighborhood, dropoffLandmark].filter(Boolean).join(" - ");

    let dutyDriverPhone = null;
    if (!type || type === 'ondemand') {
      try {
        const { data: duty } = await supabaseAdmin
          .from('karaoke_ride_duty')
          .select('is_on_duty, driver_phone')
          .eq('id', 1)
          .single();

        if (!duty?.is_on_duty) {
          return NextResponse.json(
            { error: 'Karaoke Rides is not live right now. Please schedule a future ride.' },
            { status: 409 }
          );
        }
        dutyDriverPhone = duty?.driver_phone || null;
      } catch {}
    } else {
      try {
        const { data: duty } = await supabaseAdmin
          .from('karaoke_ride_duty')
          .select('driver_phone')
          .eq('id', 1)
          .single();
        dutyDriverPhone = duty?.driver_phone || null;
      } catch {}
    }

    const hasBreakdown = adultsRaw != null;
    const adults = hasBreakdown ? Math.min(Math.max(Number(adultsRaw) || 1, 1), 8) : null;
    const children = hasBreakdown ? Math.min(Math.max(Number(childrenRaw) || 0, 0), 8) : null;
    const total = hasBreakdown ? adults + children : Math.min(Number(guests) || 1, 8);
    const count = total;
    const waiverSlots = hasBreakdown ? adults : count;

    if (count > 5) {
      return NextResponse.json({ error: 'Maximum 5 guests per ride' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("karaoke_ride_requests")
      .insert({
        request_type: type,
        scheduled_at: scheduledAt || null,
        neighborhood,
        venue_name: venue || null,
        guest_id: guestId,
        guest_name: name,
        guest_phone: phone,
        guest_count: count,
        adults,
        children,
        pickup_notes: pickupNotes || venue || null,
        dropoff_notes: dropoffFull || dropoffNotes || null,
        offered_price: Number(price) || 15,
        status: "pending_waivers"
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const waiverRows = Array.from({ length: waiverSlots }, (_, i) => ({
      request_id: data.id,
      guest_index: i + 1,
      guest_name: i === 0 ? name : null,
      guest_phone: i === 0 ? phone : null
    }));

    const { data: waivers } = await supabaseAdmin
      .from("karaoke_ride_waivers")
      .insert(waiverRows)
      .select("id,token,guest_index,guest_name");

    const waiverSkipped = false;

    supabaseAdmin
      .from("karaoke_ride_events")
      .insert({
        request_id: data.id,
        guest_id: guestId,
        event_type: "request",
        neighborhood,
        offered_price: Number(price) || 15
      })
      .then(() => {})
      .catch(() => {});

    try {
      const adultStr = adults != null ? `${adults} adults` : `${count} adults`;
      const childStr = children != null && children > 0 ? ` ${children} children` : '';
      const rideOn = [neighborhood, pickupNotes || venue].filter(Boolean).join(' - ');
      const rideOff = dropoffFull || dropoffNotes || '';
      const fullMsg = `New Karaoke Ride Request\nGuest: ${name}\nGuests: ${adultStr}${childStr} (${count} total)\nPickup: ${rideOn}\nDestination: ${rideOff}\nOffer: $${Number(price) || 15}/person`;
      const driverUrl = process.env.NEXT_PUBLIC_DRIVER_URL || 'https://staging.citytourguide.app/karaoke-rides/driver';
      const shortMsg = `New Karaoke Ride Request - ${name}, ${count} guest${count === 1 ? '' : 's'}\n${driverUrl}`;

      const { data: newThread } = await supabaseAdmin
        .from('message_threads')
        .insert({
          session_type: 'karaoke_ride',
          karaoke_ride_request_id: data.id,
          guest_name: name,
          guest_phone: phone,
          status: 'active',
          matched_by: 'request_id',
          last_message_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (newThread?.id) {
        await supabaseAdmin
          .from('karaoke_ride_messages')
          .insert({
            thread_id: newThread.id,
            request_id: data.id,
            guest_phone: phone,
            direction: 'outbound',
            sender: 'system',
            body: fullMsg,
            delivery_status: 'sent',
          });
      }

      const GHL_KEY = process.env.GHL_API_KEY;
      if (GHL_KEY) {
        const GHL_LOC = process.env.GHL_LOCATION_ID || 'pY5diwHyCzufYtay5JaC';
        const GHL_H = {
          'Authorization': 'Bearer ' + GHL_KEY,
          'Content-Type': 'application/json',
          'Version': '2021-04-15'
        };

        const sendSMS = async (toPhone, contactName, body) => {
          if (!toPhone) return;
          try {
            const sr = await fetch(
              'https://services.leadconnectorhq.com/contacts/?locationId=' + GHL_LOC + '&query=' + encodeURIComponent(toPhone),
              { headers: GHL_H }
            );
            const sd = await sr.json();
            let cId = sd?.contacts?.[0]?.id;

            if (!cId) {
              const cr = await fetch('https://services.leadconnectorhq.com/contacts/', {
                method: 'POST',
                headers: GHL_H,
                body: JSON.stringify({ locationId: GHL_LOC, phone: toPhone, name: contactName })
              });
              cId = (await cr.json())?.contact?.id;
            }

            if (cId) {
              await fetch('https://services.leadconnectorhq.com/conversations/messages', {
                method: 'POST',
                headers: GHL_H,
                body: JSON.stringify({
                  type: 'SMS',
                  contactId: cId,
                  locationId: GHL_LOC,
                  message: body
                })
              });
            }
          } catch (smsOneErr) {
            console.error('[karaoke-ride SMS] ' + contactName + ':', smsOneErr.message);
          }
        };

        if (dutyDriverPhone) {
          await sendSMS(dutyDriverPhone, 'CTG Karaoke Ride Driver', shortMsg);
        } else {
          console.warn('[karaoke-ride SMS] No driver_phone in karaoke_ride_duty - skipping driver SMS');
        }

        await sendSMS('+18338138687', 'CTG Ops', shortMsg);
      }
    } catch (notifyErr) {
      console.error('[karaoke-ride notify] Error:', notifyErr.message);
    }

    return NextResponse.json({
      id: data.id,
      waivers: waivers || [],
      waiver_skipped: waiverSkipped
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
