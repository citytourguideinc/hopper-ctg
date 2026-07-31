export const dynamic = 'force-dynamic';
import { supabaseAdmin } from '@/lib/supabase';

const DRIVER_PIN = process.env.DRIVER_PIN;

// Verbatim agreed-to waiver text from ctg-waiver/sign.html (generateClientPDF, Page 1)
const WAIVER_TEXT = `PARTICIPANT AGREEMENT, RELEASE AND ASSUMPTION OF RISK

In consideration of the services of City Tour Guide Inc., their agents, owners, officers, volunteers, personnel, and all other persons or entities acting in any capacity on their behalf (hereinafter collectively referred to as "CTG"), I hereby agree to release, indemnify, and discharge CTG, on behalf of myself, my spouse, my children, my parents, my heirs, assigns, personal representative and estate as follows:

1.  I acknowledge that my participation in golf cart activities entails known and unanticipated risks that could result in physical or emotional injury, paralysis, death, or damage to myself, to property, or to third parties. I understand that such risks simply cannot be eliminated without jeopardizing the essential qualities of the activity.

The risks include, among other things: slip & falls; collision with fixed objects or people; exposure to the elements could cause sunburn, dehydration, heat exhaustion, heat stroke, and heat cramps; equipment failure or operator error; accidents involving other vehicles; falls from the cart; the negligence of other operators of vehicles or myself; transmissible pathogen or disease; weather conditions; my own physical condition; contact with animals or insects; all of which could result in musculoskeletal or other injuries including head, neck, and back injuries.

2.  I expressly agree and promise to accept and assume all of the risks existing in this activity. My participation in this activity is purely voluntary, and I elect to participate in spite of the risks. Additionally, I agree to wear my seat belt while participating in this activity.

3.  I hereby voluntarily release, forever discharge, and agree to indemnify and hold harmless CTG from any and all claims, demands, or causes of action, which are in any way connected with my participation in this activity or my use of CTG's equipment or facilities, including any such claims which allege negligent acts or omissions of CTG.

4.  Should CTG or anyone acting on their behalf, be required to incur attorney's fees and costs to enforce this agreement, I agree to indemnify and hold them harmless for all such fees and costs.

5.  I certify that I have adequate insurance to cover any injury or damage I may cause or suffer while participating, or else I agree to bear the costs of such injury or damage myself. I further certify that I am willing to assume the risk of any medical or physical condition I may have.

6.  In the event that I file a lawsuit against CTG, I agree to do so solely in the state of Florida, and I further agree that the substantive law of that state shall apply in that action without regard to the conflict of law rules of that state. I agree that if any portion of this agreement is found to be void or unenforceable, the remaining document shall remain in full force and effect.

BY SIGNING THIS DOCUMENT, I ACKNOWLEDGE THAT IF ANYONE IS HURT OR PROPERTY IS DAMAGED DURING MY PARTICIPATION IN THIS ACTIVITY, I MAY BE FOUND BY A COURT OF LAW TO HAVE WAIVED MY RIGHT TO MAINTAIN A LAWSUIT AGAINST CTG ON THE BASIS OF ANY CLAIM FROM WHICH I HAVE RELEASED THEM HEREIN. I ALSO AGREE THAT THIS DOCUMENT IS VALID FOR SUBSEQUENT VISITS AND PARTICIPATION AT CTG. I HAVE HAD SUFFICIENT OPPORTUNITY TO READ THIS ENTIRE DOCUMENT. I HAVE READ AND UNDERSTOOD IT, AND I AGREE TO BE BOUND BY ITS TERMS.

City Tour Guide Inc. â€” Tampa, FL â€” 833-813-8687 â€” citytourguide.app`;

function escapeHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildHtml(w, ride) {
  const shortId  = 'CTG-' + w.id.slice(0, 8).toUpperCase();
  const signedAt = w.signed_at
    ? new Date(w.signed_at).toLocaleString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
      })
    : 'Unknown';

  const rideInfo = ride ? `
    <div class="section-label">Ride Details</div>
    <div class="field-row">
      <span class="field-label">Pickup</span>
      <span class="field-value">${escapeHtml([ride.neighborhood, ride.venue_name].filter(Boolean).join(' â€” ') || 'â€”')}</span>
    </div>
    ${ride.dropoff_notes ? `<div class="field-row"><span class="field-label">Dropoff</span><span class="field-value">${escapeHtml(ride.dropoff_notes)}</span></div>` : ''}
    ${ride.guest_count ? `<div class="field-row"><span class="field-label">Party Size</span><span class="field-value">${ride.guest_count} guest${ride.guest_count > 1 ? 's' : ''}</span></div>` : ''}
  ` : '';

  const sigBlock = w.signature_data
    ? `<div class="sig-wrap"><img src="${w.signature_data}" alt="Signature" class="sig-img" /></div>`
    : w.signature
      ? `<div class="sig-text">${escapeHtml(w.signature)}</div>`
      : '<div class="sig-none">No signature image on file</div>';

  const waiverLines = WAIVER_TEXT
    .split('\n')
    .map(l => escapeHtml(l) || '&nbsp;')
    .join('<br>');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Signed Waiver â€” ${escapeHtml(w.guest_name || 'Guest')} â€” CTG</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',Arial,sans-serif;background:#F3F4F6;min-height:100vh;padding:24px 16px 48px}
    .page{max-width:640px;margin:0 auto}
    .header{background:linear-gradient(135deg,#0B1D3A,#1E3A5F);color:#fff;border-radius:14px;padding:18px 20px;margin-bottom:20px;display:flex;align-items:center;gap:14px}
    .header-icon{font-size:1.6rem}
    .header-sub{font-size:0.58rem;color:rgba(255,255,255,0.45);font-weight:700;letter-spacing:0.18em;text-transform:uppercase}
    .header-title{font-weight:800;font-size:0.98rem;margin-top:2px}
    .badge{display:inline-flex;align-items:center;gap:6px;background:#D1FAE5;color:#065F46;font-weight:700;font-size:0.75rem;padding:5px 14px;border-radius:20px;margin-bottom:16px}
    .card{background:#fff;border:1.5px solid #E5E7EB;border-radius:14px;padding:20px;margin-bottom:16px}
    .section-label{font-size:0.65rem;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #F3F4F6}
    .field-row{display:flex;gap:12px;margin-bottom:10px;align-items:flex-start}
    .field-label{font-size:0.7rem;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.05em;min-width:80px;padding-top:2px}
    .field-value{font-size:0.88rem;font-weight:600;color:#0B1D3A;flex:1}
    .waiver-box{font-size:0.75rem;color:#374151;line-height:1.8;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;padding:16px;max-height:280px;overflow-y:auto;margin-top:12px}
    .sig-wrap{background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;padding:10px;text-align:center;margin-top:12px}
    .sig-img{max-height:72px;max-width:100%}
    .sig-text{font-style:italic;font-size:1.1rem;color:#0B1D3A;padding:12px 0;border-bottom:1px solid #E5E7EB;margin-top:12px}
    .sig-none{color:#9CA3AF;font-size:0.8rem;padding:12px 0;margin-top:12px}
    .print-btn{display:block;width:100%;margin-top:20px;padding:14px;background:linear-gradient(135deg,#0057E7,#0095FF);color:#fff;border:none;border-radius:12px;font-size:0.92rem;font-weight:800;cursor:pointer;font-family:inherit;box-shadow:0 4px 16px rgba(0,87,231,0.3)}
    .footer{text-align:center;font-size:0.68rem;color:#9CA3AF;margin-top:20px;line-height:1.8}
    @media print{
      body{background:#fff;padding:12px}
      .no-print{display:none!important}
      .card{border-color:#ccc;box-shadow:none}
      .header{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .waiver-box{max-height:none;overflow:visible}
    }
  </style>
  <script>window.onload=function(){window.print();};<\/script>
</head>
<body>
  <div class="page">

    <div class="header no-print">
      <div class="header-icon">ðŸ›º</div>
      <div>
        <div class="header-sub">Tampa Â· City Hopper</div>
        <div class="header-title">Signed Liability Waiver</div>
      </div>
    </div>

    <div class="badge">âœ… Waiver Signed</div>

    <div class="card">
      <div class="section-label">Passenger &amp; Signature</div>
      <div class="field-row">
        <span class="field-label">Name</span>
        <span class="field-value">${escapeHtml(w.guest_name || 'Unknown')}</span>
      </div>
      ${w.guest_phone ? `<div class="field-row"><span class="field-label">Phone</span><span class="field-value">${escapeHtml(w.guest_phone)}</span></div>` : ''}
      <div class="field-row">
        <span class="field-label">Waiver ID</span>
        <span class="field-value" style="font-size:0.75rem;color:#6B7280">${escapeHtml(shortId)}</span>
      </div>
      <div class="field-row">
        <span class="field-label">Signed At</span>
        <span class="field-value">${escapeHtml(signedAt)}</span>
      </div>
      ${w.ip_address ? `<div class="field-row"><span class="field-label">IP</span><span class="field-value" style="font-size:0.75rem;color:#6B7280">${escapeHtml(w.ip_address)}</span></div>` : ''}
      ${sigBlock}
    </div>

    ${ride ? `<div class="card">${rideInfo}</div>` : ''}

    <div class="card">
      <div class="section-label">Waiver Text Agreed To</div>
      <div class="waiver-box">${waiverLines}</div>
    </div>

    <div class="card">
      <div class="section-label">Electronic Signature Certification</div>
      <p style="font-size:0.75rem;color:#374151;line-height:1.75;margin-bottom:16px">This document constitutes a legally binding electronic signature pursuant to the Electronic Signatures in Global and National Commerce Act (ESIGN, 15 U.S.C. &sect;7001 <em>et seq.</em>) and the Uniform Electronic Transactions Act (UETA). The electronic signature above has the same legal effect, validity, and enforceability as a handwritten signature.</p>
      <div class="field-row"><span class="field-label">Waiver ID</span><span class="field-value" style="font-size:0.75rem;color:#6B7280">${escapeHtml(shortId)}</span></div>
      <div class="field-row"><span class="field-label">Participant</span><span class="field-value">${escapeHtml(w.guest_name || 'Unknown')}</span></div>
      <div class="field-row"><span class="field-label">Date Signed</span><span class="field-value">${escapeHtml(signedAt)}</span></div>
      <div class="field-row"><span class="field-label">Document</span><span class="field-value">City Tour Guide Inc. Participant Waiver v2.0</span></div>
      <div class="field-row"><span class="field-label">Token UUID</span><span class="field-value" style="font-size:0.7rem;color:#6B7280">${escapeHtml(w.id)}</span></div>
      ${w.ip_address ? `<div class="field-row"><span class="field-label">Signed From</span><span class="field-value" style="font-size:0.75rem;color:#6B7280">${escapeHtml(w.ip_address)}</span></div>` : ''}
    </div>

    <button class="print-btn no-print" onclick="window.print()">ðŸ“„ Download / Print Signed Waiver</button>

    <div class="footer no-print">
      City Tour Guide Inc. Â· Tampa, FL Â· 833-813-8687 Â· citytourguide.app<br>
      This document is for internal driver and operational use.
    </div>

  </div>
</body>
</html>`;
}

export async function GET(req, { params }) {
  const { id } = await params;
  const url    = new URL(req.url);
  const pin    = req.headers.get('x-driver-pin');

  const acceptJson = (req.headers.get('accept') || '').includes('application/json');

  if (pin !== DRIVER_PIN) {
    if (acceptJson) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    return new Response('<h2>Unauthorized</h2>', { status: 401, headers: { 'Content-Type': 'text/html' } });
  }

  // Wave 4: select all detail columns added by schema migration
  const { data: w, error } = await supabaseAdmin
    .from('hopper_waivers')
    .select('*, hopper_requests(neighborhood, venue_name, dropoff_notes, guest_count)')
    .eq('id', id)
    .single();

  if (error || !w) {
    if (acceptJson) return Response.json({ error: 'Waiver not found' }, { status: 404 });
    return new Response('<h2>Waiver not found</h2>', { status: 404, headers: { 'Content-Type': 'text/html' } });
  }

  if (!w.signed_at) {
    if (acceptJson) return Response.json({ error: 'This waiver has not been signed yet.' }, { status: 404 });
    return new Response('<h2>This waiver has not been signed yet.</h2>', { status: 404, headers: { 'Content-Type': 'text/html' } });
  }

  // â”€â”€ JSON mode: used by driver dashboard client-side PDF download â”€â”€
  if (acceptJson) {
    const ride = w.hopper_requests || null;
    return Response.json({
      id:             w.id,
      token:          w.token,
      guest_name:     w.guest_name,
      guest_phone:    w.guest_phone,
      signed_at:      w.signed_at,
      signature_data: w.signature_data,
      dob:            w.dob         || null,
      email:          w.email       || null,
      address:        w.address     || null,
      city:           w.city        || null,
      state:          w.state       || null,
      zip:            w.zip         || null,
      waiver_type:    w.waiver_type || 'adult_only',
      minors:         w.minors      || [],
      ride,
    });
  }

  // â”€â”€ HTML fallback: direct browser navigation / print â”€â”€
  const ride = w.hopper_requests || null;
  const html = buildHtml(w, ride);
  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}


