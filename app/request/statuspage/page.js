"use client";
import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import GuestChat from '../../components/GuestChat';

const STATUS_CONFIG = {
  pending_payment:  { emoji:"💳", label:"Processing Payment",   color:"#92400E", bg:"#FEF3C7", msg:"Completing your booking..." },
  pending_waivers:  { emoji:"📋", label:"Collecting Waivers",   color:"#1D4ED8", bg:"#DBEAFE", msg:"Waiting for all guests to sign their waiver." },
  pending:          { emoji:"🔍", label:"Finding Your Driver",  color:"#7C3AED", bg:"#EDE9FE", msg:"Your request is live - a driver will confirm shortly." },
  confirmed:        { emoji:"✅",  label:"Driver Confirmed!",     color:"#059669", bg:"#D1FAE5", msg:"Your cityFUNHOP is confirmed and on the way." },
  pickup_started:   { emoji:"🚗", label:"Driver On The Way!",   color:"#0369A1", bg:"#E0F2FE", msg:"Your driver is heading to your pickup location." },
  at_pickup:        { emoji:"📍", label:"Driver Has Arrived!",  color:"#B45309", bg:"#FEF3C7", msg:"Your driver is here! Head outside to meet them." },
  ride_active:      { emoji:"🛺", label:"Tour In Progress!",    color:"#166534", bg:"#DCFCE7", msg:"You’re on the move! Enjoy Tampa." },
  completed:        { emoji:"⭐",  label:"Ride Complete!",        color:"#059669", bg:"#D1FAE5", msg:"Hope you loved it! Redirecting to tip your driver..." },
  declined:         { emoji:"❌",  label:"Request Declined",      color:"#991B1B", bg:"#FEE2E2", msg:"The driver is unavailable. Try a higher offer or different time." },
  cancelled:        { emoji:"❌",  label:"Cancelled",             color:"#374151", bg:"#F3F4F6", msg:"This request was cancelled." },
  canceled:         { emoji:"❌",  label:"Cancelled",             color:"#374151", bg:"#F3F4F6", msg:"This request was cancelled." },
};

const STEPS = [
  { key:"pending",         label:"Request Sent" },
  { key:"pending_waivers", label:"Waivers" },
  { key:"confirmed",       label:"Confirmed" },
  { key:"pickup_started",  label:"En Route" },
  { key:"at_pickup",       label:"Arrived" },
  { key:"ride_active",     label:"Riding" },
  { key:"completed",       label:"Done" },
];
const STEP_ORDER = STEPS.map(s => s.key);
const ACTIVE = ["confirmed","pickup_started","at_pickup","ride_active"];

function StatusPageInner({ params }) {
  const searchParams  = useSearchParams();
  const id            = params?.id || searchParams?.get("id");
  const [data,setData]               = useState(null);
  const [loading,setLoading]         = useState(true);
  const [redirecting,setRedirecting] = useState(false);
  const [driverLoc,setDriverLoc]     = useState(null);

  const load = useCallback(async () => {
    if(!id) return;
    try{
      const r = await fetch("/api/hopper/request/"+id);
      if(r.ok){
        const d = await r.json(); setData(d);
        if(d.status==="completed"&&!redirecting){
          setRedirecting(true); setTimeout(()=>{window.location.href="/tip/"+id;},4000);
        }
      }
    }catch{} setLoading(false);
  },[id,redirecting]);

  const loadLoc = useCallback(async () => {
    try{ const r=await fetch("/api/hopper/driver-location"); if(r.ok){const d=await r.json();setDriverLoc(d);} }catch{}
  },[]);

  useEffect(()=>{load();const t=setInterval(load,30000);return()=>clearInterval(t);},[load]);
  useEffect(()=>{loadLoc();const t=setInterval(loadLoc,60000);return()=>clearInterval(t);},[loadLoc]);

  if(loading) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#F8F9FA"}}><div style={{fontSize:"2rem"}}>⏳</div></div>;
  if(!data)   return <div style={{padding:40,textAlign:"center"}}>Request not found.</div>;

  const cfg          = STATUS_CONFIG[data.status]||STATUS_CONFIG.pending;
  const waiversDone  = data.waivers_signed||0;
  const waiversTotal = data.guest_count||1;
  const allSigned    = waiversDone>=waiversTotal;
  const isActive     = ACTIVE.includes(data.status);
  const showChat     = isActive||data.status==="completed";
  const curStep      = STEP_ORDER.indexOf(data.status);
  const lat          = driverLoc?.lat||27.9506;
  const lng          = driverLoc?.lng||-82.4572;
  const mapUrl       = "https://www.openstreetmap.org/export/embed.html?bbox="+(lng-0.004)+","+(lat-0.003)+","+(lng+0.004)+","+(lat+0.003)+"&layer=mapnik&marker="+lat+","+lng;

  return(
    <div style={{minHeight:"100vh",background:"#F8F9FA",fontFamily:"DM Sans,system-ui,sans-serif",maxWidth:480,margin:"0 auto"}}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800;900&display=swap');"}</style>

      <div style={{background:"#0B1D3A",borderBottom:"1px solid #0B1D3A",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 18px",position:"sticky",top:0,zIndex:10}}>
        <a href="/" style={{color:"#fff",fontSize:"0.85rem",fontWeight:600,textDecoration:"none",display:"flex",alignItems:"center",gap:4}}>← Home</a>
        <span style={{fontWeight:800,fontSize:"0.95rem",color:"#fff",letterSpacing:"-0.01em"}}>Hop Request</span>
        <span style={{width:60}}/>
      </div>
      <div style={{textAlign:"center",padding:"14px 20px 22px",background:"#0B1D3A"}}>
        {isActive ? (
          <span style={{
            display:"inline-flex",alignItems:"center",gap:8,
            background:"#0B1D3A",
            padding:"5px 16px 5px 5px",borderRadius:999,
            border:"1.5px solid #00FF88",
            boxShadow:"0 0 12px rgba(0,255,136,0.3)",
            letterSpacing:"0.01em",whiteSpace:"nowrap"
          }}>
            <img src="/driver-profile.png" alt="Guide"
              style={{width:28,height:28,borderRadius:"50%",border:"1.5px solid #00FF88",objectFit:"cover",flexShrink:0,display:"block"}} />
            <span style={{color:"#00FF88",fontWeight:700,fontSize:"0.9rem"}}>{cfg.emoji} {cfg.label}</span>
          </span>
        ) : (
          <span style={{
            display:"inline-flex",alignItems:"center",gap:9,
            background:cfg.bg,color:cfg.color,fontWeight:800,fontSize:"0.9rem",
            padding:"11px 26px",borderRadius:50,
            letterSpacing:"0.01em",whiteSpace:"nowrap"
          }}>
            <span style={{width:8,height:8,borderRadius:"50%",background:"rgba(0,0,0,0.2)",display:"inline-block",flexShrink:0}}/>
            {cfg.emoji} {cfg.label}
          </span>
        )}
      </div>

      <div style={{padding:"20px 16px"}}>

        <div style={{background:"#fff",border:"1px solid #E5E7EB",borderRadius:16,padding:"16px 12px",marginBottom:16,overflowX:"auto"}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",minWidth:320}}>
            {STEPS.map((step,i)=>{
              const done=curStep>i||data.status==="completed";
              const cur=curStep===i;
              return(
                <div key={step.key} style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1,position:"relative"}}>
                  {i>0&&<div style={{position:"absolute",top:14,right:"50%",width:"100%",height:2,background:done?"#059669":"#E5E7EB",zIndex:0}}/>}
                  <div style={{width:28,height:28,borderRadius:"50%",zIndex:1,position:"relative",background:done?"#059669":cur?"#0B1D3A":"#E5E7EB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.7rem",fontWeight:800,color:(done||cur)?"#fff":"#9CA3AF"}}>
                    {done?"✓":i+1}
                  </div>
                  <div style={{fontSize:"0.58rem",fontWeight:600,color:cur?"#0B1D3A":done?"#059669":"#9CA3AF",marginTop:4,textAlign:"center",lineHeight:1.3}}>{step.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {isActive&&(
          <div style={{borderRadius:16,overflow:"hidden",marginBottom:16,border:"2px solid #1a1a2e",boxShadow:"0 2px 12px rgba(0,0,0,0.15)"}}>
            <iframe src={mapUrl} title="Live Driver Location" width="100%" height="240" style={{border:"none",display:"block"}} loading="lazy" referrerPolicy="no-referrer"/>
            <div style={{background:"#0B1D3A",padding:"9px 16px",display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:"0.85rem"}}>📍</span><span style={{color:"#00FF88",fontSize:"0.74rem",fontWeight:700}}>Your guide is nearby · updates every minute</span></div>
          </div>
        )}

        {isActive&&driverLoc&&driverLoc.content&&(
          <div style={{background:"#fff",border:"1px solid #E5E7EB",borderLeft:"4px solid #00FF88",borderRadius:16,padding:20,marginBottom:16}}>
            <div style={{fontWeight:800,fontSize:"0.98rem",color:"#0B1D3A",marginBottom:6}}>{driverLoc.content.title}</div>
            <div style={{fontSize:"0.82rem",color:"#6B7280",lineHeight:1.55,marginBottom:14}}>{driverLoc.content.body}</div>
            <a href={driverLoc.content.cta_url} target="_blank" rel="noopener noreferrer"
              style={{display:"inline-block",background:"#00FF88",color:"#0B1D3A",fontWeight:900,fontSize:"0.88rem",padding:"11px 20px",borderRadius:24,textDecoration:"none",boxShadow:"0 2px 10px rgba(0,255,136,0.3)"}}>
              {driverLoc.content.cta_text}
            </a>
          </div>
        )}

        {data.status==="pending_waivers"&&(
          <div style={{background:"#fff",border:"1px solid #E5E7EB",borderRadius:16,padding:20,marginBottom:16}}>
            <div style={{fontWeight:800,fontSize:"0.9rem",color:"#111827",marginBottom:4}}>Waiver Progress</div>
            <div style={{color:"#6B7280",fontSize:"0.8rem",marginBottom:14}}>All guests must sign before the driver can be assigned.</div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <div style={{flex:1,height:10,background:"#BFDBFE",borderRadius:5,overflow:"hidden"}}>
                <div style={{width:((waiversDone/waiversTotal)*100)+"%",height:"100%",background:allSigned?"#059669":"#3B82F6",borderRadius:5,transition:"width 0.5s"}}/>
              </div>
              <span style={{fontWeight:800,color:allSigned?"#059669":"#1D4ED8",fontSize:"0.9rem"}}>{waiversDone}/{waiversTotal}</span>
            </div>
            {allSigned
              ?<div style={{background:"#D1FAE5",borderRadius:10,padding:"10px 14px",color:"#065F46",fontWeight:700,fontSize:"0.85rem",textAlign:"center"}}>All waivers signed! Finding your driver...</div>
              :<div style={{background:"#FEF3C7",borderRadius:10,padding:"10px 14px",color:"#92400E",fontWeight:600,fontSize:"0.82rem"}}>Waiting for {waiversTotal-waiversDone} more guest{waiversTotal-waiversDone>1?"s":""} to sign.</div>
            }
          </div>
        )}

        {data.status==="at_pickup"&&(
          <div style={{background:"#FEF3C7",border:"2px solid #F59E0B",borderRadius:16,padding:"18px 20px",marginBottom:16,textAlign:"center"}}>
            <div style={{fontSize:"2rem",marginBottom:6}}>🚨</div>
            <div style={{fontWeight:900,color:"#92400E",fontSize:"1rem",marginBottom:4}}>Your driver is outside!</div>
            <div style={{color:"#B45309",fontSize:"0.85rem"}}>Head outside to meet your cityFUNHOP.</div>
          </div>
        )}

        <div style={{background:"#fff",border:"1px solid #E5E7EB",borderRadius:16,padding:20,marginBottom:16}}>
          <div style={{fontWeight:800,fontSize:"0.88rem",color:"#111827",marginBottom:12}}>Tour Details</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[["Guest",data.guest_name],["Neighborhood",data.neighborhood],["Guests",data.guest_count],["Fare Offered","$"+data.offered_price]].map(([label,val])=>(
              <div key={label} style={{display:"flex",justifyContent:"space-between",fontSize:"0.85rem"}}>
                <span style={{color:"#6B7280"}}>{label}</span>
                <span style={{fontWeight:700,color:"#111827"}}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        {isActive&&(
          <div style={{background:"#fff",border:"1px solid #E5E7EB",borderRadius:16,padding:20,marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontWeight:800,fontSize:"0.78rem",color:"#111827",letterSpacing:"0.06em",textTransform:"uppercase"}}>Your Driver &amp; Vehicle</div>
              <div style={{background:"#ECFDF5",color:"#059669",fontWeight:700,fontSize:"0.73rem",padding:"4px 10px",borderRadius:20,display:"flex",alignItems:"center",gap:4}}>
                <span style={{width:7,height:7,borderRadius:"50%",background:"#059669",display:"inline-block"}}/> Assigned
              </div>
            </div>
            <div style={{borderRadius:12,overflow:"hidden",marginBottom:14,border:"1px solid #E5E7EB"}}>
              <img src="/transit-van.png" alt="Ford Transit Connect 6pp Navy Blue Passenger Van" style={{width:"100%",display:"block",objectFit:"contain",background:"#fff",maxHeight:280}}/>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <img src="/driver-profile.png" alt="Michele Frasure" style={{width:50,height:50,borderRadius:"50%",objectFit:"cover",border:"1.5px solid #4ADE80",flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:800,fontSize:"0.98rem",color:"#111827"}}>Michele Frasure</div>
                <div style={{fontSize:"0.76rem",color:"#6B7280"}}>Ford Transit Connect 6pp</div>
                <div style={{fontSize:"0.76rem",color:"#6B7280"}}>Navy Blue Passenger Van</div>
              </div>
              <div style={{background:"#0B1D3A",color:"#4ADE80",fontWeight:900,fontSize:"0.82rem",padding:"8px 12px",borderRadius:8,letterSpacing:"0.1em",border:"1.5px solid #4ADE80",fontFamily:"monospace",flexShrink:0}}>DZ02UM</div>
            </div>
          </div>
        )}

        {data.status==="completed"&&(
          <div style={{background:"#fff",border:"2px solid #059669",borderRadius:16,padding:20,marginBottom:16,textAlign:"center"}}>
            <div style={{fontSize:"2rem",marginBottom:8}}>🎉</div>
            <div style={{fontWeight:800,color:"#111827",marginBottom:4}}>Thanks for riding!</div>
            <div style={{color:"#6B7280",fontSize:"0.85rem",marginBottom:16}}>Redirecting you to tip your driver in a moment...</div>
            <a href={"/tip/"+id} style={{display:"inline-block",background:"#0B1D3A",color:"#fff",fontWeight:700,fontSize:"0.9rem",padding:"12px 28px",borderRadius:12,textDecoration:"none"}}>Add a Tip Now</a>
          </div>
        )}

        {showChat&&<GuestChat requestId={id} guestName={data.guest_name}/>}

        <div style={{textAlign:"center",padding:"16px 0",color:"#9CA3AF",fontSize:"0.75rem"}}>
          Questions? Call or text <a href="tel:8338138687" style={{color:"#0066FF",textDecoration:"none",fontWeight:700}}>833-813-8687</a>
        </div>
      </div>
    </div>
  );
}

export default function StatusPage(props) {
  return(
    <Suspense fallback={<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>Loading...</div>}>
      <StatusPageInner {...props}/>
    </Suspense>
  );
}