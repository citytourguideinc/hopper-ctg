"use client";
import { useState, useEffect } from "react";

function fmtDate(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
}
function fmtTime(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"});
}

export default function WaiverAdmin() {
  const [auth, setAuth]         = useState(false);
  const [password, setPass]     = useState("");
  const [authErr, setAuthErr]   = useState("");
  const [rides, setRides]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [search, setSearch]     = useState("");
  const [view, setView]         = useState("ride");
  const [dateFilter, setDate]   = useState("");
  const [expanded, setExpanded] = useState({});
  const [sigModal, setSigModal] = useState(null);

  const login = async () => {
    const r = await fetch("/api/hopper/ops",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"login",password})});
    if (r.ok) { setAuth(true); load(); } else setAuthErr("Wrong password");
  };

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFilter) params.set("date", dateFilter);
      if (search && search.match(/^\d/)) params.set("phone", search);
      else if (search) params.set("name", search);
      const r = await fetch("/api/hopper/waivers/all?" + params.toString());
      if (r.ok) { const d = await r.json(); setRides(d.byRide || []); }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { if (auth) load(); }, [auth, dateFilter]);

  const toggle = (id) => setExpanded(m => ({...m, [id]: !m[id]}));

  const filteredRides = rides.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (r.main_guest||"").toLowerCase().includes(q) ||
           (r.neighborhood||"").toLowerCase().includes(q) ||
           r.guests.some(g => (g.guest_name||"").toLowerCase().includes(q) || (g.guest_phone||"").includes(q));
  });

  // By-guest view: flatten all guests, group by phone
  const guestMap = {};
  rides.forEach(ride => {
    ride.guests.forEach(g => {
      const key = g.guest_phone || g.guest_name || "unknown";
      if (!guestMap[key]) guestMap[key] = { name: g.guest_name, phone: g.guest_phone, rides: [] };
      guestMap[key].rides.push({ ...g, neighborhood: ride.neighborhood, ride_created: ride.ride_created });
    });
  });
  const guestList = Object.values(guestMap)
    .filter(g => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (g.name||"").toLowerCase().includes(q) || (g.phone||"").includes(q);
    })
    .sort((a,b) => b.rides.length - a.rides.length);

  if (!auth) return (
    <div style={{minHeight:"100vh",background:"#0F172A",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"#1E293B",border:"1px solid rgba(245,158,11,0.2)",borderRadius:20,padding:36,width:"100%",maxWidth:360,textAlign:"center"}}>
        <div style={{fontSize:"2.5rem",marginBottom:12}}>📋</div>
        <div style={{color:"#F1F5F9",fontWeight:800,fontSize:"1.2rem",marginBottom:4}}>Waiver Admin</div>
        <div style={{color:"#64748B",fontSize:"0.82rem",marginBottom:20}}>City Tour Guide Inc.</div>
        <input type="password" value={password} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()}
          placeholder="Driver password" style={{width:"100%",background:"#0F172A",border:"1px solid #334155",borderRadius:10,padding:"12px 14px",color:"#F1F5F9",fontFamily:"inherit",fontSize:"0.9rem",marginBottom:10,boxSizing:"border-box"}}/>
        {authErr&&<div style={{color:"#F87171",fontSize:"0.8rem",marginBottom:10}}>{authErr}</div>}
        <button onClick={login} style={{width:"100%",padding:"13px",background:"linear-gradient(135deg,#F59E0B,#D97706)",borderRadius:12,border:"none",color:"#fff",fontWeight:800,fontSize:"0.95rem",cursor:"pointer",fontFamily:"inherit"}}>Login</button>
      </div>
    </div>
  );

  const signedTotal = rides.reduce((acc,r)=>acc+r.guests.filter(g=>g.signed_at).length,0);
  const totalGuests = rides.reduce((acc,r)=>acc+r.guests.length,0);

  return (
    <div style={{minHeight:"100vh",background:"#0F172A",fontFamily:"DM Sans,system-ui,sans-serif",paddingBottom:60}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800;900&display=swap');*{box-sizing:border-box}`}</style>

      {/* Signature Modal */}
      {sigModal && (
        <div onClick={()=>setSigModal(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#1E293B",borderRadius:20,padding:24,maxWidth:440,width:"100%"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{color:"#F1F5F9",fontWeight:800,fontSize:"1rem"}}>✍️ Signed Waiver</div>
              <button onClick={()=>setSigModal(null)} style={{background:"none",border:"none",color:"#64748B",fontSize:"1.3rem",cursor:"pointer"}}>✕</button>
            </div>
            <div style={{background:"#fff",borderRadius:12,padding:12,marginBottom:14,textAlign:"center"}}>
              <img src={sigModal.signature_data} style={{maxWidth:"100%",maxHeight:120}} alt="Signature"/>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{color:"#64748B",fontSize:"0.8rem"}}>Name</span>
                <span style={{color:"#F1F5F9",fontWeight:700,fontSize:"0.85rem"}}>{sigModal.guest_name}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{color:"#64748B",fontSize:"0.8rem"}}>Phone</span>
                <span style={{color:"#F1F5F9",fontWeight:700,fontSize:"0.85rem"}}>{sigModal.guest_phone||"—"}</span>
              </div>
              {sigModal.full_waiver?.dob&&<div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{color:"#64748B",fontSize:"0.8rem"}}>DOB</span>
                <span style={{color:"#F1F5F9",fontWeight:700,fontSize:"0.85rem"}}>{sigModal.full_waiver.dob}</span>
              </div>}
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{color:"#64748B",fontSize:"0.8rem"}}>Signed</span>
                <span style={{color:"#4ADE80",fontWeight:700,fontSize:"0.85rem"}}>{fmtDate(sigModal.signed_at)} {fmtTime(sigModal.signed_at)}</span>
              </div>
              {sigModal.neighborhood&&<div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{color:"#64748B",fontSize:"0.8rem"}}>Ride</span>
                <span style={{color:"#F1F5F9",fontWeight:700,fontSize:"0.85rem"}}>{sigModal.neighborhood}</span>
              </div>}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{background:"#1E293B",borderBottom:"1px solid #334155",padding:"14px 16px",position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{color:"#F1F5F9",fontWeight:800,fontSize:"1rem"}}>📋 Signed Waivers</div>
            <div style={{color:"#64748B",fontSize:"0.7rem"}}>{signedTotal} signed · {totalGuests} total · {rides.length} rides</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <a href="/ops" style={{background:"#334155",borderRadius:8,padding:"7px 12px",color:"#94A3B8",fontWeight:700,fontSize:"0.75rem",textDecoration:"none"}}>← Ops</a>
            <button onClick={load} style={{background:"#334155",border:"none",borderRadius:8,padding:"7px 10px",color:"#94A3B8",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:"0.75rem"}}>🔄</button>
          </div>
        </div>
      </div>

      <div style={{padding:"14px 14px 0"}}>
        {/* Search + date */}
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or phone..."
          style={{width:"100%",background:"#1E293B",border:"1px solid #334155",borderRadius:12,padding:"11px 14px",color:"#F1F5F9",fontFamily:"inherit",fontSize:"0.88rem",marginBottom:10}}/>
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          <input type="date" value={dateFilter} onChange={e=>setDate(e.target.value)}
            style={{flex:1,background:"#1E293B",border:"1px solid #334155",borderRadius:10,padding:"9px 12px",color:"#F1F5F9",fontFamily:"inherit",fontSize:"0.82rem"}}/>
          {dateFilter&&<button onClick={()=>setDate("")} style={{background:"#334155",border:"none",borderRadius:10,padding:"9px 12px",color:"#94A3B8",cursor:"pointer",fontFamily:"inherit",fontSize:"0.82rem"}}>Clear</button>}
        </div>

        {/* View toggle */}
        <div style={{display:"flex",gap:4,marginBottom:16,background:"#1E293B",borderRadius:12,padding:4}}>
          {["ride","guest"].map(v=>(
            <button key={v} onClick={()=>setView(v)} style={{flex:1,padding:"8px",borderRadius:9,border:"none",background:view===v?"#334155":"transparent",color:view===v?"#F1F5F9":"#64748B",fontWeight:700,fontSize:"0.82rem",cursor:"pointer",fontFamily:"inherit"}}>
              {v==="ride"?"🛺 By Ride":"👤 By Guest"}
            </button>
          ))}
        </div>

        {loading&&<div style={{textAlign:"center",color:"#64748B",padding:20}}>Loading...</div>}

        {/* BY RIDE VIEW */}
        {view==="ride" && filteredRides.map(ride => {
          const signedCount = ride.guests.filter(g=>g.signed_at).length;
          const allSigned = signedCount === ride.guests.length;
          const isOpen = expanded[ride.request_id];
          return (
            <div key={ride.request_id} style={{background:"#1E293B",border:`1px solid ${allSigned?"#166534":"#334155"}`,borderRadius:16,marginBottom:12,overflow:"hidden"}}>
              {/* Ride header — tap to expand */}
              <div onClick={()=>toggle(ride.request_id)} style={{padding:"14px 16px",cursor:"pointer"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    <div style={{color:"#F1F5F9",fontWeight:800,fontSize:"0.95rem"}}>{ride.main_guest||"Unknown Guest"}</div>
                    <div style={{color:"#94A3B8",fontSize:"0.78rem",marginTop:2}}>
                      📍 {ride.neighborhood||"—"}{ride.venue_name?` · ${ride.venue_name}`:""}
                    </div>
                    <div style={{color:"#64748B",fontSize:"0.72rem",marginTop:2}}>
                      {fmtDate(ride.ride_created)} · {fmtTime(ride.ride_created)} · 👥 {ride.guest_count||ride.guests.length} hoppers · 💰 ${ride.offered_price||"—"}
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,marginLeft:10}}>
                    <div style={{background:allSigned?"#052e16":"#0F172A",borderRadius:8,padding:"4px 10px",color:allSigned?"#4ADE80":"#F59E0B",fontWeight:800,fontSize:"0.75rem",whiteSpace:"nowrap"}}>
                      {allSigned?"✅ All signed":`${signedCount}/${ride.guests.length} signed`}
                    </div>
                    <div style={{color:"#475569",fontSize:"0.72rem"}}>{isOpen?"▲ Hide":"▼ Show"}</div>
                  </div>
                </div>
              </div>

              {/* Guest list — expanded */}
              {isOpen && (
                <div style={{borderTop:"1px solid #334155"}}>
                  {ride.guests.map((g,i) => (
                    <div key={g.id||i} style={{padding:"12px 16px",borderBottom:i<ride.guests.length-1?"1px solid #0F172A":"none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                          <span style={{color:"#64748B",fontWeight:700,fontSize:"0.68rem",background:"#0F172A",borderRadius:4,padding:"2px 6px"}}>
                            {i===0?"MAIN GUEST":"GUEST "+g.guest_index}
                          </span>
                          {g.signed_at&&<span style={{color:"#4ADE80",fontSize:"0.68rem",fontWeight:700}}>✅ SIGNED</span>}
                          {!g.signed_at&&<span style={{color:"#F59E0B",fontSize:"0.68rem",fontWeight:700}}>⏳ PENDING</span>}
                        </div>
                        <div style={{color:"#F1F5F9",fontWeight:700,fontSize:"0.88rem"}}>{g.guest_name||"—"}</div>
                        <div style={{color:"#64748B",fontSize:"0.72rem",marginTop:2}}>{g.guest_phone||g.guest_email||"No contact"}</div>
                        {g.signed_at&&<div style={{color:"#64748B",fontSize:"0.68rem",marginTop:2}}>Signed {fmtDate(g.signed_at)} at {fmtTime(g.signed_at)}</div>}
                        {g.full_waiver?.dob&&<div style={{color:"#475569",fontSize:"0.68rem"}}>DOB: {g.full_waiver.dob}</div>}
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end",marginLeft:10}}>
                        {g.signed_at&&g.signature_data&&(
                          <button onClick={()=>setSigModal(g)} style={{background:"#0F172A",border:"1px solid #334155",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontFamily:"inherit"}}>
                            <img src={g.signature_data} style={{maxWidth:70,maxHeight:30,display:"block"}} alt="sig"/>
                            <div style={{color:"#60A5FA",fontSize:"0.6rem",textAlign:"center",marginTop:3}}>View</div>
                          </button>
                        )}
                        {!g.signed_at&&g.token&&(
                          <a href={"https://waiver.citytourguide.app/sign/"+g.token} target="_blank" rel="noopener noreferrer"
                            style={{background:"#1E3A5F",borderRadius:8,padding:"6px 10px",color:"#60A5FA",fontSize:"0.72rem",fontWeight:700,textDecoration:"none",whiteSpace:"nowrap"}}>
                            🔗 Waiver Link
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* BY GUEST VIEW */}
        {view==="guest" && guestList.map((g,i) => (
          <div key={i} style={{background:"#1E293B",border:"1px solid #334155",borderRadius:14,padding:"14px 16px",marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div>
                <div style={{color:"#F1F5F9",fontWeight:800,fontSize:"0.92rem"}}>{g.name||"Unknown"}</div>
                <div style={{color:"#64748B",fontSize:"0.75rem",marginTop:2}}>{g.phone||"No phone"}</div>
              </div>
              <div style={{background:g.rides.length>1?"#F59E0B22":"#0F172A",borderRadius:8,padding:"4px 10px",border:g.rides.length>1?"1px solid #F59E0B33":"1px solid #334155",color:g.rides.length>1?"#F59E0B":"#64748B",fontWeight:800,fontSize:"0.75rem"}}>
                {g.rides.length} ride{g.rides.length!==1?"s":""}{g.rides.length>1?" ⭐":""}
              </div>
            </div>
            {g.rides.map((r,j)=>(
              <div key={j} style={{background:"#0F172A",borderRadius:9,padding:"8px 12px",marginTop:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{color:"#94A3B8",fontSize:"0.78rem",fontWeight:600}}>{r.neighborhood||"—"}</div>
                  <div style={{color:"#64748B",fontSize:"0.68rem"}}>{fmtDate(r.ride_created)} {fmtTime(r.ride_created)}</div>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  {r.signed_at&&r.signature_data&&<button onClick={()=>setSigModal(r)} style={{background:"#1E293B",border:"1px solid #334155",borderRadius:6,padding:"4px 8px",cursor:"pointer"}}>
                    <img src={r.signature_data} style={{maxWidth:50,maxHeight:22,display:"block"}} alt="sig"/>
                  </button>}
                  <div style={{color:r.signed_at?"#4ADE80":"#F59E0B",fontWeight:700,fontSize:"0.75rem"}}>{r.signed_at?"✅":"⏳"}</div>
                </div>
              </div>
            ))}
          </div>
        ))}

        {!loading&&filteredRides.length===0&&view==="ride"&&(
          <div style={{textAlign:"center",color:"#64748B",padding:"40px 20px"}}>
            <div style={{fontSize:"2rem",marginBottom:8}}>📋</div>
            <div style={{fontWeight:700}}>No waivers found</div>
            <div style={{fontSize:"0.8rem",marginTop:4}}>Try adjusting your search or date filter</div>
          </div>
        )}
      </div>
    </div>
  );
}