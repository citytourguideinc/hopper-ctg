'use client';
import { useState } from 'react';

const NAV_ITEMS = [
  {
    id: 'guide',
    label: 'cityGUIDE',
    href: 'https://staging.citytourguide.app/guide',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
        <line x1="9" y1="3" x2="9" y2="18"/>
        <line x1="15" y1="6" x2="15" y2="21"/>
      </svg>
    ),
  },
  {
    id: 'tours',
    label: 'cityTOURS',
    href: 'https://staging.citytourguide.app/tours',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="10" r="4"/>
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      </svg>
    ),
  },
  {
    id: 'transit',
    label: 'cityTRANSIT',
    href: 'https://staging.citytourguide.app/transit',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="3" width="14" height="16" rx="3"/>
        <line x1="8" y1="7" x2="16" y2="7"/>
        <circle cx="9" cy="15" r="1"/>
        <circle cx="15" cy="15" r="1"/>
        <line x1="8" y1="21" x2="10" y2="19"/>
        <line x1="16" y1="21" x2="14" y2="19"/>
      </svg>
    ),
  },
  {
    id: 'experiences',
    label: 'cityEXPERIENCES',
    href: 'https://staging.citytourguide.app/social',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
];

const MORE_ITEMS = [
  {
    id: 'merchant-membership',
    label: 'Merchant Membership',
    sub: 'Coming soon • Grow your business with CTG',
    href: '#',
    color: '#2F9BFF',
    comingSoon: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l1.5-5h15L21 9"/>
        <path d="M5 9v10h14V9"/>
        <path d="M9 19v-6h6v6"/>
      </svg>
    ),
  },
  {
    id: 'info',
    label: 'CityINFO',
    sub: 'About, location & contact',
    href: 'https://staging.citytourguide.app/city-info',
    color: '#0066FF',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="8.01"/>
        <line x1="12" y1="12" x2="12" y2="16"/>
      </svg>
    ),
  },
  {
    id: 'faq',
    label: 'CityFAQ',
    sub: 'Frequently asked questions',
    href: 'https://staging.citytourguide.app/city-faq',
    color: '#00C896',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
  {
    id: 'legal',
    label: 'CityLEGAL',
    sub: 'Privacy, terms & disclaimer',
    href: 'https://staging.citytourguide.app/city-legal',
    color: '#F59E0B',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
];

export default function BottomNav({ active = 'transit' }) {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      {moreOpen && (
        <div onClick={() => setMoreOpen(false)} style={{position:'fixed',inset:0,zIndex:400,background:'rgba(0,0,0,0.55)',display:'flex',flexDirection:'column',justifyContent:'flex-end'}}>
          <div onClick={e => e.stopPropagation()} style={{background:'#111',borderRadius:'20px 20px 0 0',padding:'12px 0 32px',border:'1px solid rgba(255,255,255,0.1)',borderBottom:'none'}}>
            <div style={{width:36,height:4,background:'rgba(255,255,255,0.2)',borderRadius:99,margin:'0 auto 16px'}}/>
            <div style={{padding:'0 20px 12px',fontSize:'0.65rem',fontWeight:800,color:'rgba(255,255,255,0.35)',letterSpacing:'0.12em',textTransform:'uppercase'}}>City+</div>
            {MORE_ITEMS.map(item => (
              <a key={item.id} href={item.href} onClick={(e) => { if (item.comingSoon) e.preventDefault(); else setMoreOpen(false); }} aria-disabled={item.comingSoon || undefined} style={{display:'flex',alignItems:'center',gap:16,padding:'14px 20px',textDecoration:'none',borderBottom:'1px solid rgba(255,255,255,0.06)',opacity:item.comingSoon?0.9:1,cursor:item.comingSoon?'default':'pointer'}}>
                <div style={{width:44,height:44,borderRadius:12,background:`${item.color}18`,display:'flex',alignItems:'center',justifyContent:'center',color:item.color,flexShrink:0}}>{item.icon}</div>
                <div>
                  <div style={{fontWeight:800,fontSize:'0.95rem',color:'#fff',lineHeight:1.2}}>{item.label}</div>
                  <div style={{fontSize:'0.72rem',color:'rgba(255,255,255,0.45)',marginTop:2}}>{item.sub}</div>
                </div>
                {item.comingSoon ? <span style={{marginLeft:'auto',fontSize:'0.58rem',fontWeight:900,letterSpacing:'0.08em',color:item.color,border:`1px solid ${item.color}66`,borderRadius:999,padding:'4px 7px'}}>SOON</span> : <div style={{marginLeft:'auto',color:'rgba(255,255,255,0.25)'}}>›</div>}
              </a>
            ))}
          </div>
        </div>
      )}

      <nav className="ctg-bottom-nav" aria-label="City Tour Guide navigation">
        {NAV_ITEMS.map((item) => (
          <a key={item.id} href={item.href} className={`ctg-bottom-nav-item${item.id === active ? ' ctg-bottom-nav-item--active' : ''}`} aria-current={item.id === active ? 'page' : undefined}>
            <span className="ctg-bottom-nav-icon">{item.icon}</span>
            <span className="ctg-bottom-nav-label">{item.label}</span>
          </a>
        ))}
        <button onClick={() => setMoreOpen(o => !o)} className={`ctg-bottom-nav-item${moreOpen ? ' ctg-bottom-nav-item--active' : ''}`} aria-label="More options" style={{background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',padding:0}}>
          <span className="ctg-bottom-nav-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </span>
          <span className="ctg-bottom-nav-label">city+</span>
        </button>
      </nav>
      <div className="ctg-bottom-nav-spacer" aria-hidden="true" />
    </>
  );
}
