'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

const ACTIVE_STATUSES = new Set(['confirmed','pickup_started','driver_arrived','ride_active']);

// Driver-side session chat panel. Supabase-backed, no GHL on this path.
// Used by /driver dashboard per active request card.
export default function DriverChat({ requestId, guestName, status, driverPin }) {
  const [messages, setMessages]  = useState([]);
  const [text, setText]          = useState('');
  const [sending, setSending]    = useState(false);
  const [open, setOpen]          = useState(false);
  const [unread, setUnread]      = useState(0);
  const bottomRef                = useRef(null);
  const prevCount                = useRef(0);
  const guestFirst               = (guestName || 'Guest').split(' ')[0];

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/sms/thread/' + requestId);
      if (!r.ok) return;
      const d = await r.json();
      const msgs = d.messages || [];
      const newCount = msgs.length;
      if (!open && newCount > prevCount.current) setUnread(u => u + (newCount - prevCount.current));
      prevCount.current = newCount;
      setMessages(msgs);
    } catch {}
  }, [requestId, open]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);
  useEffect(() => {
    if (open) {
      setUnread(0);
      if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [open, messages]);

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await fetch('/api/hopper/driver-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-driver-pin': driverPin },
        body: JSON.stringify({ requestId, message: text.trim() }),
      });
      setText('');
      await load();
    } catch {}
    setSending(false);
  };

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  if (!ACTIVE_STATUSES.has(status)) return null;

  return (
    <div style={{ borderRadius:12, overflow:'hidden', border:'1.5px solid #D1FAE5', marginTop:10, background:'#fff' }}>
      <button
        onClick={() => { setOpen(o => !o); setUnread(0); }}
        style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
                 padding:'11px 14px', background:'#ECFDF5', border:'none', cursor:'pointer',
                 fontFamily:'Inter,sans-serif' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:'1rem' }}>💬</span>
          <span style={{ fontWeight:800, fontSize:'0.82rem', color:'#065F46' }}>
            Chat with {guestFirst}
          </span>
          {unread > 0 && (
            <span style={{ background:'#EF4444', color:'#fff', borderRadius:'50%',
                           width:18, height:18, display:'flex', alignItems:'center',
                           justifyContent:'center', fontSize:'0.65rem', fontWeight:800 }}>
              {unread}
            </span>
          )}
        </div>
        <span style={{ color:'#065F46', fontSize:'0.75rem' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div>
          <div style={{ height:180, overflowY:'auto', padding:'10px 12px',
                        display:'flex', flexDirection:'column', gap:6 }}>
            {messages.length === 0 && (
              <div style={{ color:'#9CA3AF', fontSize:'0.78rem', textAlign:'center', marginTop:50 }}>
                No messages yet.
              </div>
            )}
            {messages.map(m => {
              const isDriver = m.direction === 'outbound';
              return (
                <div key={m.id} style={{ display:'flex', flexDirection:'column',
                                         alignItems: isDriver ? 'flex-end' : 'flex-start' }}>
                  <div style={{ fontSize:'0.65rem', color:'#9CA3AF', marginBottom:2,
                                paddingLeft:4, paddingRight:4 }}>
                    {isDriver ? 'You' : guestFirst}
                  </div>
                  <div style={{
                    maxWidth:'80%', padding:'8px 12px',
                    borderRadius: isDriver ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: isDriver ? '#059669' : '#F3F4F6',
                    color: isDriver ? '#fff' : '#111827',
                    fontSize:'0.83rem', lineHeight:1.4,
                  }}>{m.body}</div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
          <div style={{ borderTop:'1px solid #D1FAE5', padding:'9px 10px', display:'flex', gap:7 }}>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Reply to guest..."
              style={{ flex:1, border:'1.5px solid #A7F3D0', borderRadius:9, padding:'8px 11px',
                       fontSize:'0.83rem', outline:'none', fontFamily:'inherit' }}
            />
            <button
              onClick={send}
              disabled={sending || !text.trim()}
              style={{ background:'#059669', color:'#fff', border:'none', borderRadius:9,
                       padding:'8px 14px', fontWeight:700, fontSize:'0.8rem', cursor:'pointer',
                       fontFamily:'Inter,sans-serif',
                       opacity:(sending || !text.trim()) ? 0.5 : 1 }}>
              {sending ? '...' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}