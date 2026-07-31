"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const BASE = "https://storage.googleapis.com/ctg-media-assets/";
const MEDIA = [
  { type:"image", src:BASE+"FB_IMG_1777844399282.jpg", alt:"Tampa family postcard mural" },
  { type:"image", src:BASE+"20260404_103014-EDIT.jpg", alt:"cityFUNHOP Tampa Riverwalk" },
  { type:"image", src:BASE+"20260404_105143-EDIT.jpg", alt:"Exploring Tampa" },
  { type:"image", src:BASE+"tour-ctg-armature.jpg",   alt:"Armature Works" },
  { type:"image", src:BASE+"tour-golf-cart.jpg",       alt:"The cityFUNHOP cart" },
  { type:"image", src:BASE+"20250727_112917.jpg",      alt:"Tampa shuttle" },
  { type:"image", src:BASE+"20241127_104220.jpg",      alt:"Morning run" },
  { type:"image", src:BASE+"20260228_182312.jpg",      alt:"Evening ride" },
  { type:"video", src:BASE+"Driving.mp4",              alt:"Driving Tampa",  poster:BASE+"20260404_103014-EDIT.jpg" },
  { type:"video", src:BASE+"20260228_162121.mp4",      alt:"Ybor night",     poster:BASE+"20260228_182312.jpg"      },
];

const HOODS = ["Downtown Tampa","Riverwalk","Ybor City","Hyde Park","Channelside","Harbour Island","Water Street","SoHo","Davis Islands","Armature Works","Tampa Heights","Seminole Heights"];

const STEPS = [
  { n:"1", e:"1", t:"When Do You Need a Hop?",   b:"Need an experience right now or planning ahead? Pick On-Demand and your City Host heads to your hop-on location, or choose Scheduled and lock in your time." },
  { n:"2", e:"2", t:"Where Are You Hopping On?", b:"Select your pickup neighborhood and nearest landmark. Then pick your drop-off neighborhood and destination." },
  { n:"3", e:"3", t:"Who Is Joining Your Experience?",    b:"Your name and phone. We will send confirmation and experience updates by text." },
  { n:"4", e:"4", t:"Set Your Offer",            b:"Dial in what you want to pay. You set the fare and your driver reviews and accepts before you are charged." },
  { n:"5", e:"5",    t:"Confirm and Go",            b:"Review your details, sign the quick waiver, and you are set. Your driver will be on the way." },
];

const USE_CASES = [
  { tag:"HOTEL GUEST",      icon:"", h:"Hotel to dinner and back.",                      b:"Staying downtown and heading out for the evening? Skip the parking hunt. Hop in and arrive in style." },
  { tag:"LUNCH RUN",        icon:"", h:"From your hotel or office to your lunch spot.",         b:"Hop between neighborhoods at lunch without the parking headache. Hop, explore, eat, be back. Done." },
  { tag:"NO PARKING",       icon:"", h:"Skip the parking garage.",                         b:"Channelside, Water Street and Ybor fill up fast. Hop On at any one of our pickup locations and go directly to your destination." },
  { tag:"NIGHT OUT",        icon:"", h:"Convention Center to any Tampa neighborhood.",    b:"Between sessions or heading out for the evening? We move you through Tampa neighborhoods quickly and comfortably." },
  { tag:"LOCAL SHORTCUT",   icon:"", h:"The open air way to move through Tampa.",          b:"No traffic. No parking. No detours. Just the city, the breeze, and a driver who knows every block." },
];

const EXPECT = [
  { e:"Cart", t:"Bintelli Black Limo Cart",   b:"Street legal. 6 seats. The cleanest way to move between Tampa neighborhoods. Whether you are hotel bound, heading to lunch or exploring a new district." },
  { e:"Music", t:"Sing Along or Vibe to Your Fav Tunes",  b:"Sing along or vibe to your favorite tunes. Your driver keeps the energy going. Music, good vibes, and a route through the best of Tampa." },
  { e:"Group", t:"Up to 5 Guests",           b:"Colleagues on a lunch run, hotel guests exploring the city, or a group moving between neighborhoods. Everyone fits." },
  { e:"Licensed", t:"Licensed and Insured",     b:"City Tour Guide Inc. Fully licensed and insured." },
];

// WHAT'S HOPPIN'? -- static v1, no geo/events/feed/admin wiring
// Parked for future phases:
//   - geo-triggered suggestions
//   - event / happy-hour live feed
//   - sponsored partner placements
//   - district-based recommendations
//   - time-of-day logic
//   - admin-controlled hot spots and offers
//   - optional user-location permission with fallback district selector
const HOPPIN = [
  {
    cat:"Happy Hour",
    title:"Happy Hour Hops",
    desc:"Find nearby drinks, bites, and after-work stops.",
    accent:"#00FF88", from:"#002200", to:"#004d00",
    border:"rgba(0,255,136,0.28)", chipBg:"rgba(0,255,136,0.12)"
  },
  {
    cat:"Events",
    title:"Event Hops",
    desc:"Heading to a game, concert, market, or festival? Hop closer without the parking hassle.",
    accent:"#818CF8", from:"#0D0B2E", to:"#1e1a60",
    border:"rgba(129,140,248,0.28)", chipBg:"rgba(129,140,248,0.12)"
  },
  {
    cat:"Nightlife",
    title:"Dinner & Nightlife",
    desc:"Move between restaurants, rooftops, bars, and music spots.",
    accent:"#FB923C", from:"#1C0A00", to:"#3d1a00",
    border:"rgba(251,146,60,0.28)", chipBg:"rgba(251,146,60,0.12)"
  },
  {
    cat:"Districts",
    title:"District Hops",
    desc:"Explore Water Street, Channelside, Ybor, Riverwalk, Hyde Park, and more.",
    accent:"#22D3EE", from:"#001A1F", to:"#003040",
    border:"rgba(34,211,238,0.28)", chipBg:"rgba(34,211,238,0.12)"
  },
  {
    cat:"Local Picks",
    title:"Featured Local Stops",
    desc:"Partner picks, specials, and places worth checking out.",
    accent:"#FBBF24", from:"#1C1200", to:"#3a2600",
    border:"rgba(251,191,36,0.28)", chipBg:"rgba(251,191,36,0.12)"
  },
];

function Carousel() {
  const [active, setActive] = useState(0);
  const [muted,  setMuted]  = useState(true);
  const timer  = useRef(null);
  const vidRef = useRef(null);
  const cur    = MEDIA[active];
  function advance() { setActive(a => (a+1) % MEDIA.length); }
  const go = (idx) => {
    clearInterval(timer.current);
    if (vidRef.current) { vidRef.current.pause(); vidRef.current.currentTime = 0; }
    setMuted(true); setActive(idx);
  };
  useEffect(() => {
    fetch("https://city-tour-guide-916952788862.us-east1.run.app/api/book/reviews")
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setReviews(d.slice(0,5)); }).catch(()=>{});
  }, []);
  useEffect(() => {
    clearInterval(timer.current);
    if (cur.type === "image") timer.current = setInterval(advance, 4500);
    if (cur.type === "video" && vidRef.current) {
      vidRef.current.currentTime = 0; vidRef.current.muted = muted;
      vidRef.current.play().catch(() => {});
    }
    return () => clearInterval(timer.current);
  }, [active]);
  const arrowSt = (side) => ({
    position:"absolute",[side]:"10px",top:"50%",transform:"translateY(-50%)",
    background:"rgba(0,0,0,0.5)",border:"1px solid rgba(255,255,255,0.2)",
    color:"#fff",borderRadius:"50%",width:"38px",height:"38px",
    cursor:"pointer",fontSize:"1.2rem",display:"flex",alignItems:"center",justifyContent:"center",zIndex:4
  });
  return (
    <div style={{position:"relative",width:"100%",height:"clamp(420px, 90vw, 580px)",overflow:"hidden",background:"#000"}}>
      {MEDIA.map((m,i) => (
        <div key={i} style={{position:"absolute",inset:0,opacity:i===active?1:0,transition:"opacity 0.7s ease",pointerEvents:i===active?"auto":"none"}}>
          {m.type === "image"
            ? <>
                <img src={m.src} alt={m.alt} loading="lazy" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"contain",objectPosition:"center",background:"#000",display:"block"}}/>
              </>
            : <video ref={i===active?vidRef:null} src={m.src} poster={m.poster||''} playsInline muted={muted} loop onEnded={advance} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:"center",display:"block"}}/>
          }
        </div>
      ))}
      <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(0,0,0,0) 40%,rgba(0,0,0,0.35) 100%)",zIndex:2,pointerEvents:"none"}}/>
      {cur.type === "video" && (
        <button onClick={() => { const n=!muted; setMuted(n); if(vidRef.current) vidRef.current.muted=n; }}
          style={{position:"absolute",bottom:"48px",right:"12px",zIndex:5,background:muted?"rgba(0,0,0,0.62)":"rgba(0,102,255,0.85)",border:muted?"1px solid rgba(255,255,255,0.25)":"1px solid rgba(255,255,255,0.5)",borderRadius:"999px",padding:"6px 12px",color:"#fff",fontSize:"0.72rem",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:"5px"}}>
          {muted ? "Tap to hear" : "Mute"}
        </button>
      )}
      <button onClick={() => go((active-1+MEDIA.length)%MEDIA.length)} style={arrowSt("left")}>&#x2039;</button>
      <button onClick={() => go((active+1)%MEDIA.length)} style={arrowSt("right")}>&#x203a;</button>
      <div style={{position:"absolute",bottom:"10px",left:"50%",transform:"translateX(-50%)",display:"flex",gap:"6px",zIndex:4}}>
        {MEDIA.map((_,i) => (
          <button key={i} onClick={() => go(i)}
            style={{width:i===active?"20px":"8px",height:"8px",borderRadius:"999px",border:"none",cursor:"pointer",padding:0,background:i===active?"#C9A227":"rgba(255,255,255,0.45)",transition:"all 0.3s",flexShrink:0}}/>
        ))}
      </div>
    </div>
  );
}

function CTGLogo() {
  return (
    <div style={{display:'flex',alignItems:'center',flexShrink:0}}>
      <div style={{background:'#000',padding:'4px 10px',textAlign:'center',lineHeight:0.88,fontFamily:"Ultra,Georgia,serif"}}>
        <div style={{color:'#fff',fontWeight:400,fontSize:'1.05rem',letterSpacing:'0.06em',display:'block'}}>CITY</div>
        <div style={{position:'relative',display:'flex',alignItems:'center',justifyContent:'center',margin:'1px 0'}}>
          <span style={{color:'#fff',fontWeight:400,fontSize:'1.05rem',letterSpacing:'0.06em'}}>TOUR</span>
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <span style={{background:'#000',color:'#fff',fontSize:'0.22rem',fontWeight:700,letterSpacing:'0.3em',padding:'1px 4px',whiteSpace:'nowrap',border:'0.5px solid rgba(255,255,255,0.7)',fontFamily:'Inter,sans-serif'}}>TAMPA</span>
          </div>
        </div>
        <div style={{color:'#fff',fontWeight:400,fontSize:'1.05rem',letterSpacing:'0.06em',display:'flex',alignItems:'flex-end',justifyContent:'center',gap:2}}>
          <span>GUIDE</span>
          <span style={{fontSize:'0.26rem',fontWeight:700,letterSpacing:'0.1em',marginBottom:'2px',fontFamily:'Inter,sans-serif',opacity:0.9}}>INC.</span>
        </div>
      </div>
    </div>
  );
}

function UseCaseCards() {
  const [idx, setIdx] = useState(0);
  const n = USE_CASES.length;
  useEffect(() => { const t = setInterval(() => setIdx(i => (i+1)%n), 8000); return () => clearInterval(t); }, [n]);
  const cur = USE_CASES[idx];
  return (
    <div style={{position:"relative",userSelect:"none"}}>
      <div style={{background:"#fff",borderRadius:"16px",padding:"28px 52px 24px",textAlign:"center",boxShadow:"0 2px 12px rgba(0,0,0,0.08)",border:"1px solid #E5E7EB"}}>
        <span style={{fontSize:"0.75rem",fontWeight:700,background:"#EEF4FF",color:"#0066FF",borderRadius:"999px",padding:"3px 12px",textTransform:"uppercase",letterSpacing:"0.08em",border:"1px solid #BFDBFE",display:"inline-block",marginBottom:"12px"}}>{cur.tag}</span>
        <div style={{fontSize:"2.2rem",marginBottom:"10px"}}>{cur.icon}</div>
        <div style={{fontWeight:700,fontSize:"1rem",color:"#0041CC",lineHeight:1.35,marginBottom:"10px",letterSpacing:"-0.02em"}}>{cur.h}</div>
        <div style={{fontSize:"0.88rem",color:"#374151",lineHeight:1.7,fontWeight:400}}>{cur.b}</div>
      </div>
      <button onClick={() => setIdx(i => (i-1+n)%n)} style={{position:"absolute",top:"50%",left:"8px",transform:"translateY(-50%)",width:"32px",height:"32px",borderRadius:"50%",border:"1px solid #E5E7EB",background:"#fff",color:"#0066FF",fontSize:"1.1rem",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 1px 4px rgba(0,0,0,0.08)"}}>&#x2039;</button>
      <button onClick={() => setIdx(i => (i+1)%n)} style={{position:"absolute",top:"50%",right:"8px",transform:"translateY(-50%)",width:"32px",height:"32px",borderRadius:"50%",border:"1px solid #E5E7EB",background:"#fff",color:"#0066FF",fontSize:"1.1rem",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 1px 4px rgba(0,0,0,0.08)"}}>&#x203a;</button>
      <div style={{display:"flex",justifyContent:"center",gap:"5px",marginTop:"12px"}}>
        {USE_CASES.map((_,i) => (
          <button key={i} onClick={() => setIdx(i)} style={{width:i===idx?"20px":"7px",height:"7px",borderRadius:999,border:"none",cursor:"pointer",padding:0,background:i===idx?"#0066FF":"#D1D5DB",transition:"all 0.25s"}}/>
        ))}
      </div>
    </div>
  );
}

const sectionLabel = (txt) => (
  <div style={{fontSize:"0.78rem",fontWeight:700,color:"#374151",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:14,paddingBottom:6,borderBottom:"2px solid #E5E7EB"}}>{txt}</div>
);

function BookingForm() {
  const LANDMARKS = {
  "Harbour Island":   ["The Pointe at Harbour Island","The RoundAbout at Harbour Island","Beneficial Dr (Starbucks)"],
  "Downtown Tampa":   ["Curtis Hixon Waterfront Park","Kiley Garden","Cotanchobee Fort Brooke Park","Tampa Theatre","Lykes Gaslight Square Park","Old City Hall","Franklin Street Pedestrian Mall"],
  "Channelside":      ["Sparkman Wharf","Florida Aquarium","Port of Tampa Parking Garage","Amalie Arena","Tampa Bay History Center"],
  "Water Street":     ["JW Marriott Water Street","Marriott Waterside","Amalie Arena (Water St side)","Sparkman Wharf (Water St entry)"],
  "Ybor City":        ["7th Ave & 15th St","7th Ave & 19th St","7th Ave & 22nd St","Gas Worx Ybor","Columbia Restaurant","Centro Ybor","Centennial Park","Ybor City Museum"],
  "Hyde Park":        ["Hyde Park Village","The Plant (UT Campus)","Palma Ceia Golf Club"],
  "SoHo":             ["SoHo District (Howard & Azeele)","SoHo District (Howard & Platt)","MacDill Ave Strip"],
  "Davis Islands":    ["Davis Islands Village","Peter O. Knight Airport","Tampa General Hospital"],
  "Armature Works":   ["Armature Works / Heights Market","Ulele Restaurant","Riverwalk at Highland Ave"],
  "Riverwalk":        ["Curtis Hixon Waterfront Park","Cotanchobee Fort Brooke Park","Kiley Garden","Riverwalk at Harbour Island Bridge"],
};
const HOODS = Object.keys(LANDMARKS);
  const [rideType, setRideType]   = useState("now");
  const [name,     setName]       = useState(() => { try { return localStorage.getItem("ctg_hop_name")||""; } catch(e){return "";} });
  const [phone,    setPhone]      = useState(() => { try { return localStorage.getItem("ctg_hop_phone")||""; } catch(e){return "";} });
  const [guests,   setGuests]     = useState(() => { try { return Number(localStorage.getItem("ctg_hop_guests"))||1; } catch(e){return 1;} });
  const [guestContacts, setGuestContacts] = useState([]); // [{contact:'', type:'phone'}] for guests 2-N
  const [hood,     setHood]       = useState("");
  const [venue,    setVenue]      = useState("");
  const [pickup,   setPickup]     = useState("");
  const [dropoff,  setDropoff]    = useState("");

  // Persist guest info to localStorage whenever it changes
  useEffect(() => { try { localStorage.setItem("ctg_hop_name", name); } catch(e){} }, [name]);
  useEffect(() => { try { localStorage.setItem("ctg_hop_phone", phone); } catch(e){} }, [phone]);
  useEffect(() => { try { localStorage.setItem("ctg_hop_guests", String(guests)); } catch(e){} }, [guests]);
  const [price,    setPrice]      = useState("");
  const [sched,    setSched]      = useState("");
  const [loading,  setLoading]    = useState(false);
  const [error,    setError]      = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name||!phone||!hood||!price) { setError("Please fill in all required fields."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/hopper/checkout", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ name, phone, guests, neighborhood:hood, venue, pickupNotes:pickup, dropoffNotes:dropoff, price:parseFloat(price), type:rideType, scheduledAt:sched||null, guestContacts }),
      });
      const d = await res.json();
      if (d.url) { window.location.href = d.url; }
      else { setError(d.error || "Something went wrong. Please try again."); setLoading(false); }
    } catch(err) { setError("Network error. Please try again."); setLoading(false); }
  }

  const inp = { width:"100%", padding:"12px 14px", border:"2px solid #E5E7EB", borderRadius:10, fontSize:"0.9rem", fontFamily:"Inter,sans-serif", outline:"none", boxSizing:"border-box", background:"#fff", color:"#111827" };
  const lbl = { display:"block", fontWeight:700, fontSize:"0.75rem", color:"#374151", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:5 };

  return (
    <form onSubmit={handleSubmit} style={{background:"#fff",borderRadius:20,border:"2px solid #E5E7EB",padding:"28px 24px",boxShadow:"0 4px 24px rgba(0,0,0,0.07)"}}>
      {/* Ride type */}
      <div style={{display:"flex",gap:8,marginBottom:20}}>
        {[{val:"now",label:"Hop Now"},{val:"scheduled",label:"Schedule"}].map(rt=>(
          <button key={rt.val} type="button" onClick={()=>setRideType(rt.val)}
            style={{flex:1,padding:"10px",borderRadius:10,border:"2px solid "+(rideType===rt.val?"#00B761":"#E5E7EB"),background:rideType===rt.val?"#ECFDF5":"#fff",fontWeight:700,fontSize:"0.85rem",cursor:"pointer",color:rideType===rt.val?"#00B761":"#6B7280",fontFamily:"Inter,sans-serif"}}>
            {rt.label}
          </button>
        ))}
      </div>

      {rideType==="scheduled" && (
        <div style={{marginBottom:16}}>
          <label style={lbl}>When? *</label>
          <input type="datetime-local" value={sched} onChange={e=>setSched(e.target.value)} style={inp} required/>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
        <div>
          <label style={lbl}>Your Name *</label>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" style={inp} required/>
        </div>
        <div>
          <label style={lbl}>Phone *</label>
          <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="(813) 000-0000" style={inp} required/>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
        <div>
          <label style={lbl}>Neighborhood *</label>
          <select value={hood} onChange={e=>setHood(e.target.value)} style={{...inp,appearance:"none"}} required>
            <option value="">Select area</option>
            {HOODS.map(h=><option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Guests</label>
          <select value={guests} onChange={e=>setGuests(Number(e.target.value))} style={{...inp,appearance:"none"}}>
            {[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n} guest{n>1?"s":""}</option>)}
          </select>
        </div>
      </div>

      {/* GUEST CONTACTS -- shown when 2+ riders */}
      {guests > 1 && (
        <div style={{marginBottom:16,background:"#F0F9FF",border:"1px solid #BAE6FD",borderRadius:12,padding:"14px"}}>
          <div style={{fontWeight:700,fontSize:"0.78rem",color:"#0369A1",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Send Waiver Links To</div>
          <div style={{fontSize:"0.72rem",color:"#6B7280",marginBottom:12}}>Each guest gets their own unique waiver link instantly.</div>
          {Array.from({length: guests - 1}, (_, i) => {
            const gc = guestContacts[i] || {contact:'', type:'phone'};
            const update = (field, val) => {
              const updated = [...guestContacts];
              updated[i] = {...(updated[i]||{type:'phone',contact:''}), [field]: val};
              setGuestContacts(updated);
            };
            return (
              <div key={i} style={{marginBottom: i < guests-2 ? 10 : 0}}>
                <div style={{fontWeight:600,fontSize:"0.75rem",color:"#374151",marginBottom:6}}>Guest {i+2}</div>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:6}}>
                  <label style={{display:"flex",alignItems:"center",gap:5,cursor:"pointer",fontSize:"0.82rem",fontWeight:500}}>
                    <input type="radio" name={"gc-"+(i+2)} value="phone" defaultChecked checked={gc.type==="phone"} onChange={()=>update("type","phone")} style={{accentColor:"#0066FF"}}/>
                    <span>Phone</span>
                  </label>
                  <label style={{display:"flex",alignItems:"center",gap:5,cursor:"pointer",fontSize:"0.82rem",fontWeight:500}}>
                    <input type="radio" name={"gc-"+(i+2)} value="email" checked={gc.type==="email"} onChange={()=>update("type","email")} style={{accentColor:"#0066FF"}}/>
                    <span>Email</span>
                  </label>
                </div>
                <input
                  type={gc.type==="email"?"email":"tel"}
                  value={gc.contact}
                  onChange={e=>update("contact",e.target.value)}
                  placeholder={gc.type==="phone"?"Guest "+String(i+2)+" phone number":"Guest "+String(i+2)+" email address"}
                  style={{...inp,fontSize:"0.88rem"}}/>
              </div>
            );
          })}
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
        <div>
          <label style={lbl}>Hop On FROM *</label>
          <select value={pickup} onChange={e=>setPickup(e.target.value)} style={{...inp,appearance:"none"}} required>
            <option value="">Select pickup location</option>
            {(LANDMARKS[hood]||[]).map(l=><option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Hop Off TO *</label>
          <select value={dropoff} onChange={e=>setDropoff(e.target.value)} style={{...inp,appearance:"none"}} required>
            <option value="">Select drop-off location</option>
            {(LANDMARKS[hood]||[]).map(l=><option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      <div style={{marginBottom:20}}>
        <label style={lbl}>Your Offer Price (USD) *</label>
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontWeight:700,color:"#374151",fontSize:"1rem"}}>$</span>
          <input type="number" min="5" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} placeholder="0.00" style={{...inp,paddingLeft:28}} required/>
        </div>
        <div style={{fontSize:"0.72rem",color:"#9CA3AF",marginTop:4}}>Set your offer. Your City Host reviews before confirming.</div>
      </div>

      {error && <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,padding:"10px 14px",color:"#B91C1C",fontSize:"0.82rem",marginBottom:16}}>{error}</div>}

      <button type="submit" disabled={loading}
        style={{width:"100%",padding:"16px",background:loading?"#9CA3AF":"#0B1D3A",color:loading?"#fff":"#4ADE80",border:loading?"none":"1.5px solid #4ADE80",borderRadius:12,fontWeight:900,fontSize:"1rem",cursor:loading?"not-allowed":"pointer",fontFamily:"Inter,sans-serif",letterSpacing:"0.03em",transition:"background 0.2s"}}>
        {loading ? "Redirecting to payment..." : "Book & Pay Securely"}
      </button>

      <div style={{textAlign:"center",marginTop:12,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
        <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" fill="#6B7280"/></svg>
        <span style={{color:"#9CA3AF",fontSize:"0.72rem"}}>Secured by Stripe - No card stored on our servers</span>
      </div>
    </form>
  );
}



const EXPERIENCES = [
  { label:"City Guided Tours",  tagline:"Karaoke | History | Tastings",  sub:"Guided. Hosted. Unforgettable.",          url:"https://tours.citytourguide.app",         icon:"", bg:"linear-gradient(135deg,#1a0033,#3d0070)",  accent:"#BF5FFF", border:"rgba(191,95,255,0.45)" },
  { label:"CityHOPPER Tours", tagline:"Hop on, Hop off Rides",          sub:"City experiences. On demand.", url:"https://hopper.citytourguide.app",        icon:"", bg:"linear-gradient(135deg,#002200,#004d00)",  accent:"#00FF88", border:"rgba(0,255,136,0.4)"   },
];



function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22">
      <defs><radialGradient id="igG2" cx="30%" cy="107%" r="150%"><stop offset="0%" stopColor="#fdf497"/><stop offset="45%" stopColor="#fd5949"/><stop offset="60%" stopColor="#d6249f"/><stop offset="90%" stopColor="#285AEB"/></radialGradient></defs>
      <rect width="24" height="24" rx="6" fill="url(#igG2)"/>
      <circle cx="12" cy="12" r="4.5" fill="none" stroke="#fff" strokeWidth="1.6"/>
      <circle cx="17.2" cy="6.8" r="1.1" fill="#fff"/>
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="#fff" strokeWidth="1.6"/>
    </svg>
  );
}
function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24V15.563H7.078v-3.49h3.047V9.356c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.971H15.83c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" fill="#1877F2"/>
    </svg>
  );
}
function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FF0000"/>
    </svg>
  );
}
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

const SOCIAL = [
  { label:"Google",    url:"https://maps.app.goo.gl/eCWEvUwCbrFnbwjo6", color:"#4285F4", Icon:GoogleIcon    },
  { label:"Instagram", url:"https://instagram.com/citytourguideinc",     color:"#E1306C", Icon:InstagramIcon },
  { label:"Facebook",  url:"https://facebook.com/citytourguideinc",      color:"#1877F2", Icon:FacebookIcon  },
  { label:"YouTube",   url:"https://youtube.com/@citytourguideinc",      color:"#FF0000", Icon:YouTubeIcon   },
];


const GYG_REVIEWS = [
  {name:"Emmalyn",country:"United States",date:"Jul 30, 2025",stars:5,source:"GetYourGuide",text:"Tour went well over all. Michelle is very friendly and flexible in time. She is fun and easy to work with. We highly recommend this tour especially if you're new to the area. Thanks Michelle for giving us a memorable tour!"},
  {name:"KB",country:"United States",date:"Jul 11, 2025",stars:5,source:"GetYourGuide",text:"Tour was great and very informative! Seen beautiful parts of the city!"},
  {name:"Jasmine T.",country:"United States",date:"Jul 4, 2025",stars:5,source:"GetYourGuide",text:"Best thing we did in Tampa! We were a bachelorette group of 5 and had the absolute best time. Michelle let us pick all the songs and knew every landmark by heart. The golf cart was clean, comfortable and had great speakers. Already planning to come back!"},
  {name:"Marcus D.",country:"United States",date:"Jun 28, 2025",stars:5,source:"GetYourGuide",text:"Took my family on this tour for Father's Day. Kids loved the karaoke, my wife loved the waterfront views, and I loved that someone else was driving! Seriously fun experience. Worth every penny."},
  {name:"Priya K.",country:"United States",date:"Jun 15, 2025",stars:5,source:"GetYourGuide",text:"Moved to Tampa 6 months ago and this was the best introduction to the city I could have asked for. We stopped at spots I never would have found on my own. Michelle is a natural guide — funny, knowledgeable, and passionate about the city."},
  {name:"Rachel & Mike",country:"United States",date:"Jun 1, 2025",stars:5,source:"GetYourGuide",text:"Absolutely perfect date night! We sang together through Ybor City and finished with a sunset view at Harbour Island. Romantic, fun, and totally unique. We've done lots of tours across the country — this is one of our favorites."},
  {name:"Derek O.",country:"United States",date:"May 24, 2025",stars:4,source:"GetYourGuide",text:"Really enjoyed it. The karaoke setup was hilarious — I'm a terrible singer but nobody judged! Great way to see the city. Knocked off one star only because we wanted to stay longer — would love a 3-hour option."},
  {name:"Tanya B.",country:"United States",date:"May 17, 2025",stars:5,source:"GetYourGuide",text:"Booked this for my mom's birthday and she absolutely loved it. She was hesitant at first but ended up stealing the mic the whole tour! Michelle was incredibly warm and accommodating. This is a MUST do in Tampa."},
  {name:"James & Courtney",country:"United States",date:"May 10, 2025",stars:5,source:"GetYourGuide",text:"We've lived in Tampa for 3 years and still discovered things on this tour. The commentary was fantastic and the karaoke just made it feel like a party. Can't recommend enough. Go book it now!"},
  {name:"Lindsey P.",country:"United States",date:"Apr 27, 2025",stars:5,source:"GetYourGuide",text:"Visited Tampa for a conference and squeezed this tour in between sessions. So glad I did! In 2 hours I saw more of the real Tampa than I would have in a whole week on my own. The vibe is just different — feels personal and fun, not touristy."},
  {name:"Andre W.",country:"United States",date:"Apr 19, 2025",stars:5,source:"GetYourGuide",text:"This is hands down the most fun I've had on any tour, anywhere. The karaoke aspect is genius — it makes you feel like you're celebrating while you explore. Our guide knew every building, every story, every shortcut. 10/10."},
  {name:"Sofia R.",country:"United States",date:"Apr 6, 2025",stars:5,source:"GetYourGuide",text:"Our girls' trip highlight! We laughed the entire time. Michelle is so personable and knows the city inside and out. We stopped at the most gorgeous spots for photos. Don't overthink it — just book it."},
  {name:"Nathaniel G.",country:"United States",date:"Mar 29, 2025",stars:5,source:"GetYourGuide",text:"Surprised my girlfriend for her birthday and she absolutely flipped. Perfect blend of sightseeing and entertainment. Michelle went above and beyond to make it special. The Ybor City stretch at dusk was especially beautiful."},
  {name:"Cassandra M.",country:"United States",date:"Mar 15, 2025",stars:4,source:"GetYourGuide",text:"Super fun experience! We loved the karaoke and the stops around Water Street were beautiful. Guide was great — very professional and funny. Would definitely do the extended tour next time."},
  {name:"Sarah M.",country:"United States",date:"Jun 22, 2025",stars:5,source:"GetYourGuide",text:"Absolutely loved it! We sang our hearts out while cruising through Tampa. The guide knew every hidden gem in the city."},
];


export default function HopperHome() {
  const [mapOpen,  setMapOpen]  = useState(false);
  const [reviews, setReviews]   = useState([]);
  const [ucIdx, setUcIdx]       = useState(0);
  const [showDesc, setShowDesc]  = useState(false);
  const [showAll, setShowAll]      = useState(false);
  const [reviewForm, setReviewForm]= useState(false);
  const [reviewDrawerOpen, setReviewDrawerOpen]= useState(false);
  const [formData, setFormData]    = useState({name:'',stars:5,text:'',tourDate:'',tourType:''});
  const [submitting, setSubmitting]= useState(false);
  const [submitted, setSubmitted]  = useState(false);
  // Wave E: duty status
  const [dutyStatus, setDutyStatus] = useState(null); // null = loading, then { is_on_duty: bool }
  const [driverPos, setDriverPos]         = useState(null);
  const [driverContent, setDriverContent] = useState(null);

  useEffect(() => {
    fetch('https://tours.citytourguide.app/api/book/reviews').then(r=>r.json()).then(d=>setReviews((d.reviews||[]).slice(0,5))).catch(()=>{});
    const t = setInterval(()=>setUcIdx(i=>(i+1)%USE_CASES.length),4000);
    // Wave H: poll duty status every 30 seconds
    const fetchDuty = () =>
      fetch('/api/hopper/duty-status', { cache: 'no-store' }).then(r=>r.json()).then(d=>setDutyStatus(d)).catch(()=>setDutyStatus({ is_on_duty: false }));
    fetchDuty();
    const dutyTimer = setInterval(fetchDuty, 120000);
    // Driver location + content -- poll every 60 seconds
    const fetchDriverLoc = () =>
      fetch('/api/hopper/driver-location', { cache: 'no-store' })
        .then(r => r.json())
        .then(d => {
          if (d.available && d.lat && d.lng) setDriverPos({ lat: d.lat, lng: d.lng });
          if (d.content) setDriverContent(d.content);
        })
        .catch(() => {});
    fetchDriverLoc();
    const locTimer = setInterval(fetchDriverLoc, 60000);
    return () => { clearInterval(t); clearInterval(dutyTimer); clearInterval(locTimer); };
  },[]);

  const uc = USE_CASES[ucIdx];

  return (
    <div style={{minHeight:"100vh",background:"#F8F9FB",fontFamily:"DM Sans,system-ui,sans-serif",color:"#0B1D3A",maxWidth:"100vw",overflowX:"hidden"}} onClick={()=>setMapOpen(false)}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Inter:wght@700;800;900&family=Ultra&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0} a{text-decoration:none;color:inherit}
        @keyframes pulse-dot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}
        @keyframes cartRide{0%,8%{left:11%}40%,60%{left:46%}92%,100%{left:81%}}
        @keyframes roadFill{0%,8%{width:15%}40%,60%{width:50%}92%,100%{width:85%}}
        .hood-pill:hover{background:#0B1D3A!important;color:#fff!important;border-color:#0B1D3A!important}
      `}</style>

      {/* HEADER — Tours-identical layout */}
      <div style={{position:"sticky",top:0,zIndex:100,background:"#000",borderBottom:"1px solid #1a1a1a",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 20px",gap:"12px"}} onClick={e=>e.stopPropagation()}>
        {/* CTG Logo box — same as Tours */}
        <div style={{display:"flex",alignItems:"flex-end",gap:"4px",flexShrink:0}}>
          <div style={{background:"#000",border:"2px solid #fff",borderRadius:"6px",padding:"6px 12px",textAlign:"center",fontFamily:'Georgia,"Times New Roman",serif',lineHeight:0.9}}>
            <div style={{color:"#fff",fontWeight:900,fontSize:"0.9rem",letterSpacing:"0.12em"}}>CITY</div>
            <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center",margin:"1px 0"}}>
              <span style={{color:"#fff",fontWeight:900,fontSize:"0.9rem",letterSpacing:"0.12em"}}>TOUR</span>
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{background:"#000",color:"#fff",fontSize:"0.28rem",fontWeight:700,letterSpacing:"0.3em",padding:"0 3px",whiteSpace:"nowrap",border:"0.5px solid rgba(255,255,255,0.5)"}}>TAMPA</span>
              </div>
            </div>
            <div style={{color:"#fff",fontWeight:900,fontSize:"0.9rem",letterSpacing:"0.12em"}}>GUIDE<span style={{fontSize:"0.28rem",fontWeight:700,letterSpacing:"0.1em",verticalAlign:"super",marginLeft:"2px",opacity:0.6}}>INC.</span></div>
          </div>
        </div>
        {/* Duty status — center, same pill style as Tours YouTube button */}
        <button onClick={e=>{e.stopPropagation();setMapOpen(o=>!o);}}
          style={{display:"flex",alignItems:"center",gap:"5px",background:"none",color:"rgba(255,255,255,0.7)",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.04em",border:"1px solid rgba(255,255,255,0.2)",borderRadius:"8px",padding:"5px 10px",cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
          <span style={{width:7,height:7,background:dutyStatus?.is_on_duty?"#22C55E":"#EF4444",borderRadius:"50%",display:"inline-block",animation:dutyStatus?.is_on_duty?"pulse-dot 2s infinite":"none",flexShrink:0}}></span>
          {dutyStatus===null?"Service Status":dutyStatus.is_on_duty?"Drivers on Duty":"Drivers off Duty"}
        </button>
        {/* TEXT US — same as Tours */}
        <a href="sms:+18338138687?body=Hi! I am interested in a City Hopper experience." style={{display:"flex",alignItems:"center",gap:"6px",background:"linear-gradient(135deg,#0057E7,#0095FF)",color:"#fff",borderRadius:"10px",padding:"9px 18px",fontWeight:900,fontSize:"0.85rem",textDecoration:"none",letterSpacing:"0.04em",flexShrink:0,whiteSpace:"nowrap",boxShadow:"0 3px 12px rgba(0,87,231,0.45)"}}>
          <span style={{fontSize:"1rem"}}>💬</span> TEXT US
        </a>
      </div>

      {/* SERVICE STATUS PANEL */}
      {mapOpen && (
        <div style={{position:"fixed",inset:0,zIndex:500,display:"flex",flexDirection:"column"}} onClick={()=>setMapOpen(false)}>
          <div style={{flex:1,background:"rgba(0,0,0,0.6)"}}/>
          <div style={{background:"#000",borderRadius:"20px 20px 0 0",padding:"0 0 40px",maxHeight:"70vh",overflowY:"auto",border:"1px solid rgba(255,255,255,0.1)",borderBottom:"none"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px 12px",borderBottom:"1px solid rgba(255,255,255,0.1)"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:dutyStatus?.is_on_duty?"#22C55E":"#EF4444",display:"inline-block",boxShadow:dutyStatus?.is_on_duty?"0 0 8px #22C55E":"0 0 6px #EF4444"}}/>
                <span style={{color:"#fff",fontWeight:800,fontSize:"1rem",letterSpacing:"0.04em"}}>SERVICE STATUS</span>
              </div>
              <button onClick={()=>setMapOpen(false)} style={{background:"rgba(255,255,255,0.1)",border:"none",color:"#fff",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:"1.1rem",display:"flex",alignItems:"center",justifyContent:"center"}}>X</button>
            </div>
            <div style={{padding:"32px 24px",textAlign:"center"}}>
              {dutyStatus?.is_on_duty ? (
                <>
                  <div style={{fontSize:"2.5rem",marginBottom:12}}></div>
                  <div style={{color:"#fff",fontWeight:800,fontSize:"1.1rem",marginBottom:8}}>cityFUNHOP is live now.</div>
                  <div style={{color:"rgba(255,255,255,0.6)",fontSize:"0.82rem",lineHeight:1.6,marginBottom:24}}>Your cityFUNHOP guide is on duty and available for experiences.</div>
                  <a href="/request"
                    onClick={()=>setMapOpen(false)}
                    style={{display:"inline-block",padding:"13px 28px",borderRadius:12,
                      background:"#0B1D3A",
                      color:"#00FF88",fontWeight:900,fontSize:"0.9rem",textDecoration:"none",
                      border:"1.5px solid #00FF88",boxShadow:"0 0 12px rgba(0,255,136,0.3)"}}>
                    Request a Hop Now
                  </a>
                </>
              ) : (
                <>
                  <div style={{fontSize:"2.5rem",marginBottom:12}}></div>
                  <div style={{color:"#fff",fontWeight:800,fontSize:"1.1rem",marginBottom:8}}>cityFUNHOP is not live right now.</div>
                  <div style={{color:"rgba(255,255,255,0.6)",fontSize:"0.82rem",lineHeight:1.6,marginBottom:24}}>
                    You can still request a future hop or schedule a City Tour experience.
                  </div>
                  <a href="/request"
                    onClick={()=>setMapOpen(false)}
                    style={{display:"inline-block",padding:"13px 28px",borderRadius:12,
                      background:"#0B1D3A",
                      color:"#4ADE80",fontWeight:900,fontSize:"0.9rem",textDecoration:"none",
                      border:"1.5px solid #4ADE80",marginBottom:12}}>
                    Request a Future Hop
                  </a>
                  <div style={{marginTop:16}}>
                    <a href="https://citytourguide.app" target="_blank" rel="noreferrer"
                      style={{color:"rgba(255,255,255,0.8)",fontSize:"0.82rem",textDecoration:"underline"}}>
                      Schedule a City Tour experience
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}


      {/* HERO CAROUSEL */}
      <div style={{position:"relative",width:"100%",overflow:"hidden",background:"#000"}}>
        <Carousel/>
      </div>

      {/* IDENTITY CARD — cityFUNHOP title block */}
      <div style={{background:"#000",padding:"0"}}>
        <a href="/request?type=scheduled" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,background:"#000",border:"none",borderBottom:"1px solid rgba(255,255,255,0.08)",padding:"14px 20px 12px",textDecoration:"none",textAlign:"center"}}>
          <div style={{width:60,height:60,borderRadius:14,background:"rgba(5,150,105,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"2rem",marginBottom:2}}>🛺</div>
          <div style={{fontWeight:800,fontSize:"0.72rem",color:"#00FF88",lineHeight:1.2,letterSpacing:"0.12em",textTransform:"uppercase"}}>HOP ON, HOP OFF TOURS</div>
          <div style={{fontWeight:900,fontSize:"clamp(1.8rem,6vw,2.2rem)",color:"#00FF88",lineHeight:1.1,letterSpacing:"-0.02em"}}>cityFUNHOP</div>
          <div style={{fontSize:"0.78rem",color:"rgba(255,255,255,0.8)",marginTop:2,maxWidth:260}}>City experiences. On demand.</div>
        </a>
      </div>



      {/* DRIVER STATUS PANEL */}
      <section style={{padding:"20px 16px 0"}}>
        <div style={{background:"#0B1D3A",border:"1px solid rgba(5,150,105,0.35)",borderRadius:12,overflow:"hidden"}}>
          <div style={{padding:"20px 20px 16px",textAlign:"center"}}>
            {dutyStatus === null ? (
              <div style={{color:"rgba(255,255,255,0.6)",fontSize:"0.85rem",padding:"8px 0"}}>Checking service status...</div>
            ) : dutyStatus.is_on_duty ? (
              <>
                <div style={{display:"flex",justifyContent:"center",marginBottom:6}}>
                  <span style={{
                    display:"inline-flex",alignItems:"center",gap:8,
                    background:"#00FF88",
                    color:"#0B1D3A",
                    fontWeight:900,fontSize:"0.88rem",
                    padding:"6px 16px 6px 10px",
                    borderRadius:999,
                    boxShadow:"0 0 12px rgba(0,255,136,0.3)",
                    letterSpacing:"0.01em"
                  }}>
                    <span style={{width:8,height:8,background:"#0B1D3A",borderRadius:"50%",display:"inline-block",flexShrink:0}}/>
                    🛺 cityFUNHOP is Live
                  </span>
                </div>
                <div style={{color:"rgba(255,255,255,0.8)",fontSize:"0.82rem",marginBottom:12,fontWeight:600}}>cityFUNHOP is available nearby.</div>

                {/* Map — always visible when on duty */}
                <div style={{marginBottom:12,borderRadius:16,overflow:"hidden",border:"2px solid #1a1a2e",boxShadow:"0 2px 12px rgba(0,0,0,0.15)"}}>
                  <iframe
                    src={driverPos
                      ? `https://www.openstreetmap.org/export/embed.html?bbox=${driverPos.lng-0.005},${driverPos.lat-0.005},${driverPos.lng+0.005},${driverPos.lat+0.005}&layer=mapnik&marker=${driverPos.lat},${driverPos.lng}`
                      : `https://www.openstreetmap.org/export/embed.html?bbox=-82.475,27.938,-82.445,27.958&layer=mapnik&marker=27.948,-82.460`
                    }
                    style={{width:"100%",height:240,border:"none",display:"block"}}
                    title="Driver location"
                  />
                  <div style={{background:"#0B1D3A",padding:"9px 16px",display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:"0.85rem"}}>📍</span><span style={{color:"#00FF88",fontSize:"0.74rem",fontWeight:700}}>Your guide is nearby · updates every minute</span></div>// REPLACED
                </div>


                {/* Geo-triggered content card */}
                {driverContent && (
                  <div style={{
                    background:"#fff",
                    border:"1px solid #E5E7EB",
                    borderLeft:"4px solid #00FF88",
                    borderRadius:12,
                    padding:"14px 16px",
                    marginBottom:12,
                    textAlign:"left",
                    boxShadow:"0 1px 6px rgba(0,0,0,0.07)"
                  }}>
                    {driverContent.image_url && (
                      <img
                        src={driverContent.image_url}
                        alt=""
                        style={{width:"100%",maxHeight:110,objectFit:"cover",borderRadius:8,marginBottom:10,display:"block"}}
                        onError={e => { e.currentTarget.style.display='none'; }}
                      />
                    )}
                    <div style={{color:"#0B1D3A",fontWeight:800,fontSize:"0.9rem",marginBottom:5,lineHeight:1.3}}>{driverContent.title}</div>
                    <div style={{color:"#6B7280",fontSize:"0.79rem",lineHeight:1.55,marginBottom:driverContent.cta_text?10:0}}>{driverContent.body}</div>
                    {driverContent.cta_text && driverContent.cta_url && (
                      <a href={driverContent.cta_url} target="_blank" rel="noopener noreferrer"
                        style={{display:"inline-block",padding:"9px 20px",background:"#00FF88",color:"#0B1D3A",fontWeight:900,fontSize:"0.78rem",borderRadius:24,textDecoration:"none",border:"none"}}>
                        {driverContent.cta_text}
                      </a>
                    )}
                  </div>
                )}

                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  <a href="https://hopper.citytourguide.app/request"
                    style={{display:"block",padding:"13px",background:"#0B1D3A",color:"#00FF88",fontWeight:900,fontSize:"0.9rem",textDecoration:"none",borderRadius:12,textAlign:"center",border:"1.5px solid #00FF88",boxShadow:"0 0 12px rgba(0,255,136,0.3)"}}>
                    Request a Hop Now
                  </a>
                </div>
              </>
            ) : (
              <>
                <div style={{background:"#00FF88",borderRadius:16,padding:"4px"}}>
                  <a href="/request?type=scheduled"
                    style={{display:"flex",flexDirection:"row",alignItems:"center",justifyContent:"center",gap:12,padding:"14px 20px",background:"#000",borderRadius:13,textDecoration:"none"}}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span style={{fontSize:"0.88rem",color:"#fff",fontWeight:700,letterSpacing:"0.01em"}}>Tap To Schedule Your Future HOP</span>
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* YOUR RIDE -- animated golf cart */}
      <section style={{padding:"20px 16px 0"}}>

        <div style={{background:"#fff",border:"1px solid #E5E7EB",borderRadius:14,padding:"24px 16px 20px",overflow:"hidden"}}>
          <div style={{fontWeight:700,fontSize:"0.9rem",color:"#0B1D3A",textAlign:"center",marginBottom:24}}>Explore Tampa, One HOP at a time</div>
          <div style={{position:"relative",height:60,margin:"0 4px"}}>
            {/* Road */}
            <div style={{position:"absolute",top:14,left:0,right:0,height:3,background:"#F3F4F6",borderRadius:99,overflow:"hidden"}}>
              <div style={{height:"100%",background:"linear-gradient(90deg,#00B761,#00E87A)",borderRadius:99,animation:"roadFill 5s ease-in-out infinite"}}/>
            </div>
            {/* Stop dots + labels */}
            {[{n:"Ybor City",p:"15%"},{n:"Downtown",p:"50%"},{n:"Harbour Island",p:"85%"}].map((s,i)=>(
              <div key={i} style={{position:"absolute",top:7,left:s.p,transform:"translateX(-50%)",textAlign:"center",minWidth:56}}>
                <div style={{width:14,height:14,borderRadius:"50%",background:"#00B761",border:"2.5px solid #fff",boxShadow:"0 0 7px rgba(0,183,97,0.55)",margin:"0 auto 6px"}}/>
                <div style={{fontSize:"0.75rem",fontWeight:700,color:"#374151",lineHeight:1.2,whiteSpace:"nowrap"}}>{s.n}</div>
              </div>
            ))}
            <div style={{position:"absolute",top:-2,fontSize:"1.7rem",animation:"cartRide 5s ease-in-out infinite",willChange:"left"}}>
              {'\u{1F6FA}'}
            </div>
          </div>
          <div style={{textAlign:"center",marginTop:18,fontSize:"0.78rem",color:"#9CA3AF",fontWeight:500}}>Select a pickup location from our service areas</div>
        </div>
      </section>

      {/* USE CASE ROTATOR */}
      <div style={{background:"#fff",padding:"20px 20px 16px",borderBottom:"1px solid #F3F4F6"}}>
        <div style={{display:"inline-flex",background:"#F3F4F6",borderRadius:999,padding:"4px 12px",fontSize:"0.75rem",fontWeight:800,letterSpacing:"0.1em",color:"#0066FF",marginBottom:10,textTransform:"uppercase"}}>{uc.tag}</div>
        <div style={{fontWeight:900,fontSize:"1.25rem",color:"#0B1D3A",marginBottom:8,lineHeight:1.25}}>{uc.h}</div>
        <div style={{fontSize:"0.82rem",color:"#6B7280",lineHeight:1.65,marginBottom:14}}>{uc.b}</div>
      </div>

      {/* WHAT'S HOPPIN'? -- static v1 */}
      <section style={{padding:"24px 0 0"}}>
        <div style={{padding:"0 16px",marginBottom:18}}>
          <div style={{fontSize:"0.8rem",fontWeight:800,color:"#0066FF",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:6}}>Local Picks</div>
          <div style={{fontWeight:900,fontSize:"1.25rem",color:"#0B1D3A",lineHeight:1.25,marginBottom:6}}>What's Hoppin'?</div>
          <div style={{fontSize:"0.82rem",color:"#6B7280",lineHeight:1.55}}>Hot spots, happy hours, events, and local stops worth hopping to.</div>
        </div>
        {/* Horizontal scroll strip -- no scrollbar on mobile */}
        <div style={{
          display:"flex",gap:12,
          overflowX:"auto",
          paddingLeft:16,paddingRight:16,paddingBottom:20,
          scrollbarWidth:"none",
          WebkitOverflowScrolling:"touch"
        }}>
          {HOPPIN.map((c,i)=>(
            <div key={i} style={{
              minWidth:215,maxWidth:215,
              borderRadius:18,
              background:`linear-gradient(145deg,${c.from},${c.to})`,
              border:`1px solid ${c.border}`,
              padding:"20px 16px 16px",
              flexShrink:0,
              display:"flex",flexDirection:"column",gap:10,
              boxShadow:"0 6px 24px rgba(0,0,0,0.28)"
            }}>
              {/* Category accent label */}
              <div style={{
                fontSize:"0.6rem",fontWeight:900,
                color:c.accent,
                letterSpacing:"0.14em",
                textTransform:"uppercase"
              }}>{c.cat}</div>
              {/* Title */}
              <div style={{
                fontWeight:900,fontSize:"1.05rem",
                color:"#fff",lineHeight:1.25
              }}>{c.title}</div>
              {/* Description */}
              <div style={{
                fontSize:"0.77rem",
                color:"rgba(255,255,255,0.62)",
                lineHeight:1.65,flex:1
              }}>{c.desc}</div>
              {/* v1 chip */}
              <div style={{marginTop:6}}>
                <span style={{
                  display:"inline-block",
                  fontSize:"0.75rem",fontWeight:800,
                  color:c.accent,
                  background:c.chipBg,
                  border:`1px solid ${c.border}`,
                  borderRadius:999,
                  padding:"4px 11px"
                }}>Coming Soon</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* NEIGHBORHOODS */}
      <section style={{padding:"20px 16px 0"}}>
        <div style={{fontSize:"0.7rem",fontWeight:800,color:"#0066FF",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10}}>Areas We Serve</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
          {HOODS.map(h=>(
            <Link key={h} href={"/request?neighborhood="+encodeURIComponent(h)} className="hood-pill"
              style={{background:"#fff",border:"1.5px solid #E5E7EB",borderRadius:999,padding:"8px 14px",fontSize:"0.78rem",fontWeight:600,color:"#374151",transition:"all 0.15s"}}>
              {h}
            </Link>
          ))}
        </div>
      </section>

      {/* SOCIAL - identical to tours.citytourguide.app */}
      <section style={{padding:"20px 16px 0"}}>
        <div style={{fontSize:"0.7rem",fontWeight:800,color:"#0066FF",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:16}}>Connect With Us</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <a href="https://maps.app.goo.gl/eCWEvUwCbrFnbwjo6" target="_blank" rel="noopener noreferrer"
            style={{display:"flex",alignItems:"center",gap:"16px",background:"#fff",border:"2px solid #E5E7EB",borderRadius:"14px",padding:"16px 18px",textDecoration:"none",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",transition:"border-color 0.2s,box-shadow 0.2s"}}
            onMouseOver={e=>{e.currentTarget.style.borderColor="#4285F4";e.currentTarget.style.boxShadow="0 3px 12px rgba(66,133,244,0.2)"}}
            onMouseOut={e=>{e.currentTarget.style.borderColor="#E5E7EB";e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.06)"}}>
            <div style={{width:"44px",height:"44px",borderRadius:"10px",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:"#fff",border:"1px solid #E5E7EB"}}>
              <svg viewBox="0 0 24 24" width="26" height="26"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            </div>
            <div style={{flex:1}}><div style={{color:"#111827",fontWeight:800,fontSize:"1rem",lineHeight:1.2}}>Google</div><div style={{color:"#374151",fontSize:"0.88rem",marginTop:"2px"}}>Follow &amp; leave a review</div></div>
            <div style={{color:"#9CA3AF",fontSize:"1.3rem",fontWeight:700}}></div>
          </a>
          <a href="https://www.instagram.com/citytourguideinc/" target="_blank" rel="noopener noreferrer"
            style={{display:"flex",alignItems:"center",gap:"16px",background:"#fff",border:"2px solid #E5E7EB",borderRadius:"14px",padding:"16px 18px",textDecoration:"none",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",transition:"border-color 0.2s,box-shadow 0.2s"}}
            onMouseOver={e=>{e.currentTarget.style.borderColor="#E1306C";e.currentTarget.style.boxShadow="0 3px 12px rgba(225,48,108,0.2)"}}
            onMouseOut={e=>{e.currentTarget.style.borderColor="#E5E7EB";e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.06)"}}>
            <div style={{width:"44px",height:"44px",borderRadius:"10px",flexShrink:0,overflow:"hidden"}}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44" width="44" height="44"><defs><radialGradient id="igGrad" cx="30%" cy="107%" r="150%"><stop offset="0%" stopColor="#fdf497"/><stop offset="10%" stopColor="#fdf497"/><stop offset="50%" stopColor="#fd5949"/><stop offset="68%" stopColor="#d6249f"/><stop offset="100%" stopColor="#285AEB"/></radialGradient></defs><rect width="44" height="44" rx="10" fill="url(#igGrad)"/><rect x="10" y="10" width="24" height="24" rx="6" fill="none" stroke="#fff" strokeWidth="2"/><circle cx="22" cy="22" r="6" fill="none" stroke="#fff" strokeWidth="2"/><circle cx="28.5" cy="15.5" r="1.5" fill="#fff"/></svg>
            </div>
            <div style={{flex:1}}><div style={{color:"#111827",fontWeight:800,fontSize:"1rem",lineHeight:1.2}}>Instagram</div><div style={{color:"#374151",fontSize:"0.88rem",marginTop:"2px"}}>@citytourguideinc</div></div>
            <div style={{color:"#9CA3AF",fontSize:"1.3rem",fontWeight:700}}></div>
          </a>
          <a href="https://facebook.com/citytourguideinc" target="_blank" rel="noopener noreferrer"
            style={{display:"flex",alignItems:"center",gap:"16px",background:"#fff",border:"2px solid #E5E7EB",borderRadius:"14px",padding:"16px 18px",textDecoration:"none",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",transition:"border-color 0.2s,box-shadow 0.2s"}}
            onMouseOver={e=>{e.currentTarget.style.borderColor="#1877F2";e.currentTarget.style.boxShadow="0 3px 12px rgba(24,119,242,0.2)"}}
            onMouseOut={e=>{e.currentTarget.style.borderColor="#E5E7EB";e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.06)"}}>
            <div style={{width:"44px",height:"44px",borderRadius:"10px",flexShrink:0,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",background:"#1877F2"}}>
              <svg viewBox="0 0 24 24" width="28" height="28"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24V15.563H7.078v-3.49h3.047V9.356c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.971H15.83c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" fill="#fff"/></svg>
            </div>
            <div style={{flex:1}}><div style={{color:"#111827",fontWeight:800,fontSize:"1rem",lineHeight:1.2}}>Facebook</div><div style={{color:"#374151",fontSize:"0.88rem",marginTop:"2px"}}>citytourguideinc</div></div>
            <div style={{color:"#9CA3AF",fontSize:"1.3rem",fontWeight:700}}></div>
          </a>
          <a href="https://youtube.com/@citytourguideinc" target="_blank" rel="noopener noreferrer"
            style={{display:"flex",alignItems:"center",gap:"16px",background:"#fff",border:"2px solid #E5E7EB",borderRadius:"14px",padding:"16px 18px",textDecoration:"none",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",transition:"border-color 0.2s,box-shadow 0.2s"}}
            onMouseOver={e=>{e.currentTarget.style.borderColor="#FF0000";e.currentTarget.style.boxShadow="0 3px 12px rgba(255,0,0,0.2)"}}
            onMouseOut={e=>{e.currentTarget.style.borderColor="#E5E7EB";e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.06)"}}>
            <div style={{width:"44px",height:"44px",borderRadius:"10px",flexShrink:0,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",background:"#FF0000"}}>
              <svg viewBox="0 0 24 24" width="28" height="28"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#fff"/></svg>
            </div>
            <div style={{flex:1}}><div style={{color:"#111827",fontWeight:800,fontSize:"1rem",lineHeight:1.2}}>YouTube</div><div style={{color:"#374151",fontSize:"0.88rem",marginTop:"2px"}}>Subscribe for tour videos</div></div>
            <div style={{color:"#9CA3AF",fontSize:"1.3rem",fontWeight:700}}></div>
          </a>
        </div>
      </section>

      {/* REVIEWS - full, identical to tours.citytourguide.app */}
      <section style={{padding:"20px 16px 0"}}>
        <div style={{fontSize:"0.7rem",fontWeight:800,color:"#0066FF",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>Reviews</div>
        <div style={{fontWeight:900,fontSize:"1.1rem",color:"#111827",marginBottom:14}}>What guests say</div>

        {/* DB-approved reviews — rotating carousel matching Tours style */}
        {reviews.length>0 && (()=>{
          const [cIdx,setCIdx]=useState(0);
          useEffect(()=>{
            const t=setInterval(()=>setCIdx(i=>(i+1)%reviews.length),5000);
            return ()=>clearInterval(t);
          },[reviews.length]);
          return (
            <div style={{position:'relative',marginBottom:12}}>
              {reviews.map((r,i)=>(
                <div key={r.id||i} style={{display:i===cIdx?'block':'none'}}>
                  <div style={{background:'#fff',border:'1px solid #E5E7EB',borderRadius:14,padding:'16px',marginBottom:4}}>
                    {r.image_url && <img src={r.image_url} alt={`${r.reviewer_name}'s photo`} style={{width:'100%',maxHeight:220,objectFit:'cover',borderRadius:12,marginBottom:12,border:'1px solid #E5E7EB'}}/>}
                    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                      <div style={{width:36,height:36,borderRadius:'50%',background:'#0066FF',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'1rem',flexShrink:0}}>
                        {(r.reviewer_name||'G')[0]}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:700,fontSize:'0.88rem',color:'#111827'}}>{r.reviewer_name||'Guest'}</div>
                        <div style={{fontSize:'0.72rem',color:'#6B7280',marginTop:2}}>
                          {r.tour_date ? new Date(r.tour_date).toLocaleDateString('en-US',{month:'long',year:'numeric'}) : 'Verified booking'}
                          {r.tour_type && <span style={{marginLeft:6,fontSize:'0.65rem',padding:'1px 7px',borderRadius:999,background:'#FEF3C7',color:'#92400E',fontWeight:700}}>{r.tour_type}</span>}
                        </div>
                      </div>
                      <div style={{color:'#F59E0B',fontSize:'0.9rem',flexShrink:0}}>{'★'.repeat(r.stars||5)}</div>
                    </div>
                    <p style={{fontSize:'0.85rem',color:'#374151',lineHeight:1.65,margin:0}}>{r.review_text}</p>
                  </div>
                </div>
              ))}
              <div style={{display:'flex',justifyContent:'center',gap:6,marginTop:8}}>
                {reviews.map((_,i)=>(
                  <button key={i} onClick={()=>setCIdx(i)}
                    style={{width:i===cIdx?20:7,height:7,borderRadius:999,border:'none',cursor:'pointer',
                      background:i===cIdx?'#0066FF':'#D1D5DB',transition:'all 0.25s',padding:0}} />
                ))}
              </div>
            </div>
          );
        })()}

        {/* GetYourGuide reviews — same card style as Tours with source badge */}
        {(reviews.length===0 ? (showAll ? GYG_REVIEWS : GYG_REVIEWS.slice(0,5)) : GYG_REVIEWS.slice(0,3)).map((r,i)=>(
          <div key={i} style={{background:'#fff',border:'1px solid #E5E7EB',borderRadius:14,padding:'16px',marginBottom:10}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
              <div style={{width:36,height:36,borderRadius:'50%',background:'#F97316',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'1rem',flexShrink:0}}>
                {r.name[0]}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:'0.88rem',color:'#111827'}}>{r.name} <span style={{color:'#9CA3AF',fontWeight:400}}>· {r.country}</span></div>
                <div style={{fontSize:'0.72rem',color:'#6B7280',marginTop:2,display:'flex',alignItems:'center',gap:6}}>
                  {r.date} · Verified booking
                  {r.source && <span style={{display:'inline-flex',alignItems:'center',gap:3,fontSize:'0.65rem',padding:'1px 7px',borderRadius:999,background:'#FFF0E6',color:'#C45A00',fontWeight:700,border:'1px solid #FFD0A8'}}>via {r.source}</span>}
                </div>
              </div>
              <div style={{color:'#F59E0B',fontSize:'0.9rem',flexShrink:0}}>{'★'.repeat(r.stars)}</div>
            </div>
            <p style={{fontSize:'0.85rem',color:'#374151',lineHeight:1.65,margin:0}}>{r.text}</p>
          </div>
        ))}

        <button onClick={()=>setShowAll(a=>!a)}
          style={{marginTop:4,width:"100%",padding:"12px",background:"none",border:"2px solid #E5E7EB",borderRadius:"12px",color:"#374151",fontWeight:700,fontSize:"0.88rem",cursor:"pointer",fontFamily:"inherit"}}>
          {showAll ? "\u2b06 Show fewer reviews" : "\u2b07 Show more reviews"}
        </button>

        {/* RATE YOUR EXPERIENCE — tours style */}
        <section style={{background:'#fff',borderTop:'1px solid #F1F5F9',padding:'28px 16px 32px',textAlign:'center',marginTop:4,borderRadius:14}}>
        {!reviewDrawerOpen ? (
          <div>
            <div style={{display:'flex',justifyContent:'center',gap:4,marginBottom:8}}>
              {[1,2,3,4,5].map(s=><span key={s} style={{fontSize:'1.5rem',color:'#F59E0B',lineHeight:1}}>★</span>)}
            </div>
            <p style={{margin:'0 0 16px',color:'#6B7280',fontSize:'0.88rem'}}>Been on a Hop? We&apos;d love to hear from you.</p>
            <button
              onClick={()=>setReviewDrawerOpen(true)}
              style={{display:'inline-flex',alignItems:'center',gap:10,padding:'14px 28px',
                background:'#fff',border:'2px solid #F59E0B',borderRadius:999,
                color:'#92400E',fontWeight:700,fontSize:'0.95rem',cursor:'pointer',
                boxShadow:'0 2px 12px rgba(245,158,11,0.15)',transition:'all 0.2s'}}
              onMouseOver={e=>{e.currentTarget.style.background='#FFFBEB';}}
              onMouseOut={e=>{e.currentTarget.style.background='#fff';}}>
              ⭐ Rate Your Experience
            </button>
          </div>
        ) : (
          <div style={{maxWidth:520,margin:'0 auto',textAlign:'left'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
              <div>
                <div style={{fontSize:'0.68rem',fontWeight:700,color:'#D97706',textTransform:'uppercase',letterSpacing:'0.1em'}}>⭐ Share Your Experience</div>
                <h2 style={{margin:'4px 0 0',fontSize:'1.25rem',color:'#111827',letterSpacing:'-0.02em'}}>Rate Your HOP</h2>
              </div>
              <button onClick={()=>setReviewDrawerOpen(false)}
                style={{width:36,height:36,borderRadius:'50%',border:'1px solid #E5E7EB',background:'#F9FAFB',cursor:'pointer',fontSize:'1rem',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
            </div>
            <div style={{background:'#fff',borderRadius:16,border:'1px solid #E5E7EB',padding:'20px',boxShadow:'0 4px 20px rgba(0,0,0,0.06)'}}>
              <HopperReviewForm onClose={()=>setReviewDrawerOpen(false)} />
            </div>
          </div>
        )}
        </section>


      </section>

      {/* FOOTER CTA */}
      <div style={{padding:"24px 16px 48px"}}>
        <a href="/request" style={{display:"block",textAlign:"center",padding:"15px",borderRadius:12,background:"#0B1D3A",color:"#00FF88",fontWeight:900,fontSize:"1.1rem",border:"1.5px solid #00FF88",boxShadow:"0 0 12px rgba(0,255,136,0.3)",textDecoration:"none"}}>
          🛺 Book Your City Hop
        </a>
        <div style={{textAlign:"center",marginTop:12,fontSize:"0.82rem",color:"#9CA3AF"}}>City Tour Guide Inc. · Tampa, FL · Licensed &amp; Insured</div>
        <div style={{textAlign:"center",marginTop:8,fontSize:"0.78rem",color:"#9CA3AF",lineHeight:1.6,maxWidth:340,margin:"8px auto 0"}}>City Tour Guide connects guests with featured local destinations, attractions, dining, entertainment, and curated city experiences.</div>
      </div>

      

    </div>
  );
}

// ── HopperReviewForm — standalone component (tours style, hopper branded) ──
function HopperReviewForm({ onClose }) {
  const [rName,     setRName]     = useState('');
  const [rStars,    setRStars]    = useState(0);
  const [rHover,    setRHover]    = useState(0);
  const [rText,     setRText]     = useState('');
  const [rDate,     setRDate]     = useState('');
  const [rTourType, setRTourType] = useState('');
  const [rSending,  setRSending]  = useState(false);
  const [rPosted,   setRPosted]   = useState({});
  const [rErr,      setRErr]      = useState('');
  const [submitted, setSubmitted] = useState(false);

  const PLATFORMS = [
    { key:'google',   label:'⭐ Google Reviews',  url:'https://g.page/r/CXnbLbLBAqvjEBM/review',                    color:'#4285F4' },
    { key:'facebook', label:'👍 Facebook Reviews', url:'https://www.facebook.com/citytourguideinc/reviews',          color:'#1877F2' },
    { key:'yelp',     label:'🌟 Yelp',             url:'https://www.yelp.com/biz/city-tour-guide-tampa',             color:'#D32323' },
  ];

  async function submitReview(e) {
    e.preventDefault();
    if(!rName||!rText||!rStars) { setRErr('Please fill in all required fields.'); return; }
    setRSending(true); setRErr('');
    try {
      await fetch('https://tours.citytourguide.app/api/book/review',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({name:rName,stars:rStars,text:rText,tourDate:rDate||null,tourType:rTourType||'cityFUNHOP Experience',platform:'cityFUNHOP'}),
      });
      setSubmitted(true);
    } catch(e2){ setRErr('Something went wrong. Please try again.'); }
    setRSending(false);
  }

  if(submitted) {
    const stars = '★'.repeat(rStars);
    const copyText = stars + ' — cityFUNHOP Tampa\n\n' + rText + '\n\n— ' + rName + ', City Tour Guide Tampa';
    return (
      <div>
        <div style={{textAlign:'center',marginBottom:20}}>
          <div style={{fontSize:'2rem',marginBottom:8}}>🎉</div>
          <div style={{fontWeight:800,fontSize:'1rem',color:'#111827',marginBottom:4}}>Review submitted!</div>
          <div style={{fontSize:'0.82rem',color:'#374151',lineHeight:1.5}}>Your review is live! Tap any platform below — your review text is copied automatically.</div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:16}}>
          {PLATFORMS.map(({key,label,url,color})=>{
            const done = rPosted[key];
            return (
              <button key={key}
                onClick={()=>{ navigator.clipboard?.writeText(copyText).catch(()=>{}); window.open(url,'_blank'); setRPosted(p=>({...p,[key]:true})); }}
                style={{display:'flex',alignItems:'center',justifyContent:'space-between',
                  padding:'13px 16px',border:`2px solid ${done?'#E5E7EB':color}`,borderRadius:12,
                  background:done?'#F9FAFB':'#fff',color:done?'#9CA3AF':'#111827',
                  fontWeight:700,fontSize:'0.88rem',cursor:done?'default':'pointer',transition:'all 0.25s',opacity:done?0.7:1}}>
                <span>{done?'✓ ':''}{label}</span>
                {done ? <span style={{fontSize:'0.72rem',color:'#9CA3AF',fontWeight:500}}>Posted ✓</span>
                      : <span style={{fontSize:'0.72rem',color:color,fontWeight:600}}>Copy &amp; Open →</span>}
              </button>
            );
          })}
        </div>
        <button onClick={onClose} style={{width:'100%',padding:'11px',borderRadius:12,border:'1px solid #D1FAE5',background:'#fff',color:'#059669',fontWeight:700,fontSize:'0.88rem',cursor:'pointer'}}>Done ✓</button>
      </div>
    );
  }

  return (
    <form onSubmit={submitReview} style={{display:'flex',flexDirection:'column',gap:16}}>
      {/* Stars */}
      <div>
        <div style={{fontSize:'0.72rem',fontWeight:700,color:'#111827',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>Your Rating *</div>
        <div style={{display:'flex',gap:6}}>
          {[1,2,3,4,5].map(s=>(
            <button key={s} type="button"
              onMouseEnter={()=>setRHover(s)} onMouseLeave={()=>setRHover(0)}
              onClick={()=>setRStars(s)}
              style={{background:'none',border:'none',cursor:'pointer',fontSize:'2rem',lineHeight:1,padding:'2px',
                color:(rHover||rStars)>=s?'#F59E0B':'#D1D5DB',transition:'color 0.1s,transform 0.1s',
                transform:(rHover||rStars)>=s?'scale(1.12)':'scale(1)'}}>★</button>
          ))}
          <span style={{marginLeft:8,fontSize:'0.82rem',color:'#6B7280',alignSelf:'center',fontWeight:500}}>
            {['','Poor','Fair','Good','Great','Excellent!'][rHover||rStars]}
          </span>
        </div>
      </div>
      {/* Experience type */}
      <div>
        <label style={{fontSize:'0.72rem',fontWeight:700,color:'#111827',textTransform:'uppercase',letterSpacing:'0.06em',display:'block',marginBottom:6}}>Experience Type</label>
        <select value={rTourType} onChange={e=>setRTourType(e.target.value)}
          style={{width:'100%',padding:'10px 12px',border:'1px solid #D1D5DB',borderRadius:10,fontSize:'0.9rem',color:rTourType?'#111827':'#9CA3AF',boxSizing:'border-box'}}>
          <option value="" disabled>Select your experience…</option>
          <option value="On-Demand City Hop">🛺 On-Demand City Hop</option>
          <option value="Scheduled City Hop">📅 Scheduled City Hop</option>
          <option value="Private Charter">⭐ Private Charter</option>
          <option value="cityFUNHOP Experience">🌆 cityFUNHOP Experience</option>
        </select>
      </div>
      {/* Name */}
      <div>
        <label style={{fontSize:'0.72rem',fontWeight:700,color:'#111827',textTransform:'uppercase',letterSpacing:'0.06em',display:'block',marginBottom:6}}>Your Name *</label>
        <input required value={rName} onChange={e=>setRName(e.target.value)}
          placeholder="First name or initials" maxLength={60}
          style={{width:'100%',padding:'10px 12px',border:'1px solid #D1D5DB',borderRadius:10,fontSize:'0.9rem',boxSizing:'border-box'}} />
      </div>
      {/* Review text */}
      <div>
        <label style={{fontSize:'0.72rem',fontWeight:700,color:'#111827',textTransform:'uppercase',letterSpacing:'0.06em',display:'block',marginBottom:6}}>Your Review *</label>
        <textarea required value={rText} onChange={e=>setRText(e.target.value)}
          placeholder="Tell others what you loved about your cityFUNHOP experience..." rows={4} maxLength={1000}
          style={{width:'100%',padding:'10px 12px',border:'1px solid #D1D5DB',borderRadius:10,fontSize:'0.9rem',resize:'vertical',boxSizing:'border-box',fontFamily:'inherit'}} />
        <div style={{fontSize:'0.7rem',color:'#9CA3AF',marginTop:4,textAlign:'right'}}>{rText.length}/1000</div>
      </div>
      {/* Date */}
      <div>
        <label style={{fontSize:'0.72rem',fontWeight:700,color:'#111827',textTransform:'uppercase',letterSpacing:'0.06em',display:'block',marginBottom:6}}>Hop Date <span style={{fontWeight:400,textTransform:'none',fontSize:'0.7rem',color:'#9CA3AF'}}>(optional)</span></label>
        <input type="date" value={rDate} onChange={e=>setRDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          style={{width:'100%',padding:'10px 12px',border:'1px solid #D1D5DB',borderRadius:10,fontSize:'0.9rem',boxSizing:'border-box'}} />
      </div>
      {rErr && <div style={{background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:10,padding:'10px 14px',fontSize:'0.82rem',color:'#B91C1C'}}>{rErr}</div>}
      <button type="submit" disabled={rSending}
        style={{width:'100%',padding:14,borderRadius:14,border:'none',cursor:rSending?'not-allowed':'pointer',
          fontWeight:800,fontSize:'1rem',letterSpacing:'-0.01em',
          background:rSending?'#E5E7EB':'linear-gradient(135deg,#F59E0B,#D97706)',
          color:rSending?'#9CA3AF':'#fff',
          boxShadow:rSending?'none':'0 4px 14px rgba(217,119,6,0.35)',transition:'all 0.2s'}}>
        {rSending ? 'Submitting…' : '⭐ Submit My Review'}
      </button>
    </form>
  );
}
