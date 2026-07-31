// check_hopper_content.cjs
// Usage: $env:SUPABASE_SERVICE_ROLE_KEY = "your-new-rotated-key"
//        node check_hopper_content.cjs
// No secret is ever printed to stdout or stderr.

'use strict';

async function main() {
  const { createClient } = await import('@supabase/supabase-js');

  const SUPABASE_URL = 'https://idxviqopiywzxbmuwtrz.supabase.co';
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SERVICE_KEY) {
    console.error('ERROR: $env:SUPABASE_SERVICE_ROLE_KEY is not set.');
    console.error('Set it to your NEW rotated key and re-run.');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false }
  });

  // Check 1: table exists
  const { data, error, count } = await supabase
    .from('hopper_content')
    .select('id, content_type', { count: 'exact' });

  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') {
      console.log('CHECK 1. hopper_content table exists: FAIL (table not found)');
    } else {
      console.log(`CHECK 1. hopper_content table exists: FAIL (error ${error.code}: ${error.message})`);
    }
    process.exit(1);
  }

  const total    = count ?? data?.length ?? 0;
  const locCount = (data || []).filter(r => r.content_type === 'location_info').length;
  const ctgCount = (data || []).filter(r => r.content_type === 'ctg').length;

  console.log('CHECK 1. hopper_content table exists:  PASS');
  console.log(`CHECK 2. Row count: ${total} (location_info: ${locCount}, ctg: ${ctgCount})`);
  console.log(`         Expected:  30 total (25 location_info + 5 ctg)`);
  console.log(`         Match: ${total === 30 ? 'PASS' : total === 0 ? 'EMPTY — run create_hopper_content.cjs to seed' : 'PARTIAL'}`);

  // Check 3: if empty, confirm cjs can seed
  if (total === 0) {
    console.log('');
    console.log('CHECK 3. Rows = 0. To seed:');
    console.log('         $env:SUPABASE_SERVICE_ROLE_KEY = "your-new-key"');
    console.log('         node create_hopper_content.cjs');
    console.log('         (No secret is printed during seeding.)');
  }

  // Check 8: if rows exist, simulate geo near Armature Works (lat=27.9590, lng=-82.4648)
  if (total > 0) {
    console.log('');
    console.log('CHECK 8. Geo-content near "Armature Works" (lat=27.9590, lng=-82.4648, r=150m):');
    const R = 6371000;
    const toRad = d => d * Math.PI / 180;
    const driverLat = 27.9590, driverLng = -82.4648;
    const locationRows = (data || []).filter(r => r.content_type === 'location_info');

    // We need title/body/lat/lng/radius_m for the geo check — re-fetch with full fields
    const { data: fullRows } = await supabase
      .from('hopper_content')
      .select('stop_name, lat, lng, radius_m, title, content_type')
      .eq('content_type', 'location_info')
      .eq('active', true);

    let nearest = null, nearestDist = Infinity;
    for (const row of (fullRows || [])) {
      const dLat = toRad(parseFloat(row.lat) - driverLat);
      const dLng = toRad(parseFloat(row.lng) - driverLng);
      const a = Math.sin(dLat/2)**2 + Math.cos(toRad(driverLat))*Math.cos(toRad(parseFloat(row.lat)))*Math.sin(dLng/2)**2;
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      if (dist <= row.radius_m && dist < nearestDist) {
        nearestDist = dist;
        nearest = row;
      }
    }

    if (nearest) {
      console.log(`         PASS — matched stop: "${nearest.stop_name}" at ${nearestDist.toFixed(1)}m`);
      console.log(`         title: ${nearest.title}`);
    } else {
      console.log('         No location_info stop within radius of test point.');
      console.log('         CTG fallback would apply (check ctg rows exist).');
      const ctgRows = (data || []).filter(r => r.content_type === 'ctg');
      console.log(`         CTG rows available: ${ctgRows.length} ${ctgRows.length > 0 ? '— fallback PASS' : '— fallback FAIL'}`);
    }
  }
}

main().catch(e => {
  // Never print the full error which might include env vars
  console.error('Script error:', e.message || 'unknown');
  process.exit(1);
});
