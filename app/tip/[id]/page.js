"use client";
import { useState, useEffect } from "react";

const PRESETS = [
  { label: "15%", pct: 0.15 },
  { label: "20%", pct: 0.20 },
  { label: "25%", pct: 0.25 },
  { label: "30%", pct: 0.30 },
];

export default function TipPage({ params }) {
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(1);
  const [custom, setCustom] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Check if returning from Stripe tip payment
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("tip_success") === "1") {
      setSubmitted(true);
    }
    fetch("/api/hopper/request/" + params.id)
      .then(r => r.json())
      .then(d => { setRide(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const base = ride ? parseFloat(ride.offered_price || 0) : 0;
  const tipAmt = useCustom
    ? parseFloat(custom || 0)
    : parseFloat((base * PRESETS[selected].pct).toFixed(2));
  const total = base + tipAmt;

  const handleTip = async () => {
    if (submitting || tipAmt <= 0) return;
    setSubmitting(true);
    try {
      const r = await fetch("/api/hopper/tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: params.id, tipAmount: tipAmt }),
      });
      const d = await r.json();
      if (d.url) {
        window.location.href = d.url;
      } else {
        setSubmitting(false);
        alert(d.error || "Could not process tip. Please try again.");
      }
    } catch(e) {
      setSubmitting(false);
      alert("Network error. Please try again.");
    }
  };

  if (loading) return (
    <div className="ctg-page" style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh" }}>
      <div style={{ fontSize:"2rem" }}>⏳</div>
    </div>
  );

  if (submitted) return (
    <div className="ctg-page" style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", padding:"20px" }}>
      <div style={{ maxWidth:360, width:"100%", textAlign:"center" }}>
        <div style={{ fontSize:"4rem", marginBottom:16 }}>❤️</div>
        <h1 style={{ fontFamily:"Outfit,sans-serif", fontWeight:900, fontSize:"1.6rem", color:"#111827", marginBottom:8, letterSpacing:"-0.02em" }}>Thank You!</h1>
        <p style={{ color:"#6B7280", fontSize:"0.88rem", lineHeight:1.6, marginBottom:24 }}>Your driver really appreciates it. Hope to see you again around Tampa!</p>
        <div className="ctg-card" style={{ padding:18, marginBottom:20 }}>
          <div style={{ fontWeight:800, fontSize:"0.85rem", color:"#E8431A", marginBottom:4 }}>🛺 cityFUNHOP by City Tour Guide</div>
          <div style={{ color:"#9CA3AF", fontSize:"0.78rem" }}>833-813-8687 · citytourguide.app</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:8}}>
          <a href="https://maps.app.goo.gl/eCWEvUwCbrFnbwjo6" target="_blank" rel="noopener noreferrer"
            style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:"#4285F4",color:"#fff",fontWeight:700,fontSize:"0.88rem",padding:"13px 20px",borderRadius:12,textDecoration:"none"}}>
            ⭐ Leave a Google Review
          </a>
          <a href="https://www.getyourguide.com" target="_blank" rel="noopener noreferrer"
            style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:"#FF6B35",color:"#fff",fontWeight:700,fontSize:"0.88rem",padding:"13px 20px",borderRadius:12,textDecoration:"none"}}>
            🌐 Review on GetYourGuide
          </a>
          <a href="https://hopper.citytourguide.app" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:"#F3F4F6",color:"#374151",fontWeight:700,fontSize:"0.88rem",padding:"13px 20px",borderRadius:12,textDecoration:"none"}}>
            🛺 Book Another Ride
          </a>
        </div>
        <p style={{ color:"#D1D5DB", fontSize:"0.7rem", marginTop:12 }}>You may close this window.</p>
      </div>
    </div>
  );

  return (
    <div className="ctg-page" style={{ maxWidth:440, margin:"0 auto" }}>
      {/* Header */}
      <div style={{ background:"#0B1D3A", padding:"28px 20px 24px", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 70% 0%,rgba(232,67,26,0.2),transparent 60%)" }}/>
        <div style={{ fontSize:"2.2rem", marginBottom:10, position:"relative" }}>🛺</div>
        <div style={{ fontFamily:"Outfit,sans-serif", fontWeight:900, fontSize:"1.1rem", color:"#F5A623", marginBottom:4, position:"relative" }}>Rate Your Hopper Ride</div>
        <div style={{ color:"rgba(255,255,255,0.5)", fontSize:"0.78rem", position:"relative" }}>City Tour Guide Inc. · Tampa</div>
      </div>

      <div style={{ padding:"20px 18px 100px" }}>
        {/* Ride summary */}
        {ride && (
          <div className="ctg-card" style={{ padding:16, marginBottom:20 }}>
            <div className="ctg-section-label" style={{ marginBottom:12 }}>Your Ride</div>
            {[
              ["Pickup at", ride.neighborhood || "Tampa"],
              ["Guests", ride.guest_count],
            ].map(([k,v]) => (
              <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontSize:"0.84rem", color:"#6B7280" }}>{k}</span>
                <span style={{ fontSize:"0.84rem", fontWeight:700, color:"#111827" }}>{v}</span>
              </div>
            ))}
            <div style={{ display:"flex", justifyContent:"space-between", paddingTop:10, borderTop:"1px solid rgba(0,0,0,0.07)" }}>
              <span style={{ fontWeight:700, fontSize:"0.9rem" }}>Ride Total</span>
              <span style={{ fontWeight:900, fontSize:"1.1rem", color:"#111827" }}>${base.toFixed(2)}</span>
            </div>
          </div>
        )}

        <div style={{ marginBottom:16 }}>
          <div style={{ fontFamily:"Outfit,sans-serif", fontWeight:800, fontSize:"1.1rem", color:"#111827", marginBottom:4 }}>Add a gratuity?</div>
          <div style={{ color:"#6B7280", fontSize:"0.82rem", lineHeight:1.5 }}>100% goes directly to your driver.</div>
        </div>

        {/* Preset buttons */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:14 }}>
          {PRESETS.map((t,i) => (
            <button key={i} onClick={()=>{setSelected(i);setUseCustom(false);}}
              style={{ padding:"13px 0", borderRadius:12,
                border: !useCustom&&selected===i ? "2px solid #E8431A" : "1.5px solid rgba(0,0,0,0.1)",
                background: !useCustom&&selected===i ? "#FFF1EE" : "#fff",
                fontWeight:800, fontSize:"0.9rem",
                color: !useCustom&&selected===i ? "#E8431A" : "#4B5563",
                cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" }}>
              <div>{t.label}</div>
              <div style={{ fontSize:"0.68rem", fontWeight:600, marginTop:2,
                color: !useCustom&&selected===i ? "#C0392B" : "#9CA3AF" }}>
                ${base>0?(base*t.pct).toFixed(2):"—"}
              </div>
            </button>
          ))}
        </div>

        {/* Custom */}
        <div style={{ marginBottom:20 }}>
          <button onClick={()=>setUseCustom(u=>!u)}
            style={{ width:"100%", padding:"12px", borderRadius:12,
              border: useCustom ? "2px solid #E8431A" : "1.5px solid rgba(0,0,0,0.1)",
              background: useCustom ? "#FFF1EE" : "#fff",
              fontWeight:700, fontSize:"0.85rem",
              color: useCustom ? "#E8431A" : "#6B7280",
              cursor:"pointer", fontFamily:"inherit", marginBottom:10, transition:"all 0.15s" }}>
            ✏️ Custom Amount
          </button>
          {useCustom && (
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:16, top:"50%", transform:"translateY(-50%)", fontWeight:800, fontSize:"1.1rem", color:"#111827" }}>$</span>
              <input type="number" value={custom} onChange={e=>setCustom(e.target.value)}
                placeholder="0.00" step="0.01" min="0"
                style={{ width:"100%", border:"2px solid rgba(0,0,0,0.12)", borderRadius:12,
                  padding:"14px 14px 14px 28px", fontSize:"1.1rem", fontWeight:700,
                  textAlign:"center", fontFamily:"inherit", outline:"none", color:"#111827",
                  background:"#fff" }}/>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="ctg-card" style={{ padding:"14px 16px", marginBottom:20 }}>
          {[["Ride total", `$${base.toFixed(2)}`], ["Tip", `$${tipAmt.toFixed(2)}`]].map(([k,v])=>(
            <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:"0.84rem", color:"#6B7280" }}>{k}</span>
              <span style={{ fontSize:"0.84rem", fontWeight:600 }}>{v}</span>
            </div>
          ))}
          <div style={{ display:"flex", justifyContent:"space-between", paddingTop:10, borderTop:"1px solid rgba(0,0,0,0.07)" }}>
            <span style={{ fontWeight:800, fontSize:"0.95rem" }}>Total</span>
            <span style={{ fontWeight:900, fontSize:"1.15rem", color:"#E8431A" }}>${total.toFixed(2)}</span>
          </div>
        </div>

        {/* CTA */}
        <button onClick={handleTip} disabled={submitting}
          style={{ width:"100%",
            background: submitting ? "#E5E7EB" : "linear-gradient(135deg,#E8431A,#F05A28,#F5A623)",
            color: submitting ? "#9CA3AF" : "#fff",
            border:"none", borderRadius:9999, padding:"17px",
            fontWeight:700, fontSize:"0.95rem",
            cursor: submitting ? "not-allowed" : "pointer",
            fontFamily:"inherit",
            boxShadow: submitting ? "none" : "0 4px 18px rgba(232,67,26,0.35)",
            transition:"all 0.22s", marginBottom:12 }}>
          {submitting ? "Processing…" : `⭐ Tip Driver $${tipAmt.toFixed(2)}`}
        </button>
        <button onClick={()=>setSubmitted(true)}
          style={{ width:"100%", background:"none", border:"none", color:"#9CA3AF",
            fontSize:"0.82rem", cursor:"pointer", fontFamily:"inherit", padding:"10px", textDecoration:"underline" }}>
          No thanks, skip tip
        </button>

        <p style={{ textAlign:"center", color:"#D1D5DB", fontSize:"0.68rem", marginTop:16, lineHeight:1.5 }}>
          City Tour Guide Inc. · Tampa, FL · 833-813-8687
        </p>
      </div>
    </div>
  );
}