"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";

const TIPS = [0, 2, 5, 10];

export default function PayPage({ params: paramsProp }) {
  const params = use(paramsProp);
  const [req, setReq]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [tip, setTip]       = useState(5);
  const [customTip, setCustomTip] = useState("");
  const [tipMode, setTipMode] = useState("preset");
  const [paying, setPaying]   = useState(false);
  const [error, setError]     = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [showPromo, setShowPromo] = useState(false);

  useEffect(()=>{
    fetch("/api/hopper/request/"+params.id).then(r=>r.json()).then(d=>{setReq(d);setLoading(false);}).catch(()=>setLoading(false));
  },[params.id]);

  const tipAmount = tipMode==="custom" ? (parseFloat(customTip)||0) : tip;
  const total = req ? (Number(req.offered_price||0) + tipAmount) : 0;

  async function doPay() {
    setPaying(true); setError("");
    try {
      const r = await fetch("/api/hopper/pay",{      // was: /api/hopper/checkout
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({requestId:params.id,tipAmount,promoCode:promoCode.trim()||undefined})
      });
      const d = await r.json();
      if (d.url) window.location.href = d.url;
      else { setError(d.error||"Payment error. Please try again."); setPaying(false); }
    } catch { setError("Connection error. Please try again."); setPaying(false); }
  }

  if (loading) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Inter,sans-serif",fontSize:"2rem"}}>⏳</div>;

  return (
    <div style={{minHeight:"100vh",background:"#F9FAFB",fontFamily:"Inter,sans-serif"}}>
      <div style={{background:"#0B1D3A",padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
        <Link href={"/request/"+params.id} style={{color:"rgba(255,255,255,0.55)",fontSize:"0.8rem",textDecoration:"none"}}>← Back</Link>
        <div style={{flex:1,textAlign:"center",color:"#fff",fontWeight:800,fontSize:"0.95rem"}}>Pay + Tip</div>
        <div style={{width:40}}/>
      </div>

      <div style={{padding:"20px 16px",maxWidth:420,margin:"0 auto",display:"flex",flexDirection:"column",gap:14}}>

        <div style={{background:"#fff",border:"1.5px solid #E5E7EB",borderRadius:14,padding:"20px",textAlign:"center"}}>
          <div style={{fontSize:"0.78rem",color:"#6B7280",marginBottom:6}}>Your agreed ride price</div>
          <div style={{fontWeight:900,fontSize:"2.8rem",color:"#0044CC"}}>${req?.offered_price||0}</div>
          <div style={{fontSize:"0.75rem",color:"#9CA3AF",marginTop:6}}>{req?.pickup_notes} → {req?.dropoff_notes}</div>
        </div>

        <div style={{background:"#fff",border:"1.5px solid #E5E7EB",borderRadius:14,overflow:"hidden"}}>
          <div style={{padding:"14px 16px",borderBottom:"1px solid #F3F4F6",fontWeight:800,fontSize:"0.88rem",color:"#0B1D3A"}}>Add Gratuity 🙏</div>
          <div style={{padding:"14px 16px",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
            {TIPS.map(t=>(
              <button key={t} type="button" onClick={()=>{setTip(t);setTipMode("preset");}}
                style={{padding:"11px 4px",borderRadius:10,border:"2px solid",cursor:"pointer",fontWeight:700,fontSize:"0.82rem",fontFamily:"Inter,sans-serif",
                  borderColor:tipMode==="preset"&&tip===t?"#0066FF":"#E5E7EB",
                  background:tipMode==="preset"&&tip===t?"#EFF6FF":"#fff",
                  color:tipMode==="preset"&&tip===t?"#0044CC":"#374151"}}>
                {t===0?"None":"+$"+t}
              </button>
            ))}
          </div>
          <div style={{padding:"0 16px 14px",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:"0.78rem",color:"#9CA3AF",flexShrink:0}}>$</span>
            <input type="number" placeholder="Custom amount" value={customTip}
              onChange={e=>{setCustomTip(e.target.value);setTipMode("custom");}}
              onFocus={()=>setTipMode("custom")}
              style={{flex:1,padding:"10px 12px",borderRadius:10,border:"1.5px solid "+(tipMode==="custom"?"#0066FF":"#E5E7EB"),fontSize:"0.9rem",fontFamily:"Inter,sans-serif",color:"#111827"}} />
          </div>
        </div>

        {/* Promo / test code toggle */}
        <div style={{textAlign:"center"}}>
          <span
            onClick={()=>{setShowPromo(v=>!v); if(showPromo) setPromoCode("");}}
            style={{fontSize:"0.72rem",color:"#9CA3AF",cursor:"pointer",textDecoration:"underline",userSelect:"none"}}>
            {showPromo ? "Cancel code" : "Have a promo or test code?"}
          </span>
        </div>
        {showPromo && (
          <input
            id="promo-code-input"
            type="text"
            placeholder="Enter promo or test code"
            value={promoCode}
            onChange={e=>setPromoCode(e.target.value.toUpperCase())}
            maxLength={32}
            style={{padding:"11px 14px",borderRadius:10,border:"1.5px solid "+(promoCode?"#0066FF":"#E5E7EB"),
                    fontSize:"0.88rem",fontFamily:"Inter,sans-serif",letterSpacing:"0.08em",
                    color:"#111827",outline:"none",width:"100%",boxSizing:"border-box"}} />
        )}

        <div style={{background:"#0B1D3A",borderRadius:14,padding:"16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{color:"rgba(255,255,255,0.55)",fontSize:"0.72rem",marginBottom:2}}>Total due</div>
            <div style={{color:"#fff",fontWeight:900,fontSize:"2rem"}}>${total.toFixed(2)}</div>
          </div>
          <div style={{textAlign:"right",lineHeight:1.8}}>
            <div style={{color:"rgba(255,255,255,0.45)",fontSize:"0.7rem"}}>Ride ${req?.offered_price||0}</div>
            <div style={{color:"rgba(255,255,255,0.45)",fontSize:"0.7rem"}}>Tip ${tipAmount.toFixed(2)}</div>
          </div>
        </div>

        {error && <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:12,padding:"12px",fontSize:"0.82rem",color:"#991B1B"}}>{error}</div>}

        <button type="button" onClick={doPay} disabled={paying}
          style={{padding:"16px",borderRadius:14,border:"none",cursor:paying?"not-allowed":"pointer",background:"linear-gradient(135deg,#0057E7,#0095FF)",color:"#fff",fontWeight:900,fontSize:"1rem",fontFamily:"Inter,sans-serif",boxShadow:"0 6px 24px rgba(0,87,231,0.3)",opacity:paying?0.7:1}}>
          {paying?"Opening secure payment...":"💳 Pay $"+total.toFixed(2)}
        </button>

        <div style={{textAlign:"center",fontSize:"0.72rem",color:"#9CA3AF"}}>Secured by Stripe · City Tour Guide Inc.</div>
      </div>
    </div>
  );
}