"use client";
import { useState, useEffect, useRef } from "react";

const OPS_PASS_KEY = "hopper_ops_auth";
const ETA_OPTS = [5, 10, 20, 30];

function minsAgo(ts) {
  return Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
}
function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"});
}

export default function OpsPage() {
  const [auth, setAuth]       = useState(false);
  const [password, setPass]   = useState("");
  const [authErr, setAuthErr] = useState("");
  const [queue, setQueue]     = useState([]);
  const [active, setActive]   = useState([]);
  const [onDuty, setOnDuty]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [tick, setTick]       = useState(0);
  const [etaMap, setEtaMap]   = useState({});        // {id: 10}
  const [smsMap, setSmsMap]   = useState({});        // {id: true} open
  const [smsText, setSmsText] = useState({});        // {id: "msg"}
  const [smsSending, setSmsSending] = useState({});
  const [waiverMap, setWaiverMap]   = useState({});  // {id: [...waivers]}
  const [waiverOpen, setWaiverOpen] = useState({});  // {id: true}
  const [tipLinks, setTipLinks]     = useState({});

  // Live tick every 30s
  useEffect(() => {
    const t = setInterval(() => setTick(n => n+1), 30000);
    return () => clearInterval(t);
  }, []);

  const login = async () => {
    const r = await fetch("/api/hopper/ops", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"login",password})});
    if (r.ok) { setAuth(true); load(); }
    else setAuthErr("Wrong password");
  };

  const load = async () => {
    const r = await fetch("/api/hopper/ops");
    if (!r.ok) return;
    const d = await r.json();
    const all = d.requests || [];
    // Scheduled rides first, then by offered_price desc
    const q = all
      .filter(r => ["pending","pending_waivers"].includes(r.status))
      .sort((a,b) => {
        if (a.request_type==="scheduled" && b.request_type!=="scheduled") return -1;
        if (b.request_type==="scheduled" && a.request_type!=="scheduled") return  1;
        return parseFloat(b.offered_price||0) - parseFloat(a.offered_price||0);
      });
    const act = all.filter(r => ["confirmed","ride_active"].includes(r.status));
    setQueue(q);
    setActive(act);
  };

  useEffect(() => { if (auth) { load(); const t = setInterval(load, 15000); return () => clearInterval(t); } }, [auth]);

  const action = async (act, id, extra={}) => {
    setLoading(true);
    await fetch("/api/hopper/ops",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:act,id,...extra})});
    await load();
    setLoading(false);
  };

  const moveUp = (idx) => {
    if (idx===0) return;
    const q2 = [...queue];
    [q2[idx-1],q2[idx]] = [q2[idx],q2[idx-1]];
    setQueue(q2);
    fetch("/api/hopper/ops",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"reorder",id:q2[0].id,order:q2.map(r=>r.id)})});
  };
  const moveDown = (idx) => {
    if (idx===queue.length-1) return;
    const q2 = [...queue];
    [q2[idx],q2[idx+1]] = [q2[idx+1],q2[idx]];
    setQueue(q2);
    fetch("/api/hopper/ops",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"reorder",id:q2[0].id,order:q2.map(r=>r.id)})});
  };

  const sendSMS = async (id, phone) => {
    const msg = smsText[id]||"";
    if (!msg.trim()) return;
    setSmsSending(m=>({...m,[id]:true}));
    await fetch("/api/hopper/ops",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"sms",id,message:msg})});
    setSmsText(m=>({...m,[id]:""}));
    setSmsMap(m=>({...m,[id]:false}));
    setSmsSending(m=>({...m,[id]:false}));
  };

  const loadWaivers = async (id) => {
    if (waiverMap[id]) { setWaiverOpen(m=>({...m,[id]:!m[id]})); return; }
    const r = await fetch("/api/hopper/waiver/list/"+id);
    const d = await r.json();
    setWaiverMap(m=>({...m,[id]:d.waivers||[]}));
    setWaiverOpen(m=>({...m,[id]:true}));
  };

  const acceptRide = async (r) => {
    const eta = etaMap[r.id] || 10;
    await action("accept", r.id, {eta});
    // Send SMS to guest
    const msg = `Your City Hopper is confirmed! Driver will arrive in approximately ${eta} minutes. Track live: hopper.citytourguide.app/request/${r.id}`;
    await fetch("/api/hopper/ops",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"sms",id:r.id,message:msg})});
  };

  const completeRide = async (id) => {
    await action("complete", id);
    const link = window.location.origin+"/tip/"+id;
    setTipLinks(m=>({...m,[id]:link}));
    // SMS tip link to guest
    const msg = `Thanks for riding City Hopper! Rate your experience and tip your driver: ${link}`;
    await fetch("/api/hopper/ops",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"sms",id,message:msg})});
    navigator.clipboard?.writeText(link).catch(()=>{});
  };

  const S = {
    card:  { background:"#1E293B", border:"1px solid #334155", borderRadius:16, padding:"16px", marginBottom:12 },
    lbl:   { color:"#94A3B8", fontSize:"0.72rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" },
    val:   { color:"#F1F5F9", fontWeight:700, fontSize:"0.9rem" },
    btn:   (bg,color="#fff") => ({ background:bg, border:"none", borderRadius:10, padding:"9px 14px", color, fontWeight:700, fontSize:"0.82rem", cursor:"pointer", fontFamily:"inherit" }),
  };

  if (!auth) return (
    <div style={{minHeight:"100vh",background:"#0F172A",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"#1E293B",border:"1px solid rgba(245,158,11,0.2)",borderRadius:20,padding:36,width:"100%",maxWidth:360,textAlign:"center"}}>
        <div style={{fontSize:"2.5rem",marginBottom:12}}>🛺</div>
        <div style={{color:"#F1F5F9",fontWeight:800,fontSize:"1.2rem",marginBottom:4}}>CityHopper Ops</div>
        <div style={{color:"#64748B",fontSize:"0.82rem",marginBottom:24}}>City Tour Guide Inc.</div>
        <input type="password" value={password} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()}
          placeholder="Driver password" style={{width:"100%",background:"#0F172A",border:"1px solid #334155",borderRadius:10,padding:"12px 14px",color:"#F1F5F9",fontFamily:"inherit",fontSize:"0.9rem",marginBottom:10,boxSizing:"border-box"}}/>
        {authErr&&<div style={{color:"#F87171",fontSize:"0.8rem",marginBottom:10}}>{authErr}</div>}
        <button onClick={login} style={{width:"100%",padding:"13px",background:"linear-gradient(135deg,#F59E0B,#D97706)",borderRadius:12,border:"none",color:"#fff",fontWeight:800,fontSize:"0.95rem",cursor:"pointer",fontFamily:"inherit"}}>Login</button>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#0F172A",fontFamily:"DM Sans,system-ui,sans-serif",paddingBottom:60}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800;900&display=swap');*{box-sizing:border-box}`}</style>

      {/* Header */}
      <div style={{background:"#1E293B",borderBottom:"1px solid #334155",padding:"14px 16px",position:"sticky",top:0,zIndex:20}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{color:"#F1F5F9",fontWeight:800,fontSize:"1rem"}}>🛺 CityHopper Ops</div>
            <div style={{color:"#64748B",fontSize:"0.7rem"}}>{queue.length} in queue · {active.length} active</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <a href="/ops/waivers" style={{background:"#334155",borderRadius:8,padding:"7px 12px",color:"#94A3B8",fontWeight:700,fontSize:"0.75rem",textDecoration:"none"}}>📋 Waivers</a>
            <button onClick={()=>{setOnDuty(d=>!d);}} style={{...S.btn(onDuty?"#059669":"#DC2626"),padding:"7px 14px",fontSize:"0.78rem"}}>
              {onDuty?"🟢 ON DUTY":"🔴 OFF DUTY"}
            </button>
            <button onClick={load} style={{...S.btn("#334155","#94A3B8"),padding:"7px 10px"}}>🔄</button>
          </div>
        </div>
      </div>

      <div style={{padding:"14px 14px 0"}}>

        {/* ACTIVE RIDES */}
        {active.length > 0 && (
          <div style={{marginBottom:20}}>
            <div style={{color:"#4ADE80",fontWeight:800,fontSize:"0.75rem",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>🏎 Active Rides</div>
            {active.map(r => (
              <div key={r.id} style={{...S.card,border:"1px solid #166534"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                  <div>
                    <div style={{...S.val,fontSize:"1rem"}}>{r.guest_name}</div>
                    <div style={{color:"#64748B",fontSize:"0.78rem",marginTop:2}}>📍 {r.neighborhood} {r.venue_name?`· ${r.venue_name}`:""}</div>
                    <div style={{color:"#64748B",fontSize:"0.72rem",marginTop:2}}>👥 {r.guest_count} hoppers · 💰 ${r.offered_price}</div>
                  </div>
                  <div style={{background:"#052e16",borderRadius:8,padding:"6px 10px",textAlign:"right"}}>
                    <div style={{color:"#4ADE80",fontWeight:800,fontSize:"0.78rem"}}>🏎 ACTIVE</div>
                    <div style={{color:"#86EFAC",fontSize:"0.65rem"}}>{r.started_at?minsAgo(r.started_at)+" min":""}</div>
                  </div>
                </div>
                {tipLinks[r.id] ? (
                  <div style={{background:"#0F172A",borderRadius:10,padding:"10px 12px",marginBottom:8}}>
                    <div style={{color:"#4ADE80",fontWeight:700,fontSize:"0.82rem",marginBottom:4}}>✅ Ride Complete — Tip link sent to guest</div>
                    <div style={{color:"#64748B",fontSize:"0.72rem",wordBreak:"break-all"}}>{tipLinks[r.id]}</div>
                  </div>
                ) : (
                  <button onClick={()=>completeRide(r.id)} disabled={loading}
                    style={{...S.btn("linear-gradient(135deg,#7C3AED,#6D28D9)"),width:"100%",padding:"12px",marginBottom:8}}>
                    🏁 End Ride + Send Tip Link
                  </button>
                )}
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>loadWaivers(r.id)} style={{...S.btn("#1E3A5F","#60A5FA"),flex:1,padding:"8px"}}>
                    📋 Waivers {waiverMap[r.id]?`(${waiverMap[r.id].filter(w=>w.signed_at).length}/${waiverMap[r.id].length})`:""}
                  </button>
                  <button onClick={()=>setSmsMap(m=>({...m,[r.id]:!m[r.id]}))} style={{...S.btn("#1E293B","#94A3B8"),flex:1,padding:"8px",border:"1px solid #334155"}}>
                    💬 Message Guest
                  </button>
                </div>
                {smsMap[r.id]&&(
                  <div style={{marginTop:8,display:"flex",gap:8}}>
                    <input value={smsText[r.id]||""} onChange={e=>setSmsText(m=>({...m,[r.id]:e.target.value}))}
                      placeholder="Message from 833-813-8687..." style={{flex:1,background:"#0F172A",border:"1px solid #334155",borderRadius:8,padding:"9px 12px",color:"#F1F5F9",fontFamily:"inherit",fontSize:"0.82rem"}}/>
                    <button onClick={()=>sendSMS(r.id,r.guest_phone)} disabled={smsSending[r.id]} style={{...S.btn("#0066FF"),padding:"9px 14px"}}>
                      {smsSending[r.id]?"...":"Send"}
                    </button>
                  </div>
                )}
                {waiverOpen[r.id]&&waiverMap[r.id]&&(
                  <div style={{marginTop:10,borderTop:"1px solid #334155",paddingTop:10}}>
                    {waiverMap[r.id].map((w,i)=>(
                      <div key={w.id||i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid #1E293B"}}>
                        <div>
                          <div style={{color:"#F1F5F9",fontSize:"0.8rem",fontWeight:600}}>{w.guest_name||"Guest "+w.guest_index}</div>
                          <div style={{color:"#64748B",fontSize:"0.68rem"}}>{w.guest_phone||w.guest_email||""}</div>
                        </div>
                        <div style={{color:w.signed_at?"#4ADE80":"#F59E0B",fontWeight:700,fontSize:"0.8rem"}}>
                          {w.signed_at?"✅ "+new Date(w.signed_at).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"}):"⏳ Pending"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* QUEUE */}
        <div style={{color:"#F59E0B",fontWeight:800,fontSize:"0.75rem",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>
          🎵 Queue · {queue.length} ride{queue.length!==1?"s":""}
        </div>

        {queue.length===0&&(
          <div style={{textAlign:"center",padding:"60px 20px",color:"#475569"}}>
            <div style={{fontSize:"3rem",marginBottom:12}}>🛺</div>
            <div style={{fontWeight:700,color:"#64748B"}}>Queue is empty</div>
            <div style={{fontSize:"0.82rem",marginTop:4}}>{onDuty?"New requests will appear here":"Go On Duty to accept rides"}</div>
          </div>
        )}

        {queue.map((r,idx) => {
          const mins = minsAgo(r.created_at);
          const isScheduled = r.request_type==="scheduled";
          const cardEta = etaMap[r.id] || 10;
          const waiversDone = r.waivers_signed||0;
          const allSigned = waiversDone >= (r.guest_count||1);
          return (
            <div key={r.id} style={{...S.card, border:`1px solid ${isScheduled?"#7C3AED33":"#334155"}`, position:"relative"}}>
              {/* Queue position + reorder */}
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                <div style={{background:idx===0?"#F59E0B22":"#1E293B",border:`1px solid ${idx===0?"#F59E0B":"#475569"}`,borderRadius:8,padding:"4px 10px",color:idx===0?"#F59E0B":"#64748B",fontWeight:800,fontSize:"0.78rem",minWidth:32,textAlign:"center"}}>
                  {idx===0?"▶ NEXT":("#"+(idx+1))}
                </div>
                {isScheduled&&<div style={{background:"#4C1D9522",borderRadius:6,padding:"3px 8px",color:"#A78BFA",fontWeight:700,fontSize:"0.68rem"}}>📅 SCHEDULED</div>}
                <div style={{flex:1}}/>
                <button onClick={()=>moveUp(idx)} disabled={idx===0} style={{...S.btn(idx===0?"#1E293B":"#334155",idx===0?"#475569":"#94A3B8"),padding:"5px 10px",fontSize:"1rem"}}>↑</button>
                <button onClick={()=>moveDown(idx)} disabled={idx===queue.length-1} style={{...S.btn(idx===queue.length-1?"#1E293B":"#334155",idx===queue.length-1?"#475569":"#94A3B8"),padding:"5px 10px",fontSize:"1rem"}}>↓</button>
              </div>

              {/* Guest + Ride Info */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div style={{flex:1}}>
                  <div style={{...S.val,fontSize:"1rem",marginBottom:2}}>{r.guest_name}</div>
                  <div style={{color:"#94A3B8",fontSize:"0.8rem",fontWeight:600,marginBottom:3}}>📍 {r.neighborhood}{r.venue_name?` · ${r.venue_name}`:""}</div>
                  {r.pickup_notes&&<div style={{color:"#64748B",fontSize:"0.72rem",marginBottom:3}}>Pickup: {r.pickup_notes}</div>}
                  <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:4}}>
                    <span style={{color:"#60A5FA",fontWeight:700,fontSize:"0.82rem"}}>💰 ${r.offered_price}</span>
                    <span style={{color:"#94A3B8",fontSize:"0.78rem"}}>👥 {r.guest_count} hopper{r.guest_count>1?"s":""}</span>
                    {isScheduled&&r.scheduled_at&&<span style={{color:"#A78BFA",fontSize:"0.75rem",fontWeight:600}}>🕐 {new Date(r.scheduled_at).toLocaleString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}</span>}
                  </div>
                </div>
                {/* Live timer */}
                <div style={{background:"#0F172A",borderRadius:10,padding:"8px 12px",textAlign:"center",minWidth:60,flexShrink:0}}>
                  <div style={{color:mins>20?"#F87171":mins>10?"#F59E0B":"#4ADE80",fontWeight:900,fontSize:"1.2rem",lineHeight:1}}>{mins}</div>
                  <div style={{color:"#475569",fontSize:"0.6rem",fontWeight:600}}>MIN AGO</div>
                  <div style={{color:"#64748B",fontSize:"0.6rem",marginTop:2}}>{fmtTime(r.created_at)}</div>
                </div>
              </div>

              {/* Waiver status */}
              <div style={{background:"#0F172A",borderRadius:10,padding:"8px 12px",marginBottom:10,display:"flex",alignItems:"center",gap:10}}>
                <div style={{flex:1,height:6,background:"#1E293B",borderRadius:3,overflow:"hidden"}}>
                  <div style={{width:`${(waiversDone/(r.guest_count||1))*100}%`,height:"100%",background:allSigned?"#4ADE80":"#3B82F6",borderRadius:3,transition:"width 0.4s"}}/>
                </div>
                <span style={{color:allSigned?"#4ADE80":"#60A5FA",fontWeight:700,fontSize:"0.78rem",whiteSpace:"nowrap"}}>
                  {allSigned?"✅ All signed":`📋 ${waiversDone}/${r.guest_count||1} signed`}
                </span>
              </div>

              {/* ETA selector — per card */}
              <div style={{marginBottom:10}}>
                <div style={{...S.lbl,marginBottom:6}}>ETA for this rider</div>
                <div style={{display:"flex",gap:6}}>
                  {ETA_OPTS.map(t=>(
                    <button key={t} onClick={()=>setEtaMap(m=>({...m,[r.id]:t}))}
                      style={{flex:1,padding:"8px 4px",border:`2px solid ${cardEta===t?"#F59E0B":"#334155"}`,borderRadius:8,background:cardEta===t?"#F59E0B22":"#0F172A",color:cardEta===t?"#F59E0B":"#64748B",fontWeight:700,fontSize:"0.78rem",cursor:"pointer",fontFamily:"inherit"}}>
                      {t===30?"30+":t+"m"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accept + SMS */}
              <div style={{display:"flex",gap:8,marginBottom:8}}>
                <button onClick={()=>acceptRide(r)} disabled={loading}
                  style={{...S.btn("#059669"),flex:2,padding:"11px"}}>
                  {idx===0?"🛺 DISPATCH NOW":"✅ Accept Ride"}
                </button>
                <button onClick={()=>setSmsMap(m=>({...m,[r.id]:!m[r.id]}))}
                  style={{...S.btn("#1E3A5F","#60A5FA"),flex:1,padding:"11px"}}>
                  💬
                </button>
                <button onClick={()=>loadWaivers(r.id)}
                  style={{...S.btn("#1E293B","#94A3B8"),flex:1,padding:"11px",border:"1px solid #334155"}}>
                  📋
                </button>
              </div>

              {smsMap[r.id]&&(
                <div style={{display:"flex",gap:8,marginBottom:8}}>
                  <input value={smsText[r.id]||""} onChange={e=>setSmsText(m=>({...m,[r.id]:e.target.value}))}
                    placeholder="Message guest from 833-813-8687..."
                    style={{flex:1,background:"#0F172A",border:"1px solid #475569",borderRadius:8,padding:"9px 12px",color:"#F1F5F9",fontFamily:"inherit",fontSize:"0.82rem"}}/>
                  <button onClick={()=>sendSMS(r.id,r.guest_phone)} disabled={smsSending[r.id]}
                    style={{...S.btn("#0066FF"),padding:"9px 14px"}}>{smsSending[r.id]?"...":"Send"}</button>
                </div>
              )}

              {waiverOpen[r.id]&&waiverMap[r.id]&&(
                <div style={{borderTop:"1px solid #334155",paddingTop:10}}>
                  {waiverMap[r.id].map((w,i)=>(
                    <div key={w.id||i} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #1E293B"}}>
                      <div>
                        <div style={{color:"#F1F5F9",fontSize:"0.8rem",fontWeight:600}}>{w.guest_name||"Guest "+w.guest_index}</div>
                        <div style={{color:"#64748B",fontSize:"0.68rem"}}>{w.guest_phone||w.guest_email||""}</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{color:w.signed_at?"#4ADE80":"#F59E0B",fontWeight:700,fontSize:"0.78rem"}}>
                          {w.signed_at?"✅ "+new Date(w.signed_at).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"}):"⏳ Not signed"}
                        </div>
                        {!w.signed_at&&<a href={"https://waiver.citytourguide.app/sign/"+w.token} target="_blank" rel="noopener noreferrer"
                          style={{color:"#60A5FA",fontSize:"0.65rem",textDecoration:"none"}}>Open link ›</a>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}