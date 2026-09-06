"use client";

import { useEffect, useState } from "react";

const PRESETS = [10, 20, 30, 50];

export default function TourTipPage() {
  const [selected, setSelected] = useState(20);
  const [custom, setCustom] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tip_success") === "1") setSubmitted(true);
  }, []);

  const tipAmount = useCustom ? Number(custom || 0) : selected;
  const validAmount = Number.isFinite(tipAmount) && tipAmount >= 0.5;

  async function handleTip() {
    if (submitting || !validAmount) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/tour-tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipAmount, guestName: guestName.trim() }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || "Could not create payment");
      window.location.href = data.url;
    } catch (error) {
      setSubmitting(false);
      alert(error.message || "Could not process gratuity. Please try again.");
    }
  }

  if (submitted) {
    return (
      <main style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:"#F8FAFC"}}>
        <section style={{maxWidth:420,width:"100%",textAlign:"center",background:"white",padding:32,borderRadius:20,boxShadow:"0 10px 35px rgba(0,0,0,.08)"}}>
          <div style={{fontSize:"3rem"}}>❤️</div>
          <h1 style={{fontSize:"1.8rem",margin:"12px 0 8px"}}>Thank You!</h1>
          <p style={{color:"#64748B",lineHeight:1.6}}>Your gratuity is sincerely appreciated. Thank you for choosing City Tour Guide and spending part of your Tampa visit with us.</p>
          <a href="https://citytourguide.app" style={{display:"inline-block",marginTop:20,color:"#E8431A",fontWeight:700}}>CityTourGuide.app</a>
        </section>
      </main>
    );
  }

  return (
    <main style={{minHeight:"100vh",background:"#F8FAFC",padding:"28px 18px"}}>
      <section style={{maxWidth:440,margin:"0 auto"}}>
        <header style={{background:"#0B1D3A",borderRadius:"20px 20px 0 0",padding:"30px 22px",textAlign:"center",color:"white"}}>
          <div style={{fontSize:"2.3rem"}}>🎤</div>
          <h1 style={{margin:"10px 0 4px",fontSize:"1.55rem"}}>Thank Your Tour Guide</h1>
          <div style={{fontSize:".82rem",opacity:.7}}>City Tour Guide, Inc. · Tampa</div>
        </header>

        <div style={{background:"white",padding:22,borderRadius:"0 0 20px 20px",boxShadow:"0 10px 35px rgba(0,0,0,.08)"}}>
          <p style={{color:"#64748B",fontSize:".9rem",lineHeight:1.6,marginTop:0}}>If you enjoyed your tour and would like to leave a gratuity, choose a suggested amount or enter any amount below. Thank you for supporting your tour guide.</p>

          <label style={{display:"block",fontWeight:700,fontSize:".82rem",margin:"20px 0 7px"}}>Your name (optional)</label>
          <input value={guestName} onChange={e=>setGuestName(e.target.value)} placeholder="Guest name" style={{width:"100%",boxSizing:"border-box",padding:13,border:"1.5px solid #CBD5E1",borderRadius:12,fontSize:"1rem"}} />

          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginTop:22}}>
            {PRESETS.map(amount => (
              <button key={amount} onClick={()=>{setSelected(amount);setUseCustom(false);}} style={{padding:"14px 4px",borderRadius:12,border:!useCustom&&selected===amount?"2px solid #E8431A":"1.5px solid #CBD5E1",background:!useCustom&&selected===amount?"#FFF1EE":"white",fontWeight:800,color:!useCustom&&selected===amount?"#E8431A":"#334155",cursor:"pointer"}}>${amount}</button>
            ))}
          </div>

          <button onClick={()=>setUseCustom(true)} style={{width:"100%",marginTop:10,padding:12,borderRadius:12,border:useCustom?"2px solid #E8431A":"1.5px solid #CBD5E1",background:useCustom?"#FFF1EE":"white",fontWeight:700,color:useCustom?"#E8431A":"#64748B",cursor:"pointer"}}>Enter Any Amount</button>

          {useCustom && (
            <div style={{position:"relative",marginTop:10}}>
              <span style={{position:"absolute",left:16,top:"50%",transform:"translateY(-50%)",fontWeight:800,color:"#334155"}}>$</span>
              <input
                type="number"
                inputMode="decimal"
                min="0.50"
                step="0.01"
                value={custom}
                onChange={e=>setCustom(e.target.value)}
                placeholder="0.00"
                autoFocus
                style={{width:"100%",boxSizing:"border-box",padding:"14px 14px 14px 30px",border:"1.5px solid #CBD5E1",borderRadius:12,fontSize:"1.1rem",textAlign:"center",fontWeight:700}}
              />
            </div>
          )}

          {useCustom && custom !== "" && !validAmount && (
            <p style={{color:"#B91C1C",fontSize:".75rem",margin:"8px 0 0"}}>Minimum gratuity is $0.50.</p>
          )}

          <button onClick={handleTip} disabled={submitting || !validAmount} style={{width:"100%",marginTop:22,padding:16,border:0,borderRadius:999,background:(submitting||!validAmount)?"#CBD5E1":"linear-gradient(135deg,#E8431A,#F5A623)",color:"white",fontWeight:800,fontSize:"1rem",cursor:(submitting||!validAmount)?"not-allowed":"pointer"}}>{submitting?"Opening secure payment…":`Add $${validAmount ? tipAmount.toFixed(2) : "0.00"} Gratuity`}</button>

          <p style={{textAlign:"center",color:"#94A3B8",fontSize:".72rem",margin:"14px 0 0"}}>Secure payment processed by Stripe.</p>
        </div>
      </section>
    </main>
  );
}
