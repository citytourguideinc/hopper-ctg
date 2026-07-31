'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const NEIGHBORHOODS = [
  'Harbour Island',
  'Downtown Tampa',
  'Channelside',
  'Water Street',
  'Ybor City',
  'Hyde Park',
  'Bayshore Beautiful',
  'SoHo',
  'Davis Islands',
  'Tampa Heights',
];

const VENUES = {
  'Harbour Island': ['The Pointe', 'The Roundabout'],
  'Downtown Tampa': ['Tampa Theatre','Tampa Convention Center','Curtis Hixon Waterfront Park','Cotanchobee Fort Brooke Park','Straz Center','Snow Park','Benchmark International Arena','Dick Greco Plaza Transit Center'],
  'Channelside': ['Sparkman Wharf','Florida Aquarium','Port of Tampa Parking Garage'],
  'Water Street': ['Publix - Water Street','Tampa Bay History Center'],
  'Ybor City': ['Ybor City Archway - 7th Ave','Centro Ybor','Gas Worx'],
  'Hyde Park': ['Hyde Park Village'],
  'Bayshore Beautiful': ['Gasparilla Pirate Ship Dock'],
  'SoHo': ['Howard & Azeele - Publix',"Bern's Park"],
  'Davis Islands': ['Davis Islands Village','Tampa General Hospital'],
  'Tampa Heights': ['Armature Works','Water Works Park','Julian B. Lane Riverfront Park'],
};

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

function DrumPicker({ value, onChange }) {
  return (
    <div style={{background:'#fff',border:'1.5px solid #E5E7EB',borderRadius:16,padding:'20px 24px',textAlign:'center'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:16,marginBottom:12}}>
        <button type="button" onClick={() => onChange(Math.max(1,value-1))}
          style={{width:44,height:44,borderRadius:'50%',border:'1.5px solid #E5E7EB',background:'#fff',fontSize:'1.3rem',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#374151',fontFamily:'Inter,sans-serif'}}>&#8722;</button>
        <div style={{fontWeight:900,fontSize:'2.4rem',color:'#0044CC',minWidth:80,textAlign:'center',fontFamily:'Inter,sans-serif'}}>${value}</div>
        <button type="button" onClick={() => onChange(Math.min(200,value+1))}
          style={{width:44,height:44,borderRadius:'50%',border:'1.5px solid #E5E7EB',background:'#fff',fontSize:'1.3rem',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#374151',fontFamily:'Inter,sans-serif'}}>+</button>
      </div>
      <input type="range" min="1" max="200" value={value} onChange={e => onChange(parseInt(e.target.value))} style={{width:'100%',accentColor:'#0044CC'}} />
      <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.7rem',color:'#9CA3AF',marginTop:4}}><span>$1</span><span>$200</span></div>
    </div>
  );
}

function HoodPicker({ selected, onSelect, landmark, onLandmark, label, color }) {
  return (
    <div>
      <div style={{fontWeight:800,fontSize:'0.8rem',color,letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:10}}>{label}</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
        {NEIGHBORHOODS.map(n => (
          <button type="button" key={n} onClick={() => { onSelect(n); onLandmark(''); }}
            style={{padding:'10px 8px',borderRadius:12,border:'1.5px solid',cursor:'pointer',fontWeight:600,fontSize:'0.78rem',fontFamily:'Inter,sans-serif',transition:'all 0.15s',
              borderColor:selected===n?color:'#E5E7EB',background:selected===n?color:'#fff',color:selected===n?'#fff':'#374151'}}>
            {n}
          </button>
        ))}
      </div>
      {selected && (VENUES[selected]||[]).length > 0 && (
        <div>
          <select value={landmark} onChange={e => onLandmark(e.target.value)}
            style={{width:'100%',padding:'12px 14px',borderRadius:12,border:'1.5px solid '+(landmark?'#16A34A':'#F59E0B'),fontSize:'0.9rem',color:landmark?'#111827':'#6B7280',background:'#fff',fontFamily:'Inter,sans-serif'}}>
            <option value="" disabled>Select a landmark *</option>
            {(VENUES[selected]||[]).map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          {!landmark && <div style={{fontSize:'0.72rem',color:'#F59E0B',marginTop:4,fontWeight:600}}>&#9888; Select a landmark to continue</div>}
        </div>
      )}
      {selected && (VENUES[selected]||[]).length === 0 && (
        <div style={{fontSize:'0.72rem',color:'#EF4444',marginTop:4,fontWeight:600}}>No landmarks for this area — choose a nearby neighborhood</div>
      )}
    </div>
  );
}

function RequestFormInner() {
  const params = useSearchParams();
  const router = useRouter();

  const [step, setStep]       = useState(params.get('type')==='scheduled' ? 1 : 2);
  const [subStep, setSubStep] = useState(1);
  const [hasSavedInfo, setHasSavedInfo] = useState(false);

  const [type, setType]           = useState(params.get('type')==='scheduled'?'scheduled':'ondemand');
  const [scheduledAt, setScheduledAt] = useState('');

  const [fromHood, setFromHood]         = useState('');
  const [fromLandmark, setFromLandmark] = useState('');
  const [toHood, setToHood]             = useState('');
  const [toLandmark, setToLandmark]     = useState('');

  const [name, setName]     = useState('');
  const [phone, setPhone]   = useState('');
  const [adults,   setAdults]   = useState(1);
  const [children, setChildren] = useState(0);
  const guests = adults + children;
  const [price, setPrice]   = useState(6);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [dutyStatus, setDutyStatus] = useState(null);

  useEffect(() => {
    fetch('/api/hopper/duty-status', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        setDutyStatus(d);
        if (!d.is_on_duty && params.get('type') !== 'scheduled') {
          setType('scheduled');
          setStep(1);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('ctg_hopper_info') || '{}');
      const n = s.name   || localStorage.getItem('ctg_hop_name')  || '';
      const p = s.phone  || localStorage.getItem('ctg_hop_phone') || '';
      const g = s.guests ? Number(s.guests) : (Number(localStorage.getItem('ctg_hop_guests')) || 1);
      if (n) setName(n);
      if (p) setPhone(p);
      if (g > 1) setAdults(g);
      if (n || p) setHasSavedInfo(true);
    } catch {}
  }, []);

  useEffect(() => {
    try { if (name||phone) localStorage.setItem('ctg_hopper_info', JSON.stringify({name,phone,guests,adults,children})); } catch {}
  }, [name, phone, adults, children]);

  useEffect(() => { setPrice(guests * 6); }, [guests]);

  const pickupOk  = !!(fromHood && fromLandmark);
  const dropoffOk = !!(toHood && toLandmark);

  const canNext = [
    type==='ondemand' || (type==='scheduled' && scheduledAt),
    subStep===1 ? pickupOk : dropoffOk,
    !!(name && phone),
    true,
  ][step-1] ?? true;

  function goNext() {
    if (step===2 && subStep===1) { setSubStep(2); return; }
    if (step===2 && subStep===2) { setSubStep(1); setStep(3); return; }
    setStep(s => Math.min(5, s+1));
  }
  function goBack() {
    if (step===2 && subStep===2) { setSubStep(1); return; }
    if (step===2 && subStep===1) { setStep(1); return; }
    setStep(s => Math.max(1, s-1));
  }

  function clearSavedInfo() {
    setName(''); setPhone(''); setAdults(1); setChildren(0); setHasSavedInfo(false);
    try {
      localStorage.removeItem('ctg_hopper_info');
      localStorage.removeItem('ctg_hop_name');
      localStorage.removeItem('ctg_hop_phone');
      localStorage.removeItem('ctg_hop_guests');
    } catch {}
  }

  async function submit() {
    if (!name||!phone) { setError('Please enter your name and phone number'); return; }
    if (type === 'ondemand') {
      try {
        const dr = await fetch('/api/hopper/duty-status', { cache: 'no-store' });
        const dd = await dr.json();
        if (!dd.is_on_duty) {
          setError('cityFUNHOP is not live right now. Please switch to Schedule in Advance.');
          setDutyStatus(dd);
          setType('scheduled');
          setStep(1);
          return;
        }
      } catch {}
    }
    setSubmitting(true); setError('');
    const pickupLocation  = [fromHood, fromLandmark].filter(Boolean).join(' - ');
    const dropoffLocation = [toHood, toLandmark].filter(Boolean).join(' - ');
    try {
      const r = await fetch('/api/hopper/request', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ type, scheduledAt, neighborhood: fromHood, venue: fromLandmark,
          dropoffNeighborhood: toHood, dropoffLandmark: toLandmark,
          name, phone, adults, children, guests,
          pickupNotes: pickupLocation, dropoffNotes: dropoffLocation, price })
      });
      const d = await r.json();
      if (d.id && d.waiver_skipped) {
        window.location.href = '/request/'+d.id;
      } else if (d.id && d.waivers && d.waivers.length > 0) {
        const waiverBase = window.location.hostname.includes('staging---hopper-ctg')
          ? 'https://staging---ctg-waiver-q2rksbyinq-ue.a.run.app'
          : 'https://waiver.citytourguide.app';
        const url = waiverBase+'/sign/'+d.waivers[0].token
          +'?return_url='+encodeURIComponent(window.location.origin+'/request/'+d.id)
          +'&name='+encodeURIComponent(name||'')
          +'&phone='+encodeURIComponent(phone||'');
        window.location.assign(url);
      } else if (d.id) {
        window.location.href = '/request/'+d.id;
      } else {
        if (d.error && d.error.includes('not live')) {
          setError(d.error);
          setType('scheduled');
          setStep(1);
        } else {
          setError(d.error||'Something went wrong. Please try again.');
        }
        setSubmitting(false);
      }
    } catch { setError('Connection error. Please try again.'); setSubmitting(false); }
  }

  const LABELS = ['Timing','Route','Your Info','Offer','Confirm'];
  const activeLabel = step===2 ? (subStep===1?'Hop On':'Hop Off') : LABELS[step-1];
  const card = {background:'#fff',border:'1.5px solid #E5E7EB',borderRadius:14,padding:'16px'};

  return (
    <div style={{minHeight:'100vh',background:'#F9FAFB',fontFamily:'Inter,sans-serif'}}>

      <div style={{position:'sticky',top:0,zIndex:100,background:'#000',borderBottom:'1px solid #1a1a1a',display:'flex',alignItems:'center',padding:'8px 16px',gap:12,minHeight:54}}>
        <a href="https://citytourguide.app" style={{textDecoration:'none',flexShrink:0}}><CTGLogo/></a>
        <div style={{flex:1}}>
          <div style={{color:'#fff',fontWeight:800,fontSize:'0.88rem',lineHeight:1}}>cityFUNHOP</div>
          <div style={{color:'rgba(255,255,255,0.4)',fontSize:'0.62rem',letterSpacing:'0.05em'}}>Golf Cart Rides · Tampa</div>
        </div>
        <a href="/" style={{color:'rgba(255,255,255,0.55)',fontSize:'0.75rem',textDecoration:'none',border:'1px solid rgba(255,255,255,0.18)',borderRadius:8,padding:'5px 10px',flexShrink:0}}>&#8592; Back</a>
      </div>

      <div style={{background:'#fff',borderBottom:'1px solid #F3F4F6',padding:'10px 16px'}}>
        <div style={{display:'flex',alignItems:'center',maxWidth:500,margin:'0 auto'}}>
          {LABELS.map((l,i) => {
            const s=i+1, active=s===step, done=s<step;
            return (
              <div key={l} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                <div style={{width:26,height:26,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'0.75rem',fontFamily:'Inter,sans-serif',
                  background:done?'#16A34A':active?'#0066FF':'#F3F4F6',color:done||active?'#fff':'#9CA3AF'}}>
                  {done?'✓':s}
                </div>
                <div style={{fontSize:'0.58rem',fontWeight:active?700:400,color:active?'#0066FF':'#9CA3AF',letterSpacing:'0.04em'}}>
                  {active&&step===2?activeLabel:l}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{padding:'20px 16px',maxWidth:500,margin:'0 auto'}}>

        {dutyStatus !== null && !dutyStatus.is_on_duty && type === 'ondemand' && (
          <div style={{background:'#FEF3C7',border:'1.5px solid #F59E0B',borderRadius:12,padding:'14px 16px',marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:'0.88rem',color:'#92400E',marginBottom:6}}>
              ⚠️ cityFUNHOP is not live right now.
            </div>
            <div style={{fontSize:'0.8rem',color:'#92400E',lineHeight:1.5,marginBottom:10}}>
              Please schedule a future hop instead.
            </div>
            <button type="button" onClick={() => { setType('scheduled'); setStep(1); }}
              style={{padding:'9px 18px',borderRadius:10,border:'none',background:'#F59E0B',
                color:'#fff',fontWeight:700,fontSize:'0.82rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
              📅 Switch to Schedule in Advance
            </button>
          </div>
        )}

        {step===1 && (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={{fontWeight:800,fontSize:'1rem',color:'#0B1D3A',marginBottom:4}}>When do you need a hop?</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {[['ondemand','⚡','Right Now','Immediate pickup'],['scheduled','📅','Schedule','Pick a date & time']].map(([v,ic,title,sub]) => (
                <button type="button" key={v} onClick={() => setType(v)}
                  style={{padding:'18px 12px',borderRadius:16,border:'2px solid',cursor:'pointer',textAlign:'center',fontFamily:'Inter,sans-serif',transition:'all 0.15s',
                    borderColor:type===v?'#0066FF':'#E5E7EB',background:type===v?'#EFF6FF':'#fff'}}>
                  <div style={{fontSize:'1.4rem',marginBottom:6}}>{ic}</div>
                  <div style={{fontWeight:700,fontSize:'0.85rem',color:type===v?'#0044CC':'#374151'}}>{title}</div>
                  <div style={{fontSize:'0.72rem',color:'#6B7280',marginTop:3}}>{sub}</div>
                </button>
              ))}
            </div>
            {type==='scheduled' && (
              <div style={card}>
                <label style={{display:'block',fontWeight:600,fontSize:'0.78rem',color:'#6B7280',marginBottom:6,letterSpacing:'0.06em'}}>DATE &amp; TIME</label>
                <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
                  min={new Date().toISOString().slice(0,16)}
                  style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid #E5E7EB',fontSize:'0.95rem',fontFamily:'Inter,sans-serif',color:'#111827'}} />
              </div>
            )}
          </div>
        )}

        {step===2 && subStep===1 && (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={{fontWeight:800,fontSize:'1rem',color:'#16A34A'}}>📍 Where are you Hopping On?</div>
            <div style={{fontSize:'0.82rem',color:'#6B7280'}}>Select your pickup neighborhood and landmark. Both are required.</div>
            <HoodPicker selected={fromHood} onSelect={n=>{setFromHood(n);setFromLandmark('');}} landmark={fromLandmark} onLandmark={setFromLandmark} label="Pickup Neighborhood" color="#16A34A" />
          </div>
        )}

        {step===2 && subStep===2 && (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={{fontWeight:800,fontSize:'1rem',color:'#EF4444'}}>🏁 Where are you Hopping Off?</div>
            <div style={{fontSize:'0.82rem',color:'#6B7280'}}>Select your destination neighborhood and landmark. Both are required.</div>
            <HoodPicker selected={toHood} onSelect={n=>{setToHood(n);setToLandmark('');}} landmark={toLandmark} onLandmark={setToLandmark} label="Destination Neighborhood" color="#EF4444" />
            <div style={{display:'flex',alignItems:'center',gap:8,background:'#F0FDF4',borderRadius:10,padding:'8px 12px',fontSize:'0.78rem',color:'#16A34A'}}>
              <span>&#10003;</span> Hop On: <strong>{fromHood} at {fromLandmark}</strong>
            </div>
            <button type="button" onClick={() => setSubStep(1)} style={{background:'none',border:'none',color:'#6B7280',fontSize:'0.8rem',cursor:'pointer',textDecoration:'underline',padding:0,textAlign:'left'}}>← Change Hop On</button>
          </div>
        )}

        {step===3 && (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={{fontWeight:800,fontSize:'1rem',color:'#0B1D3A'}}>Who is joining your experience?</div>
            {hasSavedInfo
              ? <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:'#F0FDF4',border:'1px solid #BBF7D0',borderRadius:10,padding:'10px 14px'}}>
                  <span style={{fontSize:'0.78rem',color:'#166534',fontWeight:600}}>✓ Your info is pre-filled from your last request.</span>
                  <button type="button" onClick={clearSavedInfo}
                    style={{background:'none',border:'none',color:'#DC2626',fontSize:'0.72rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',padding:0,whiteSpace:'nowrap',marginLeft:12}}>
                    🗑 Clear
                  </button>
                </div>
              : <div style={{fontSize:'0.82rem',color:'#6B7280'}}>Your info is saved for next time.</div>
            }
            <div style={card}>
              <label style={{display:'block',fontWeight:600,fontSize:'0.78rem',color:'#6B7280',marginBottom:6,letterSpacing:'0.06em'}}>YOUR NAME *</label>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="First and last name"
                style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid #E5E7EB',fontSize:'0.95rem',fontFamily:'Inter,sans-serif',color:'#111827'}} />
            </div>
            <div style={card}>
              <label style={{display:'block',fontWeight:600,fontSize:'0.78rem',color:'#6B7280',marginBottom:6,letterSpacing:'0.06em'}}>PHONE NUMBER *</label>
              <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="(813) 555-0000"
                style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid #E5E7EB',fontSize:'0.95rem',fontFamily:'Inter,sans-serif',color:'#111827'}} />
              <div style={{fontSize:'0.72rem',color:'#9CA3AF',marginTop:6}}>Confirmation and experience updates sent here</div>
            </div>
            <div style={card}>
              <label style={{display:'block',fontWeight:600,fontSize:'0.78rem',color:'#6B7280',marginBottom:10,letterSpacing:'0.06em'}}>ADULTS</label>
              <div style={{display:'flex',alignItems:'center',gap:16,justifyContent:'center',marginBottom:16}}>
                <button type="button" onClick={()=>setAdults(a=>Math.max(1,a-1))} style={{width:40,height:40,borderRadius:'50%',border:'1.5px solid #E5E7EB',background:'#fff',fontSize:'1.2rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>&#8722;</button>
                <span style={{fontWeight:900,fontSize:'1.8rem',color:'#0044CC',minWidth:40,textAlign:'center',fontFamily:'Inter,sans-serif'}}>{adults}</span>
                <button type="button" onClick={()=>setAdults(a=>Math.min(5-children,a+1))} style={{width:40,height:40,borderRadius:'50%',border:'1.5px solid #E5E7EB',background:'#fff',fontSize:'1.2rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>+</button>
              </div>
              <label style={{display:'block',fontWeight:600,fontSize:'0.78rem',color:'#6B7280',marginBottom:10,letterSpacing:'0.06em'}}>CHILDREN UNDER 18</label>
              <div style={{display:'flex',alignItems:'center',gap:16,justifyContent:'center'}}>
                <button type="button" onClick={()=>setChildren(c=>Math.max(0,c-1))} style={{width:40,height:40,borderRadius:'50%',border:'1.5px solid #E5E7EB',background:'#fff',fontSize:'1.2rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>&#8722;</button>
                <span style={{fontWeight:900,fontSize:'1.8rem',color:'#0044CC',minWidth:40,textAlign:'center',fontFamily:'Inter,sans-serif'}}>{children}</span>
                <button type="button" onClick={()=>setChildren(c=>Math.min(5-adults,c+1))} style={{width:40,height:40,borderRadius:'50%',border:'1.5px solid #E5E7EB',background:'#fff',fontSize:'1.2rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>+</button>
              </div>
              {guests > 1 && <div style={{textAlign:'center',marginTop:10,fontSize:'0.8rem',color:'#6B7280'}}>{adults} adult{adults!==1?'s':''} + {children} child{children!==1?'ren':''} = <strong style={{color:'#0044CC'}}>{guests} total</strong></div>}
              {guests === 5 && <div style={{textAlign:'center',marginTop:6,fontSize:'0.75rem',fontWeight:700,color:'#92400E',background:'#FEF3C7',border:'1px solid #F59E0B',borderRadius:8,padding:'4px 10px'}}>🛺 Maximum 5 guests per experience</div>}
            </div>
          </div>
        )}

        {step===4 && (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={{fontWeight:800,fontSize:'1rem',color:'#0B1D3A'}}>Set your offer</div>
            <div style={{fontSize:'0.82rem',color:'#6B7280'}}>You name the offer. Your City Host reviews and confirms before you are charged.</div>
            <DrumPicker value={price} onChange={setPrice} />
            <div style={{background:'#EFF6FF',borderRadius:12,padding:'12px 14px',fontSize:'0.78rem',color:'#1D4ED8',lineHeight:1.6}}>
              💡 Higher offers may receive higher priority in the driver queue, especially during busy times. Pickup is not guaranteed until a driver accepts.
            </div>
          </div>
        )}

        {step===5 && (
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            <div style={{fontWeight:800,fontSize:'1rem',color:'#0B1D3A',marginBottom:4}}>Confirm your experience</div>
            {[['When', type==='ondemand'?'⚡ Right Now':'📅 '+scheduledAt],
              ['Hop On', fromHood+' at '+fromLandmark],
              ['Hop Off', toHood+' at '+toLandmark],
              ['Name', name],['Phone', phone],
              ['Guests', adults+' adult'+(adults!==1?'s':'')+(children>0?' + '+children+' child'+(children!==1?'ren':''):'')+' ('+guests+' total)'],
              ['Offer', '$'+price]
            ].map(([k,v]) => v && (
              <div key={k} style={{...card,display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px'}}>
                <span style={{fontWeight:600,fontSize:'0.8rem',color:'#6B7280'}}>{k}</span>
                <span style={{fontWeight:700,fontSize:'0.88rem',color:'#0B1D3A',textAlign:'right',maxWidth:'62%'}}>{v}</span>
              </div>
            ))}
            {error && <div style={{background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:12,padding:'12px 14px',fontSize:'0.82rem',color:'#991B1B'}}>{error}</div>}
            {type === 'ondemand' && dutyStatus !== null && !dutyStatus.is_on_duty ? (
              <div style={{background:'#FEF3C7',border:'1.5px solid #F59E0B',borderRadius:14,padding:'16px',textAlign:'center',display:'flex',flexDirection:'column',gap:10}}>
                <div style={{fontWeight:800,fontSize:'0.9rem',color:'#92400E'}}>No Drivers on Duty at This Time</div>
                <div style={{fontSize:'0.8rem',color:'#92400E',lineHeight:1.5}}>Schedule a Future Hop instead. Pick a date and time that works for you.</div>
                <button type="button" onClick={() => { setType('scheduled'); setStep(1); }}
                  style={{padding:'13px',borderRadius:12,border:'none',background:'#F59E0B',color:'#fff',fontWeight:800,fontSize:'0.9rem',cursor:'pointer',fontFamily:'Inter,sans-serif',boxShadow:'0 4px 12px rgba(245,158,11,0.35)'}}>
                  📅 Schedule in Advance
                </button>
              </div>
            ) : (
              <button type="button" onClick={submit} disabled={submitting || guests > 5}
                style={{padding:'15px',borderRadius:14,border:'none',cursor:(submitting||guests>5)?'not-allowed':'pointer',background:'linear-gradient(135deg,#0057E7,#0095FF)',color:'#fff',fontWeight:900,fontSize:'1rem',fontFamily:'Inter,sans-serif',boxShadow:'0 6px 24px rgba(0,87,231,0.35)',marginTop:4,opacity:(submitting||guests>5)?0.7:1}}>
                {submitting?'Confirming your experience...':'🛺 Reserve My Hop'}
              </button>
            )}
          </div>
        )}

        {step<5 && (
          <div style={{display:'flex',gap:10,marginTop:20}}>
            {step>1 && (
              <button type="button" onClick={goBack}
                style={{flex:1,padding:'13px',borderRadius:14,border:'1.5px solid #E5E7EB',background:'#fff',color:'#374151',fontWeight:700,fontSize:'0.9rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                &#8592; Back
              </button>
            )}
            <button type="button" onClick={goNext} disabled={!canNext}
              style={{flex:2,padding:'13px',borderRadius:14,border:'none',fontWeight:800,fontSize:'0.95rem',cursor:canNext?'pointer':'not-allowed',fontFamily:'Inter,sans-serif',transition:'all 0.2s',
                background:canNext?'linear-gradient(135deg,#0057E7,#0095FF)':'#E5E7EB',color:canNext?'#fff':'#9CA3AF'}}>
              {step===2&&subStep===1?'Continue → Destination':step===4?'Confirm →':'Next →'}
            </button>
          </div>
        )}
      </div>

      <div style={{textAlign:'center',marginTop:16,fontSize:'0.65rem',color:'#9CA3AF',lineHeight:1.6,maxWidth:320,margin:'16px auto 0',paddingBottom:8}}>City Tour Guide, Inc. connects guests with featured local destinations, attractions, dining, entertainment, and curated city experiences.</div>

      <style>{`*{box-sizing:border-box}body{margin:0}input:focus,select:focus{outline:2px solid #0066FF;outline-offset:0;border-color:#0066FF!important}`}</style>
    </div>
  );
}

export default function RequestForm() {
  return (
    <Suspense fallback={null}>
      <RequestFormInner />
    </Suspense>
  );
}
