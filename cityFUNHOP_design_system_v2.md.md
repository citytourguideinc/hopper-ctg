# City Tour Guide Inc. — Complete Design System
**Version 2.0 — June 11, 2026**
**Tampa, FL — Live Sell Play**

---

## Brand Family

All products share the "city" lowercase prefix. One brand, five experiences.

| Product | Name | Color | Hex | Purpose |
|---|---|---|---|---|
| Rides | **cityFUNHOP** | Green | `#059669` | On-demand golf cart rides, hop on/hop off |
| Guided Tours | **cityTOURS** | Purple | `#7C3AED` | Karaoke, history, tasting guided tours |
| Community | **citySOCIAL** | Red | `#EF4444` | Social feed, community, events |
| Directory | **cityGUIDE** | Navy | `#0B1D3A` | City directory, local guide, discovery |
| Membership | **City+** | Gold | `#F59E0B` | Premium membership, perks, subscription |

**Parent brand:** City Tour Guide Inc.
**Tagline:** Live. Sell. Play.
**Phone:** 833.813.TOUR (8687)
**Email:** info@citytourguideinc.com
**Domain family:** citytourguide.app / hopper.citytourguide.app / tours.citytourguide.app

---

## Color System — Full Token Reference

### Brand Colors
| Token | Hex | RGB | Usage |
|---|---|---|---|
| `--funhop-green` | `#059669` | 5,150,105 | cityFUNHOP primary, active states, CTAs |
| `--funhop-green-dark` | `#047857` | 4,120,87 | Hover state for green buttons |
| `--funhop-green-light` | `#D1FAE5` | 209,250,229 | Assigned pill bg, covered bg, success bg |
| `--funhop-green-text` | `#065F46` | 6,95,70 | Text on green-light bg |
| `--funhop-green-glow` | `rgba(5,150,105,0.35)` | — | Box shadow, focus ring, active glow |
| `--tours-purple` | `#7C3AED` | 124,58,237 | cityTOURS primary |
| `--tours-purple-dark` | `#6D28D9` | 109,40,217 | Hover state for purple buttons |
| `--tours-purple-light` | `#EDE9FE` | 237,233,254 | Purple bg accents |
| `--social-red` | `#EF4444` | 239,68,68 | citySOCIAL primary, danger actions |
| `--social-red-dark` | `#DC2626` | 220,38,38 | Hover for red buttons |
| `--social-red-light` | `#FEE2E2` | 254,226,226 | Red bg accents |
| `--guide-navy` | `#0B1D3A` | 11,29,58 | cityGUIDE, headers, dark sections |
| `--guide-navy-mid` | `#1E3A5F` | 30,58,95 | Navy hover states |
| `--city-plus-gold` | `#F59E0B` | 245,158,11 | City+ membership |
| `--city-plus-gold-dark` | `#D97706` | 217,119,6 | Gold hover |
| `--blue-action` | `#0066FF` | 0,102,255 | Payment, compliance, download, legal |
| `--blue-action-dark` | `#0052CC` | 0,82,204 | Blue hover |
| `--blue-action-light` | `#EEF4FF` | 238,244,255 | Blue bg accent |

### Neutral Colors
| Token | Hex | Usage |
|---|---|---|
| `--white` | `#FFFFFF` | Card backgrounds, text on dark |
| `--gray-50` | `#F9FAFB` | Page backgrounds |
| `--gray-100` | `#F3F4F6` | Alternate row bg, subtle dividers |
| `--gray-200` | `#E5E7EB` | Card borders, dividers, input borders |
| `--gray-300` | `#D1D5DB` | Disabled borders |
| `--gray-400` | `#9CA3AF` | Placeholder text, disabled text |
| `--gray-500` | `#6B7280` | Secondary text, metadata, inactive nav |
| `--gray-700` | `#374151` | Supporting body text |
| `--gray-900` | `#111827` | Primary body text |
| `--black` | `#000000` | Hero bg, carousel bg |

### Semantic Colors
| Token | Hex | Usage |
|---|---|---|
| `--success` | `#059669` | Same as funhop-green |
| `--warning` | `#F59E0B` | Off duty, pending states |
| `--danger` | `#EF4444` | Decline, cancel, error |
| `--info` | `#0066FF` | Info states, download |

---

## Typography System

### Font Stack
**Primary:** Inter (Google Fonts)
**Fallback:** -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
**Monospace (plate/code):** "Courier New", Courier, monospace

### Type Scale
| Role | Size | Weight | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|---|
| Display XL | 2.5rem | 900 | 1.1 | -0.03em | Hero headlines |
| Display L | 2rem | 900 | 1.15 | -0.02em | Page titles |
| Heading 1 | 1.5rem | 800 | 1.2 | -0.02em | Section titles |
| Heading 2 | 1.25rem | 800 | 1.3 | -0.01em | Card titles |
| Heading 3 | 1rem | 700 | 1.4 | 0 | Sub-headings |
| Body L | 0.95rem | 400 | 1.65 | 0 | Main body text |
| Body M | 0.88rem | 400 | 1.65 | 0 | Secondary body |
| Body S | 0.82rem | 400 | 1.6 | 0 | Fine print |
| Label L | 0.78rem | 700 | 1.4 | 0.06em | Section labels (uppercase) |
| Label M | 0.72rem | 700 | 1.4 | 0.08em | Tags, chips (uppercase) |
| Label S | 0.65rem | 700 | 1.3 | 0.08em | Tiny badges |
| Data XL | 2rem | 900 | 1 | 0 | Price display |
| Data L | 1.3rem | 900 | 1 | 0 | Stats, counts |
| Nav | 0.58rem | 600–800 | 1 | 0.01em | Bottom nav labels |

---

## Spacing System

Base unit: 4px

| Token | Value | Usage |
|---|---|---|
| `--space-1` | 4px | Micro gaps |
| `--space-2` | 8px | Tight padding |
| `--space-3` | 12px | Default inner padding |
| `--space-4` | 16px | Standard padding |
| `--space-5` | 20px | Section padding |
| `--space-6` | 24px | Large padding |
| `--space-8` | 32px | Section gaps |
| `--space-10` | 40px | Large section gaps |
| `--space-12` | 48px | Page section spacing |

---

## Border Radius System

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 8px | Small elements, inputs |
| `--radius-md` | 12px | Buttons, cards |
| `--radius-lg` | 16px | Large cards, panels |
| `--radius-xl` | 20px | Feature cards |
| `--radius-full` | 999px | Pills, badges, circular elements |

---

## Shadow System

| Token | Value | Usage |
|---|---|---|
| `--shadow-sm` | `0 1px 4px rgba(0,0,0,0.06)` | Subtle card lift |
| `--shadow-md` | `0 2px 8px rgba(0,0,0,0.08)` | Standard card |
| `--shadow-lg` | `0 4px 20px rgba(0,0,0,0.12)` | Modal, overlay |
| `--shadow-green` | `0 0 12px rgba(5,150,105,0.4)` | Active green glow |
| `--shadow-navy` | `0 4px 20px rgba(11,29,58,0.25)` | Dark element lift |

---

## Button System — Complete Reference

Every interactive button must match one of these exactly. No custom one-offs.

### 1. Primary CTA — Green (cityFUNHOP actions)
```css
background: #059669;
background-hover: #047857;
color: #fff;
border: none;
border-radius: 12px;
padding: 14px 20px;
font-weight: 900;
font-size: 1rem;
font-family: Inter, sans-serif;
cursor: pointer;
width: 100%; /* full width in forms */
box-shadow: 0 4px 12px rgba(5,150,105,0.3);
```
**Used for:** Request a Hop Now, Book Your City Hop, Start Ride, Go On Duty,
Confirm, Accept Request, Start Pickup, Navigate to Pickup, Complete Ride

### 2. Tours CTA — Purple (cityTOURS actions)
```css
background: #7C3AED;
background-hover: #6D28D9;
color: #fff;
border-radius: 12px;
padding: 12px 18px;
font-weight: 700;
```
**Used for:** See Guided Tours, Book a Guided Tour, Explore Tours

### 3. Compliance / Payment / Download — Blue
```css
background: #0066FF;
background-hover: #0052CC;
color: #fff;
border-radius: 12px;
padding: 12px 18px;
font-weight: 700;
```
**Used for:** Download Signed Waiver, Pay Now, Stripe checkout,
Back to Hopper (after waiver), Copy Link, Legal actions

### 4. Danger — Red
```css
background: #EF4444;
background-hover: #DC2626;
color: #fff;
border-radius: 12px;
padding: 12px 18px;
font-weight: 700;
```
**Used for:** Go Off Duty, Decline Request, Cancel Reservation

### 5. Ghost / Secondary
```css
background: transparent;
border: 2px solid #E5E7EB;
color: #374151;
border-radius: 12px;
padding: 12px 18px;
font-weight: 700;
```
**Used for:** Cancel, Back, Show More, secondary nav options

### 6. Navigation / Purple Gradient (special use)
```css
background: linear-gradient(135deg, #0057E7, #0095FF);
color: #fff;
border-radius: 14px;
padding: 15px;
font-weight: 900;
box-shadow: 0 4px 20px rgba(0,87,231,0.35);
```
**Used for:** Footer "Book Your City Hop" CTA only

### 7. SMS / Text Us (header)
```css
background: #0066FF;
color: #fff;
border-radius: 999px;
padding: 8px 16px;
font-weight: 700;
font-size: 0.82rem;
display: flex;
align-items: center;
gap: 6px;
```

---

## Status Pills & Badges — Complete Reference

### Ride Status Pill (page header)
```css
background: linear-gradient(135deg, #059669, #047857);
color: #fff;
border-radius: 999px;
padding: 8px 20px;
font-weight: 800;
font-size: 0.88rem;
box-shadow: 0 0 16px rgba(5,150,105,0.45);
display: inline-flex;
align-items: center;
gap: 8px;
```
Status text examples:
- "Guide On The Way" (confirmed)
- "Pickup Started" (pickup_started)
- "Guide Has Arrived" (at_pickup)
- "Ride In Progress!" (ride_active)
- "Ride Complete" (completed)

### Assigned Badge
```css
background: #D1FAE5;
color: #059669;
border: 1px solid #6EE7B7;
border-radius: 999px;
padding: 4px 12px;
font-weight: 700;
font-size: 0.72rem;
```

### License Plate Badge (31DNMF)
```css
background: #0B1D3A;
color: #4ADE80;
border: 1.5px solid #4ADE80;
border-radius: 8px;
padding: 4px 12px;
font-weight: 900;
font-family: monospace;
font-size: 0.88rem;
letter-spacing: 0.1em;
```

### Waiver Covered
```css
background: #D1FAE5;
color: #059669;
border-radius: 999px;
padding: 3px 10px;
font-weight: 700;
font-size: 0.72rem;
```

### Experience Active
```css
background: #DBEAFE;
color: #1E3A8A;
border: 1px solid #2563EB;
border-radius: 999px;
padding: 4px 10px;
font-weight: 700;
font-size: 0.72rem;
```

### Pending
```css
background: #FEF3C7;
color: #92400E;
border: 1px solid #F59E0B;
border-radius: 999px;
```

### Completed
```css
background: #F3F4F6;
color: #374151;
border: 1px solid #9CA3AF;
border-radius: 999px;
```

---

## Bottom Navigation — Complete Spec

5 items always present. Fixed at bottom of every page.

```
Height: 66px
Background: #fff
Border top: 1px solid #E5E7EB
Box shadow: 0 -2px 10px rgba(0,0,0,0.06)
Position: fixed, bottom: 0, left: 0, right: 0
z-index: 300
```

| Position | Label | Icon | Color (active) | URL |
|---|---|---|---|---|
| 1 | cityGUIDE | Grid 2x2 SVG | `#0B1D3A` | https://citytourguide.app |
| 2 | cityTOURS | Map pin SVG | `#7C3AED` | https://tours.citytourguide.app |
| 3 | cityFUNHOP | Golf cart SVG | `#059669` | https://hopper.citytourguide.app |
| 4 | citySOCIAL | People SVG | `#EF4444` | https://social.citytourguide.app |
| 5 | City+ | Plus circle SVG | `#F59E0B` | https://citytourguide.app/plus |

Active item rules:
```css
color: [brand color above];
font-weight: 800;
border-top: 2.5px solid [brand color];
margin-top: -1px;
```

Inactive items:
```css
color: #6B7280;
font-weight: 600;
```

Nav label font size: 0.58rem

---

## Page Headers

### Dark Navy Header (status pages, driver dashboard)
```css
background: #0B1D3A;
padding: 14px 18px;
display: flex;
align-items: center;
justify-content: space-between;
position: sticky;
top: 0;
z-index: 10;
```
- Back link (← Home): color `#fff`, font-weight 600, font-size 0.85rem
- Title: color `#fff`, font-weight 800, font-size 0.95rem, centered

### Landing Page Top Bar
```css
background: #000 or #0B1D3A;
padding: 10px 16px;
display: flex;
align-items: center;
justify-content: space-between;
```
- Left: CTG logo (black bg, white text)
- Center: Drivers on Duty pill
- Right: TEXT US button (blue pill)

---

## Section Backgrounds — Page by Page

### Landing Page (/)
| Section | Background | Notes |
|---|---|---|
| Top bar | `#000` | CTG logo + status + SMS |
| Carousel | `#000` | Full bleed photos/video |
| Identity card | `#000` | cityFUNHOP name, tagline |
| Status section | `#0B1D3A` | Live/offline pill, dark navy |
| Map block | `#0B1D3A` frame | OSM map inside dark frame |
| Geo card | `#fff`, green left border | White card, `4px solid #059669` |
| CTA button | `#059669` solid | "Request a Hop Now" |
| Neighborhood stops | `#fff` | Golf cart animation on path |
| Use case carousel | `#fff` | Blue tag chip, white card |
| What's Hoppin' | Dark cards | Green/purple/orange/cyan themed |
| Areas we serve | `#fff` | Gray pill tags |
| Social/connect | `#fff` | Platform icon cards |
| Reviews | `#fff` | Star ratings, verified badges |
| Footer CTA | `#fff` | Blue gradient "Book Your City Hop" |
| Bottom nav | `#fff` | cityFUNHOP active green |

### Status Page (/request/statuspage)
| Section | Background | Notes |
|---|---|---|
| Header | `#0B1D3A` | ← Home + Hop Request |
| Status pill | Green gradient glow | Centered below header |
| Step bar | `#fff` card | 7 steps, green checkmarks |
| Map block | `#0B1D3A` frame | Live OSM map |
| Geo card | `#fff` + green border | Location-based content |
| Ride details | `#fff` card | Guest, neighborhood, fare |
| Driver & vehicle | `#fff` card | Cart photo (contain/white), driver photo, plate |
| Message panel | `#F0F4FF` | Collapsible SMS chat |
| Phone footer | `#fff` | "Questions? Call or text 833-813-8687" |
| Bottom nav | `#fff` | cityFUNHOP active |

### Request/[id] Page (/request/[id])
| Section | Background | Notes |
|---|---|---|
| Header | `#0B1D3A` | ← Home + Hop Request |
| Status pill | Green gradient glow | |
| Map block | `#0B1D3A` frame | |
| Geo card | `#fff` + green border | |
| Driver & vehicle | `#fff` card | |
| Your offer | `#fff` card | Price, HOP ON/OFF |
| Passenger waivers | `#fff` card | Waiver status per guest |
| Download waiver | Blue button | `#0066FF` |
| Copy link | Ghost | Secondary |
| Cancel | Red text link | Danger color |
| Bottom nav | `#fff` | cityFUNHOP active |

### Driver Dashboard (/driver)
| Section | Background | Notes |
|---|---|---|
| Header | `#0B1D3A` | CTG logo + Driver Dashboard |
| Driver info card | `#fff` | Profile photo (green border), plate badge |
| Duty toggle | Green (on) / Yellow (off) | Banner below header |
| Tab bar | `#F9FAFB` | Sticky below header |
| Request cards | `#fff` | HOP ON green / HOP OFF red |
| Action buttons | Green/Navy/Red | Per status |
| SMS panel | `#F0F4FF` | Per-request |
| Sign out | Ghost text | Bottom of list |
| Bottom nav | `#fff` | cityFUNHOP active |

---

## Component Specs — Detailed

### Cart/Vehicle Photo
```css
width: 100%;
object-fit: contain;
background: #fff;
max-height: 280px;
display: block;
border-radius: 8px 8px 0 0;
```
Source: `/cart.png` (always — never Ybor night photo)

### Driver Profile Photo
```css
width: 50px; /* dashboard */
height: 50px;
border-radius: 50%;
object-fit: cover;
border: 2px solid #059669;
flex-shrink: 0;
```
Source: `/driver-profile.png`

### Map Block
```css
/* Outer container */
background: #0B1D3A;
border-radius: 12px;
overflow: hidden;
margin-bottom: 16px;

/* iframe */
width: 100%;
height: 240px;
border: none;
display: block;

/* Footer bar */
background: #0B1D3A;
color: #fff;
padding: 8px 12px;
font-size: 0.78rem;
display: flex;
align-items: center;
gap: 6px;
```

### Geo Content Card
```css
background: #fff;
border: 1px solid #E5E7EB;
border-left: 4px solid #059669;
border-radius: 12px;
padding: 16px;
margin-bottom: 16px;

/* Title */
font-weight: 800;
font-size: 0.95rem;
color: #111827;

/* Body */
font-size: 0.85rem;
color: #374151;
line-height: 1.6;

/* CTA button inside */
background: #059669; /* green */
color: #fff;
border-radius: 8px;
padding: 8px 16px;
font-weight: 700;
margin-top: 12px;
```

### Step Bar
```css
/* Container */
background: #fff;
border: 1px solid #E5E7EB;
border-radius: 16px;
padding: 16px;
margin-bottom: 16px;

/* Completed step circle */
background: #059669;
color: #fff;
border-radius: 50%;
width: 32px;
height: 32px;
/* checkmark inside */

/* Current step circle */
background: #0B1D3A;
color: #fff;
border-radius: 50%;
width: 32px;
height: 32px;
font-weight: 800;

/* Future step circle */
background: #E5E7EB;
color: #9CA3AF;
border-radius: 50%;

/* Connecting line */
background: #059669; /* completed */
background: #E5E7EB; /* future */
height: 2px;

/* Step label */
font-size: 0.62rem;
font-weight: 600;
color: #6B7280; /* inactive */
color: #059669; /* completed */
color: #0B1D3A; /* current */
```

### Message Your Driver Panel
```css
/* Container */
background: #F0F4FF;
border: 1px solid #C7D2FE;
border-radius: 16px;
margin-bottom: 16px;
overflow: hidden;

/* Header */
background: #F0F4FF;
padding: 14px 16px;
display: flex;
align-items: center;
justify-content: space-between;
cursor: pointer;

/* Header text */
color: #0B1D3A;
font-weight: 800;
font-size: 0.9rem;

/* Unread badge */
background: #EF4444;
color: #fff;
border-radius: 50%;
width: 20px;
height: 20px;
font-size: 0.72rem;
font-weight: 800;

/* Chat area */
height: 220px;
overflow-y: auto;
padding: 12px;

/* Guest bubble (outbound) */
background: #0B1D3A;
color: #fff;
border-radius: 12px 12px 2px 12px;
padding: 8px 12px;
margin-left: auto;
max-width: 80%;

/* Driver bubble (inbound) */
background: #E5E7EB;
color: #111827;
border-radius: 12px 12px 12px 2px;
padding: 8px 12px;
max-width: 80%;

/* Input area */
border-top: 1px solid #E5E7EB;
padding: 12px;
display: flex;
gap: 8px;

/* Input field */
flex: 1;
border: 1px solid #D1D5DB;
border-radius: 999px;
padding: 10px 16px;
font-size: 0.88rem;

/* Send button */
background: #059669;
color: #fff;
border-radius: 999px;
padding: 10px 20px;
font-weight: 700;
border: none;
```

### Neighborhood Stops Animation
```css
/* Track line */
height: 3px;
background: linear-gradient(90deg, #059669 0%, #E5E7EB 100%);
border-radius: 999px;

/* Stop dot */
width: 12px;
height: 12px;
background: #059669;
border-radius: 50%;
border: 2px solid #fff;
box-shadow: 0 0 0 2px #059669;

/* Golf cart icon */
position: absolute;
animation: moveCart 6s ease-in-out infinite;
font-size: 1.5rem;

@keyframes moveCart {
  0% { left: 0%; }
  50% { left: 85%; }
  100% { left: 0%; }
}

/* Stop label */
font-size: 0.72rem;
font-weight: 600;
color: #374151;
margin-top: 8px;
```

---

## Waiver Flow Spec

### Waiver Success Page (waiver.citytourguide.app)
- Auto-advance back to return_url after **3 seconds**
- Show countdown: "Returning to your ride in 3..."
- Download button: Blue `#0066FF`
- Back to Hopper button: Blue `#0066FF`
- Header: Dark navy `#0B1D3A`

### Waiver Signing Flow
1. Guest receives SMS with waiver link
2. Signs on waiver.citytourguide.app
3. Success page shows with 3-second countdown
4. Auto-redirects to `/request/[id]?signed=true`
5. Status page updates to show "All riders covered"

---

## Waiver CTA Rules
- "Sign Waiver" → Green `#059669` (action)
- "Download Signed Waiver" → Blue `#0066FF` (compliance)
- "View Waivers" → Ghost button (secondary)
- "Send Waiver Link" → Green `#059669` (action)

---

## HOP ON / HOP OFF Labels
```css
/* HOP ON */
font-size: 0.62rem;
font-weight: 700;
color: #16A34A;
letter-spacing: 0.06em;
text-transform: uppercase;
background: #F0FDF4;
border-radius: 10px;
padding: 8px 10px;

/* HOP OFF */
font-size: 0.62rem;
font-weight: 700;
color: #EF4444;
letter-spacing: 0.06em;
text-transform: uppercase;
background: #FEF2F2;
border-radius: 10px;
padding: 8px 10px;
```

---

## Copy & Voice Rules

### Brand Voice
- Energetic, local, warm, confident
- Never corporate or stiff
- Tampa-specific references encouraged

### Naming Rules
- Never say "golf cart" in guest-facing marketing copy
- Never say "fleet"
- Say "City Host" or "Guide" not "Driver" in guest copy
- Say "Hop On" / "Hop Off" not "Pickup" / "Dropoff" in guest copy
- Product names always lowercase "city" prefix: cityFUNHOP, cityTOURS, citySOCIAL, cityGUIDE
- "City+" with capital C and +

### CTA Copy Rules
| Context | Copy |
|---|---|
| Main booking | "Request a Hop Now" |
| Footer | "Book Your City Hop" |
| Tours | "See Guided Tours" |
| Download | "Download Signed Waiver" |
| Payment | "Pay Securely" |
| Driver accept | "Accept" |
| Driver navigation | "Navigate to Pickup" |
| Driver start | "Start Pickup" |
| Driver complete | "Complete Ride" |

### Status Message Copy
| Status | Guest sees |
|---|---|
| pending | "Request Sent! Looking for your Guide..." |
| confirmed | "Guide On The Way!" |
| pickup_started | "Pickup Started" |
| at_pickup | "Guide Has Arrived!" |
| ride_active | "Ride In Progress!" |
| completed | "Ride Complete! Thanks for hopping with us." |

---

## Accessibility Rules
- All buttons minimum 44px touch target
- Color contrast minimum 4.5:1 for body text
- Focus rings: 2px solid brand color
- Reduced motion: respect prefers-reduced-motion for animations
- All images have alt text

---

## Mobile-First Rules
- Max content width: 560px centered
- All padding: minimum 16px horizontal
- No horizontal scroll ever
- Bottom nav height: 66px (accounts for iOS safe area)
- Sticky headers: position sticky, not fixed (except bottom nav)
- Input font-size minimum 16px (prevents iOS zoom)

---

## What NOT To Do
- Never use bright green (#00FF88 neon) — use `#059669` brand green only
- Never use white text on green-light background
- Never crop cart photo — always use `object-fit: contain`
- Never use the Ybor night photo as the cart image — always `/cart.png`
- Never show the bottom nav with fewer than 5 items
- Never auto-promote to production without staging verification
- Never let Antigravity patch files without reading them here first
- Never deploy from an incomplete local source folder
- Never use "golf cart" in guest-facing marketing copy

---

*This document is the source of truth for all UI decisions.*
*Version 2.0 — June 11, 2026*
*City Tour Guide Inc. — Tampa, FL*
