# CTG Sections Registry & Design Reference

Version 2.0 — June 11, 2026
City Tour Guide Inc.

---

## CRITICAL RULES BEFORE ANY DEPLOY

- Run `node verify_sections.cjs` — all checks must pass
- Deploy to staging with `--no-traffic`
- Test on phone — landing, status, driver, request form
- Screenshot and compare to design system
- Only then promote to production

**After every session:** Update this file and verify_sections.cjs
**After every production promotion:** Tag revision in Cloud Run as `golden-[date]`

---

## SHARED COMPONENT STATUS

| Component | Currently | Should Be | Priority |
|---|---|---|---|
| Bottom Nav | Inline in page.js + statuspage | app/components/BottomNav.js | HIGH |
| TEXT US Button | Inline in page.js only | app/components/TextUsButton.js | HIGH |
| Reviews Section | Inline in page.js only | app/components/Reviews.js | HIGH |
| Map Block | Inline in 3 pages | app/components/MapBlock.js | HIGH |
| Status Pill | Inline in 3 pages | app/components/StatusPill.js | HIGH |
| Geo Content Card | Inline in 2 pages | app/components/GeoCard.js | MEDIUM |
| Driver Card | Inline in 2 pages | app/components/DriverCard.js | MEDIUM |
| CTG Logo | Inline in 3 pages | app/components/CTGLogo.js | MEDIUM |

**Rule:** When a section appears on more than one page, it must become a shared component.
One update = all pages update simultaneously.

---

## APPROVED COLOR TOKENS

```
NAVY:           #0B1D3A   — dark bg, CTA bg, headers, plate bg
NEON_GREEN:     #00FF88   — CTA text/border on navy, status text, live indicators bg
ACCENT_GREEN:   #4ADE80   — nav active, step bar, driver photo border, geo card border
CTA_GREEN:      #00C27C   — solid green button bg (geo card CTA, send button)
GOLD_REVIEW:    #D4940A   — review star color
REVIEW_BTN:     #FFB900   — Write a Review / Rate Your Experience button bg
BLUE:           #0066FF   — Download Waiver, payment, compliance
BLUE_GRADIENT:  linear-gradient(135deg,#0057E7,#0095FF) — TEXT US button
PURPLE:         #7C3AED   — cityTOURS
RED:            #EF4444   — citySOCIAL, danger, HOP OFF
CYAN:           #06B6D4   — cityCONNECT
GOLD_CITY:      #F59E0B   — City+
WHITE:          #ffffff   — text on dark, card bg
GRAY_500:       #6B7280   — inactive nav, secondary text
MINT_BG:        #D1FAE5   — Assigned pill bg
MINT_BORDER:    #6EE7B7   — Assigned pill border
```

**BANNED COLORS — never use:**
```
#059669  #00B761  #16A34A  #22C55E  (wrong greens)
#00FF88 on white/light bg — only on #0B1D3A dark navy
```

---

## APPROVED COPY

| Context | Text |
|---|---|
| Identity tagline | "City experiences. On demand." |
| Main booking CTA | "Request a Hop Now" |
| Footer CTA | "Book Your City Hop" |
| Tours CTA | "See Guided Tours" |
| Review CTA | "⭐ Rate Your Experience" |
| Driver complete | "Complete Tour" |
| Driver start | "Begin Tour" |
| Status: confirmed | "Guide On The Way!" |
| Status: ride_active | "Tour In Progress!" |
| Status: completed | "Tour Complete!" |
| Map footer | "Your guide is nearby · updates every minute" |

**BANNED COPY:**
- "golf cart" in guest-facing copy
- "fleet"
- "Ride In Progress" (use Tour)
- "Complete Ride" (use Tour)
- "Party Size" (use Guests)

---

## SECTION REGISTRY

### LANDING PAGE — app/page.js

| ID | Section | Key Verify String | Notes |
|---|---|---|---|
| LP-001 | TEXT US button | linear-gradient(135deg,#0057E7,#0095FF) | Blue gradient pill, top right |
| LP-003 | Identity card tagline | City experiences. On demand. | Vehicle-agnostic copy |
| LP-004 | Live status pill | cityFUNHOP is Live | #00FF88 bg on dark |
| LP-005 | Map footer strip | color:"#00FF88",fontSize:"0.74rem",fontWeight:700 | Dark navy bg |
| LP-006 | Geo content card | borderLeft | 4px solid #4ADE80 |
| LP-007 | Request a Hop Now | background:"#0B1D3A",color:"#00FF88" | Navy/neon style |
| LP-008 | Neighbourhood stops | Harbour Island | Ybor, Downtown, Harbour Island |
| LP-013 | Reviews | GYG_REVIEWS | Static array + live fetch |
| LP-014 | Review button | background:"#FFB900" | Gold/amber button |
| LP-015 | Footer CTA | Book Your City Hop | Navy/neon style |
| LP-016 | Bottom nav | cityCONNECT | 6 items: cityGUIDE/cityTOURS/cityFUNHOP/citySOCIAL/cityCONNECT/City+ |

### REQUEST/[ID] PAGE — app/request/[id]/page.js

| ID | Section | Key Verify String | Notes |
|---|---|---|---|
| RQ-001 | Dark header | #0B1D3A | ← Home, Hop Request |
| RQ-002 | Status pill | driver-profile.png + "1.5px solid #00FF88" | Photo + dark navy + green border |
| RQ-004 | Geo card | driverContent | Live from driver-location API |
| RQ-005 | Driver card | /cart.png + 31DNMF + Michele Frasure | cart.png NOT vehicle.png |
| RQ-006 | Offer card | HOP ON + HOP OFF | Green/red labels |
| RQ-008 | Download waiver | #0066FF | Blue compliance button |
| RQ-009 | Bottom nav | cityCONNECT | 6 items |

### STATUS PAGE — app/request/statuspage/page.js

| ID | Section | Key Verify String | Notes |
|---|---|---|---|
| SP-001 | Dark header | #0B1D3A | ← Home, Hop Request |
| SP-002 | Status pill | driver-profile.png + #00FF88 | Photo + dark navy + green |
| SP-003 | Step bar | Request Sent + Riding | 7 steps total |
| SP-004 | Map footer | #00FF88 | Dark navy bg strip |
| SP-005 | Geo card | borderLeft | 4px solid #4ADE80 |
| SP-007 | Driver card | /cart.png + driver-profile.png | cart.png contain/white bg |
| SP-008 | GuestChat | Message Your Driver | SMS panel, collapsible |
| SP-009 | Bottom nav | cityCONNECT | 6 items |

### DRIVER DASHBOARD — app/driver/page.js

| ID | Section | Key Verify String | Notes |
|---|---|---|---|
| DR-001 | Dark header | #0B1D3A | CTG logo, Driver Dashboard |
| DR-002 | Driver info card | Michele Frasure + 31DNMF + driver-profile.png + Bintelli Beyond | Added this session |
| DR-003 | Duty toggle | On Duty | Green when on, yellow when off |
| DR-004 | Request tabs | Requests | Requests/Active/Done |
| DR-007 | SMS panels | sendBusinessSmsMessage | Panel per request |
| DR-008 | Bottom nav | ctg-bottom-nav | 6 items |

### BOOKING FORM — app/request/page.js

| ID | Section | Key Verify String | Notes |
|---|---|---|---|
| BF-001 | Step bar | Timing | 5 steps |
| BF-002 | Neighbourhood picker | Harbour Island | Grid of neighbourhood buttons |
| BF-003 | Selected neighbourhood | background:selected===n?'#0B1D3A' | Navy/neon when selected |
| BF-004 | Continue button | background:canNext?'#0B1D3A' | Navy/neon when active, gray when not |

### SMS ROUTES

| ID | File | Key Verify String |
|---|---|---|
| SMS-001 | api/sms/thread/[id]/route.js | hopper_messages |
| SMS-002 | api/sms/reply/route.js | sendGHL |
| SMS-003 | api/sms/inbound/route.js | matchHopper |
| SMS-004 | api/hopper/guest-message/route.js | message_threads |

### CORE API ROUTES

| ID | File | Key Verify String |
|---|---|---|
| API-001 | api/hopper/duty-status/route.js | is_on_duty |
| API-002 | api/hopper/driver-location/route.js | lat |
| API-003 | api/hopper/ops/route.js | confirmed |

---

## QUICK REBUILD STYLES

### Primary CTA (Request a Hop Now, Book Your City Hop)
```jsx
background:"#0B1D3A", color:"#00FF88", border:"1.5px solid #00FF88",
borderRadius:12, padding:"13px 20px", fontWeight:900,
boxShadow:"0 0 12px rgba(0,255,136,0.2)", width:"100%", display:"block"
```

### Status Pill (active ride)
```jsx
display:"inline-flex", alignItems:"center", gap:8,
background:"#0B1D3A", border:"1.5px solid #00FF88", borderRadius:999,
padding:"5px 16px 5px 5px", boxShadow:"0 0 12px rgba(0,255,136,0.3)"
// Left: <img src="/driver-profile.png" width=28 height=28 borderRadius="50%" border="1.5px solid #00FF88" objectFit="cover" />
// Text: color:"#00FF88", fontWeight:700
```

### Live Status Pill (cityFUNHOP is Live)
```jsx
display:"inline-flex", alignItems:"center", gap:8,
background:"#00FF88", color:"#0B1D3A", fontWeight:900,
padding:"6px 16px 6px 10px", borderRadius:999,
boxShadow:"0 0 12px rgba(0,255,136,0.3)"
// Left dot: background:"#0B1D3A", borderRadius:"50%"
```

### License Plate Badge (31DNMF)
```jsx
background:"#0B1D3A", color:"#00FF88", border:"1.5px solid #00FF88",
borderRadius:8, padding:"4px 12px", fontWeight:900,
fontFamily:"monospace", letterSpacing:"0.1em"
```

### Map Block (all 3 pages)
```jsx
// Container
borderRadius:16, overflow:"hidden", border:"2px solid #1a1a2e",
boxShadow:"0 2px 12px rgba(0,0,0,0.15)", marginBottom:16
// iframe: width:"100%", height:240, border:"none", display:"block"
// Footer: background:"#0B1D3A", padding:"9px 16px", display:"flex", gap:8
// Footer text: color:"#00FF88", fontSize:"0.74rem", fontWeight:700
// Footer text: "Your guide is nearby · updates every minute"
```

### Geo Content Card
```jsx
background:"#fff", border:"1px solid #E5E7EB",
borderLeft:"4px solid #4ADE80", borderRadius:12, padding:16
// CTA inside: background:"#00C27C", color:"#0B1D3A"
```

### Driver Info Card
```jsx
background:"#fff", borderBottom:"1px solid #E5E7EB",
padding:"12px 16px", display:"flex", alignItems:"center", gap:12
// Photo: src="/driver-profile.png", borderRadius:"50%", border:"2px solid #4ADE80"
// Name: fontWeight:800, color:"#111827"
// Vehicle: fontSize:"0.72rem", color:"#6B7280"
// Plate: background:"#0B1D3A", color:"#00FF88", border:"1.5px solid #00FF88", borderRadius:8
```

### CTG Bottom Nav (6 items)
```jsx
position:"fixed", bottom:0, left:0, right:0,
background:"#fff", borderTop:"1px solid #E5E7EB", height:66, zIndex:300
// Items: cityGUIDE(#0B1D3A) · cityTOURS(#7C3AED) · cityFUNHOP(#4ADE80)
//        citySOCIAL(#EF4444) · cityCONNECT(#06B6D4) · City+(#F59E0B)
// Active: color=brand, fontWeight:800, borderTop:"2.5px solid {color}"
// Inactive: color:#6B7280, fontWeight:600
```

### TEXT US Button
```jsx
background:"linear-gradient(135deg,#0057E7,#0095FF)", color:"#fff",
borderRadius:999, padding:"8px 16px", fontWeight:700
href="sms:+18338138687"
```

### Review Button
```jsx
background:"#FFB900", color:"#0B1D3A", border:"none",
borderRadius:12, padding:"12px 20px", fontWeight:900
```

### HOP ON / HOP OFF
```jsx
// HOP ON: background:"#F0FDF4", color:"#00C27C", fontWeight:700
// HOP OFF: background:"#FEF2F2", color:"#EF4444", fontWeight:700
```

### Assigned Badge
```jsx
background:"#D1FAE5", color:"#00C27C", border:"1px solid #6EE7B7",
borderRadius:999, padding:"4px 12px", fontWeight:700, fontSize:"0.72rem"
```

---

## DEPLOY CHECKLIST

- [ ] `node verify_sections.cjs` — all 40+ checks pass
- [ ] Deploy to staging `--no-traffic`
- [ ] Test landing page on phone
- [ ] Test status page on phone
- [ ] Test driver dashboard on phone
- [ ] Test request/booking form on phone
- [ ] Screenshot all 4 pages
- [ ] Compare to design system
- [ ] Promote to production
- [ ] Tag revision as `golden-[date]` in Cloud Run
- [ ] Update this file with any changes
- [ ] Update verify_sections.cjs with any new checks

---

## SESSION LOG

| Date | Changes | Revision |
|---|---|---|
| Jun 11 2026 | Golden baseline restored, SMS added, all buttons fixed, driver card added, 6-item nav, waiver auto-redirect, cityCONNECT page built | staging32 / pending production |

---

*Version 2.0 — June 11, 2026*
*Verify script: `C:\Users\miche\.gemini\antigravity\playground\hopper-ctg\verify_sections.cjs`*