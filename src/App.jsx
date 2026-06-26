import { useState } from 'react';

const TIERS = [
  { name:"PLATINO", min:1900, color:"#f0c040", bg:"#1a1500", glow:"#f0c04055", emoji:"\u{1F451}", prize:1000 },
  { name:"ORO",     min:1700, color:"#f97316", bg:"#1a0800", glow:"#f9731655", emoji:"\u{1F947}", prize:400  },
  { name:"PLATA",   min:1500, color:"#94a3b8", bg:"#101520", glow:"#94a3b855", emoji:"\u{1F948}", prize:150  },
  { name:"BRONCE",  min:1350, color:"#c97c2a", bg:"#120c00", glow:"#c97c2a55", emoji:"\u{1F949}", prize:50   },
  { name:"ROOKIE",  min:0,    color:"#6b7280", bg:"#0f1117", glow:"#6b728055", emoji:"⚽",    prize:0    },
];
const getTier = elo => TIERS.find(t => elo >= t.min) || TIERS[4];
const ELO_PTS = { p1:90, p2:55, p3:25, p4:8, goal:4, assist:2, cs:6, noShow:-15, daily:50, fb:5 };
const DAYS = [
  { date:"2026-06-21", label:"Sun Jun 21", short:"SUN", type:"free",    slots:["10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"] },
  { date:"2026-06-22", label:"Mon Jun 22", short:"MON", type:"paid",    slots:["19:00","20:00","21:00"] },
  { date:"2026-06-23", label:"Tue Jun 23", short:"TUE", type:"paid",    slots:["19:00","20:00","21:00"] },
  { date:"2026-06-24", label:"Wed Jun 24", short:"WED", type:"paid",    slots:["19:00","20:00","21:00"] },
  { date:"2026-06-25", label:"Thu Jun 25", short:"THU", type:"paid",    slots:["19:00","20:00","21:00"] },
  { date:"2026-06-26", label:"Fri Jun 26",  short:"FRI", type:"finale", slots:["19:00","20:00","21:00"] },
];
const FIELDS = [
  {id:"F1",name:"Field 1",type:"full",max:7,cost:125},{id:"F2",name:"Field 2",type:"full",max:7,cost:125},
  {id:"M1",name:"Mini 1",type:"mini",max:5,cost:125},{id:"M2",name:"Mini 2",type:"mini",max:5,cost:125},
  {id:"M3",name:"Mini 3",type:"mini",max:5,cost:125},{id:"M4",name:"Mini 4",type:"mini",max:5,cost:125},
  {id:"M5",name:"Mini 5",type:"mini",max:5,cost:125},
];
const PRICE = {reg:15,solo:25,sq7:175,sq5:140,pass:99};
const C = {
  bg:"#060b14",surface:"#0d1424",card:"#0f1a2e",border:"#1e2d4a",
  accent:"#22c55e",orange:"#f97316",gold:"#f0c040",blue:"#3b82f6",
  purple:"#a855f7",red:"#ef4444",text:"#e2e8f0",muted:"#64748b",
};
const TABS = [
  {id:"home",icon:"\u{1F3DF}",label:"Home"},{id:"register",icon:"✍",label:"Register"},
  {id:"tracker",icon:"\u{1F4CA}",label:"Tracker"},{id:"rankings",icon:"\u{1F3C6}",label:"Rankings"},
  {id:"projection",icon:"\u{1F4C8}",label:"Projection"},{id:"schedule",icon:"\u{1F4C5}",label:"Schedule"},
  {id:"financials",icon:"\u{1F4B0}",label:"Financials"},{id:"rulebook",icon:"\u{1F4D6}",label:"Rulebook"},
];
const SEED = [
  {id:1,name:"Carlos Mendoza",pos:"FWD",squad:"Los Galácticos"},
  {id:2,name:"Jorge Rivera",pos:"MID",squad:"Los Galácticos"},
  {id:3,name:"Luis Flores",pos:"DEF",squad:"Los Galácticos"},
  {id:4,name:"Andrés Vargas",pos:"MID",squad:null},
  {id:5,name:"Miguel Santos",pos:"FWD",squad:"Pilsen FC"},
  {id:6,name:"David López",pos:"GK",squad:"Pilsen FC"},
  {id:7,name:"Roberto García",pos:"DEF",squad:"Pilsen FC"},
  {id:8,name:"Emilio Torres",pos:"FWD",squad:null},
  {id:9,name:"Marco Alvarez",pos:"MID",squad:"Los Galácticos"},
  {id:10,name:"Oscar Pérez",pos:"DEF",squad:null},
].map(p=>({...p,elo:1500,wins:0,losses:0,goals:0,assists:0,yCards:0,rCards:0,days:[],gamesPlayed:0,registered:true}));

/* ── SMALL COMPONENTS ── */
const Badge = ({tier}) => (
  <span style={{background:tier.bg,color:tier.color,border:`1px solid ${tier.color}55`,padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:800,whiteSpace:"nowrap"}}>
    {tier.emoji} {tier.name}
  </span>
);
const Pill = ({color,children}) => (
  <span style={{background:color+"22",color,border:`1px solid ${color}44`,padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700}}>{children}</span>
);
const Card = ({children,accent=C.border,style={}}) => (
  <div style={{background:C.card,border:`1px solid ${accent}`,borderRadius:14,padding:18,...style}}>{children}</div>
);
const H2 = ({color=C.accent,children}) => (
  <div style={{fontWeight:800,color,fontSize:15,marginBottom:14}}>{children}</div>
);
const Btn = ({color=C.accent,onClick,children,style={}}) => (
  <button onClick={onClick} style={{background:color,color:color===C.accent?"#000":"#fff",border:"none",borderRadius:8,padding:"10px 20px",fontWeight:800,fontSize:13,cursor:"pointer",...style}}>{children}</button>
);
const Sm = ({bg,color,onClick,children}) => (
  <button onClick={onClick} style={{background:bg,color,border:"none",borderRadius:5,padding:"3px 8px",fontSize:10,fontWeight:700,cursor:"pointer"}}>{children}</button>
);
const TH = ({children,left}) => (
  <th style={{padding:"8px 10px",textAlign:left?"left":"center",fontSize:11,fontWeight:700,color:C.muted,borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap",background:C.surface}}>{children}</th>
);
const TD = ({children,color,bold,center,small}) => (
  <td style={{padding:"7px 10px",fontSize:small?10:12,color:color||C.text,fontWeight:bold?700:400,textAlign:center?"center":"left",borderBottom:`1px solid ${C.border}22`,verticalAlign:"middle"}}>{children}</td>
);
const EloBar = ({elo}) => {
  const tier=getTier(elo);
  const idx=TIERS.findIndex(t=>t.name===tier.name);
  const next=TIERS[idx-1];
  const pct=next?Math.min(100,Math.round(((elo-tier.min)/(next.min-tier.min))*100)):100;
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:C.muted,marginBottom:3}}>
        <span style={{color:tier.color,fontWeight:700}}>{tier.name}</span>
        {next&&<span>{next.name} {next.min}</span>}
      </div>
      <div style={{height:5,background:C.surface,borderRadius:3,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${pct}%`,background:tier.color,borderRadius:3}}/>
      </div>
    </div>
  );
};
const DayDots = ({days}) => (
  <div style={{display:"flex",gap:3}}>
    {Array.from({length:6}).map((_,i)=>(
      <div key={i} title={days[i]||""} style={{width:9,height:9,borderRadius:"50%",background:days[i]?C.accent:C.border}}/>
    ))}
  </div>
);

/* ── APP ── */
export default function App() {
  const [tab,setTab]         = useState("home");
  const [players,setPlayers] = useState(SEED);
  const [selDay,setSelDay]   = useState("2026-06-22");
  const [toast,setToast]     = useState(null);
  const [modal,setModal]     = useState(null);
  const [lf,setLf]           = useState({placement:1,goals:0,assists:0,cs:false});
  const [np,setNp]           = useState({name:"",pos:"MID",squad:"",paid:false,pass:false});

  const ranked   = [...players].sort((a,b)=>b.elo-a.elo);
  const totalPool= TIERS.reduce((s,t)=>s+t.prize,0);
  const isSusp   = p => p.rCards>=1||p.yCards>=4;
  const isElig   = p => p.days.length>=2&&p.elo>=1350&&!isSusp(p);
  const dayInfo  = DAYS.find(d=>d.date===selDay)||DAYS[0];
  const totalCostWeek = 7*175*(9+3*5);

  function pop(msg,color=C.accent){ setToast({msg,color}); setTimeout(()=>setToast(null),2600); }

  function addPlayer(){
    if(!np.name.trim()) return pop("Enter a name",C.red);
    setPlayers(prev=>[...prev,{id:Date.now(),name:np.name.trim(),pos:np.pos,
      squad:np.squad.trim()||null,paid:np.paid,weekPass:np.pass,elo:1500,
      wins:0,losses:0,goals:0,assists:0,yCards:0,rCards:0,days:[],gamesPlayed:0,registered:true}]);
    pop("✓ "+np.name.trim()+" registered!");
    setNp({name:"",pos:"MID",squad:"",paid:false,pass:false});
  }

  function openLog(pid){ setModal(pid); setLf({placement:1,goals:0,assists:0,cs:false}); }

  function submitLog(){
    if(!modal) return;
    const base=[ELO_PTS.p1,ELO_PTS.p2,ELO_PTS.p3,ELO_PTS.p4][lf.placement-1]||ELO_PTS.p4;
    const bonus=lf.goals*ELO_PTS.goal+lf.assists*ELO_PTS.assist+(lf.cs?ELO_PTS.cs:0);
    setPlayers(prev=>prev.map(p=>{
      if(p.id!==modal) return p;
      const newDays=p.days.includes(selDay)?p.days:[...p.days,selDay];
      return {...p,elo:p.elo+base+bonus,wins:lf.placement<=2?p.wins+1:p.wins,
        losses:lf.placement>2?p.losses+1:p.losses,goals:p.goals+lf.goals,
        assists:p.assists+lf.assists,days:newDays,gamesPlayed:p.gamesPlayed+1};
    }));
    pop("+"+(base+bonus)+" ELO logged");
    setModal(null);
  }

  function issueCard(pid,type){
    setPlayers(prev=>prev.map(p=>p.id!==pid?p:type==="yellow"?{...p,yCards:p.yCards+1}:{...p,rCards:p.rCards+1}));
    pop(type==="yellow"?"🟨 Yellow card":"🟥 Red — ejected",type==="yellow"?C.orange:C.red);
  }

  function projElo(daily){ let e=1500; for(let d=0;d<6;d++) e+=daily+ELO_PTS.fb; return e+ELO_PTS.daily; }

  /* ── shared input style ── */
  const inp = {width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,
    padding:"9px 12px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box"};

  return (
    <div style={{fontFamily:"'Inter','Helvetica Neue',sans-serif",background:C.bg,minHeight:"100vh",color:C.text}}>

      {/* TOAST */}
      {toast&&<div style={{position:"fixed",top:16,right:16,zIndex:9999,background:toast.color,color:"#000",padding:"10px 18px",borderRadius:10,fontWeight:800,fontSize:13,boxShadow:"0 8px 30px #0008"}}>{toast.msg}</div>}

      {/* LOG MODAL */}
      {modal&&(()=>{
        const player=players.find(p=>p.id===modal);
        const base=[ELO_PTS.p1,ELO_PTS.p2,ELO_PTS.p3,ELO_PTS.p4][lf.placement-1]||ELO_PTS.p4;
        const preview=base+lf.goals*ELO_PTS.goal+lf.assists*ELO_PTS.assist+(lf.cs?ELO_PTS.cs:0);
        return (
          <div style={{position:"fixed",inset:0,background:"#000b",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
            <div style={{background:C.card,border:`1px solid ${C.accent}55`,borderRadius:18,padding:28,width:360,maxWidth:"100%",boxShadow:"0 20px 60px #000c"}}>
              <div style={{fontWeight:800,color:C.accent,fontSize:16,marginBottom:4}}>Log Game Result</div>
              <div style={{fontSize:13,color:C.muted,marginBottom:18}}>{player?.name} • {dayInfo.label}</div>
              <div style={{marginBottom:16}}>
                <div style={{fontSize:11,color:C.muted,marginBottom:8}}>Team Placement</div>
                <div style={{display:"flex",gap:8}}>
                  {[1,2,3,4].map(n=>(
                    <button key={n} onClick={()=>setLf(f=>({...f,placement:n}))} style={{flex:1,padding:"12px 0",borderRadius:10,cursor:"pointer",fontWeight:800,fontSize:13,border:`2px solid ${lf.placement===n?C.accent:C.border}`,background:lf.placement===n?C.accent+"22":C.surface,color:lf.placement===n?C.accent:C.muted}}>
                      {n===1?"🥇":n===2?"🥈":n===3?"🥉":"4th"}
                      <div style={{fontSize:9,marginTop:2,fontWeight:400}}>{["+90","+55","+25","+8"][n-1]}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{display:"flex",gap:10,marginBottom:14}}>
                {[["Goals ⚽","goals"],["Assists 🎯","assists"]].map(([lbl,key])=>(
                  <div key={key} style={{flex:1}}>
                    <div style={{fontSize:11,color:C.muted,marginBottom:5}}>{lbl}</div>
                    <input type="number" min="0" max="20" value={lf[key]}
                      onChange={e=>setLf(f=>({...f,[key]:Math.max(0,+e.target.value)}))}
                      style={{...inp,fontSize:20,fontWeight:700,textAlign:"center",padding:"10px"}}/>
                  </div>
                ))}
              </div>
              <label style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,cursor:"pointer"}}>
                <input type="checkbox" checked={lf.cs} onChange={e=>setLf(f=>({...f,cs:e.target.checked}))}/>
                <span style={{fontSize:12,color:C.muted}}>GK Clean Sheet (+6 ELO)</span>
              </label>
              <div style={{background:C.surface,borderRadius:12,padding:14,marginBottom:18,textAlign:"center"}}>
                <div style={{fontSize:11,color:C.muted,marginBottom:4}}>ELO GAINED</div>
                <div style={{fontSize:44,fontWeight:900,color:C.accent,lineHeight:1}}>+{preview}</div>
              </div>
              <div style={{display:"flex",gap:10}}>
                <Btn onClick={submitLog} style={{flex:2}}>Submit Result</Btn>
                <button onClick={()=>setModal(null)} style={{flex:1,background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.muted,cursor:"pointer",fontSize:13}}>Cancel</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* HEADER */}
      <div style={{background:"linear-gradient(135deg,#04080f 0%,#091525 60%,#04080f 100%)",borderBottom:`2px solid ${C.accent}`}}>
        <div style={{maxWidth:1200,margin:"0 auto",padding:"14px 16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
            <div>
              <div style={{fontSize:28,fontWeight:900,letterSpacing:-1,lineHeight:1}}>LIGA <span style={{color:C.accent}}>REAL</span> PRO</div>
              <div style={{fontSize:10,color:C.muted,marginTop:2}}>Sofive Chitown • 2343 S Throop St Chicago • Jun 21–26 2026</div>
            </div>
            <Pill color={C.accent}>BETA MVP</Pill>
            <Pill color={C.orange}>Find the Next Brian Gutierrez</Pill>
            <Pill color={C.gold}>${totalPool.toLocaleString()} Prize Pool</Pill>
            <div style={{marginLeft:"auto",textAlign:"right",fontSize:11,color:C.muted}}>
              <div style={{color:C.text,fontWeight:700}}>{players.length} Players</div>
              <div>{players.filter(p=>p.paid||p.weekPass).length} Paid</div>
            </div>
          </div>
        </div>
        <div style={{maxWidth:1200,margin:"0 auto",display:"flex",overflowX:"auto",padding:"0 14px",gap:2}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{background:"none",border:"none",cursor:"pointer",padding:"9px 12px",fontSize:12,fontWeight:tab===t.id?800:400,color:tab===t.id?C.accent:C.muted,whiteSpace:"nowrap",borderBottom:`2px solid ${tab===t.id?C.accent:"transparent"}`}}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{maxWidth:1200,margin:"0 auto",padding:"20px 14px"}}>

        {/* ══ HOME ══ */}
        {tab==="home"&&(
          <div>
            {/* hero */}
            <div style={{background:"linear-gradient(135deg,#0a1f0e,#0d1f2d,#1a0a00)",border:`1px solid ${C.accent}44`,borderRadius:20,padding:32,marginBottom:20,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:-40,right:-40,width:200,height:200,background:C.accent+"08",borderRadius:"50%",pointerEvents:"none"}}/>
              <div style={{fontSize:12,color:C.accent,fontWeight:700,marginBottom:8,letterSpacing:2}}>BETA WEEK • JUNE 21–26 2026</div>
              <div style={{fontSize:30,fontWeight:900,lineHeight:1.1,marginBottom:10}}>The Streets Decide.<br/><span style={{color:C.accent}}>The Data Confirms.</span></div>
              <div style={{fontSize:13,color:C.muted,maxWidth:480,lineHeight:1.7,marginBottom:20}}>7 fields. 6 days. Every goal tracked. Every ranking earned. This is where Chicago's backyard legends stop being unknown. No substitutes. No excuses.</div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <Btn onClick={()=>setTab("register")}>Register Now →</Btn>
                <Btn color={C.orange} onClick={()=>setTab("rankings")}>View Rankings →</Btn>
                <Btn color={C.blue} onClick={()=>setTab("projection")}>See Your Potential →</Btn>
              </div>
            </div>

            {/* kpi */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:10,marginBottom:20}}>
              {[
                {l:"Players Registered",v:players.length,c:C.accent},
                {l:"Paid Entries",v:players.filter(p=>p.paid||p.weekPass).length,c:C.orange},
                {l:"Grand Prize Pool",v:"$"+totalPool.toLocaleString(),c:C.gold},
                {l:"Total Fields",v:"7 (2+5)",c:C.blue},
                {l:"Max Players / Slot",v:78,c:C.purple},
                {l:"25% Daily Target",v:"~20 players",c:C.accent},
              ].map(k=>(
                <div key={k.l} style={{background:C.surface,border:`1px solid ${k.c}33`,borderRadius:12,padding:"14px 16px"}}>
                  <div style={{fontSize:22,fontWeight:900,color:k.c}}>{k.v}</div>
                  <div style={{fontSize:10,color:C.muted,marginTop:2}}>{k.l}</div>
                </div>
              ))}
            </div>

            {/* match timeline */}
            <Card accent={C.accent+"44"} style={{marginBottom:20}}>
              <H2 color={C.accent}>30-Minute Match Timeline — Every Field, Every Slot</H2>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(185px,1fr))",gap:10}}>
                {[
                  {t:"0:00–2:00",  ph:"Line-Up & Roster Lock",      c:C.muted,  n:"Late arrivals not added after 2:00"},
                  {t:"2:00–16:00", ph:"First Half (14 min)",         c:C.blue,   n:"Continuous clock, full contact"},
                  {t:"16:00–19:00",ph:"Half-Time Switch (3 min)",    c:C.orange, n:"Winners vs Winners · Losers vs Losers"},
                  {t:"19:00–28:00",ph:"Second Match (9 min)",        c:C.accent, n:"Championship + Consolation simultaneous"},
                  {t:"28:00–30:00",ph:"ELO Log & Score Report",      c:C.purple, n:"Staff logs immediately, leaderboard updates"},
                ].map(s=>(
                  <div key={s.t} style={{background:C.surface,borderRadius:10,padding:"10px 14px",borderLeft:`3px solid ${s.c}`}}>
                    <div style={{fontSize:12,fontWeight:800,color:s.c}}>{s.t}</div>
                    <div style={{fontSize:12,color:C.text,marginTop:3}}>{s.ph}</div>
                    <div style={{fontSize:10,color:C.muted,marginTop:3}}>{s.n}</div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:12,background:C.surface,borderRadius:10,padding:12,fontSize:12,color:C.muted}}>
                <span style={{color:C.orange,fontWeight:800}}>NO SUBSTITUTES.</span> Exactly 7 (full) or 5 (mini) players per team. 7v7 winners ONLY face 7v7 winners. 5v5 winners ONLY face 5v5 winners.
              </div>
            </Card>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              {/* top 5 */}
              <Card accent={C.accent+"44"}>
                <H2 color={C.accent}>Live Top 5</H2>
                {ranked.slice(0,5).map((p,i)=>{
                  const tier=getTier(p.elo);
                  return (
                    <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${C.border}33`}}>
                      <div style={{width:24,fontSize:13,color:i<3?C.gold:C.muted,fontWeight:700}}>#{i+1}</div>
                      <div style={{fontSize:16}}>{tier.emoji}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:700}}>{p.name}</div>
                        {p.squad&&<div style={{fontSize:10,color:C.muted}}>{p.squad}</div>}
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:14,fontWeight:900,color:tier.color}}>{p.elo}</div>
                        <div style={{fontSize:9,color:C.muted}}>{p.days.length}d • {p.gamesPlayed}g</div>
                      </div>
                    </div>
                  );
                })}
                <Btn onClick={()=>setTab("rankings")} style={{width:"100%",marginTop:12,fontSize:12,padding:"8px 0"}}>Full Leaderboard →</Btn>
              </Card>

              {/* prizes */}
              <Card accent={C.gold+"44"}>
                <H2 color={C.gold}>Grand Prize Pool — Jun 26</H2>
                {TIERS.filter(t=>t.prize>0).map(t=>(
                  <div key={t.name} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${C.border}33`}}>
                    <div style={{fontSize:18}}>{t.emoji}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:800,color:t.color}}>{t.name}</div>
                      <div style={{fontSize:10,color:C.muted}}>ELO {t.min}+</div>
                    </div>
                    <div style={{fontSize:20,fontWeight:900,color:t.color}}>${t.prize.toLocaleString()}</div>
                  </div>
                ))}
                <div style={{display:"flex",justifyContent:"space-between",marginTop:12,paddingTop:10,borderTop:`1px solid ${C.border}`}}>
                  <span style={{fontWeight:700}}>TOTAL POOL</span>
                  <span style={{fontSize:22,fontWeight:900,color:C.gold}}>${totalPool.toLocaleString()}</span>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ══ REGISTER ══ */}
        {tab==="register"&&(
          <div>
            <H2 color={C.accent}>Player Registration — $15 One-Time Fee</H2>
            <Card accent={C.accent+"44"} style={{marginBottom:20}}>
              <div style={{fontWeight:700,color:C.accent,marginBottom:14,fontSize:14}}>Register New Player</div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:12}}>
                <div style={{flex:"2 1 180px"}}>
                  <div style={{fontSize:11,color:C.muted,marginBottom:5}}>Full Name *</div>
                  <input value={np.name} onChange={e=>setNp(p=>({...p,name:e.target.value}))} placeholder="e.g. Brian Gutierrez" style={inp}/>
                </div>
                <div style={{flex:"1 1 120px"}}>
                  <div style={{fontSize:11,color:C.muted,marginBottom:5}}>Position</div>
                  <select value={np.pos} onChange={e=>setNp(p=>({...p,pos:e.target.value}))} style={inp}>
                    <option>GK</option><option>DEF</option><option>MID</option><option>FWD</option>
                  </select>
                </div>
                <div style={{flex:"1 1 160px"}}>
                  <div style={{fontSize:11,color:C.muted,marginBottom:5}}>Squad Name (optional)</div>
                  <input value={np.squad} onChange={e=>setNp(p=>({...p,squad:e.target.value}))} placeholder="e.g. Pilsen FC" style={inp}/>
                </div>
              </div>
              <div style={{display:"flex",gap:20,flexWrap:"wrap",marginBottom:16}}>
                <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13}}>
                  <input type="checkbox" checked={np.paid} onChange={e=>setNp(p=>({...p,paid:e.target.checked}))}/>
                  <span>Paid game entry ($25/session Mon–Fri)</span>
                </label>
                <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13}}>
                  <input type="checkbox" checked={np.pass} onChange={e=>setNp(p=>({...p,pass:e.target.checked}))}/>
                  <span style={{color:C.gold}}>Elite Week Pass ($99 — all 5 days + bonus ELO)</span>
                </label>
              </div>
              <Btn onClick={addPlayer}>Register Player →</Btn>
            </Card>

            {/* registered list */}
            <Card accent={C.border}>
              <H2>All Registered Players ({players.length})</H2>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr>
                    <TH left>#</TH><TH left>Name</TH><TH>Pos</TH><TH>Squad</TH>
                    <TH>Tier</TH><TH>ELO</TH><TH>Days</TH><TH>Entry</TH><TH>Status</TH>
                  </tr></thead>
                  <tbody>
                    {ranked.map((p,i)=>{
                      const tier=getTier(p.elo);
                      const susp=isSusp(p);
                      return (
                        <tr key={p.id} style={{background:i%2===0?C.surface+"44":"transparent"}}>
                          <TD color={C.muted} small>#{i+1}</TD>
                          <TD bold>{p.name}</TD>
                          <TD center><Pill color={C.blue}>{p.pos}</Pill></TD>
                          <TD small color={C.muted}>{p.squad||"—"}</TD>
                          <TD center><Badge tier={tier}/></TD>
                          <TD center bold color={tier.color}>{p.elo}</TD>
                          <TD center>{p.days.length}/6</TD>
                          <TD center>
                            {p.weekPass?<Pill color={C.gold}>Week Pass</Pill>:p.paid?<Pill color={C.accent}>Paid</Pill>:<Pill color={C.muted}>Free</Pill>}
                          </TD>
                          <TD center>
                            {susp?<Pill color={C.red}>Suspended</Pill>:isElig(p)?<Pill color={C.accent}>✓ Prize Eligible</Pill>:<Pill color={C.muted}>Active</Pill>}
                          </TD>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ══ TRACKER ══ */}
        {tab==="tracker"&&(
          <div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:16}}>
              <H2 color={C.accent}>MVP Beta Tracker — Manual Game Log</H2>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {DAYS.map(d=>{
                  const col=d.type==="free"?C.accent:d.type==="finale"?C.gold:C.blue;
                  return (
                    <button key={d.date} onClick={()=>setSelDay(d.date)} style={{padding:"6px 12px",borderRadius:8,border:`2px solid ${selDay===d.date?col:C.border}`,background:selDay===d.date?col+"22":C.surface,cursor:"pointer",fontSize:11,fontWeight:selDay===d.date?800:400,color:selDay===d.date?col:C.muted}}>
                      {d.short}<div style={{fontSize:9}}>{d.type==="free"?"FREE":d.type==="finale"?"FINAL":"PAID"}</div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{background:C.surface,borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:12,color:C.muted}}>
              Logging for: <strong style={{color:C.text}}>{dayInfo.label}</strong> • Click <strong style={{color:C.accent}}>Log Game</strong> to record a result • Issue cards directly from the row
            </div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr>
                  <TH>#</TH><TH left>Player</TH><TH>Tier</TH><TH>ELO</TH>
                  <TH>W</TH><TH>L</TH><TH>G</TH><TH>A</TH>
                  <TH>Cards</TH><TH>Days</TH><TH>Log</TH><TH>Actions</TH>
                </tr></thead>
                <tbody>
                  {ranked.map((p,i)=>{
                    const tier=getTier(p.elo);
                    const susp=isSusp(p);
                    const todayDone=p.days.includes(selDay);
                    return (
                      <tr key={p.id} style={{background:i%2===0?C.surface+"33":"transparent",opacity:susp?0.55:1}}>
                        <TD center color={i<3?C.gold:C.muted} bold>#{i+1}</TD>
                        <TD>
                          <div style={{fontWeight:700,fontSize:13}}>{p.name}</div>
                          <div style={{fontSize:10,color:C.muted}}>{p.pos}{p.squad?" • "+p.squad:""}</div>
                          {susp&&<Pill color={C.red}>SUSPENDED</Pill>}
                          {todayDone&&<Pill color={C.accent}>✓ Played</Pill>}
                        </TD>
                        <TD center><Badge tier={tier}/></TD>
                        <TD center bold color={tier.color}>{p.elo}</TD>
                        <TD center color={C.accent} bold>{p.wins}</TD>
                        <TD center color={C.red}>{p.losses}</TD>
                        <TD center>{p.goals}</TD>
                        <TD center>{p.assists}</TD>
                        <TD center>
                          {p.yCards>0&&<span style={{color:"#fbbf24",fontWeight:700,fontSize:12}}>{"\u{1F7E8}".repeat(Math.min(p.yCards,3))}</span>}
                          {p.rCards>0&&<span style={{color:C.red,fontWeight:700,fontSize:12}}>{"\u{1F7E5}"}</span>}
                          {p.yCards===0&&p.rCards===0&&<span style={{color:C.muted,fontSize:11}}>✓</span>}
                          {p.yCards>=2&&<div style={{fontSize:9,color:C.red}}>${p.yCards===2?35:p.yCards===3?75:125} fine</div>}
                          {p.rCards>=1&&<div style={{fontSize:9,color:C.red}}>${p.rCards===1?100:200} fine</div>}
                        </TD>
                        <TD center>
                          <DayDots days={p.days}/>
                          <div style={{fontSize:9,color:C.muted,marginTop:2}}>{p.days.length}/6</div>
                        </TD>
                        <TD center>
                          <Btn onClick={()=>openLog(p.id)} style={{padding:"5px 12px",fontSize:11}}>Log Game</Btn>
                        </TD>
                        <TD center>
                          <div style={{display:"flex",gap:3,justifyContent:"center"}}>
                            <Sm bg="#422006" color="#fbbf24" onClick={()=>issueCard(p.id,"yellow")}>{"\u{1F7E8}"}</Sm>
                            <Sm bg="#450a0a" color={C.red} onClick={()=>issueCard(p.id,"red")}>{"\u{1F7E5}"}</Sm>
                          </div>
                        </TD>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ RANKINGS ══ */}
        {tab==="rankings"&&(
          <div>
            <H2 color={C.accent}>Live Rankings</H2>
            {/* tier cards */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:10,marginBottom:20}}>
              {TIERS.map(t=>{
                const cnt=players.filter(p=>getTier(p.elo).name===t.name).length;
                return (
                  <div key={t.name} style={{background:t.bg,border:`1px solid ${t.color}44`,boxShadow:`0 0 18px ${t.glow}`,borderRadius:14,padding:"14px 16px"}}>
                    <div style={{fontSize:24}}>{t.emoji}</div>
                    <div style={{fontSize:14,fontWeight:800,color:t.color,marginTop:4}}>{t.name}</div>
                    <div style={{fontSize:10,color:C.muted}}>ELO {t.min}+</div>
                    <div style={{fontSize:11,color:C.muted,marginTop:2}}>{cnt} player{cnt!==1?"s":""}</div>
                    {t.prize>0&&<div style={{fontSize:18,fontWeight:900,color:t.color,marginTop:6}}>${t.prize.toLocaleString()}</div>}
                  </div>
                );
              })}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
              {/* elo table */}
              <Card accent={C.blue+"44"}>
                <H2 color={C.blue}>ELO Points Per Game</H2>
                {[
                  ["1st Place (win)","+" +ELO_PTS.p1,C.gold],
                  ["2nd Place","+"+ELO_PTS.p2,"#94a3b8"],
                  ["3rd Place","+"+ELO_PTS.p3,"#c97c2a"],
                  ["4th Place / Loss","+"+ELO_PTS.p4,C.muted],
                  ["Goal scored","+"+ELO_PTS.goal+"/goal",C.accent],
                  ["Assist","+"+ELO_PTS.assist+"/ast",C.accent],
                  ["GK Clean Sheet","+"+ELO_PTS.cs,C.accent],
                  ["No-show (registered)",""+ELO_PTS.noShow,C.red],
                  ["Feedback form/day","+"+ELO_PTS.fb,C.purple],
                  ["Elite daily bonus (paid, all 5 days)","+"+ELO_PTS.daily+" on Fri",C.orange],
                ].map(([k,v,c])=>(
                  <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${C.border}33`,fontSize:12}}>
                    <span style={{color:C.muted}}>{k}</span>
                    <span style={{fontWeight:700,color:c}}>{v}</span>
                  </div>
                ))}
              </Card>

              {/* prizes */}
              <Card accent={C.gold+"44"}>
                <H2 color={C.gold}>Prize Eligibility</H2>
                {TIERS.filter(t=>t.prize>0).map(t=>(
                  <div key={t.name} style={{background:t.bg,borderRadius:10,padding:"10px 12px",marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontWeight:800,color:t.color,fontSize:14}}>{t.emoji} {t.name}</span>
                      <span style={{fontWeight:900,color:t.color,fontSize:18}}>${t.prize.toLocaleString()}</span>
                    </div>
                    <div style={{fontSize:10,color:C.muted,marginTop:3}}>ELO {t.min}+ • no active suspension • min days played</div>
                  </div>
                ))}
                <div style={{background:C.surface,borderRadius:8,padding:10,marginTop:4,fontSize:11,color:C.muted}}>
                  <span style={{color:C.orange,fontWeight:700}}>Elite Bonus:</span> Paid players attending all 5 weekdays earn +{ELO_PTS.daily} ELO at 8:45 PM on Jun 26 before rankings lock.
                </div>
              </Card>
            </div>

            {/* full board */}
            <Card accent={C.border}>
              <H2>Full Leaderboard</H2>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr>
                    <TH>#</TH><TH left>Player</TH><TH>Tier</TH><TH>ELO</TH>
                    <TH>Progress</TH><TH>W</TH><TH>L</TH><TH>Goals</TH>
                    <TH>Days</TH><TH>Cards</TH><TH>Prize</TH>
                  </tr></thead>
                  <tbody>
                    {ranked.map((p,i)=>{
                      const tier=getTier(p.elo);
                      const ok=isElig(p);
                      return (
                        <tr key={p.id} style={{background:i%2===0?C.surface+"33":"transparent"}}>
                          <TD center color={i<3?C.gold:C.muted} bold>#{i+1}</TD>
                          <TD>
                            <div style={{fontWeight:700}}>{p.name}</div>
                            {p.squad&&<div style={{fontSize:10,color:C.muted}}>{p.squad}</div>}
                          </TD>
                          <TD center><Badge tier={tier}/></TD>
                          <TD center bold color={tier.color}>{p.elo}</TD>
                          <TD><div style={{minWidth:110}}><EloBar elo={p.elo}/></div></TD>
                          <TD center color={C.accent} bold>{p.wins}</TD>
                          <TD center color={C.red}>{p.losses}</TD>
                          <TD center>{p.goals}</TD>
                          <TD center>
                            <DayDots days={p.days}/>
                            <div style={{fontSize:9,color:C.muted}}>{p.days.length}/6</div>
                          </TD>
                          <TD center small>
                            {p.yCards>0&&<span style={{color:"#fbbf24"}}>Y:{p.yCards}</span>}
                            {p.rCards>0&&<span style={{color:C.red}}> R:{p.rCards}</span>}
                            {p.yCards===0&&p.rCards===0&&<span style={{color:C.muted}}>✓ Clean</span>}
                          </TD>
                          <TD center>
                            {ok?<Pill color={C.accent}>✓ ${tier.prize}</Pill>:<span style={{color:C.muted,fontSize:11}}>—</span>}
                          </TD>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ══ PROJECTION ══ */}
        {tab==="projection"&&(
          <div>
            <H2 color={C.accent}>6-Day ELO Projection</H2>
            <div style={{background:C.surface,borderRadius:10,padding:"10px 14px",marginBottom:18,fontSize:12,color:C.muted,lineHeight:1.7}}>
              <strong style={{color:C.accent}}>Assumptions:</strong> Player plays exactly <strong style={{color:C.text}}>1 game per day for all 6 days</strong>, starts at 1500 ELO, completes daily feedback form (+{ELO_PTS.fb}/day), <strong style={{color:C.text}}>zero offenses</strong> (no cards), holds Elite Week Pass (+{ELO_PTS.daily} bonus on Friday). Sunday is free but still earns full ELO.
            </div>

            {/* scenario cards */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:14,marginBottom:24}}>
              {[
                {label:"Win Every Day (1st)",daily:ELO_PTS.p1,desc:"Best Case"},
                {label:"Runner-Up Daily (2nd)",daily:ELO_PTS.p2,desc:"Strong"},
                {label:"Bronze Daily (3rd)",daily:ELO_PTS.p3,desc:"Mid-Tier"},
                {label:"Participation (4th)",daily:ELO_PTS.p4,desc:"Base"},
              ].map(sc=>{
                const final=projElo(sc.daily);
                const tier=getTier(final);
                return (
                  <div key={sc.label} style={{background:tier.bg,border:`1px solid ${tier.color}55`,boxShadow:`0 0 24px ${tier.glow}`,borderRadius:16,padding:20}}>
                    <div style={{fontSize:11,color:C.muted,fontWeight:700,marginBottom:2}}>{sc.desc}</div>
                    <div style={{fontSize:13,color:C.text,fontWeight:700,marginBottom:10}}>{sc.label}</div>
                    <div style={{fontSize:42,fontWeight:900,color:tier.color,lineHeight:1}}>{final}</div>
                    <div style={{fontSize:12,color:C.muted,marginTop:4}}>+{final-1500} ELO over 6 days</div>
                    <div style={{marginTop:10}}><Badge tier={tier}/></div>
                    {tier.prize>0&&<div style={{marginTop:10,fontSize:18,fontWeight:900,color:tier.color}}>Prize: ${tier.prize.toLocaleString()}</div>}
                    <div style={{marginTop:10}}><EloBar elo={final}/></div>
                  </div>
                );
              })}
            </div>

            {/* day-by-day table */}
            <Card accent={C.border} style={{marginBottom:20}}>
              <H2>Day-by-Day ELO Breakdown (No Offenses, 1 Game/Day)</H2>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr>
                    <TH left>Day</TH>
                    {[{l:"1st Daily",d:ELO_PTS.p1},{l:"2nd Daily",d:ELO_PTS.p2},{l:"3rd Daily",d:ELO_PTS.p3},{l:"4th Daily",d:ELO_PTS.p4}].map(s=><TH key={s.l}>{s.l}</TH>)}
                  </tr></thead>
                  <tbody>
                    {DAYS.map((d,di)=>(
                      <tr key={d.date} style={{background:di%2===0?C.surface+"33":"transparent"}}>
                        <TD>
                          <div style={{fontWeight:700}}>{d.label}</div>
                          <Pill color={d.type==="free"?C.accent:d.type==="finale"?C.gold:C.blue}>
                            {d.type==="free"?"FREE":d.type==="finale"?"FINALE":"PAID"}
                          </Pill>
                        </TD>
                        {[ELO_PTS.p1,ELO_PTS.p2,ELO_PTS.p3,ELO_PTS.p4].map((daily,si)=>{
                          let elo=1500;
                          for(let x=0;x<=di;x++){ elo+=daily+ELO_PTS.fb; if(x===5)elo+=ELO_PTS.daily; }
                          const tier=getTier(elo);
                          const dayGain=daily+ELO_PTS.fb+(di===5?ELO_PTS.daily:0);
                          return (
                            <TD key={si} center>
                              <div style={{fontWeight:800,color:tier.color,fontSize:15}}>{elo}</div>
                              <div style={{fontSize:9,color:C.muted}}>+{dayGain} • {tier.emoji} {tier.name}</div>
                            </TD>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* what it takes */}
            <Card accent={C.purple+"44"}>
              <H2 color={C.purple}>What It Takes to Hit Each Tier in 6 Days</H2>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:10}}>
                {TIERS.filter(t=>t.prize>0).map(t=>{
                  const needed=t.min-1500;
                  const netNeeded=needed-ELO_PTS.daily-6*ELO_PTS.fb;
                  const perDay=Math.ceil(netNeeded/6);
                  const how=perDay>=ELO_PTS.p1?"Win every game + score goals":perDay>=ELO_PTS.p2?"Finish top 2 each day":perDay>=ELO_PTS.p3?"Finish top 3 each day":"Just show up and play";
                  return (
                    <div key={t.name} style={{background:t.bg,border:`1px solid ${t.color}44`,borderRadius:12,padding:"14px 16px"}}>
                      <div style={{fontSize:22}}>{t.emoji}</div>
                      <div style={{fontSize:14,fontWeight:800,color:t.color,marginTop:4}}>{t.name}</div>
                      <div style={{fontSize:11,color:C.muted,marginTop:4}}>Need +{needed} from 1500</div>
                      <div style={{fontSize:12,color:C.text,marginTop:6,lineHeight:1.5}}>{how}</div>
                      {t.prize>0&&<div style={{fontSize:16,fontWeight:900,color:t.color,marginTop:8}}>${t.prize} prize</div>}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* ══ SCHEDULE ══ */}
        {tab==="schedule"&&(
          <div>
            <H2 color={C.accent}>Beta Week Schedule — Jun 21–26 2026</H2>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:18}}>
              {DAYS.map(d=>{
                const col=d.type==="free"?C.accent:d.type==="finale"?C.gold:C.blue;
                return (
                  <button key={d.date} onClick={()=>setSelDay(d.date)} style={{padding:"10px 14px",borderRadius:10,border:`2px solid ${selDay===d.date?col:C.border}`,background:selDay===d.date?col+"22":C.surface,cursor:"pointer",color:selDay===d.date?col:C.muted,fontWeight:selDay===d.date?800:400}}>
                    <div style={{fontSize:14,fontWeight:800}}>{d.short}</div>
                    <div style={{fontSize:10,marginTop:2}}>{d.label.split(" ").slice(1).join(" ")}</div>
                    <div style={{fontSize:9,marginTop:2}}>{d.type==="free"?"FREE":d.type==="finale"?"FINALE":"PAID"}</div>
                  </button>
                );
              })}
            </div>
            {(()=>{
              const day=DAYS.find(d=>d.date===selDay)||DAYS[0];
              const isFree=day.type==="free";
              const isF=day.type==="finale";
              const col=isFree?C.accent:isF?C.gold:C.blue;
              return (
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,flexWrap:"wrap"}}>
                    <div style={{fontSize:18,fontWeight:800}}>{day.label}</div>
                    <Pill color={col}>{isFree?"FREE OPEN PLAY":isF?"GRAND FINALE":"PAID TOURNAMENT NIGHT"}</Pill>
                    <span style={{fontSize:12,color:C.muted}}>{day.slots.length} slots • 7 fields • 30 min/game</span>
                  </div>
                  {day.slots.map((slot,si)=>{
                    const phases=[
                      {t:"0:00",ph:"Lineup & Lock",c:C.muted},
                      {t:"+2:00",ph:"1st Half (14m)",c:C.blue},
                      {t:"+16:00",ph:"Half-Time Switch → W vs W / L vs L",c:C.orange},
                      {t:"+19:00",ph:"2nd Match (9m)",c:C.accent},
                      {t:"+28:00",ph:"ELO Log",c:C.purple},
                    ];
                    return (
                      <div key={slot} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:14,marginBottom:10}}>
                        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10,flexWrap:"wrap"}}>
                          <div style={{fontSize:20,fontWeight:900,color:col}}>{slot}</div>
                          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                            {FIELDS.map(f=>(
                              <span key={f.id} style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:6,background:f.type==="full"?C.accent+"22":C.blue+"22",color:f.type==="full"?C.accent:C.blue}}>
                                {f.name}: {isFree?"FREE":f.type==="full"?"$"+PRICE.sq7:"$"+PRICE.sq5}/team
                              </span>
                            ))}
                          </div>
                        </div>
                        <div style={{display:"flex",gap:0,overflowX:"auto",paddingBottom:4}}>
                          {phases.map((ph,pi)=>(
                            <div key={ph.t} style={{display:"flex",alignItems:"center"}}>
                              <div style={{background:ph.c+"22",border:`1px solid ${ph.c}44`,borderRadius:8,padding:"6px 10px",whiteSpace:"nowrap"}}>
                                <div style={{fontSize:10,fontWeight:700,color:ph.c}}>{ph.t}</div>
                                <div style={{fontSize:11,color:C.text}}>{ph.ph}</div>
                              </div>
                              {pi<phases.length-1&&<div style={{width:16,height:1,background:C.border,flexShrink:0}}/>}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  <Card accent={C.border} style={{marginTop:14}}>
                    <H2>Staff Assignment Sheet — {day.label}</H2>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(175px,1fr))",gap:10}}>
                      {FIELDS.map(f=>(
                        <div key={f.id} style={{background:C.surface,borderRadius:10,padding:12,border:`1px solid ${f.type==="full"?C.accent:C.blue}33`}}>
                          <div style={{fontWeight:800,color:f.type==="full"?C.accent:C.blue,marginBottom:6}}>{f.name} • {f.max}v{f.max}</div>
                          {["Referee:","Scorekeeper:","Ready by:","Teams:"].map(l=>(
                            <div key={l} style={{fontSize:10,color:C.muted,padding:"2px 0",borderBottom:`1px dashed ${C.border}`}}>{"☐"} {l} _______________</div>
                          ))}
                          <div style={{fontSize:10,color:C.orange,marginTop:6,fontWeight:700}}>Cost: ${175*(isFree?9:3)}/day</div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              );
            })()}
          </div>
        )}

        {/* ══ FINANCIALS ══ */}
        {tab==="financials"&&(()=>{
          const totalC=7*175*(9+15);
          const reg=players.length*PRICE.reg;
          const scenarios=[
            {l:"Sunday Free Only (loss leader)",fill:0,regN:40,sqN:0},
            {l:"25% Capacity Mon–Fri",fill:21,regN:50,sqN:21},
            {l:"50% Capacity (moderate)",fill:42,regN:60,sqN:42},
            {l:"75% Capacity (strong)",fill:63,regN:70,sqN:63},
            {l:"100% Full House",fill:84,regN:78,sqN:84},
          ];
          return (
            <div>
              <H2 color={C.accent}>Beta Week Financials</H2>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
                <Card accent={C.red+"44"}>
                  <H2 color={C.red}>Full Week Costs</H2>
                  {[
                    ["Field Sun (7×9h×$125)",7*9*125],
                    ["Field Mon–Fri (7×3h×5d×$125)",7*3*5*125],
                    ["Refs Sun (7×9×$30)",7*9*30],
                    ["Refs Mon–Fri (7×3×5×$30)",7*3*5*30],
                    ["Staff Sun (7×9h×$20)",7*9*20],
                    ["Staff Mon–Fri (7×3h×5d×$20)",7*3*5*20],
                  ].map(([k,v])=>(
                    <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${C.border}33`,fontSize:12}}>
                      <span style={{color:C.muted}}>{k}</span>
                      <span style={{fontWeight:700,color:C.red}}>${v.toLocaleString()}</span>
                    </div>
                  ))}
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:10,paddingTop:10,borderTop:`1px solid ${C.dim}`,fontSize:14,fontWeight:800}}>
                    <span>TOTAL</span><span style={{color:C.red}}>${totalC.toLocaleString()}</span>
                  </div>
                </Card>
                <Card accent={C.orange+"44"}>
                  <H2 color={C.orange}>Break-Even Per Slot</H2>
                  {[{title:"7v7 Full Field",price:PRICE.sq7,col:C.accent},{title:"5v5 Mini Field",price:PRICE.sq5,col:C.blue}].map(box=>(
                    <div key={box.title} style={{background:C.surface,borderRadius:10,padding:12,marginBottom:10}}>
                      <div style={{fontWeight:800,color:box.col,marginBottom:8,fontSize:13}}>{box.title}</div>
                      {[["Slot cost (field+ref+staff)","$175"],["Per team (÷2 teams)","$87.50"],["Break-even price","$90/team"],["Target price","$"+box.price+"/team"],["Profit per team","$"+(box.price-87.5).toFixed(2)]].map(([k,v])=>(
                        <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"3px 0",borderBottom:`1px solid ${C.border}33`}}>
                          <span style={{color:C.muted}}>{k}</span>
                          <span style={{color:k.includes("Target")||k.includes("Profit")?box.col:C.text,fontWeight:k.includes("Target")||k.includes("Profit")?800:400}}>{v}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </Card>
              </div>
              <Card accent={C.border}>
                <H2>Revenue Scenarios</H2>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse"}}>
                    <thead><tr>
                      {["Scenario","Slots","Reg Rev","Squad Rev","Total Rev","Total Cost","Net"].map(h=><TH key={h}>{h}</TH>)}
                    </tr></thead>
                    <tbody>
                      {scenarios.map((s,si)=>{
                        const rR=s.regN*PRICE.reg, sqR=s.sqN*175, tot=rR+sqR, net=tot-totalC;
                        return (
                          <tr key={s.l} style={{background:si%2===0?C.surface+"33":"transparent"}}>
                            <TD bold color={net>=0?C.accent:C.orange}>{s.l}</TD>
                            <TD center>{s.fill}</TD>
                            <TD center color={C.blue}>${rR.toLocaleString()}</TD>
                            <TD center color={C.accent}>${sqR.toLocaleString()}</TD>
                            <TD center bold>${tot.toLocaleString()}</TD>
                            <TD center color={C.red}>${totalC.toLocaleString()}</TD>
                            <TD center bold color={net>=0?C.accent:C.red}>{net>=0?"+":""}{net<0?"−":""}{"$"}{Math.abs(net).toLocaleString()}</TD>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={{marginTop:12,background:C.surface,borderRadius:10,padding:12,fontSize:12,color:C.muted,lineHeight:1.7}}>
                  <strong style={{color:C.accent}}>Beta Strategy:</strong> Sunday is free — collect $15 reg from 40+ players = $600 seed. Convert to paid squads Mon–Fri. Fill 50%+ of paid slots to cover week costs. <strong style={{color:C.orange}}>The real ROI is player data, proof of concept, and the pitch to investors.</strong>
                </div>
              </Card>
            </div>
          );
        })()}

        {/* ══ RULEBOOK ══ */}
        {tab==="rulebook"&&(
          <div>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>
              <H2 color={C.accent}>Liga Real Pro — Official Beta Rulebook</H2>
              <Pill color={C.muted}>v1.0 • June 2026</Pill>
            </div>
            {[
              {id:"toc",title:"TABLE OF CONTENTS",color:C.purple,toc:true,items:["1. Overview & Mission","2. Registration & Pricing","3. No-Sub Rule & Fields","4. 30-Min Match Structure","5. Match Rules","6. Speed-Up Rules","7. ELO Ranking System","8. Tier Classification","9. Discipline & Cards","10. Squad Rosters","11. Prize Pool","12. Staff Protocol","13. Code of Conduct","14. Beta Special Rules"]},
              {id:"1",title:"1. LEAGUE OVERVIEW & MISSION",color:C.accent,body:"Liga Real Pro is a technology-enabled, player-first indoor soccer league. Our mission is to find the backyard legends — players like Brian Gutierrez who have the skill but never had a stage.\n\nBETA WEEK: June 21–26, 2026 · Sofive Soccer Centers Chitown · 2343 S Throop St, Chicago IL\n\nValidate the format, ranking system, and player experience before the official March 2027 multi-facility launch."},
              {id:"2",title:"2. REGISTRATION & PRICING",color:C.accent,body:"ALL PLAYERS: $15 one-time registration fee.\n\nSunday June 21:          FREE open play — no game fee. ELO earned as normal.\nSolo paid (Mon–Fri):    $25/player/session\nSquad 7v7 full field:    $175/team/slot (7 players, NO substitutes)\nSquad 5v5 mini field:    $140/team/slot (5 players, NO substitutes)\nElite Week Pass:         $99/player — all 5 weekday sessions + +50 ELO bonus on Friday"},
              {id:"3",title:"3. NO-SUBSTITUTE RULE & FIELD FORMAT",color:C.blue,body:"FULL FIELDS (Field 1 & 2): 7v7 — exactly 7 players per team\nMINI FIELDS (Mini 1–5): 5v5 — exactly 5 players per team\n\nNO SUBSTITUTES. Rosters lock at the 2:00 mark. Missing players = forfeit.\nEjected player (red card) = team plays short. No replacement permitted.\n7v7 teams ONLY face 7v7 teams. 5v5 teams ONLY face 5v5 teams."},
              {id:"4",title:"4. 30-MINUTE MATCH STRUCTURE",color:C.orange,body:"0:00–2:00     LINE-UP & ROSTER LOCK (late arrivals not added after 2:00)\n2:00–16:00    FIRST HALF (14 minutes, continuous clock)\n16:00–19:00   HALF-TIME SWITCH (3 minutes)\n               → Winner first half faces OTHER FIELD's winner\n               → Loser first half faces OTHER FIELD's loser\n               → Single field: teams swap sides and rematch\n19:00–28:00   SECOND MATCH (9 minutes, championship + consolation simultaneous)\n28:00–30:00   SCORE REPORT — referee signs, staff logs ELO immediately\n30:00          NEXT SLOT BEGINS — no dead time between rounds"},
              {id:"5",title:"5. MATCH RULES",color:C.accent,body:"• Ball out of bounds: kick-in from sideline (no throw-ins)\n• No offside rule (Beta Week simplification)\n• Goals when ball fully crosses goal line\n• Fouls: direct free kick at point of foul\n• Penalty kick: deliberate handball in box or foul preventing clear goal\n• GK: different jersey/bib · max 5 seconds holding · no back-pass by foot\n• Tied first half: coin flip for half-time switch\n• Tied second match: both teams receive equal ELO for that placement"},
              {id:"6",title:"6. SPEED-UP RULES — THE CLOCK NEVER LIES",color:C.gold,body:"RULE 1 — NO DEAD TIME: Clock runs 2:00–28:00 continuously. Goals and fouls do NOT stop the clock.\nRULE 2 — 3-SECOND RESTART: After a goal, restart from center within 3 seconds. No celebrations that delay play.\nRULE 3 — 5-SECOND FREE KICK: Take within 5 seconds of referee placing ball. Delay = yellow card.\nRULE 4 — GK 5-SECOND RULE: Must distribute within 5 seconds. Holding longer = indirect free kick.\nRULE 5 — 2:00 KICKOFF HARD STOP: Referee blows whistle at exactly 2:00. Starts with or without late players.\nRULE 6 — HALF-TIME IS 3 MINUTES: Team not in position by 19:00 concedes 1-goal penalty in second match.\nRULE 7 — ZERO TOLERANCE: Argue on the field = immediate yellow card. Second delay = red card + ejection."},
              {id:"7",title:"7. ELO RANKING SYSTEM",color:C.blue,body:"Starting ELO: 1500 for all players\n\n1st Place (championship)    → +90 ELO\n2nd Place                   → +55 ELO\n3rd Place                   → +25 ELO\n4th / consolation loss      → +8 ELO\nNo-show (registered)        → −15 ELO\nGoal scored                 → +4 per goal\nAssist                      → +2 per assist\nGK Clean Sheet              → +6\nFeedback form (daily)       → +5\nElite daily bonus (paid, all 5 weekdays) → +50 on Friday June 26"},
              {id:"8",title:"8. TIER CLASSIFICATION",color:C.purple,body:"👑 PLATINO   ELO 1900+   Elite of the elite     $1,000 prize\n🥇 ORO       ELO 1700+   High performers        $400 prize\n🥈 PLATA     ELO 1500+   Competitive mid-tier   $150 prize\n🥉 BRONCE    ELO 1350+   Developing players     $50 prize\n⚽ ROOKIE    ELO 0–1349  Building foundation    No prize yet\n\nTiers update after every game. You can rise and fall daily."},
              {id:"9",title:"9. DISCIPLINE — CARDS, FINES & SUSPENSIONS",color:C.red,body:"YELLOW CARDS:\n  1st → Warning, $0\n  2nd → 1-game suspension + $35 makeup fee\n  3rd → 2-game suspension + $75 makeup fee\n  4th+ → 3-game suspension + $125 makeup fee\n\nRED CARDS:\n  1st → Ejected + 2-game suspension + $100 makeup fee\n  2nd → 4-game suspension + $200 makeup fee\n  3rd → BANNED from Beta Week, no prize eligibility\n\nMAKEUP GAME: Pay fee → 30-min 1v1 skills challenge → win/draw lifts suspension.\nActive suspension on June 26 = disqualified from Grand Prize."},
              {id:"10",title:"10. SQUAD ROSTER FORMATION",color:C.orange,body:"Individual: Staff auto-assigns you. $25/session or free Sunday.\nSquad 7v7: Pre-form exactly 7 players. $175/team/slot. All register ($15 each).\nSquad 5v5: Pre-form exactly 5 players. $140/team/slot. Same requirement.\n\nRules:\n• Exactly 7 or 5 at kickoff. Missing player at 2:00 = forfeit, no refund.\n• Cannot combine two registered squads.\n• Captain submits roster 15 min before slot."},
              {id:"11",title:"11. PRIZE POOL & ELIGIBILITY",color:C.gold,body:"GRAND PRIZE — Friday June 26 at 9:30 PM\n\n👑 PLATINO  $1,000  ELO 1900+ AND played all 6 days\n🥇 ORO      $400    ELO 1700+ AND played 4+ days\n🥈 PLATA    $150    ELO 1500+ AND played 3+ days\n🥉 BRONCE   $50     ELO 1350+ AND played 2+ days\nTOTAL: $1,600\n\nDisqualified if: active suspension · 3+ red cards · reg fee unpaid · score fraud.\nPrizes paid cash at ceremony. Must be present to collect."},
              {id:"12",title:"12. STAFF PROTOCOL — MANUAL ENTRY",color:C.blue,body:"BEFORE SLOT: Confirm check-in, collect fees, assign teams, set countdown timer.\nDURING GAME: Scorekeeper logs goals, assists, cards on paper scorecard.\nAT HALF-TIME (16:00): Collect scores, determine W/L, reassign fields, announce by 18:50.\nAFTER SLOT (28:00): Referee signs scorecard. Log result in tracker. Update leaderboard whiteboard.\nEND OF DAY: Reconcile cash. Flag disputes. Post leaderboard to group chat.\nJUN 26 FINALE: Apply +50 ELO daily bonus at 8:45 PM. Lock rankings 9:00 PM. Ceremony 9:30 PM."},
              {id:"13",title:"13. PLAYER CODE OF CONDUCT",color:C.accent,body:"RESPECT: No offensive language. First offense = red card + ejection. Second = permanent ban.\nFAIR PLAY: No deliberate injuries. Report scorecard errors immediately.\nCLOCK: Be ready at 2:00. The game starts without you.\nREFS: Referee decisions are final. Only captain addresses referee, calmly, between plays.\nSAFETY: Indoor soccer shoes required. Liability waiver signed at registration.\nSPORTSMANSHIP: Shake hands after every game.\nThis is where legends start. Act like one."},
              {id:"14",title:"14. BETA WEEK SPECIAL RULES",color:C.purple,body:"MANUAL PROCESS: Paper scorecards first → digital tracker is source of truth.\nFEEDBACK: 5-question form per session = +5 ELO/day.\nFREE SUNDAY: No game fees. $15 reg still collected. Full ELO earned. Counts as 1 of 6 prize days.\nFORMAT LOCK: 7v7 winners ONLY vs 7v7 winners. 5v5 ONLY vs 5v5. No cross-format matchups.\nDATA: Aggregated data used for platform development. Leaderboard is public by default."},
            ].map(sec=>(
              <div key={sec.id} style={{background:C.card,border:`1px solid ${sec.color}33`,borderRadius:14,padding:18,marginBottom:12}}>
                <div style={{fontWeight:800,color:sec.color,fontSize:14,marginBottom:10}}>{sec.title}</div>
                {sec.toc?(
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
                    {sec.items.map(item=>(
                      <div key={item} style={{fontSize:12,color:C.muted,padding:"4px 0",borderBottom:`1px solid ${C.border}33`}}>{item}</div>
                    ))}
                  </div>
                ):(
                  <pre style={{fontFamily:"inherit",fontSize:12,color:C.muted,lineHeight:1.85,margin:0,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{sec.body}</pre>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
