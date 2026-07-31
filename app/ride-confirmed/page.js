"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function ConfirmContent() {
  const params = useSearchParams();
  const requestId = params.get("request_id");
  const [request, setRequest] = useState(null);

  useEffect(() => {
    if (requestId) {
      fetch(`/api/hopper/request/${requestId}`)
        .then(r => r.json())
        .then(d => setRequest(d))
        .catch(() => {});
    }
  }, [requestId]);

  return (
    <main style={{minHeight:"100vh",background:"#0a0a0a",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 20px",fontFamily:"Inter,sans-serif"}}>
      <div style={{maxWidth:480,width:"100%",textAlign:"center"}}>
        <div style={{fontSize:"4rem",marginBottom:16}}>🛺</div>
        <h1 style={{color:"#4ADE80",fontSize:"1.8rem",fontWeight:900,marginBottom:8}}>Ride Confirmed!</h1>
        <p style={{color:"rgba(255,255,255,0.65)",fontSize:"0.95rem",marginBottom:32,lineHeight:1.6}}>
          Payment received. Your driver has been notified and will confirm your ride shortly.<br/>
          You will receive a text at the number you provided.
        </p>

        {requestId && (
          <div style={{background:"#111",border:"1px solid rgba(0,255,136,0.3)",borderRadius:16,padding:"20px",marginBottom:24,textAlign:"left"}}>
            <div style={{fontSize:"0.65rem",color:"rgba(255,255,255,0.35)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>Booking Reference</div>
            <div style={{fontFamily:"monospace",color:"#fff",fontSize:"0.85rem",wordBreak:"break-all"}}>{requestId}</div>
          </div>
        )}

        <div style={{textAlign:"center",marginBottom:16}}>
          <a href={requestId ? `/request/statuspage?id=${requestId}` : "#"} style={{display:"inline-block",background:"#C9A84C",color:"#0B1D3A",borderRadius:12,padding:"14px 28px",fontWeight:800,fontSize:"1rem",textDecoration:"none"}}>
            Track Your Ride
          </a>
        </div>
        <div style={{background:"rgba(255,215,0,0.08)",border:"1px solid rgba(255,215,0,0.2)",borderRadius:14,padding:"16px",marginBottom:24,textAlign:"left"}}>
          <div style={{fontSize:"0.8rem",color:"rgba(255,255,255,0.5)",lineHeight:1.6}}>
            <strong style={{color:"#FFD700"}}>Next step:</strong> You will receive waiver links via text. All guests must sign before boarding.
          </div>
        </div>
        <a href="/" style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:12,padding:"12px 24px",color:"#fff",textDecoration:"none",fontWeight:700,fontSize:"0.9rem"}}>
          ← Back to cityFUNHOP
        </a>
      </div>
    </main>
  );
}

export default function RideConfirmed() {
  return <Suspense><ConfirmContent /></Suspense>;
}