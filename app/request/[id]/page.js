"use client";
import { useState, useEffect, useCallback, use } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import GuestChat from "../../components/GuestChat";

const TRACKER_STATUSES = new Set(['confirmed','pickup_started','driver_arrived','ride_active']);

const STATUS = {
  pending_waivers: { emoji:"", label:"Collecting Waivers",      color:"#F59E0B", bg:"#FEF3C7",  pill:"linear-gradient(135deg,#F59E0B,#FBBF24)" },
  pending:         { emoji:"", label:"Experience Pending",      color:"#3B82F6", bg:"#DBEAFE",  pill:"linear-gradient(135deg,#3B82F6,#60A5FA)" },
  waivers_complete:{ emoji:"", label:"Experience Pending",      color:"#3B82F6", bg:"#DBEAFE",  pill:"linear-gradient(135deg,#3B82F6,#60A5FA)" },
  confirmed:       { emoji:"", label:"Guide On The Way",        color:"#00B761", bg:"#D1FAE5",  pill:"#0B1D3A" },
  pickup_started:  { emoji:"", label:"Guide On The Way",        color:"#00B761", bg:"#D1FAE5",  pill:"#0B1D3A" },
  driver_arrived:  { emoji:"", label:"Your Guide Has Arrived",  color:"#00B761", bg:"#D1FAE5",  pill:"#0B1D3A" },
  ride_active:     { emoji:"", label:"Experience In Progress",  color:"#00B761", bg:"#D1FAE5",  pill:"#0B1D3A" },
  completed:       { emoji:"", label:"Experience Complete",     color:"#0B1D3A", bg:"#F3F4F6",  pill:"linear-gradient(135deg,#374151,#6B7280)" },
  declined:        { emoji:"", label:"Not Available Right Now", color:"#DC2626", bg:"#FEE2E2",  pill:"linear-gradient(135deg,#DC2626,#EF4444)" },
  canceled:        { emoji:"", label:"Reservation Canceled",    color:"#6B7280", bg:"#F3F4F6",  pill:"linear-gradient(135deg,#6B7280,#9CA3AF)" },
};

// Current active driver config â€” update this when driver assignment changes.
// photoUrl must be a file in /public. Do not use a generic fallback here.
const CURRENT_DRIVER = {
  name:            "Michele Frasure",
  plate:           "DZ02UM",
  vehicle:         "Ford Transit Connect 6pp Navy Blue Passenger Van",
  photoUrl:        "/driver-profile.png",
  relationship:    "City Tour Guide employee/driver",
};
const TRACKER_URL = "https://optimustracking.com/Guest/Map?token=6d75de1f-0332-4988-bfa4-ad4454817187";

export default function ConfirmPage({ params: paramsProp }) {
  const params       = use(paramsProp);
  const searchParams = useSearchParams();
  const isPaid    = searchParams.get("paid") === "1";
  const isTestPay = isPaid && searchParams.get("test") === "1";
  const [req, setReq]       = useState(null);
  const [waivers, setWaivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrUrl, setQrUrl]   = useState(null);
  const [copied, setCopied] = useState(null);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [canceling, setCanceling]         = useState(false);
  const [cancelError, setCancelError]     = useState('');
  const [downloadingWaiver, setDownloadingWaiver] = useState(null);
  const [dutyStatus, setDutyStatus] = useState(null);
  const [driverPos, setDriverPos]   = useState(null);
  const [driverContent, setDriverContent] = useState(null);
  const WAIVER_BASE = "https://waiver.citytourguide.app/sign";
  const CANCELABLE  = new Set(['pending_waivers','pending','waivers_complete','confirmed','pickup_started']);

  const load = useCallback(async () => {
    try {
      const [rRes, wRes] = await Promise.all([
        fetch("/api/hopper/request/" + params.id),
        fetch("/api/hopper/waiver/list/" + params.id)
      ]);
      setReq(await rRes.json());
      const wd = await wRes.json();
      setWaivers(wd.waivers || []);
    } catch {}
    setLoading(false);
  }, [params.id]);

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  useEffect(() => {
    const fetchDuty = () =>
      fetch('/api/hopper/duty-status', { cache: 'no-store' })
        .then(r => r.json()).then(d => setDutyStatus(d)).catch(() => {});
    fetchDuty();
    const t = setInterval(fetchDuty, 60000);
    return () => clearInterval(t);
  }, []);

  // Driver location + content polling
  useEffect(() => {
    const fetchPos = () =>
      fetch('/api/hopper/driver-location', { cache: 'no-store' })
        .then(r => r.json())
        .then(d => {
          if (d.available && d.lat && d.lng) setDriverPos({ lat: d.lat, lng: d.lng });
          if (d.content) setDriverContent(d.content);
        })
        .catch(() => {});
    fetchPos();
    const t = setInterval(fetchPos, 60000);
    return () => clearInterval(t);
  }, []);

  function emailShare(url, name) {
    const subj = encodeURIComponent("cityFUNHOP Waiver â€” please sign");
    const body = encodeURIComponent(`Hi ${name||"there"},\n\nPlease sign your cityFUNHOP liability waiver before your experience:\n${url}\n\nThis only takes 30 seconds.\n\nSee you soon!\nCity Tour Guide Inc.`);
    window.location.href = `mailto:?subject=${subj}&body=${body}`;
  }
  function copyLink(url) {
    navigator.clipboard?.writeText(url).then(()=>{ setCopied(url); setTimeout(()=>setCopied(null),2500); });
  }

  async function cancelRequest() {
    setCanceling(true); setCancelError('');
    try {
      const r = await fetch('/api/hopper/request/' + params.id + '/cancel', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: req.guest_phone }),
      });
      const d = await r.json();
      if (d.ok) { setCancelConfirm(false); await load(); }
      else { setCancelError(d.error || 'Could not cancel. Please try again.'); }
    } catch { setCancelError('Connection error. Please try again.'); }
    setCanceling(false);
  }

  async function downloadWaiver(token) {
    setDownloadingWaiver(token);
    try {
      const res = await fetch('/api/hopper/waiver/view-by-token/' + token, { headers: { 'Accept': 'application/json' } });
      const waiver = await res.json();
      if (waiver.error) { alert('Could not load waiver: ' + waiver.error); return; }
      const { generateWaiverPDF } = await import('@/lib/generateWaiverPDF');
      await generateWaiverPDF(waiver);
    } catch {
      window.open('/api/hopper/waiver/view-by-token/' + token, '_blank');
    }
    setDownloadingWaiver(null);
  }

  if (loading) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Inter,sans-serif",fontSize:"2rem"}}>â³</div>;
  if (!req||req.error) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Inter,sans-serif",padding:20,flexDirection:"column",gap:12,textAlign:"center"}}>
      <div style={{fontSize:"2rem"}}>âŒ</div>
      <div style={{fontWeight:800,color:"#0B1D3A"}}>Request not found</div>
      <Link href="/request" style={{color:"#0066FF",fontSize:"0.85rem"}}>â† Book a new hop</Link>
    </div>
  );

  const allSigned   = waivers.length > 0 && waivers.every(w => w.signed_at);
  const signedCount = waivers.filter(w => w.signed_at).length;
  const guestCount  = req.guest_count || waivers.length || 1;
  const coveredCount = waivers.filter(w => w.signed_at).reduce((sum, w) => sum + 1 + (w.minor_count || 0), 0);
  const allCovered  = coveredCount >= guestCount;
  const displayStatus =
    (req.status === "pending_waivers" && allSigned) ? "pending" :
    (req.status === "waivers_complete") ? "pending" :
    req.status;
  const st = STATUS[displayStatus] || STATUS.pending;
  const isActive = TRACKER_STATUSES.has(req.status);

  return (
    <div style={{minHeight:"100vh",background:"#F9FAFB",fontFamily:"Inter,sans-serif"}}>

      {/* QR Modal */}
      {qrUrl && (
        <div style={{position:"fixed",inset:0,zIndex:999,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setQrUrl(null)}>
          <div style={{background:"#fff",borderRadius:20,padding:28,textAlign:"center",maxWidth:300}} onClick={e=>e.stopPropagation()}>
            <div style={{fontWeight:800,fontSize:"0.88rem",color:"#0B1D3A",marginBottom:12}}>Scan to Sign Waiver</div>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrUrl)}`} alt="QR Code" style={{width:220,height:220,borderRadius:8}} />
            <div style={{fontSize:"0.72rem",color:"#6B7280",marginTop:10,wordBreak:"break-all"}}>{qrUrl}</div>
            <button onClick={()=>setQrUrl(null)} style={{marginTop:16,padding:"10px 24px",borderRadius:10,border:"none",background:"#0B1D3A",color:"#fff",fontWeight:700,cursor:"pointer",fontFamily:"Inter,sans-serif"}}>Done</button>
          </div>
        </div>
      )}

      {/* â”€â”€ HEADER with inline status pill â”€â”€ */}
      <div style={{background:"#0B1D3A",paddingBottom:14}}>
        <div style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
          <Link href="/" style={{color:"rgba(255,255,255,0.55)",fontSize:"0.8rem",textDecoration:"none",flexShrink:0}}>Home</Link>
          <div style={{flex:1,textAlign:"center",color:"#fff",fontWeight:800,fontSize:"0.95rem"}}>Hop Request</div>
          <div style={{width:40}}/>
        </div>
        {/* Status pill */}
        <div style={{textAlign:"center"}}>
          {isActive ? (
            <span style={{
              display:"inline-flex",alignItems:"center",gap:8,
              background:"#0B1D3A",
              padding:"5px 16px 5px 5px",borderRadius:999,
              border:"1.5px solid #00FF88",
              boxShadow:"0 0 12px rgba(0,255,136,0.3)",
              letterSpacing:"0.01em"
            }}>
              <img src="/driver-profile.png" alt="Guide"
                style={{width:28,height:28,borderRadius:"50%",border:"1.5px solid #00FF88",objectFit:"cover",flexShrink:0,display:"block"}} />
              <span style={{color:"#00FF88",fontWeight:700,fontSize:"0.88rem"}}>{st.emoji} {st.label}</span>
            </span>
          ) : (
            <span style={{
              display:"inline-flex",alignItems:"center",gap:8,
              background:st.pill,
              color:"#fff",fontWeight:800,fontSize:"0.88rem",
              padding:"9px 20px",borderRadius:999,
              boxShadow:"0 2px 8px rgba(0,0,0,0.3)",
              letterSpacing:"0.01em"
            }}>
              <span style={{width:8,height:8,borderRadius:"50%",background:"rgba(255,255,255,0.6)",display:"inline-block",flexShrink:0}}/>
              {st.emoji} {st.label}
            </span>
          )}
        </div>
      </div>

      <div style={{padding:"14px 16px",maxWidth:480,margin:"0 auto",display:"flex",flexDirection:"column",gap:12}}>

        {/* Test pay banner */}
        {isTestPay && (
          <div style={{background:"#FEF3C7",border:"1.5px solid #F59E0B",borderRadius:12,padding:"14px 16px",fontSize:"0.83rem",color:"#92400E",fontWeight:600,display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:"1.2rem"}}>ðŸ§ª</span>
            <span>Test payment completed. Thank you for hopping with cityFUNHOP.</span>
          </div>
        )}

        {/* â”€â”€ INLINE DRIVER MAP (active statuses only) â”€â”€ */}
        {isActive && (
          <div style={{borderRadius:12,overflow:"hidden",border:"1.5px solid #E5E7EB",background:"#1a1a2e"}}>
            {driverPos ? (
              <>
                <iframe
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${driverPos.lng-0.005},${driverPos.lat-0.005},${driverPos.lng+0.005},${driverPos.lat+0.005}&layer=mapnik&marker=${driverPos.lat},${driverPos.lng}`}
                  style={{width:'100%',height:'220px',border:'none',display:'block'}} 
                  title="Driver location"
                />
                <div style={{background:'#0B1D3A',padding:'9px 16px',display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:'0.85rem'}}>ðŸ“</span><span style={{color:'#00FF88',fontSize:'0.74rem',fontWeight:700}}>Your guide is nearby Â· updates every minute</span></div>
              </>
            ) : (
              <div style={{width:'100%',height:'200px',background:'#1a1a2e',
                borderRadius:'10px',marginTop:'12px',display:'flex',
                alignItems:'center',justifyContent:'center',
                color:'#94a3b8',fontSize:'0.85rem'}}>
                ðŸ“ Locating your guide...
              </div>
            )}
          </div>
        )}

        {/* â”€â”€ GEO-CONTENT CARD (active statuses + content available) â”€â”€ */}
        {isActive && driverContent && (
          <div style={{
            background:"#fff",
            border:"1.5px solid #E5E7EB",
            borderLeft:"4px solid #00FF88",
            borderRadius:12,
            overflow:"hidden",
            boxShadow:"0 2px 10px rgba(0,183,97,0.08)"
          }}>
            {driverContent.image_url && (
              <img
                src={driverContent.image_url}
                alt=""
                style={{width:"100%",maxHeight:100,objectFit:"cover",display:"block"}}
                onError={e=>{e.currentTarget.style.display="none";}}
              />
            )}
            <div style={{padding:"13px 15px"}}>
              <div style={{fontWeight:800,fontSize:"0.85rem",color:"#0B1D3A",marginBottom:4,lineHeight:1.3}}>
                {driverContent.title}
              </div>
              <div style={{fontSize:"0.78rem",color:"#6B7280",lineHeight:1.6,marginBottom:driverContent.cta_text?10:0}}>
                {driverContent.body}
              </div>
              {driverContent.cta_text && driverContent.cta_url && (
                <a href={driverContent.cta_url} target="_blank" rel="noopener noreferrer"
                  style={{display:"inline-block",padding:"9px 20px",background:"#00FF88",color:"#0B1D3A",fontWeight:900,fontSize:"0.76rem",borderRadius:24,textDecoration:"none"}}>
                  {driverContent.cta_text}
                </a>
              )}
            </div>
          </div>
        )}

        {/* â”€â”€ DRIVER + VEHICLE CARD â”€â”€ */}
        <div style={{background:"#fff",border:"1.5px solid #E5E7EB",borderRadius:16,overflow:"hidden",
          boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
          {/* Header row */}
          <div style={{padding:"12px 16px",borderBottom:"1px solid #F3F4F6",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontWeight:800,fontSize:"0.82rem",color:"#0B1D3A",letterSpacing:"0.04em",textTransform:"uppercase"}}>Your City Guide & Vehicle</span>
            {isActive && <span style={{marginLeft:"auto",fontSize:"0.68rem",fontWeight:700,color:"#059669",background:"#D1FAE5",padding:"3px 10px",borderRadius:999}}>â— Assigned</span>}
          </div>

          {/* Vehicle photo */}
          <div style={{position:"relative",background:"#f8f9fb",overflow:"hidden",height:170}}>
            <img src="/transit-van.png" alt="Ford Transit Connect 6pp Navy Blue Passenger Van"
              style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center"}}
              onError={e=>{e.currentTarget.style.display="none";}}/>
          </div>

          {/* Driver + Plate row */}
          <div style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:14}}>
            {/* Driver avatar â€” profile photo */}
            <div style={{width:52,height:52,borderRadius:"50%",flexShrink:0,
              border:"2.5px solid #00FF88",
              boxShadow:"0 3px 12px rgba(0,255,136,0.35)",
              overflow:"hidden",background:"#059669",
              display:"flex",alignItems:"center",justifyContent:"center"}}>
              <img src={CURRENT_DRIVER.photoUrl} alt={CURRENT_DRIVER.name}
                style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center top",display:"block"}}
                onError={e=>{e.currentTarget.style.display="none";}}/>
            </div>
            {/* Name + vehicle */}
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:900,fontSize:"1rem",color:"#0B1D3A",lineHeight:1.2}}>{CURRENT_DRIVER.name}</div>
              <div style={{fontSize:"0.72rem",color:"#6B7280",marginTop:2}}>{CURRENT_DRIVER.vehicle}</div>
            </div>
            {/* License plate */}
            <div style={{textAlign:"center",flexShrink:0}}>
              <div style={{
                background:"#0B1D3A",color:"#00FF88",
                fontWeight:900,fontSize:"1rem",
                padding:"6px 14px",borderRadius:8,
                letterSpacing:"0.12em",fontFamily:"monospace",
                border:"2px solid #00FF88",
                boxShadow:"0 0 10px rgba(0,255,136,0.25)"
              }}>{CURRENT_DRIVER.plate}</div>
              <div style={{fontSize:"0.6rem",color:"#9CA3AF",marginTop:4,fontWeight:600,letterSpacing:"0.06em"}}>LICENSE PLATE</div>
            </div>
          </div>
        </div>

        {/* Off duty notice for pre-acceptance */}
        {['pending_waivers','pending','waivers_complete'].includes(req.status) &&
         dutyStatus !== null && !dutyStatus.is_on_duty && (
          <div style={{background:'#FEF3C7',border:'1.5px solid #F59E0B',borderRadius:12,padding:'14px'}}>
            <div style={{fontWeight:700,fontSize:'0.82rem',color:'#92400E',marginBottom:6}}>âš ï¸ cityFUNHOP is no longer live right now.</div>
            <div style={{fontSize:'0.78rem',color:'#92400E',lineHeight:1.5,marginBottom:10}}>Your experience has not been confirmed yet. You can schedule a future hop instead.</div>
            <a href="/request?type=scheduled"
              style={{display:'inline-block',padding:'9px 16px',borderRadius:10,background:'#F59E0B',color:'#fff',fontWeight:700,fontSize:'0.78rem',textDecoration:'none'}}>
              ðŸ“… Schedule in Advance
            </a>
          </div>
        )}

        {/* Sub-caption for pending statuses */}
        {displayStatus === "pending" && (
          <div style={{textAlign:"center",fontSize:"0.78rem",color:"#3B82F6",fontWeight:600}}>
            Your experience is queued â€” waiting for your guide to confirm.
          </div>
        )}
        {req.status === "declined" && (
          <div style={{textAlign:"center",fontSize:"0.78rem",color:"#DC2626",fontWeight:600}}>
            No experience hosts available right now.
          </div>
        )}

        {/* â”€â”€ REQUEST DETAILS CARD â”€â”€ */}
        <div style={{background:"#fff",border:"1.5px solid #E5E7EB",borderRadius:14,overflow:"hidden"}}>
          <div style={{padding:"12px 16px",borderBottom:"1px solid #F3F4F6",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontWeight:700,fontSize:"0.82rem",color:"#6B7280"}}>Your Offer</span>
            <span style={{fontWeight:900,fontSize:"1.4rem",color:"#0044CC"}}>${req.offered_price}</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr"}}>
            <div style={{padding:"12px 16px",borderRight:"1px solid #F3F4F6"}}>
              <div style={{fontSize:"0.62rem",fontWeight:700,color:"#16A34A",letterSpacing:"0.08em",marginBottom:4}}>HOP ON</div>
              <div style={{fontSize:"0.82rem",fontWeight:600,color:"#0B1D3A"}}>{req.pickup_notes||req.neighborhood||"â€”"}</div>
            </div>
            <div style={{padding:"12px 16px"}}>
              <div style={{fontSize:"0.62rem",fontWeight:700,color:"#EF4444",letterSpacing:"0.08em",marginBottom:4}}>HOP OFF</div>
              <div style={{fontSize:"0.82rem",fontWeight:600,color:"#0B1D3A"}}>{req.dropoff_notes||"â€”"}</div>
            </div>
          </div>
          <div style={{padding:"10px 16px",borderTop:"1px solid #F3F4F6",display:"flex",justifyContent:"space-between"}}>
            <span style={{fontSize:"0.78rem",color:"#6B7280"}}>{req.guest_name}</span>
            <span style={{fontSize:"0.78rem",color:"#6B7280"}}>{req.guest_count} guest{req.guest_count!==1?"s":""}</span>
          </div>
        </div>

        {/* â”€â”€ WAIVERS CARD â”€â”€ */}
        {waivers.length > 0 && (
          <div style={{background:"#fff",border:"1.5px solid #E5E7EB",borderRadius:14,overflow:"hidden"}}>
            <div style={{padding:"12px 16px",borderBottom:"1px solid #F3F4F6",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:"0.88rem",color:"#0B1D3A"}}>Passenger Waivers</span>
              <span style={{fontSize:"0.75rem",fontWeight:700,color:allCovered?"#059669":"#F59E0B"}}>
                {allCovered
                  ? `âœ… All ${guestCount} rider${guestCount!==1?"s":""} covered`
                  : `${coveredCount} of ${guestCount} riders covered`}
              </span>
            </div>

            {waivers.map((w,i) => {
              const url    = WAIVER_BASE + "/" + w.token + "?return_url=" + encodeURIComponent("https://hopper.citytourguide.app/request/" + params.id);
              const signed = !!w.signed_at;
              const isMain = i === 0;
              return (
                <div key={w.id||i} style={{padding:"14px 16px",borderBottom:i<waivers.length-1?"1px solid #F3F4F6":"none"}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:signed?8:(!isMain?10:0)}}>
                    <div style={{width:36,height:36,borderRadius:"50%",background:signed?"#D1FAE5":"#FEF3C7",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.1rem",flexShrink:0}}>
                      <span aria-hidden="true" style={{width:10,height:10,borderRadius:"50%",background:signed?"#059669":"#F59E0B",display:"block"}} />
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:"0.84rem",color:"#0B1D3A"}}>{w.guest_name || (isMain ? req.guest_name : "Guest "+(i+1))}</div>
                      <div style={{fontSize:"0.7rem",color:signed?"#059669":"#F59E0B",fontWeight:600}}>{signed?"Waiver signed":"Waiver pending"}</div>
                    </div>
                    {isMain && !signed && (
                      <a href={url} style={{padding:"8px 14px",borderRadius:8,background:"linear-gradient(135deg,#0057E7,#0095FF)",color:"#fff",fontSize:"0.78rem",fontWeight:700,textDecoration:"none",whiteSpace:"nowrap",boxShadow:"0 2px 8px rgba(0,87,231,0.3)"}}>
                        Sign Mine
                      </a>
                    )}
                  </div>

                  {signed && (
                    <>
                      {(w.minor_count||0) > 0 && (
                        <div style={{fontSize:"0.72rem",color:"#059669",fontWeight:600,marginBottom:6}}>
                          Covers adult + {w.minor_count} minor child{w.minor_count!==1?"ren":""}
                        </div>
                      )}
                      <button
                        onClick={() => downloadWaiver(w.token)}
                        disabled={downloadingWaiver === w.token}
                        style={{display:"block",width:"100%",padding:"9px 14px",borderRadius:9,background:"#EFF6FF",border:"1.5px solid #BFDBFE",color:"#1D4ED8",fontSize:"0.78rem",fontWeight:700,textAlign:"center",fontFamily:"Inter,sans-serif",cursor:"pointer",opacity:downloadingWaiver===w.token?0.7:1}}>
                        {downloadingWaiver === w.token ? 'â³ Preparing PDFâ€¦' : 'ðŸ“„ Download Signed Waiver'}
                      </button>
                    </>
                  )}

                  {!signed && !isMain && (
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,marginTop:4}}>
                      <button onClick={()=>copyLink(url)}
                        style={{padding:"9px 4px",borderRadius:9,border:copied===url?"1.5px solid #059669":"1.5px solid #0066FF",background:copied===url?"#D1FAE5":"#EFF6FF",color:copied===url?"#065F46":"#0044CC",fontSize:"0.72rem",fontWeight:700,cursor:"pointer",fontFamily:"Inter,sans-serif",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                        <span style={{fontSize:"1rem"}}>{copied===url?'âœ…':'ðŸ“‹'}</span>{copied===url?'Copied!':'Copy Link'}
                      </button>
                      <button onClick={()=>emailShare(url,w.guest_name||"Guest "+(i+1))}
                        style={{padding:"9px 4px",borderRadius:9,border:"1.5px solid #0066FF",background:"#EFF6FF",color:"#0044CC",fontSize:"0.72rem",fontWeight:700,cursor:"pointer",fontFamily:"Inter,sans-serif",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                        <span style={{fontSize:"1rem"}}>ðŸ“§</span>Email
                      </button>
                      <button onClick={()=>setQrUrl(url)}
                        style={{padding:"9px 4px",borderRadius:9,border:"1.5px solid #0066FF",background:"#EFF6FF",color:"#0044CC",fontSize:"0.72rem",fontWeight:700,cursor:"pointer",fontFamily:"Inter,sans-serif",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                        <span style={{fontSize:"1rem"}}>ðŸ“·</span>QR Code
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {!allSigned && (
              <div style={{padding:"10px 16px",background:"#FFFBEB",borderTop:"1px solid #FEF3C7",fontSize:"0.73rem",color:"#92400E",lineHeight:1.5}}>
Each adult signs their own waiver. For minors, the parent or guardian signs on their behalf.
              </div>
            )}
          </div>
        )}

        {/* Pay CTA */}
        {req.status==="completed" && !isPaid && (
          <Link href={"/pay/"+params.id} style={{display:"block",padding:"16px",borderRadius:14,background:"linear-gradient(135deg,#0057E7,#0095FF)",color:"#fff",fontWeight:900,fontSize:"1rem",textAlign:"center",textDecoration:"none",boxShadow:"0 6px 24px rgba(0,87,231,0.35)"}}>
            ðŸ’³ Pay + Tip Your Guide
          </Link>
        )}
        {req.status==="completed" && isPaid && (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <Link href="/request" style={{display:"block",padding:"16px",borderRadius:14,background:"linear-gradient(135deg,#059669,#10B981)",color:"#fff",fontWeight:900,fontSize:"1rem",textAlign:"center",textDecoration:"none",boxShadow:"0 6px 24px rgba(5,150,105,0.3)"}}>
              ðŸ›º Request Another Hop
            </Link>
            <Link href="/" style={{display:"block",padding:"13px",borderRadius:12,border:"1.5px solid #E5E7EB",background:"#fff",color:"#374151",fontWeight:700,fontSize:"0.88rem",textAlign:"center",textDecoration:"none"}}>
              â† Back Home
            </Link>
          </div>
        )}
        {req.status==="declined" && (
          <div style={{textAlign:"center"}}>
            <Link href="/request" style={{padding:"12px 24px",borderRadius:12,background:"#0057E7",color:"#fff",fontWeight:700,fontSize:"0.88rem",textDecoration:"none"}}>Try Again</Link>
          </div>
        )}

        {/* Copy link */}
        {["pending_waivers","pending","waivers_complete","confirmed","pickup_started","driver_arrived"].includes(req.status) && (
          <div style={{textAlign:"center",marginTop:4}}>
            <button
              onClick={()=>copyLink(window.location.href)}
              style={{background:"none",border:"none",color:copied===window.location.href?"#059669":"#9CA3AF",fontSize:"0.72rem",cursor:"pointer",fontFamily:"Inter,sans-serif",textDecoration:"underline",padding:0}}>
              {copied===window.location.href?"Copied!":"Copy this link"}
            </button>
          </div>
        )}

        {/* Cancel */}
        {CANCELABLE.has(req.status) && !cancelConfirm && (
          <div style={{textAlign:"center",marginTop:2}}>
            <button
              onClick={() => { setCancelConfirm(true); setCancelError(''); }}
              style={{background:"none",border:"none",color:"#9CA3AF",fontSize:"0.72rem",cursor:"pointer",fontFamily:"Inter,sans-serif",textDecoration:"underline",padding:0}}>
              Cancel this reservation
            </button>
          </div>
        )}

        {cancelConfirm && (
          <div style={{background:"#FEF2F2",border:"1.5px solid #FCA5A5",borderRadius:14,padding:"16px",display:"flex",flexDirection:"column",gap:10}}>
            <div style={{fontWeight:700,fontSize:"0.88rem",color:"#991B1B",textAlign:"center"}}>Cancel this hop?</div>
            <div style={{fontSize:"0.78rem",color:"#6B7280",textAlign:"center",lineHeight:1.5}}>This cannot be undone. Your offer will not be charged.</div>
            {cancelError && <div style={{fontSize:"0.75rem",color:"#DC2626",textAlign:"center",fontWeight:600}}>{cancelError}</div>}
            <div style={{display:"flex",gap:8}}>
              <button onClick={() => { setCancelConfirm(false); setCancelError(''); }} disabled={canceling}
                style={{flex:1,padding:"11px",borderRadius:10,border:"1.5px solid #E5E7EB",background:"#fff",color:"#374151",fontWeight:700,fontSize:"0.85rem",cursor:"pointer",fontFamily:"Inter,sans-serif"}}>
                Keep My Reservation
              </button>
              <button onClick={cancelRequest} disabled={canceling}
                style={{flex:1,padding:"11px",borderRadius:10,border:"none",background:"#DC2626",color:"#fff",fontWeight:800,fontSize:"0.85rem",cursor:"pointer",fontFamily:"Inter,sans-serif",opacity:canceling?0.7:1}}>
                {canceling ? 'Cancelingâ€¦' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        )}

        {req && !["declined","canceled","completed"].includes(req.status) && <GuestChat requestId={params.id} guestName={req.guest_name}/>}

        <div style={{textAlign:"center",fontSize:"0.65rem",color:"#9CA3AF",lineHeight:1.6,maxWidth:320,margin:"0 auto 8px",paddingTop:8}}>City Tour Guide connects guests with featured local destinations, attractions, dining, entertainment, and curated city experiences.</div>
        <div style={{textAlign:"center",fontSize:"0.68rem",color:"#9CA3AF",paddingBottom:24}}>Auto-refreshing - #{params.id.slice(0,8).toUpperCase()}</div>
      </div>
    </div>
  );
}



