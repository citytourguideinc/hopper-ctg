export const dynamic = "force-dynamic";
import { supabaseAdmin } from "@/lib/supabase";

async function notifyDriverAllSigned(requestId) {
  try {
    // Get request details
    const { data: req } = await supabaseAdmin
      .from("hopper_requests")
      .select("guest_name, neighborhood, guest_phone, driver_phone, offered_price, guest_count")
      .eq("id", requestId)
      .single();
    if (!req) return;

    // Count total waivers vs signed waivers
    const { data: waivers } = await supabaseAdmin
      .from("hopper_waivers")
      .select("id, signed_at")
      .eq("request_id", requestId);

    if (!waivers || waivers.length === 0) return;
    const signedCount = waivers.filter(w => w.signed_at).length;
    const totalCount = waivers.length;
    if (signedCount < totalCount) return; // not all signed yet

    // All signed — update request status
    await supabaseAdmin.from("hopper_requests")
      .update({ status: "waivers_complete" })
      .eq("id", requestId);

    await supabaseAdmin.from("hopper_events").insert({
      request_id: requestId,
      event_type: "all_waivers_signed",
    });

    // Send driver notification via GHL
    const GHL_KEY = process.env.GHL_API_KEY;
    const GHL_LOC = process.env.GHL_LOCATION_ID || "pY5diwHyCzufYtay5JaC";
    const DRIVER_PHONE = process.env.DRIVER_PHONE || req.driver_phone;

    if (GHL_KEY && DRIVER_PHONE) {
      const GHL_H = {
        Authorization: "Bearer " + GHL_KEY,
        "Content-Type": "application/json",
        Version: "2021-04-15",
      };
      const msg = `✅ ALL WAIVERS SIGNED — Ready to go!\n👤 ${req.guest_name} (${req.guest_count || 1} guest${(req.guest_count||1) > 1 ? "s" : ""})\n📍 ${req.neighborhood || "Tampa"}\n💰 $${req.offered_price}\nRide ID: ${requestId.slice(0, 8).toUpperCase()}`;

      // Find or create driver contact
      const sr = await fetch(
        `https://services.leadconnectorhq.com/contacts/search?query=${encodeURIComponent(DRIVER_PHONE)}&locationId=${GHL_LOC}`,
        { headers: GHL_H }
      );
      const sd = await sr.json();
      let driverId = sd?.contacts?.[0]?.id;
      if (!driverId) {
        const cr = await fetch("https://services.leadconnectorhq.com/contacts/", {
          method: "POST", headers: GHL_H,
          body: JSON.stringify({ locationId: GHL_LOC, name: "City Hopper Driver", phone: DRIVER_PHONE }),
        });
        driverId = (await cr.json())?.contact?.id;
      }
      if (driverId) {
        await fetch("https://services.leadconnectorhq.com/conversations/messages", {
          method: "POST", headers: GHL_H,
          body: JSON.stringify({ contactId: driverId, locationId: GHL_LOC, message: msg, type: "SMS" }),
        });
        console.log("[hopper-submit] Driver notified: all waivers signed for", requestId);
      }
    } else {
      console.log("[hopper-submit] All waivers signed for", requestId, "— no driver phone to notify");
    }
  } catch (e) {
    console.error("[hopper-submit] notifyDriver error:", e.message);
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      token, waiver_type, print_name, dob, phone, email,
      address, city, state, zip, signature_data, minors,
      marketing_opt_in, referral_source, latitude, longitude,
      minor_count, signing_method, adult_phones
    } = body;

    // Log for debugging
    console.log("[hopper-submit] token:", token, "print_name:", print_name, "phone:", phone);
    if (!token) {
      return Response.json({ error: "Missing token - please use your waiver link" }, { status: 400 });
    }
    // print_name will be filled from DB if empty

    let { data: existing } = await supabaseAdmin
      .from("hopper_waivers")
      .select("id, signed_at, request_id")
      .eq("token", token)
      .single();

    // If no row found, create one on the fly (handles walk-up signers or legacy tokens)
    if (!existing) {
      const { data: newRow } = await supabaseAdmin
        .from("hopper_waivers")
        .insert({ token, guest_index: 1, guest_name: print_name, guest_phone: phone || null })
        .select("id, signed_at, request_id")
        .single();
      existing = newRow;
      if (!existing) return Response.json({ error: "Could not create waiver record" }, { status: 500 });
    }
    if (existing.signed_at) return Response.json({ success: true, waiver_id: token });

    // Use DB name as fallback if form name is empty
    const resolvedName = print_name || existing.guest_name || "Guest";

    const updateData = {
      guest_name: resolvedName,
      guest_phone: phone || null,
      signed_at: new Date().toISOString(),
      signature_data: signature_data || null,
      waiver_type: waiver_type || "adult_only",
      marketing_opt_in: marketing_opt_in ?? true,
      referral_source: referral_source || "City Hopper",
    };
    // Optional fields
    const extras = { dob, address, city, state_code: state, zip, latitude, longitude };
    Object.entries(extras).forEach(([k, v]) => { if (v) updateData[k] = v; });
    if (minors && minors.length > 0) updateData.minors_json = JSON.stringify(minors);

    const { error } = await supabaseAdmin.from("hopper_waivers").update(updateData).eq("token", token);

    if (error) {
      console.warn("[hopper-submit] Full update failed:", error.message, "- trying minimal fallback");
      const minimalUpdate = {
        signed_at: new Date().toISOString(),
        signature_data: signature_data || null,
      };
      if (resolvedName) minimalUpdate.guest_name = resolvedName;
      if (phone) minimalUpdate.guest_phone = phone;
      const { error: fbErr } = await supabaseAdmin.from("hopper_waivers")
        .update(minimalUpdate).eq("token", token);
      if (fbErr) {
        console.error("[hopper-submit] Fallback also failed:", fbErr.message);
        return Response.json({ error: "Could not save waiver: " + fbErr.message }, { status: 500 });
      }
      console.log("[hopper-submit] Fallback update succeeded for token:", token);
    } else {
      console.log("[hopper-submit] Update succeeded for token:", token);
    }

    // Check if all waivers are now signed → notify driver
    if (existing.request_id) {
      await notifyDriverAllSigned(existing.request_id);
    }

    // Mark minor waiver slots as signed by guardian
    if (minor_count > 0 && existing.request_id) {
      try {
        const { data: minorSlots } = await supabaseAdmin
          .from("hopper_waivers")
          .select("id, guest_index")
          .eq("request_id", existing.request_id)
          .is("signed_at", null)
          .neq("token", token)
          .order("guest_index", { ascending: true })
          .limit(minor_count);
        if (minorSlots?.length) {
          for (const slot of minorSlots) {
            await supabaseAdmin.from("hopper_waivers").update({
              signed_at: new Date().toISOString(),
              guest_name: "Minor (Guardian: " + (resolvedName || "Adult") + ")",
              waiver_type: "minor",
            }).eq("id", slot.id);
          }
          console.log("[hopper-submit] Marked", minorSlots.length, "minor slots as signed by guardian");
        }
      } catch(e) { console.error("[hopper-submit] minor slot error:", e.message); }
    }

    // Send SMS to adult guests if signing_method === "sms"
    if (signing_method === "sms" && adult_phones?.length > 0 && existing.request_id) {
      try {
        const { data: adultSlots } = await supabaseAdmin
          .from("hopper_waivers")
          .select("token, guest_index, guest_name")
          .eq("request_id", existing.request_id)
          .is("signed_at", null)
          .neq("token", token)
          .order("guest_index", { ascending: true });
        if (adultSlots?.length) {
          const GHL_KEY = process.env.GHL_API_KEY;
          const GHL_LOC = process.env.GHL_LOCATION_ID || "pY5diwHyCzufYtay5JaC";
          const GHL_H = { Authorization: "Bearer " + GHL_KEY, "Content-Type": "application/json", Version: "2021-04-15" };
          for (let i = 0; i < Math.min(adult_phones.length, adultSlots.length); i++) {
            const ph = adult_phones[i];
            const slot = adultSlots[i];
            if (!ph || !slot) continue;
            const wUrl = "https://hopper.citytourguide.app/waiver/" + slot.token;
            const msg  = "Hi! Please sign your City Hopper waiver (takes 60 sec): " + wUrl;
            if (GHL_KEY) {
              // Find/create contact and send SMS via GHL
              try {
                const sr = await fetch("https://services.leadconnectorhq.com/contacts/search?query=" + encodeURIComponent(ph) + "&locationId=" + GHL_LOC, { headers: GHL_H });
                const sd = await sr.json();
                let cId = sd?.contacts?.[0]?.id;
                if (!cId) {
                  const cr = await fetch("https://services.leadconnectorhq.com/contacts/", { method:"POST", headers:GHL_H, body:JSON.stringify({ locationId:GHL_LOC, phone:ph, name:"Guest " + slot.guest_index }) });
                  cId = (await cr.json())?.contact?.id;
                }
                if (cId) {
                  await fetch("https://services.leadconnectorhq.com/conversations/messages", { method:"POST", headers:GHL_H, body:JSON.stringify({ contactId:cId, locationId:GHL_LOC, message:msg, type:"SMS" }) });
                  // Update waiver slot with phone
                  await supabaseAdmin.from("hopper_waivers").update({ guest_phone: ph }).eq("id", slot.id);
                  console.log("[hopper-submit] Waiver SMS sent to", ph, "for guest", slot.guest_index);
                }
              } catch(e2) { console.error("[hopper-submit] SMS error:", e2.message); }
            }
          }
        }
      } catch(e) { console.error("[hopper-submit] adult SMS error:", e.message); }
    }

    // Find next unsigned waiver (re-verify current token IS now signed to prevent loop)
    let nextWaiver = null;
    if (existing.request_id) {
      // Small delay to ensure write is committed
      await new Promise(r => setTimeout(r, 200));
      // Verify current waiver is now signed
      const { data: selfCheck } = await supabaseAdmin
        .from("hopper_waivers").select("signed_at").eq("token", token).single();
      console.log("[hopper-submit] Self-check signed_at:", selfCheck?.signed_at);

      const { data: remaining } = await supabaseAdmin
        .from("hopper_waivers")
        .select("token, guest_index, guest_name")
        .eq("request_id", existing.request_id)
        .is("signed_at", null)
        .neq("token", token)
        .order("guest_index", { ascending: true })
        .limit(1);
      if (remaining?.[0]) {
        nextWaiver = {
          token: remaining[0].token,
          guest_index: remaining[0].guest_index,
          guest_name: remaining[0].guest_name,
          url: `https://hopper.citytourguide.app/waiver/${remaining[0].token}`,
        };
      }
    }

    return Response.json({ success: true, waiver_id: token, next_waiver: nextWaiver, request_id: existing.request_id });
  } catch (e) {
    console.error("[hopper-submit]", e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
}