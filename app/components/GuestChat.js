'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

// Shared guest chat panel — in-session messaging (Supabase-backed, no SMS on this path).
// Used by /request/[id] and /request/statuspage.
export default function GuestChat({ requestId, guestName }) {
  const [messages, setMessages]  = useState([]);
  const [text, setText]          = useState("");
  const [sending, setSending]    = useState(false);
  const [open, setOpen]          = useState(false);
  const [unread, setUnread]      = useState(0);
  const bottomRef                = useRef(null);
  const prevCount                = useRef(0);
  const firstName                = (guestName || "Guest").split(" ")[0];

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/sms/thread/" + requestId);
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
    if (open) { setUnread(0); if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior:"smooth" }); }
  }, [open, messages]);

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await fetch("/api/hopper/guest-message", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ requestId, message: text.trim() }),
      });
      setText("");
      await load();
    } catch {}
    setSending(false);
  };

  const handleKey = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <div style={{ borderRadius:16, overflow:"hidden", border:"1.5px solid #BFDBFE", marginBottom:16, background:"#fff" }}>
      <button onClick={() => { setOpen(o => !o); setUnread(0); }}
        style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between",
                 padding:"14px 18px", background:"#EFF6FF", border:"none", cursor:"pointer" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:"1.1rem" }}>💬</span>
          <span style={{ fontWeight:800, fontSize:"0.88rem", color:"#1E40AF" }}>Message Your Driver</span>
          {unread > 0 && (
            <span style={{ background:"#EF4444", color:"#fff", borderRadius:"50%", width:20, height:20,
                           display:"flex", alignItems:"center", justifyContent:"center",
                           fontSize:"0.7rem", fontWeight:800 }}>{unread}</span>
          )}
        </div>
        <span style={{ color:"#1E40AF", fontSize:"0.8rem" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div>
          <div style={{ height:220, overflowY:"auto", padding:"12px 14px", display:"flex", flexDirection:"column", gap:8 }}>
            {messages.length === 0 && (
              <div style={{ color:"#9CA3AF", fontSize:"0.8rem", textAlign:"center", marginTop:60 }}>
                No messages yet. Say hello to your driver!
              </div>
            )}
            {messages.map(m => {
              const isMe = m.direction === "inbound";
              return (
                <div key={m.id} style={{ display:"flex", flexDirection:"column",
                                         alignItems: isMe ? "flex-end" : "flex-start" }}>
                  <div style={{ fontSize:"0.68rem", color:"#9CA3AF", marginBottom:2, paddingLeft:4, paddingRight:4 }}>
                    {isMe ? firstName : "Driver"}
                  </div>
                  <div style={{
                    maxWidth:"78%", padding:"9px 13px", borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: isMe ? "#1E40AF" : "#F3F4F6",
                    color: isMe ? "#fff" : "#111827",
                    fontSize:"0.85rem", lineHeight:1.4,
                  }}>{m.body}</div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
          <div style={{ borderTop:"1px solid #E5E7EB", padding:"10px 12px", display:"flex", gap:8 }}>
            <input
              value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKey}
              placeholder={"Message your driver..."}
              style={{ flex:1, border:"1.5px solid #BFDBFE", borderRadius:10, padding:"9px 12px",
                       fontSize:"0.85rem", outline:"none", fontFamily:"inherit" }}
            />
            <button onClick={send} disabled={sending || !text.trim()}
              style={{ background:"#1E40AF", color:"#fff", border:"none", borderRadius:10,
                       padding:"9px 16px", fontWeight:700, fontSize:"0.82rem", cursor:"pointer",
                       opacity: (sending || !text.trim()) ? 0.5 : 1 }}>
              {sending ? "..." : "Send"}
            </button>
          </div>
        </div>
      )}

      
    </div>
  );
}
