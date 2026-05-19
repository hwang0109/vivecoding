"use client";
import { useState, useEffect } from "react";

const CATS = ["전체", "정치", "경제", "국제", "사회", "기술"];

const INIT = [
  { id:1, badge:"속보", category:"국제", title:"North Korea Fires ICBM; US, South Korea, Japan Issue Joint Condemnation", titleKo:"북한 ICBM 발사...한미일 즉각 공동 규탄 성명", source:"AP", time:"방금 전", lang:"en", url:"https://apnews.com", body:"North Korea launched an intercontinental ballistic missile that flew approximately 1,000 kilometers before landing in the sea east of the peninsula. The United States, South Korea, and Japan convened emergency talks and issued a joint statement condemning the launch.", byline:null, bookmarked:false, translated:false, translatedBody:null },
  { id:2, badge:"단독", category:"정치", title:"단독] 여야, 이번 주 추경안 전격 합의 유력...규모 20조 원 선", titleKo:"단독] 여야, 이번 주 추경안 전격 합의 유력...규모 20조 원 선", source:"연합뉴스", time:"8분 전", lang:"ko", url:"https://www.yna.co.kr", body:"여야 원내 지도부가 추가경정예산안 규모를 20조 원 안팎으로 하는 합의안을 이번 주 내 처리하는 방안을 논의 중인 것으로 확인됐다.", byline:null, bookmarked:false, translated:false, translatedBody:null },
  { id:3, badge:"속보", category:"경제", title:"Fed Holds Rates Steady, Signals Two Cuts Possible in 2026", titleKo:"Fed, 금리 동결...올해 두 차례 인하 가능성 시사", source:"Reuters", time:"19분 전", lang:"en", url:"https://www.reuters.com", body:"The Federal Reserve kept its benchmark rate unchanged at its May meeting but signaled it could cut rates twice before year-end if inflation continues to moderate.", byline:null, bookmarked:false, translated:false, translatedBody:null },
  { id:4, badge:null, category:"경제", title:"코스피, 외국인 순매수에 2,750 돌파...반도체 강세", titleKo:"코스피, 외국인 순매수에 2,750 돌파...반도체 강세", source:"한국경제", time:"32분 전", lang:"ko", url:"https://www.hankyung.com", body:"코스피가 외국인 투자자들의 대규모 순매수에 힘입어 장중 2,750선을 돌파했다. 삼성전자와 SK하이닉스 등 반도체 대형주가 지수 상승을 이끌었다.", byline:null, bookmarked:false, translated:false, translatedBody:null },
  { id:5, badge:null, category:"기술", title:"Apple Previews On-Device AI at WWDC 2026", titleKo:"애플, WWDC 2026서 온디바이스 AI 공개", source:"The Verge", time:"1시간 전", lang:"en", url:"https://www.theverge.com", body:"Apple unveiled a comprehensive suite of on-device AI features at its annual developer conference, including a redesigned Siri with contextual awareness.", byline:null, bookmarked:false, translated:false, translatedBody:null },
  { id:6, badge:null, category:"사회", title:"서울 합계출산율 0.55로 역대 최저...저출산위 긴급 대책 착수", titleKo:"서울 합계출산율 0.55로 역대 최저...저출산위 긴급 대책 착수", source:"MBC", time:"2시간 전", lang:"ko", url:"https://www.mbc.co.kr/news", body:"서울시의 올해 1분기 합계출산율이 0.55명으로 역대 최저를 기록했다. 저출산고령사회위원회는 긴급 대책반을 꾸리고 주거·양육비 지원 확대 방안을 검토 중이다.", byline:null, bookmarked:false, translated:false, translatedBody:null },
];

async function callClaude(body: object) {
  const res = await fetch("/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export default function NewsHub() {
  const [news, setNews] = useState(INIT);
  const [cat, setCat] = useState("전체");
  const [selId, setSelId] = useState<number|null>(null);
  const [bmView, setBmView] = useState(false);
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [banners, setBanners] = useState<{bid:number, article:typeof INIT[0]}[]>([]);
  const [hovered, setHovered] = useState<number|null>(null);

  const sel = news.find(n => n.id === selId);
  const filtered = news.filter(n => {
    if (bmView) return n.bookmarked;
    return cat === "전체" || n.category === cat;
  });
  const bmCount = news.filter(n => n.bookmarked).length;

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (news !== INIT && news.some(n => n.badge === "속보")) {
      const t = setTimeout(() => addBanner(news.find(n => n.badge === "속보")!), 800);
      return () => clearTimeout(t);
    }
  }, [news]);

  const addBanner = (article: typeof INIT[0]) => {
    const bid = Math.random();
    setBanners(p => [...p, { bid, article }]);
    setTimeout(() => setBanners(p => p.filter(b => b.bid !== bid)), 7000);
  };

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/news");
      const arr = await res.json();
      if (Array.isArray(arr) && arr.length > 0) {
        setNews(arr);
        arr.filter((n: typeof INIT[0]) => n.badge === "속보").forEach(addBanner);
        setSelId(null);
      }
    } catch(err) { console.error(err); }
    setLoading(false);
  };

  const translate = async () => {
    if (!sel || translating) return;
    setTranslating(true);
    try {
      const data = await callClaude({
        model: "claude-sonnet-4-20250514",
        max_tokens: 800,
        messages: [{ role: "user", content: `Translate to natural Korean. Return ONLY the translated text.\n\nTitle: ${sel.title}\n\n${sel.body}` }]
      });
      const txt = data.content[0].text;
      setNews(p => p.map(n => n.id === sel.id ? {...n, translated: true, translatedBody: txt} : n));
    } catch(err) { console.error(err); }
    setTranslating(false);
  };

  const bookmark = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNews(p => p.map(n => n.id === id ? {...n, bookmarked: !n.bookmarked} : n));
  };

  const badgeStyle = (type: string) => ({
    fontSize:10, fontWeight:700, padding:"3px 7px", borderRadius:4,
    background: type === "속보" ? "#dc2626" : "#d97706", color:"#fff", flexShrink:0,
  });

  return (
    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", background:"#fff", minHeight:"100vh", maxWidth:480, margin:"0 auto" }}>
      {banners[0] && (
        <div style={{ position:"fixed", top:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:"#dc2626", color:"#fff", padding:"13px 16px", zIndex:300, display:"flex", alignItems:"center", gap:10, boxSizing:"border-box" }}>
          <span style={{ fontSize:10, fontWeight:800, background:"rgba(255,255,255,0.2)", padding:"3px 8px", borderRadius:3, flexShrink:0 }}>🔴 속보</span>
          <span style={{ fontSize:13, lineHeight:1.4, flex:1 }}>{banners[0].article.titleKo}</span>
          <button onClick={() => setBanners(p => p.slice(1))} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.8)", fontSize:20, cursor:"pointer", padding:0 }}>×</button>
        </div>
      )}
      <header style={{ padding:`${banners.length ? "66px" : "22px"} 20px 16px`, display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid #f0f0f0" }}>
        <div>
          <div style={{ fontSize:9, letterSpacing:3, color:"#bbb", fontWeight:700, marginBottom:2 }}>JOURNALIST</div>
          <a href="https://news-hub-alpha-silk.vercel.app" style={{ fontSize:22, fontWeight:900, letterSpacing:-1, color:"#111", textDecoration:"none" }}>뉴스허브</a>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={() => { setBmView(v => !v); setSelId(null); }} style={{ background: bmView ? "#111" : "transparent", color: bmView ? "#fff" : "#111", border:"1px solid #e0e0e0", borderRadius:8, padding:"7px 12px", fontSize:12, fontWeight:600, cursor:"pointer" }}>
            🔖 {bmCount > 0 && <span style={{ background: bmView ? "#fff" : "#dc2626", color: bmView ? "#dc2626" : "#fff", borderRadius:10, padding:"0 5px", fontSize:10 }}>{bmCount}</span>}
          </button>
          <button onClick={fetchNews} disabled={loading} style={{ background:"#111", color:"#fff", border:"none", borderRadius:8, padding:"7px 14px", fontSize:12, fontWeight:700, cursor:"pointer", opacity: loading ? 0.6 : 1 }}>
            {loading ? "⏳" : "↻ 새로고침"}
          </button>
        </div>
      </header>
      {!bmView ? (
        <div style={{ display:"flex", borderBottom:"1px solid #f0f0f0", overflowX:"auto" }}>
          {CATS.map(c => (
            <button key={c} onClick={() => { setCat(c); setSelId(null); }} style={{ background:"none", border:"none", padding:"13px 12px", fontSize:13, cursor:"pointer", fontWeight: cat===c ? 700 : 400, color: cat===c ? "#111" : "#aaa", borderBottom: cat===c ? "2px solid #111" : "2px solid transparent", whiteSpace:"nowrap", flexShrink:0 }}>{c}</button>
          ))}
        </div>
      ) : (
        <div style={{ padding:"11px 20px", background:"#f9f9f9", fontSize:13, fontWeight:600, borderBottom:"1px solid #f0f0f0" }}>스크랩 {bmCount}개</div>
      )}
      <div>
        {filtered.map(a => (
          <div key={a.id} onClick={() => setSelId(a.id)} onMouseEnter={() => setHovered(a.id)} onMouseLeave={() => setHovered(null)}
            style={{ padding:"17px 20px", borderBottom:"1px solid #f5f5f5", cursor:"pointer", background: hovered===a.id ? "#fafafa" : "#fff" }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:8, flexWrap:"wrap" }}>
                  {a.badge && <span style={badgeStyle(a.badge)}>{a.badge}</span>}
                  <span style={{ fontSize:11, color:"#aaa" }}>{a.category}</span>
                  {a.lang !== "ko" && <span style={{ fontSize:10, background:"#f3f4f6", color:"#777", padding:"2px 5px", borderRadius:3 }}>EN</span>}
                </div>
                <div style={{ fontSize:15, fontWeight:600, lineHeight:1.5, color:"#111", marginBottom:5 }}>{a.titleKo || a.title}</div>
                {a.lang !== "ko" && a.titleKo && <div style={{ fontSize:12, color:"#bbb", marginBottom:5 }}>{a.title}</div>}
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  <span style={{ fontSize:11, fontWeight:700, color:"#555" }}>{a.source}</span>
                  <span style={{ color:"#ddd" }}>·</span>
                  <span style={{ fontSize:11, color:"#aaa" }}>{a.time}</span>
                  {a.byline && <><span style={{ color:"#ddd" }}>·</span><span style={{ fontSize:11, fontWeight:700, color:"#16a34a" }}>{a.byline}</span></>}
                </div>
              </div>
              <button onClick={e => bookmark(a.id, e)} style={{ background:"none", border:"none", fontSize:16, cursor:"pointer", color: a.bookmarked ? "#111" : "#ccc" }}>
                {a.bookmarked ? "🔖" : "☆"}
              </button>
            </div>
          </div>
        ))}
      </div>
      {sel && (
        <div style={{ position:"fixed", top:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, height:"100vh", background:"#fff", zIndex:200, overflowY:"auto", boxSizing:"border-box" }}>
          <div style={{ padding:"20px 20px 50px" }}>
            <button onClick={() => setSelId(null)} style={{ background:"none", border:"none", fontSize:15, cursor:"pointer", color:"#555", padding:"0 0 18px", fontWeight:600 }}>← 목록으로</button>
            <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:12 }}>
              {sel.badge && <span style={badgeStyle(sel.badge)}>{sel.badge}</span>}
              <span style={{ fontSize:12, color:"#aaa" }}>{sel.category}</span>
              {sel.lang !== "ko" && <span style={{ fontSize:10, background:"#f3f4f6", color:"#777", padding:"2px 5px", borderRadius:3 }}>EN</span>}
            </div>
            <h1 style={{ fontSize:20, fontWeight:800, lineHeight:1.45, color:"#111", margin:"0 0 10px" }}>{sel.titleKo || sel.title}</h1>
            {sel.lang !== "ko" && sel.titleKo && <div style={{ fontSize:13, color:"#aaa", marginBottom:14, fontStyle:"italic" }}>{sel.title}</div>}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 0", borderTop:"1px solid #f0f0f0", borderBottom:"1px solid #f0f0f0", marginBottom:20 }}>
              <div style={{ display:"flex", gap:8 }}>
                <span style={{ fontSize:13, fontWeight:700, color:"#333" }}>{sel.source}</span>
                <span style={{ fontSize:13, color:"#aaa" }}>{sel.time}</span>
              </div>
              <button onClick={() => bookmark(sel.id)} style={{ background:"none", border:"1px solid #e5e5e5", borderRadius:7, fontSize:13, cursor:"pointer", fontWeight:600, color:"#555", padding:"6px 10px" }}>
                {sel.bookmarked ? "🔖 저장됨" : "☆ 스크랩"}
              </button>
            </div>
            <div style={{ fontSize:15, lineHeight:1.9, color:"#333", marginBottom:28 }}>{sel.body}</div>
            {sel.lang !== "ko" && (
              !sel.translated
                ? <button onClick={translate} disabled={translating} style={{ width:"100%", padding:14, background: translating ? "#888" : "#111", color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:700, cursor:"pointer", marginBottom:12 }}>
                    {translating ? "번역 중..." : "🌐 한국어로 번역하기"}
                  </button>
                : <div style={{ background:"#f9fafb", borderRadius:10, padding:18, border:"1px solid #efefef", marginBottom:12 }}>
                    <div style={{ fontSize:10, fontWeight:800, color:"#aaa", letterSpacing:1.5, marginBottom:10 }}>🌐 AI 번역</div>
                    <div style={{ fontSize:15, lineHeight:1.9, color:"#333" }}>{sel.translatedBody}</div>
                  </div>
            )}
            {sel.url && (
              <a href={sel.url} target="_blank" rel="noopener noreferrer" style={{ display:"block", width:"100%", padding:14, background:"#f5f5f5", color:"#333", border:"1px solid #e0e0e0", borderRadius:10, fontSize:14, fontWeight:700, cursor:"pointer", textAlign:"center", textDecoration:"none", boxSizing:"border-box" }}>
                🔗 원문 보기
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}