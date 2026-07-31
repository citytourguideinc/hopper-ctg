export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Haversine distance in metres
function haversineM(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET() {
  try {
    // ── Fetch driver location from FollowMee ────────────────────────────────
    const key      = process.env.FOLLOWMEE_API_KEY;
    const username = process.env.FOLLOWMEE_USERNAME;
    const deviceid = process.env.FOLLOWMEE_DEVICE_ID;

    if (!key || !username || !deviceid) {
      return NextResponse.json({ error: 'not configured' }, { status: 503 });
    }

    const fmUrl = `https://www.followmee.com/api/tracks.aspx?key=${key}&username=${encodeURIComponent(username)}&output=json&function=currentfordevice&deviceid=${deviceid}`;
    const fmRes = await fetch(fmUrl, { cache: 'no-store' });
    const fmData = await fmRes.json();

    const track = fmData?.Data?.[0];
    if (!track) {
      return NextResponse.json({ available: false });
    }

    const lat = parseFloat(track.Latitude);
    const lng = parseFloat(track.Longitude);

    // ── Geo-fence: find nearest active location_info stop ──────────────────
    const { data: locationRows } = await supabaseAdmin
      .from('hopper_content')
      .select('id, stop_name, lat, lng, radius_m, title, body, cta_text, cta_url, image_url')
      .eq('content_type', 'location_info')
      .eq('active', true);

    let nearestStop = null;
    let nearestDist = Infinity;

    for (const row of (locationRows || [])) {
      const dist = haversineM(lat, lng, parseFloat(row.lat), parseFloat(row.lng));
      if (dist <= row.radius_m && dist < nearestDist) {
        nearestDist = dist;
        nearestStop = row;
      }
    }

    // ── Fallback: random CTG house content ─────────────────────────────────
    let content = null;
    if (nearestStop) {
      content = {
        stop_name: nearestStop.stop_name,
        title:     nearestStop.title,
        body:      nearestStop.body,
        cta_text:  nearestStop.cta_text,
        cta_url:   nearestStop.cta_url,
        image_url: nearestStop.image_url || null,
      };
    } else {
      const { data: ctgRows } = await supabaseAdmin
        .from('hopper_content')
        .select('stop_name, title, body, cta_text, cta_url, image_url')
        .eq('content_type', 'ctg')
        .eq('active', true);

      if (ctgRows && ctgRows.length > 0) {
        const pick = ctgRows[Math.floor(Math.random() * ctgRows.length)];
        content = {
          stop_name: pick.stop_name,
          title:     pick.title,
          body:      pick.body,
          cta_text:  pick.cta_text,
          cta_url:   pick.cta_url,
          image_url: pick.image_url || null,
        };
      }
    }

    return NextResponse.json({
      available:  true,
      lat,
      lng,
      updated_at: track.Date,
      content,
    });
  } catch (e) {
    return NextResponse.json({ available: false });
  }
}
