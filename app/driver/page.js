'use client';
import { useState, useEffect, useCallback } from 'react';
import DriverChat from '../components/DriverChat';

const DRIVER_NAME = 'Michele Frasure';
const DRIVER_PLATE = 'DZ02UM';

function getOpsPassword() {
  if (typeof window === 'undefined') return '';

  saved = window.sessionStorage.getItem('hopper_ops_password');
  if (saved) return saved;

  entered = window.prompt('Enter operations password') || '';
  if (entered) {
    window.sessionStorage.setItem('hopper_ops_password', entered);
  }

  return entered;
}

function CTGLogo() {
  return (
    <div style={{display:'flex',alignItems:'center',flexShrink:0}}>
      <div style={{background:'#000',padding:'5px 11px',textAlign:'center',lineHeight:1,fontFamily:"'Playfair Display',Georgia,serif"}}>
        <div style={{color:'#fff',fontWeight:900,fontSize:'1rem',letterSpacing:'0.04em',display:'block'}}>CITY</div>
        <div style={{position:'relative',display:'flex',alignItems:'center',justifyContent:'center',margin:'1px 0'}}>
          <span style={{color:'#fff',fontWeight:900,fontSize:'1rem',letterSpacing:'0.04em'}}>TOUR</span>
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <span style={{background:'#000',color:'#fff',fontSize:'0.28rem',fontWeight:700,letterSpacing:'0.25em',padding:'1px 3px',whiteSpace:'nowrap',border:'0.5px solid rgba(255,255,255,0.7)',fontFamily:'Inter,sans-serif'}}>TAMPA</span>
          </div>
        </div>
        <div style={{color:'#fff',fontWeight:900,fontSize:'1rem',letterSpacing:'0.04em',display:'flex',alignItems:'flex-end',justifyContent:'center',gap:2}}>
          <span>GUIDE</span>
          <span style={{fontSize:'0.28rem',fontWeight:700,fontFamily:'Inter,sans-serif',lineHeight:2.2,letterSpacing:'0.1em',opacity:0.85}}>INC.</span>
        </div>
      </div>
    </div>
  );
}

const STATUS_COLOR = {
  pending:     { bg:'#FEF3C7', border:'#F59E0B', text:'#92400E', label:'â³ Pending' },
  confirmed:   { bg:'#D1FAE5', border:'#059669', text:'#065F46', label:'âœ… Confirmed' },
  ride_active: { bg:'#DBEAFE', border:'#2563EB', text:'#1E3A8A', label:'ðŸ›º Experience Active' },
  completed:   { bg:'#F3F4F6', border:'#9CA3AF', text:'#374151', label:'ðŸ Completed' },
  declined:    { bg:'#FEE2E2', border:'#EF4444', text:'#991B1B', label:'âŒ Declined' },
  canceled:    { bg:'#F3F4F6', border:'#9CA3AF', text:'#6B7280', label:'âœ• Guest Canceled' },
};

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 60) return diff + 's ago';
  if (diff < 3600) return Math.floor(diff/60) + 'm ago';
  return Math.floor(diff/3600) + 'h ago';
}

// Wave F: Port landmark normalization
const PORT_PATTERN = /port\s*(of\s*)?tampa|port.*channelside/i;
function normalizeLocation(text) {
  if (!text) return text;
  if (PORT_PATTERN.test(text)) return 'Port Tampa Bay Cruise Terminal, Channelside, Tampa, FL';
  return text;
}
function buildMapsUrl(text, neighborhood) {
  const normalized = normalizeLocation(text);
  if (normalized) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(normalized)}`;
  if (neighborhood) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(neighborhood + ' Tampa FL')}`;
  return null;
}

function RequestCard({ req, onAction, loading, viewWaivers, smsSending, smsError, sendBusinessSms }) {
  const st = STATUS_COLOR[req.status] || STATUS_COLOR.pending;
  const pickupUrl  = buildMapsUrl(req.pickup_notes,  req.neighborhood);
  const dropoffUrl = buildMapsUrl(req.dropoff_notes, req.neighborhood);

  return (
    <div style={{background:'#fff',border:'1.5px solid #E5E7EB',borderRadius:16,overflow:'hidden',marginBottom:14,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
      <div style={{padding:'14px 16px',borderBottom:'1px solid #F3F4F6'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
          <div>
            <div style={{fontWeight:800,fontSize:'0.95rem',color:'#0B1D3A'}}>{req.guest_name}</div>
            <div style={{fontSize:'0.75rem',color:'#6B7280',marginTop:2}}>
              {req.guest_phone} Â· {req.adults != null
                ? `${req.adults} adult${req.adults!==1?'s':''} Â· ${req.children||0} child${(req.children||0)!==1?'ren':''} Â· ${req.guest_count} total`
                : `${req.guest_count} guest${req.guest_count!==1?'s':''}`}
            </div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontWeight:900,fontSize:'1.3rem',color:'#0044CC'}}>${req.offered_price}</div>
            <div style={{fontSize:'0.65rem',color:'#9CA3AF'}}>{timeAgo(req.created_at)}</div>
          </div>
        </div>

        <div style={{display:'flex',gap:8,marginBottom:10}}>
          <div style={{flex:1,background:'#F0FDF4',borderRadius:10,padding:'8px 10px'}}>
            <div style={{fontSize:'0.62rem',fontWeight:700,color:'#16A34A',letterSpacing:'0.06em',marginBottom:2}}>HOP ON</div>
            <div style={{fontSize:'0.8rem',fontWeight:600,color:'#111827'}}>{req.pickup_notes || req.neighborhood || 'â€”'}</div>
          </div>
          <div style={{flex:1,background:'#FEF2F2',borderRadius:10,padding:'8px 10px'}}>
            <div style={{fontSize:'0.62rem',fontWeight:700,color:'#EF4444',letterSpacing:'0.06em',marginBottom:2}}>HOP OFF</div>
            <div style={{fontSize:'0.8rem',fontWeight:600,color:'#111827'}}>{req.dropoff_notes || 'â€”'}</div>
          </div>
        </div>

        <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 10px',borderRadius:20,border:'1px solid '+st.border,background:st.bg}}>
            <span style={{fontSize:'0.72rem',fontWeight:700,color:st.text}}>{st.label}</span>
          </div>
          {(() => {
            const ws = req.hopper_waivers || [];
            const guestCount = req.guest_count || ws.length || 1;
            const coveredCount = ws
              .filter(w => w.signed_at)
              .reduce((sum, w) => {
                const mc = Array.isArray(w.minors) ? w.minors.length : 0;
                return sum + 1 + mc;
              }, 0);
            const allCovered = coveredCount >= guestCount;
            if (ws.length === 0) return null;
            return (
              <div style={{display:'inline-flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:20,
                border:'1px solid '+(allCovered?'#10B981':'#F59E0B'),
                background:allCovered?'#D1FAE5':'#FEF3C7'}}>
                <span style={{fontSize:'0.72rem',fontWeight:700,color:allCovered?'#065F46':'#92400E'}}>
                  {allCovered
                    ? `âœ… All ${guestCount} guest${guestCount!==1?'s':''} covered`
                    : `ðŸ“ ${coveredCount} of ${guestCount} guests covered`}
                </span>
              </div>
            );
          })()}
        </div>
      </div>

      <div style={{padding:'12px 16px',display:'flex',gap:8,flexWrap:'wrap'}}>
        <div style={{display:'flex',gap:8,width:'100%'}}>
          <button onClick={() => viewWaivers && viewWaivers(req.id)}
            style={{flex:1,padding:'9px',borderRadius:12,border:'1.5px solid #E5E7EB',cursor:'pointer',background:'#F9FAFB',color:'#374151',fontWeight:700,fontSize:'0.82rem',fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
            ðŸ“‹ View Waivers
          </button>
          <a href={`/request/${req.id}`} target="_blank" rel="noreferrer"
            style={{flex:1,padding:'9px',borderRadius:12,border:'1.5px solid #E5E7EB',background:'#F9FAFB',color:'#374151',fontWeight:700,fontSize:'0.82rem',fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',justifyContent:'center',gap:6,textDecoration:'none'}}>
            ðŸ‘ Rider Page
          </a>
          {req.guest_phone && (() => {
            const smsState = smsSending[req.id];
            const smsErr   = smsError[req.id];
            return (
              <div style={{flex:1}}>
                <div style={{display:'flex',gap:6,marginBottom: smsErr ? 6 : 0}}>
                  {/* Business SMS: sends from 833-813-8687 via GHL */}
                  <button onClick={() => sendBusinessSms(req)}
                    disabled={smsState === 'sending'}
                    style={{flex:1,padding:'9px',borderRadius:12,border:'1.5px solid #0057E7',
                      background: smsState==='sent' ? '#D1FAE5' : '#EFF6FF',
                      color: smsState==='sent' ? '#065F46' : '#0057E7',
                      fontWeight:700,fontSize:'0.78rem',fontFamily:'Inter,sans-serif',
                      display:'flex',alignItems:'center',justifyContent:'center',gap:5,
                      cursor: smsState==='sending' ? 'not-allowed' : 'pointer',
                      opacity: smsState==='sending' ? 0.7 : 1}}>
                    {smsState==='sending' ? 'â³ Sendingâ€¦' : smsState==='sent' ? 'âœ… Sent' : 'ðŸ“¨ 833-813-8687'}
                  </button>
                </div>
                {/* Error notice: only shown if GHL SMS failed */}
                {smsErr && (
                  <div style={{background:'#FEF3C7',border:'1px solid #F59E0B',borderRadius:8,
                    padding:'7px 10px',fontSize:'0.72rem',color:'#92400E',fontWeight:600,
                    lineHeight:1.4}}>
                    âš ï¸ {smsErr}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
        {req.status==='pending' && (
          <>
            <button onClick={() => onAction(req.id,'confirmed')} disabled={loading===req.id}
              style={{flex:2,padding:'11px',borderRadius:12,border:'none',cursor:'pointer',background:'linear-gradient(135deg,#059669,#10B981)',color:'#fff',fontWeight:800,fontSize:'0.88rem',fontFamily:'Inter,sans-serif'}}>
              {loading===req.id ? '...' : 'âœ… Accept'}
            </button>
            <button onClick={() => onAction(req.id,'declined')} disabled={loading===req.id}
              style={{flex:1,padding:'11px',borderRadius:12,border:'1.5px solid #FCA5A5',cursor:'pointer',background:'#FEF2F2',color:'#DC2626',fontWeight:700,fontSize:'0.88rem',fontFamily:'Inter,sans-serif'}}>
              Decline
            </button>
          </>
        )}
        {req.status==='pending_waivers' && (() => {
          const ws2 = req.hopper_waivers || [];
          const allSigned2 = ws2.length > 0 && ws2.every(w => w.signed_at);
          return (
            <>
              {allSigned2
                ? <button onClick={() => onAction(req.id,'confirmed')} disabled={loading===req.id}
                    style={{flex:2,padding:'11px',borderRadius:12,border:'none',cursor:'pointer',background:'linear-gradient(135deg,#059669,#10B981)',color:'#fff',fontWeight:800,fontSize:'0.88rem',fontFamily:'Inter,sans-serif',opacity:loading===req.id?0.7:1}}>
                    {loading===req.id ? '...' : 'âœ… Accept'}
                  </button>
                : <div style={{flex:2,padding:'11px',borderRadius:12,background:'#FFFBEB',border:'1.5px solid #FDE68A',fontSize:'0.8rem',color:'#92400E',fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    â³ Awaiting guest signatures
                  </div>
              }
              <button onClick={() => onAction(req.id,'declined')} disabled={loading===req.id}
                style={{flex:1,padding:'11px',borderRadius:12,border:'1.5px solid #FCA5A5',cursor:'pointer',background:'#FEF2F2',color:'#DC2626',fontWeight:700,fontSize:'0.88rem',fontFamily:'Inter,sans-serif'}}>
                Decline
              </button>
            </>
          );
        })()}
        {req.status==='waivers_complete' && (
          <>
            <button onClick={() => onAction(req.id,'confirmed')} disabled={loading===req.id}
              style={{flex:2,padding:'11px',borderRadius:12,border:'none',cursor:'pointer',background:'linear-gradient(135deg,#059669,#10B981)',color:'#fff',fontWeight:800,fontSize:'0.88rem',fontFamily:'Inter,sans-serif',opacity:loading===req.id?0.7:1}}>
              {loading===req.id ? '...' : 'âœ… Accept'}
            </button>
            <button onClick={() => onAction(req.id,'declined')} disabled={loading===req.id}
              style={{flex:1,padding:'11px',borderRadius:12,border:'1.5px solid #FCA5A5',cursor:'pointer',background:'#FEF2F2',color:'#DC2626',fontWeight:700,fontSize:'0.88rem',fontFamily:'Inter,sans-serif'}}>
              Decline
            </button>
          </>
        )}
        {['confirmed','pickup_started','driver_arrived'].includes(req.status) && pickupUrl && (
          <a href={pickupUrl} target="_blank" rel="noreferrer"
            style={{display:'flex',width:'100%',padding:'11px',borderRadius:12,border:'none',cursor:'pointer',
              background:'linear-gradient(135deg,#0B1D3A,#1E3A5F)',color:'#fff',fontWeight:800,fontSize:'0.88rem',
              fontFamily:'Inter,sans-serif',textAlign:'center',textDecoration:'none',
              alignItems:'center',justifyContent:'center',gap:8}}>
            ðŸ—ºï¸ Navigate to Pickup
          </a>
        )}
        {req.status === 'ride_active' && dropoffUrl && (
          <a href={dropoffUrl} target="_blank" rel="noreferrer"
            style={{display:'flex',width:'100%',padding:'11px',borderRadius:12,border:'none',cursor:'pointer',
              background:'linear-gradient(135deg,#7C3AED,#9333EA)',color:'#fff',fontWeight:800,fontSize:'0.88rem',
              fontFamily:'Inter,sans-serif',textAlign:'center',textDecoration:'none',
              alignItems:'center',justifyContent:'center',gap:8}}>
            ðŸ—ºï¸ Navigate to Drop-off
          </a>
        )}
        {req.status==='confirmed' && (
          <button onClick={() => onAction(req.id,'pickup_started')} disabled={loading===req.id}
            style={{flex:1,padding:'11px',borderRadius:12,border:'none',cursor:'pointer',background:'linear-gradient(135deg,#0057E7,#0095FF)',color:'#fff',fontWeight:800,fontSize:'0.88rem',fontFamily:'Inter,sans-serif',opacity:loading===req.id?0.7:1}}>
            {loading===req.id ? 'ðŸš— Startingâ€¦' : 'ðŸš— Start Pickup'}
          </button>
        )}
        {req.status==='pickup_started' && (
          <button onClick={() => onAction(req.id,'driver_arrived')} disabled={loading===req.id}
            style={{flex:1,padding:'11px',borderRadius:12,border:'none',cursor:'pointer',background:'linear-gradient(135deg,#F59E0B,#FBBF24)',color:'#fff',fontWeight:800,fontSize:'0.88rem',fontFamily:'Inter,sans-serif',opacity:loading===req.id?0.7:1}}>
            {loading===req.id ? 'ðŸ“ Arrivingâ€¦' : 'ðŸ“ Arrived'}
          </button>
        )}
        {req.status==='driver_arrived' && (
          <button onClick={() => onAction(req.id,'ride_active')} disabled={loading===req.id}
            style={{flex:1,padding:'11px',borderRadius:12,border:'none',cursor:'pointer',background:'linear-gradient(135deg,#059669,#10B981)',color:'#fff',fontWeight:800,fontSize:'0.88rem',fontFamily:'Inter,sans-serif',opacity:loading===req.id?0.7:1}}>
            {loading===req.id ? 'ðŸš€ Startingâ€¦' : 'ðŸš€ Start Ride'}
          </button>
        )}
        {req.status==='ride_active' && (
          <button onClick={() => onAction(req.id,'completed')} disabled={loading===req.id}
            style={{flex:1,padding:'11px',borderRadius:12,border:'none',cursor:'pointer',background:'linear-gradient(135deg,#0B1D3A,#1E3A5F)',color:'#fff',fontWeight:800,fontSize:'0.88rem',fontFamily:'Inter,sans-serif',opacity:loading===req.id?0.7:1}}>
            {loading===req.id ? 'âœ… Completingâ€¦' : 'ðŸ Complete Ride'}
          </button>
        )}
        {req.status==='completed' && (
          <div style={{flex:1,padding:'10px',borderRadius:10,background:'#F0FDF4',textAlign:'center',fontSize:'0.82rem',fontWeight:700,color:'#059669'}}>
            âœ… Experience Complete
          </div>
        )}
        {req.status==='declined' && (
          <div style={{flex:1,padding:'10px',borderRadius:10,background:'#FEF2F2',textAlign:'center',fontSize:'0.82rem',fontWeight:700,color:'#DC2626'}}>
            âŒ Declined
          </div>
        )}
        {req.status==='canceled' && (
          <div style={{flex:1,padding:'10px',borderRadius:10,background:'#F3F4F6',textAlign:'center',fontSize:'0.82rem',fontWeight:700,color:'#6B7280'}}>
            âœ• Guest Canceled
          </div>
        )}
        <DriverChat
          requestId={req.id}
          guestName={req.guest_name}
          status={req.status}
          driverPin={driverPin}
        />
      </div>
    </div>
  );
}

export default function DriverDashboard() {
  const [pin, setPin]         = useState('');
  const [authed, setAuthed]   = useState(false);
  const [driverPin, setDriverPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]   = useState('active'); // 'requests' | 'active' | 'completed'
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [waiverModal, setWaiverModal] = useState(null);
  const [waiverLoading, setWaiverLoading] = useState(false);
  const [downloadingDriverWaiver, setDownloadingDriverWaiver] = useState(null);
  // Wave I: business SMS state ({ [reqId]: 'sending' | 'sent' | null })
  const [smsSending, setSmsSending] = useState({});
  // Wave I: business SMS error state ({ [reqId]: string | null })
  const [smsError, setSmsError]     = useState({});
  // sendingSms removed in Wave F â€” SMS is now a direct sms: href link
  // Wave E: On Duty / Off Duty
  const [onDuty, setOnDuty]         = useState(false);
  const [dutyLoading, setDutyLoading] = useState(false);
  const [dutyUpdated, setDutyUpdated] = useState(null);

  const load = useCallback(async (silent) => {
    if (!silent) setRefreshing(true);
    setLoadError('');

    try {
      const r = await fetch('/api/hopper/ops', {
        headers: { 'x-ops-password': getOpsPassword() }
      });

      const d = await r.json().catch(() => ({}));

      if (!r.ok) {
        throw new Error(d.error || `Request failed (${r.status})`);
      }

      setRequests(Array.isArray(d.requests) ? d.requests : []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('[driver dashboard] request load failed:', error);
      setLoadError('Connection failed');
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Auto-clear stale service workers â€” prevents CDN-cached chunk mismatches
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(r => r.unregister());
      }).catch(() => {});
    }
  }, []);
  useEffect(() => {
    const savedPin = sessionStorage.getItem('ctg_driver_pin');
    if (savedPin) {
      setDriverPin(savedPin);
      setAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    load(false);
    const t = setInterval(() => load(true), 30000);
    // Fetch current duty status on auth
    fetch('/api/hopper/duty-status')
      .then(r => r.json())
      .then(d => {
        setOnDuty(!!d.is_on_duty);
        if (d.updated_at) {
          setDutyUpdated(new Date(d.updated_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}));
        }
      })
      .catch(() => {});
    return () => clearInterval(t);
  }, [authed, load]);

  async function toggleDuty() {
    setDutyLoading(true);
    try {
      const res = await fetch('/api/hopper/duty-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-ops-password': getOpsPassword() },
        body: JSON.stringify({ is_on_duty: !onDuty, updated_by: 'driver' }),
      });
      const d = await res.json();
      if (d.ok) {
        setOnDuty(d.is_on_duty);
        setDutyUpdated(new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}));
      }
    } catch {}
    setDutyLoading(false);
  }

  async function doLogin(e) {
    e.preventDefault();
    setPinError('');

    try {
      const response = await fetch('/api/hopper/driver-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });

      if (!response.ok) {
        setPinError('Incorrect PIN â€” try again');
        setPin('');
        return;
      }

      setDriverPin(pin);
      setAuthed(true);
      sessionStorage.setItem('ctg_driver_pin', pin);
      sessionStorage.removeItem('ctg_driver_auth');
    } catch {
      setPinError('Unable to verify PIN');
    }
  }

  async function onAction(id, newStatus) {
    setLoading(id);
    try {
      await fetch('/api/hopper/ops', {
        method: 'PATCH',
        headers: { 'Content-Type':'application/json', 'x-ops-password': getOpsPassword() },
        body: JSON.stringify({ id, status: newStatus })
      });
      await load(true);
    } catch {}
    setLoading(null);
  }

  const viewWaivers = async (requestId) => {
    setWaiverLoading(true);
    setWaiverModal({ requestId, waivers: [] });
    try {
      const r = await fetch('/api/hopper/waiver/list/' + requestId, {
        headers: { 'x-driver-pin': driverPin }
      });
      const d = await r.json();
      setWaiverModal({ requestId, waivers: d.waivers || [] });
    } catch { setWaiverModal(m => ({ ...m, waivers: [] })); }
    setWaiverLoading(false);
  };

  // textGuest server-side SMS removed in Wave F â€” replaced with sms: href in RequestCard
  // Wave I: sendBusinessSms â€” sends via GHL from 833.813.8687
  async function sendBusinessSms(req) {
    setSmsSending(s => ({ ...s, [req.id]: 'sending' }));
    setSmsError(e => ({ ...e, [req.id]: null }));
    try {
      const requestLink = `https://hopper.citytourguide.app/request/${req.id}`;
      const message =
        `Hi, this is City Hopper (833-813-8687) with City Tour Guide. ` +
        `Here is your active Hopper request link: ${requestLink}\n\n` +
        `Reply to this number if you need help, have questions, or need to update pickup details.`;
      const resp = await fetch('/api/hopper/ops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-ops-password': getOpsPassword() },
        body: JSON.stringify({ action: 'sms', id: req.id, message, driverName: DRIVER_NAME }),
      });
      const data = await resp.json();
      if (resp.ok && data.ok) {
        setSmsSending(s => ({ ...s, [req.id]: 'sent' }));
        setTimeout(() => setSmsSending(s => ({ ...s, [req.id]: null })), 3000);
      } else {
        // Surface real error to driver
        setSmsError(e => ({ ...e, [req.id]: data.error || 'Business SMS failed. Use Personal SMS below.' }));
        setSmsSending(s => ({ ...s, [req.id]: null }));
      }
    } catch {
      setSmsError(e => ({ ...e, [req.id]: 'Connection error. Use Personal SMS below.' }));
      setSmsSending(s => ({ ...s, [req.id]: null }));
    }
  }

  const downloadDriverWaiver = async (waiverId) => {
    setDownloadingDriverWaiver(waiverId);
    try {
      const r = await fetch('/api/hopper/waiver/view/' + waiverId, {
        headers: { 'Accept': 'application/json', 'x-driver-pin': driverPin }
      });
      const waiver = await r.json();
      if (waiver.error) { alert('Could not load waiver: ' + waiver.error); return; }
      const { generateWaiverPDF } = await import('@/lib/generateWaiverPDF');
      await generateWaiverPDF(waiver);
    } catch {
      // Fallback: open HTML view in new tab
      alert('Could not download waiver. Please try again.');
    }
    setDownloadingDriverWaiver(null);
  };



  const TAB_REQUESTS  = ['pending_waivers','pending','waivers_complete'];
  const TAB_ACTIVE    = ['confirmed','pickup_started','driver_arrived','ride_active'];
  const TAB_COMPLETED = ['completed','declined','canceled'];
  const shown =
    filter==='requests'    ? requests.filter(r => TAB_REQUESTS.includes(r.status))
    : filter==='active'    ? requests.filter(r => TAB_ACTIVE.includes(r.status))
    : filter==='completed' ? requests.filter(r => TAB_COMPLETED.includes(r.status))
    : requests.filter(r => TAB_ACTIVE.includes(r.status));
  const pendingCount = requests.filter(r => r.status==='pending').length;

  // Waiver modal
  const WaiverModal = waiverModal && (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:1000,display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'20px',overflowY:'auto'}} onClick={() => setWaiverModal(null)}>
      <div style={{background:'#fff',borderRadius:20,width:'100%',maxWidth:480,padding:24,marginTop:20}} onClick={e => e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <h2 style={{margin:0,fontSize:'1.1rem',fontWeight:800,color:'#0B1D3A'}}>ðŸ“‹ Signed Waivers</h2>
          <button onClick={() => setWaiverModal(null)} style={{background:'none',border:'none',fontSize:'1.4rem',cursor:'pointer',color:'#9CA3AF'}}>âœ•</button>
        </div>
        {waiverLoading && <p style={{textAlign:'center',color:'#9CA3AF'}}>Loading...</p>}
        {!waiverLoading && waiverModal.waivers.length === 0 && (
          <p style={{textAlign:'center',color:'#9CA3AF',padding:'20px 0'}}>No waivers found for this experience.</p>
        )}
        {!waiverLoading && waiverModal.waivers.map((w, i) => (
          <div key={w.id} style={{border:'1.5px solid '+(w.signed_at?'#10B981':'#F59E0B'),borderRadius:14,padding:14,marginBottom:12}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
              <div>
                <div style={{fontWeight:800,fontSize:'0.92rem',color:'#0B1D3A'}}>{w.guest_name || 'Guest ' + w.guest_index}</div>
                {w.guest_phone && <div style={{fontSize:'0.75rem',color:'#6B7280'}}>{w.guest_phone}</div>}
              </div>
              <div style={{textAlign:'right'}}>
                {w.signed_at ? (
                  <div style={{background:'#D1FAE5',color:'#065F46',fontWeight:700,fontSize:'0.72rem',padding:'3px 10px',borderRadius:20}}>
                    âœ… Signed {new Date(w.signed_at).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}
                  </div>
                ) : (
                  <div style={{background:'#FEF3C7',color:'#92400E',fontWeight:700,fontSize:'0.72rem',padding:'3px 10px',borderRadius:20}}>â³ Pending</div>
                )}
              </div>
            </div>
            {w.signed_at && (
              <>
                {Array.isArray(w.minors) && w.minors.length > 0 && (
                  <div style={{fontSize:'0.72rem',color:'#059669',fontWeight:600,marginBottom:6}}>
                    Adult waiver + {w.minors.length} child{w.minors.length!==1?'ren':''}
                  </div>
                )}
                <button
                  onClick={() => downloadDriverWaiver(w.id)}
                  disabled={downloadingDriverWaiver === w.id}
                  style={{display:'block',width:'100%',marginTop:4,padding:'8px 12px',borderRadius:10,background:'#EFF6FF',
                    color:'#1D4ED8',fontSize:'0.75rem',fontWeight:700,textAlign:'center',
                    border:'1px solid #BFDBFE',fontFamily:'Inter,sans-serif',cursor:'pointer',
                    opacity:downloadingDriverWaiver===w.id?0.7:1}}>
                  {downloadingDriverWaiver === w.id ? 'â³ Preparing PDFâ€¦' : 'ðŸ“„ Download Signed Waiver'}
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  if (!authed) return (
    <div style={{minHeight:'100vh',background:'#0B1D3A',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Inter,sans-serif',padding:20}}>
      <div style={{background:'#fff',borderRadius:20,padding:'32px 28px',width:'100%',maxWidth:360,boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
        <div style={{textAlign:'center',marginBottom:24}}>
          <CTGLogo/>
          <div style={{fontWeight:900,fontSize:'1.1rem',color:'#0B1D3A',marginTop:16}}>Driver Dashboard</div>
          <div style={{fontSize:'0.78rem',color:'#6B7280',marginTop:4}}>City Hopper Â· Tampa</div>
        </div>
        <form onSubmit={doLogin} style={{display:'flex',flexDirection:'column',gap:12}}>
          <input type="password" value={pin} onChange={e=>{setPin(e.target.value);setPinError('');}}
            placeholder="Enter driver PIN"
            style={{padding:'13px 14px',borderRadius:12,border:'1.5px solid '+(pinError?'#EF4444':'#E5E7EB'),fontSize:'1rem',fontFamily:'Inter,sans-serif',textAlign:'center',letterSpacing:'0.2em',color:'#0B1D3A'}}
            autoFocus />
          {pinError && <div style={{fontSize:'0.78rem',color:'#EF4444',textAlign:'center'}}>{pinError}</div>}
          <button type="submit"
            style={{padding:'13px',borderRadius:12,border:'none',cursor:'pointer',background:'linear-gradient(135deg,#0057E7,#0095FF)',color:'#fff',fontWeight:800,fontSize:'0.95rem',fontFamily:'Inter,sans-serif'}}>
            Log In
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
    <div style={{minHeight:'100vh',background:'#F9FAFB',fontFamily:'Inter,sans-serif'}}>
      <div style={{position:'sticky',top:0,zIndex:100,background:'#0B1D3A',padding:'10px 16px',display:'flex',alignItems:'center',gap:12,minHeight:54}}>
        <CTGLogo/>
        <div style={{flex:1}}>
          <div style={{color:'#fff',fontWeight:800,fontSize:'0.88rem',lineHeight:1}}>Driver Dashboard</div>
          <div style={{color:'rgba(255,255,255,0.45)',fontSize:'0.62rem'}}>
            {loadError ? 'Connection failed' : lastUpdated ? 'Updated '+lastUpdated.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : 'Connecting...'}
          </div>
        </div>
        {pendingCount > 0 && (
          <div style={{background:'#EF4444',color:'#fff',borderRadius:'50%',width:24,height:24,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'0.78rem',flexShrink:0}}>
            {pendingCount}
          </div>
        )}
        <button onClick={() => load(false)} disabled={refreshing}
          style={{background:'rgba(255,255,255,0.1)',border:'none',color:'#fff',borderRadius:8,padding:'6px 10px',cursor:'pointer',fontSize:'0.75rem',fontFamily:'Inter,sans-serif'}}>
          {refreshing ? '...' : 'â†»'}
        </button>
      </div>

      
{/* â”€â”€ Driver Info Card â”€â”€ */}
<div style={{background:'#fff',borderBottom:'1px solid #E5E7EB',padding:'12px 16px',display:'flex',alignItems:'center',gap:12}}>
  <img
    src="/driver-profile.png"
    alt={DRIVER_NAME}
    width={50}
    height={50}
    style={{borderRadius:'50%',border:'2px solid #4ADE80',objectFit:'cover',flexShrink:0}}
    onError={e=>{e.currentTarget.style.display='none';}}
  />
  <div style={{flex:1,minWidth:0}}>
    <div style={{fontWeight:800,fontSize:'0.95rem',color:'#111827',lineHeight:1.2}}>{DRIVER_NAME}</div>
    <div style={{fontSize:'0.72rem',color:'#6B7280',marginTop:2,lineHeight:1.3}}>Ford Transit Connect 6pp Â· Navy Blue Passenger Van</div>
  </div>
  <div style={{background:'#0B1D3A',color:'#00FF88',border:'1.5px solid #00FF88',borderRadius:8,fontWeight:900,fontSize:'0.72rem',fontFamily:'monospace',padding:'4px 10px',flexShrink:0,letterSpacing:'0.08em'}}>
    {DRIVER_PLATE}
  </div>
</div>

{/* â”€â”€ On Duty / Off Duty toggle banner â”€â”€ */}
      <div style={{background: onDuty ? '#D1FAE5' : '#FEF3C7',
        borderBottom: '1px solid ' + (onDuty ? '#10B981' : '#F59E0B'),
        padding: '10px 16px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 12}}>
        <div>
          <div style={{fontWeight:800, fontSize:'0.88rem',
            color: onDuty ? '#065F46' : '#92400E', display:'flex', alignItems:'center'}}>
            <span style={{display:'inline-block',width:10,height:10,borderRadius:'50%',
              background:onDuty?'#22c55e':'#ef4444',marginRight:6,flexShrink:0}}/>
            {onDuty ? 'Driver is On Duty' : 'Driver is Off Duty'}
          </div>
          {dutyUpdated && (
            <div style={{fontSize:'0.65rem', color:'#9CA3AF', marginTop:2}}>
              Since {dutyUpdated}
            </div>
          )}
        </div>
        <button onClick={toggleDuty} disabled={dutyLoading}
          style={{padding:'9px 18px', borderRadius:10, border:'none',
            cursor: dutyLoading ? 'default' : 'pointer',
            background: onDuty ? '#EF4444' : '#059669',
            color:'#fff', fontWeight:800, fontSize:'0.82rem',
            fontFamily:'Inter,sans-serif', flexShrink:0,
            opacity: dutyLoading ? 0.7 : 1}}>
          {dutyLoading ? 'â€¦' : onDuty ? 'Go Off Duty' : 'Go On Duty'}
        </button>
      </div>

      {/* â”€â”€ Sticky tab bar â€” stays below header while cards scroll â”€â”€ */}
      <div style={{position:'sticky',top:54,zIndex:99,background:'#F9FAFB',padding:'10px 16px 6px',borderBottom:'1px solid #E5E7EB'}}>
        <div style={{display:'flex',background:'#E5E7EB',borderRadius:12,padding:3,maxWidth:560,margin:'0 auto'}}>
          {[['requests','Requests'],['active','Active'],['completed','Done']].map(([v,l]) => (
            <button key={v} onClick={() => setFilter(v)}
              style={{flex:1,padding:'9px',borderRadius:9,border:'none',cursor:'pointer',fontWeight:700,fontSize:'0.82rem',fontFamily:'Inter,sans-serif',
                background:filter===v?'#fff':'transparent',color:filter===v?'#0B1D3A':'#6B7280',
                boxShadow:filter===v?'0 1px 4px rgba(0,0,0,0.1)':'none',transition:'all 0.15s'}}>
              {l}{v==='requests'&&pendingCount>0?` (${pendingCount})`:''}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:'16px',maxWidth:560,margin:'0 auto'}}>

        {shown.length === 0 && (
          <div style={{textAlign:'center',padding:'48px 20px',color:'#9CA3AF'}}>
            <div style={{fontSize:'2.5rem',marginBottom:12}}>ðŸ›º</div>
            <div style={{fontWeight:600,fontSize:'0.9rem'}}>
              {filter==='requests'?'No pending requests':filter==='active'?'No active experiences right now':filter==='completed'?'No completed experiences in the last 30 days':'No experiences'}
            </div>
            <div style={{fontSize:'0.78rem',marginTop:4}}>Pull down to refresh</div>
          </div>
        )}

        {shown.map(req => (
          <RequestCard key={req.id} req={req} onAction={onAction} loading={loading}
            viewWaivers={viewWaivers} smsSending={smsSending} smsError={smsError} sendBusinessSms={sendBusinessSms} />
        ))}

        <div style={{textAlign:'center',marginTop:20}}>
          <button onClick={() => { sessionStorage.removeItem('ctg_driver_auth'); sessionStorage.removeItem('ctg_driver_pin'); setDriverPin(''); setAuthed(false); }}
            style={{background:'none',border:'none',color:'#9CA3AF',fontSize:'0.75rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
            Sign out
          </button>
          <div style={{textAlign:'center',marginTop:12,fontSize:'0.62rem',color:'#9CA3AF',lineHeight:1.6,maxWidth:320,margin:'12px auto 0'}}>City Tour Guide connects guests with featured local destinations, attractions, dining, entertainment, and curated city experiences.</div>
        </div>
      </div>
    </div>
    {WaiverModal}

    </>

  );
}



