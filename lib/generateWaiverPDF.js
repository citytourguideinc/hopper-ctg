/**
 * generateWaiverPDF — Wave 4
 * Client-side PDF generation for signed waivers, usable from any Hopper page.
 * Ported from ctg-waiver/sign.html generateClientPDF().
 * Loads jsPDF from CDN on demand (no page-level import needed).
 *
 * @param {object} waiver  — full waiver record from view-by-token API
 * @param {string} [filename] — optional override for download filename
 */

const JSPDF_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

function loadJsPDF() {
  return new Promise((resolve, reject) => {
    if (window.jspdf) return resolve(window.jspdf);
    const s = document.createElement('script');
    s.src = JSPDF_CDN;
    s.onload = () => resolve(window.jspdf);
    s.onerror = () => reject(new Error('jsPDF CDN load failed'));
    document.head.appendChild(s);
  });
}

function fmt(v) { return v || ''; }
function fmtDob(d) {
  if (!d) return '';
  const p = d.split('-');
  if (p.length === 3) return `${parseInt(p[1])}/${parseInt(p[2])}/${p[0].slice(2)}`;
  return d;
}

export async function generateWaiverPDF(waiver, filename) {
  const { jsPDF } = await loadJsPDF();

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
  const PW = 612, PH = 792, ML = 72, MR = 540, TW = 468;

  // Use signed_at from DB (UTC → local string), fallback to now
  const signedAt = waiver.signed_at
    ? new Date(waiver.signed_at).toLocaleString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
      })
    : new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });

  const waiverId = waiver.id || waiver.token || '';
  const refId    = 'CTG-' + waiverId.slice(0, 8).toUpperCase();

  // ── Draw labeled underline field ──────────────────────────────────────────
  function drawField(label, value, x, y, lineEndX) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(60, 60, 60);
    doc.text(label, x, y);
    const lineW = lineEndX - x;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(0, 0, 0);
    if (value) {
      const maxW = lineW - 4;
      const vLines = doc.splitTextToSize(value, maxW);
      doc.text(vLines[0], x, y + 11);
    }
    doc.setLineWidth(0.5); doc.setDrawColor(0, 0, 0);
    doc.line(x, y + 14, lineEndX, y + 14);
  }

  // ── Paragraph helper ──────────────────────────────────────────────────────
  function para(text, x, y, width, fontSize, bold, italic) {
    const style = italic ? 'italic' : (bold ? 'bold' : 'normal');
    doc.setFont('helvetica', style); doc.setFontSize(fontSize || 9);
    doc.setTextColor(0, 0, 0);
    const lines = doc.splitTextToSize(text, width);
    doc.text(lines, x, y);
    return y + lines.length * (fontSize || 9) * 1.35;
  }

  // ════════════════════════════════════════════════════════════
  // PAGE 1 — ADULT WAIVER
  // ════════════════════════════════════════════════════════════
  let y = 55;

  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(0, 0, 0);
  doc.text('PARTICIPANT AGREEMENT, RELEASE AND ASSUMPTION OF RISK', PW / 2, y, { align: 'center' });
  y += 20;

  y = para('In consideration of the services of City tour guide inc, their agents, owners, officers, volunteers, personnel, and all other persons or entities acting in any capacity on their behalf (hereinafter collectively referred to as \u201cCTG\u201d), I hereby agree to release, indemnify, and discharge CTG, on behalf of myself, my spouse, my children, my parents, my heirs, assigns, personal representative and estate as follows:', ML, y, TW, 9);
  y += 8;

  const items = [
    '1.  I acknowledge that my participation in golf cart activities entails known and unanticipated risks that could result in physical or emotional injury, paralysis, death, or damage to myself, to property, or to third parties. I understand that such risks simply cannot be eliminated without jeopardizing the essential qualities of the activity.',
    '2.  I expressly agree and promise to accept and assume all of the risks existing in this activity. My participation in this activity is purely voluntary, and I elect to participate in spite of the risks. Additionally, I agree to wear my seat belt while participating in this activity.',
    '3.  I hereby voluntarily release, forever discharge, and agree to indemnify and hold harmless CTG from any and all claims, demands, or causes of action, which are in any way connected with my participation in this activity or my use of CTG\u2019s equipment or facilities, including any such claims which allege negligent acts or omissions of CTG.',
    '4.  Should CTG or anyone acting on their behalf, be required to incur attorney\u2019s fees and costs to enforce this agreement, I agree to indemnify and hold them harmless for all such fees and costs.',
    '5.  I certify that I have adequate insurance to cover any injury or damage I may cause or suffer while participating, or else I agree to bear the costs of such injury or damage myself. I further certify that I am willing to assume the risk of any medical or physical condition I may have.',
    '6.  In the event that I file a lawsuit against CTG, I agree to do so solely in the state of Florida, and I further agree that the substantive law of that state shall apply in that action without regard to the conflict of law rules of that state. I agree that if any portion of this agreement is found to be void or unenforceable, the remaining document shall remain in full force and effect.',
  ];
  items.forEach(text => {
    const lines = doc.splitTextToSize(text, TW);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(0, 0, 0);
    doc.text(lines, ML, y);
    y += lines.length * 13 + 6;
  });

  y += 4;
  const bold1 = 'BY SIGNING THIS DOCUMENT, I ACKNOWLEDGE THAT IF ANYONE IS HURT OR PROPERTY IS DAMAGED DURING MY PARTICIPATION IN THIS ACTIVITY, I MAY BE FOUND BY A COURT OF LAW TO HAVE WAIVED MY RIGHT TO MAINTAIN A LAWSUIT AGAINST CTG ON THE BASIS OF ANY CLAIM FROM WHICH I HAVE RELEASED THEM HEREIN. I ALSO AGREE THAT THIS DOCUMENT IS VALID FOR SUBSEQUENT VISITS AND PARTICIPATION AT CTG. I HAVE HAD SUFFICIENT OPPORTUNITY TO READ THIS ENTIRE DOCUMENT. I HAVE READ AND UNDERSTOOD IT, AND I AGREE TO BE BOUND BY ITS TERMS.';
  y = para(bold1, ML, y, TW, 9, true); y += 10;

  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(0, 0, 0);
  doc.text('City Tour Guide Inc. \u2014 Tampa, FL \u2014 833-813-8687 \u2014 citytourguide.app', ML, y); y += 20;

  // Signature block — uses stored field names from DB
  drawField('Print Name', fmt(waiver.guest_name), ML, y, ML + 230);
  drawField('DOB', fmtDob(waiver.dob), ML + 244, y, ML + 320);
  drawField('Phone Number', fmt(waiver.guest_phone), ML + 333, y, MR);
  y += 28;

  drawField('Address', fmt(waiver.address), ML, y, ML + 270);
  drawField('City', fmt(waiver.city), ML + 283, y, MR);
  y += 28;

  drawField('State', fmt(waiver.state), ML, y, ML + 85);
  drawField('Zip', fmt(waiver.zip), ML + 98, y, ML + 185);
  drawField('Email', fmt(waiver.email), ML + 198, y, MR);
  y += 28;

  drawField('Signature of Participant', '', ML, y, ML + 265);
  // Use DB signed_at date for the date field
  const dateStr = waiver.signed_at
    ? new Date(waiver.signed_at).toLocaleDateString('en-US')
    : new Date().toLocaleDateString('en-US');
  drawField('Date', dateStr, ML + 278, y, MR);

  if (waiver.signature_data && waiver.signature_data.startsWith('data:image')) {
    try {
      doc.addImage(waiver.signature_data, 'PNG', ML + 5, y + 2, 255, 14);
    } catch (_) {}
  }
  y += 28;

  // ════════════════════════════════════════════════════════════
  // PAGE 2 — MINOR WAIVER (only if waiver_type = adult_with_minors)
  // ════════════════════════════════════════════════════════════
  const minors = Array.isArray(waiver.minors) ? waiver.minors : [];
  if (waiver.waiver_type === 'adult_with_minors') {
    doc.addPage();
    y = 45;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(0, 0, 0);
    doc.text('City tour guide inc', PW / 2, y, { align: 'center' }); y += 14;
    doc.setFontSize(10);
    doc.text('PERPETUAL WAIVER AND RELEASE', PW / 2, y, { align: 'center' }); y += 13;
    doc.setFontSize(9);
    doc.text('(VALID FOR EACH AND EVERY DATE OF PARTICIPATION)', PW / 2, y, { align: 'center' }); y += 16;

    // Minor items
    const minorItems = [
      '1.  I recognize and agree that: all risks can never be eliminated, and participating in the activities at City tour guide inc involves inherent danger and potential risk of both minor and serious, temporary and permanent, bodily injury of any and all kinds, both caused by me and/or by others. In signing this release, I assume all risk for, and financial cost of, any and all injuries, and/or any damage, to my child/children.',
      '2.  On behalf of my minor child/children I fully, and forever waive, release and discharge City tour guide inc and its individual members, managers, directors, officers, agents, employees, volunteers, representatives, affiliated entities, and all other persons, firms, corporations, associations or partnerships claiming by or through them, from any and all claims, actions, causes of action, demands, judgments, damages (including compensatory, general, special, consequential, and exemplary), liability or obligations of any nature or kind, whether known at the time or which may arise or become known later, which accrue on account of, or in any way arise out of or in connection with me or my child\u2019s activities with or at City tour guide inc including claims involving their own negligence.',
      '3.  I agree to indemnify and hold harmless City tour guide inc and its individual managers, directors, officers, agents, employees, volunteers, representatives, affiliated entities, and all other persons, corporations, or partnerships claiming by or through them, from and against any and all losses, liabilities, claims, obligations, costs, damages, and/or judgments directly or indirectly arising out of, or relating to, my child\u2019s/children\u2019s participation in any activities at City tour guide inc, including for claims alleging City tour guide inc own negligence.',
      '4.  I understand that this agreement extends forever into the future and will have full force and legal effect each and every time my child/children visit City tour guide inc whether at the current location or any other location or facility.',
    ];
    minorItems.forEach(text => {
      const lines = doc.splitTextToSize(text, TW);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      doc.text(lines, ML, y);
      y += lines.length * 13 + 6;
    });

    y += 4;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text('NAMES AND BIRTHDATES OF ALL CHILDREN UNDER 18 to be included with your signature', ML, y);
    y += 16;

    for (let i = 0; i < 4; i++) {
      const m = minors[i] || {};
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(0, 0, 0);
      doc.text(`MINOR NAME #${i + 1}`, ML, y);
      const mnw = doc.getTextWidth(`MINOR NAME #${i + 1}`);
      doc.setFont('helvetica', 'normal');
      if (m.name) doc.text(m.name, ML + mnw + 4, y);
      doc.setLineWidth(0.5); doc.line(ML + mnw + 2, y + 3, ML + 200, y + 3);
      doc.setFont('helvetica', 'bold'); doc.text('BIRTHDATE', ML + 214, y);
      const bdw = doc.getTextWidth('BIRTHDATE');
      doc.setFont('helvetica', 'normal');
      if (m.birthdate) doc.text(m.birthdate, ML + 214 + bdw + 4, y);
      doc.line(ML + 214 + bdw + 2, y + 3, ML + 330, y + 3);
      doc.setFont('helvetica', 'bold'); doc.text('RELATION', ML + 344, y);
      const rw = doc.getTextWidth('RELATION');
      doc.setFont('helvetica', 'normal');
      if (m.relation) doc.text(m.relation, ML + 344 + rw + 4, y);
      doc.line(ML + 344 + rw + 2, y + 3, MR, y + 3);
      y += 9;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(80, 80, 80);
      doc.text('First name, Last name', ML + mnw + 4, y);
      doc.text('mm/dd/yy', ML + 214 + bdw + 4, y);
      doc.setTextColor(0, 0, 0); doc.setFontSize(9);
      y += 18;
    }
  }

  // ════════════════════════════════════════════════════════════
  // FINAL PAGE — ELECTRONIC SIGNATURE CERTIFICATION
  // ════════════════════════════════════════════════════════════
  doc.addPage();
  y = 50;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(0, 0, 0);
  doc.text('ELECTRONIC SIGNATURE CERTIFICATION', PW / 2, y, { align: 'center' }); y += 18;
  const certText = 'This document constitutes a legally binding electronic signature pursuant to the Electronic Signatures in Global and National Commerce Act (ESIGN, 15 U.S.C. \u00a77001 et seq.) and the Uniform Electronic Transactions Act (UETA). The electronic signature above has the same legal effect, validity, and enforceability as a handwritten signature.';
  y = para(certText, ML, y, TW, 8.5); y += 14;

  const certFields = [
    ['Waiver Reference ID', refId],
    ['Participant Name',    fmt(waiver.guest_name)],
    ['Date & Time Signed',  signedAt],
    ['Document Version',    'City Tour Guide Inc Participant Waiver v2.0'],
    ['Session Token (UUID)', waiverId],
  ];
  certFields.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
    doc.text(label + ':', ML, y);
    doc.setFont('helvetica', 'normal');
    const lw2 = doc.getTextWidth(label + ':');
    const vLines = doc.splitTextToSize(value, TW - lw2 - 8);
    doc.text(vLines, ML + lw2 + 6, y);
    y += vLines.length * 12 + 4;
  });

  // Footer on every page
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setTextColor(150, 150, 150); doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    doc.text(`City Tour Guide Inc  |  Waiver ID: ${refId}  |  Page ${p} of ${totalPages}`, PW / 2, PH - 20, { align: 'center' });
  }

  // Download
  const name = waiver.guest_name ? waiver.guest_name.replace(/\s+/g, '_') : 'Guest';
  const date = (waiver.signed_at || new Date().toISOString()).slice(0, 10);
  const fname = filename || `CTG_Waiver_${date}_${name}.pdf`;

  try {
    const blob = doc.output('blob');
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = fname; a.target = '_blank';
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 2000);
  } catch (_) {
    // iOS fallback
    window.open(doc.output('datauristring'), '_blank');
  }
}
