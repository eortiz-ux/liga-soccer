import { useState, useEffect } from 'react';
import { TEAMS, PLAYERS, SCHEDULE, C, getTier } from './data/tournament-data';
import { calculatePlayerStats } from './utils/tournament-utils';

// ── COMPONENTS ──
const Badge = ({ team }) => (
  <span style={{background:team.color+"22",color:team.color,border:`1px solid ${team.color}55`,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:800,whiteSpace:"nowrap"}}>
    {team.emoji} {team.name}
  </span>
);

const Pill = ({ color, children }) => (
  <span style={{background:color+"22",color,border:`1px solid ${color}44`,padding:"2px 9px",borderRadius:20,fontSize:10,fontWeight:700}}>{children}</span>
);

const Btn = ({ color=C.accent, onClick, children, style={}, disabled=false, outline=false }) => (
  <button onClick={onClick} disabled={disabled} style={{background:outline?"transparent":color,color:outline?color:color===C.accent?"#000":"#fff",border:outline?`1.5px solid ${color}`:"none",borderRadius:10,padding:"10px 18px",fontWeight:800,fontSize:13,cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.5:1,...style}}>{children}</button>
);

const Card = ({ children, accent=C.border, style={} }) => (
  <div style={{background:C.card,border:`1px solid ${accent}`,borderRadius:16,padding:20,...style}}>{children}</div>
);

const H2 = ({ color=C.accent, children, size=16 }) => (
  <div style={{fontWeight:800,color,fontSize:size,marginBottom:14}}>{children}</div>
);

const TH = ({ children, left }) => (
  <th style={{padding:"10px 12px",textAlign:left?"left":"center",fontSize:11,fontWeight:700,color:C.muted,borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap",background:C.surface}}>{children}</th>
);

const TD = ({ children, color, bold, center, small }) => (
  <td style={{padding:"9px 12px",fontSize:small?10:12,color:color||C.text,fontWeight:bold?700:400,textAlign:center?"center":"left",borderBottom:`1px solid ${C.border}22`}}>{children}</td>
);

// ── APP ──
export default function App() {
  const [mode, setMode] = useState('player'); // 'player' or 'referee'
  const [tab, setTab] = useState('home');
  const [games, setGames] = useState(SCHEDULE); // Games with results
  const [results, setResults] = useState([]); // { gameId, winner, goalsA, goalsB, timestamp }
  const [refereePIN, setRefereePIN] = useState('');
  const [authRefPIN, setAuthRefPIN] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('liga_tournament');
    if (saved) {
      const data = JSON.parse(saved);
      setResults(data.results || []);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('liga_tournament', JSON.stringify({ results }));
  }, [results]);

  function pop(msg, color = C.accent) {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, color }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2600);
  }

  function authenticateReferee() {
    if (refereePIN === '1234') {
      setAuthRefPIN('1234');
      pop('✓ Referee authenticated', C.accent);
    } else {
      pop('Invalid PIN', C.red);
    }
  }

  function submitGameResult(gameId, winner, goalsA, goalsB, cards = []) {
    if (!winner) {
      pop('Select a winner', C.red);
      return;
    }
    setResults(prev => [...prev, {
      gameId,
      winner,
      goalsA: parseInt(goalsA) || 0,
      goalsB: parseInt(goalsB) || 0,
      cards: cards || [],
      timestamp: new Date().toISOString()
    }]);
    pop('✓ Game logged', C.accent);
  }

  // Calculate standings from results
  function getStandings() {
    const standings = {};
    TEAMS.forEach(t => {
      standings[t.id] = { team: t, wins: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 };
    });
    results.forEach(r => {
      const game = games.find(g => g.id === r.gameId);
      if (!game) return;
      const teamA = standings[game.teamA];
      const teamB = standings[game.teamB];
      if (r.winner === game.teamA) {
        teamA.wins++;
        teamB.losses++;
      } else {
        teamB.wins++;
        teamA.losses++;
      }
      teamA.goalsFor += r.goalsA;
      teamA.goalsAgainst += r.goalsB;
      teamB.goalsFor += r.goalsB;
      teamB.goalsAgainst += r.goalsA;
    });
    return Object.values(standings)
      .sort((a, b) => b.wins - a.wins || b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst));
  }

  const standings = getStandings();
  const todayGames = games.filter(g => {
    const today = new Date().toISOString().split('T')[0];
    return g.date === today;
  });

  // ── PLAYER VIEW ──
  if (mode === 'player') {
    return (
      <div style={{fontFamily:"'Inter','Helvetica Neue',sans-serif",background:C.bg,minHeight:"100vh",color:C.text}}>
        <style>{`button:hover{filter:brightness(1.1)}`}</style>

        {/* TOASTS */}
        <div style={{position:"fixed",top:16,right:16,zIndex:9999,display:"flex",flexDirection:"column",gap:8}}>
          {toasts.map(t=>(
            <div key={t.id} style={{background:t.color,color:"#000",padding:"10px 18px",borderRadius:12,fontWeight:800,fontSize:13,boxShadow:"0 8px 30px #0008"}}>{t.msg}</div>
          ))}
        </div>

        {/* HEADER */}
        <div style={{background:"linear-gradient(135deg,#04080f 0%,#091525 60%,#04080f 100%)",borderBottom:`2px solid ${C.accent}`}}>
          <div style={{maxWidth:1200,margin:"0 auto",padding:"16px 20px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <div style={{fontSize:28,fontWeight:900,letterSpacing:-1}}>LIGA <span style={{color:C.accent}}>REAL</span> PRO</div>
                <div style={{fontSize:11,color:C.muted,marginTop:2}}>Tournament: Jun 29 - Jul 6, 2026</div>
              </div>
              <Btn color={C.orange} onClick={()=>setMode('referee')} style={{fontSize:12}}>🔧 Referee Mode</Btn>
            </div>
          </div>
          <div style={{maxWidth:1200,margin:"0 auto",display:"flex",overflowX:"auto",padding:"0 14px",gap:2}}>
            {[
              {id:"home",label:"🏠 Home"},
              {id:"leaderboard",label:"🏆 Leaderboard"},
              {id:"schedule",label:"📅 Schedule"},
              {id:"teams",label:"👥 Teams"},
              {id:"stats",label:"📊 Player Stats"},
            ].map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{background:"none",border:"none",cursor:"pointer",padding:"9px 12px",fontSize:12,fontWeight:tab===t.id?800:400,color:tab===t.id?C.accent:C.muted,whiteSpace:"nowrap",borderBottom:`2px solid ${tab===t.id?C.accent:"transparent"}`}}>{t.label}</button>
            ))}
          </div>
        </div>

        <div style={{maxWidth:1200,margin:"0 auto",padding:"24px 20px"}}>
          {/* HOME */}
          {tab==="home"&&(
            <div>
              <div style={{background:"linear-gradient(135deg,#0a1f0e,#0d1f2d,#1a0a00)",border:`1px solid ${C.accent}44`,borderRadius:20,padding:32,marginBottom:20}}>
                <Pill color={C.accent}>LIVE TOURNAMENT</Pill>
                <div style={{fontSize:30,fontWeight:900,lineHeight:1.1,margin:"12px 0"}}>Battle for Glory.<br/><span style={{color:C.accent}}>7 Days of Soccer.</span></div>
                <div style={{fontSize:13,color:C.muted,maxWidth:480,marginBottom:16}}>6 teams. 3 fields. Every goal counts. Watch the rankings shift in real-time.</div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:12,marginBottom:20}}>
                {[
                  {l:"Total Teams",v:TEAMS.length,c:C.accent},
                  {l:"Games Logged",v:results.length,c:C.blue},
                  {l:"Leader",v:standings[0]?.team.name.split(" ")[0]||"TBD",c:C.gold},
                  {l:"Days Left",v:7,c:C.orange},
                ].map(k=>(
                  <div key={k.l} style={{background:C.surface,border:`1px solid ${k.c}33`,borderRadius:12,padding:"14px 16px"}}>
                    <div style={{fontSize:20,fontWeight:900,color:k.c}}>{k.v}</div>
                    <div style={{fontSize:10,color:C.muted,marginTop:2}}>{k.l}</div>
                  </div>
                ))}
              </div>

              <Card accent={C.accent+"33"}>
                <H2>Current Top 3</H2>
                {standings.slice(0,3).map((s,i)=>(
                  <div key={s.team.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:`1px solid ${C.border}22`}}>
                    <div style={{fontSize:20,fontWeight:900,color:C.gold}}>#{i+1}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:700}}>{s.team.emoji} {s.team.name}</div>
                      <div style={{fontSize:11,color:C.muted}}>{s.wins}W - {s.losses}L</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:14,fontWeight:900,color:s.team.color}}>{s.goalsFor}:{s.goalsAgainst}</div>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          )}

          {/* LEADERBOARD */}
          {tab==="leaderboard"&&(
            <div>
              <H2 color={C.accent} size={18}>Live Standings</H2>
              <Card>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse"}}>
                    <thead><tr>
                      <TH>#</TH><TH left>Team</TH><TH center>Avg MMR</TH><TH center>W</TH><TH center>L</TH>
                      <TH center>Goals</TH><TH center>Diff</TH>
                    </tr></thead>
                    <tbody>
                      {standings.map((s,i)=>(
                        <tr key={s.team.id} style={{background:i%2===0?C.surface+"33":"transparent"}}>
                          <TD center bold color={i<3?C.gold:C.muted}>#{i+1}</TD>
                          <TD bold>{s.team.emoji} {s.team.name}</TD>
                          <TD center>{s.team.mmr}</TD>
                          <TD center bold color={C.accent}>{s.wins}</TD>
                          <TD center color={C.red}>{s.losses}</TD>
                          <TD center>{s.goalsFor}:{s.goalsAgainst}</TD>
                          <TD center bold color={s.goalsFor-s.goalsAgainst>0?C.accent:s.goalsFor-s.goalsAgainst<0?C.red:C.muted}>
                            {s.goalsFor-s.goalsAgainst>0?"+":""}{s.goalsFor-s.goalsAgainst}
                          </TD>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* SCHEDULE */}
          {tab==="schedule"&&(
            <div>
              <H2 color={C.accent} size={18}>Tournament Schedule</H2>
              <Card>
                {games.map(g=>{
                  const result = results.find(r=>r.gameId===g.id);
                  const teamA = TEAMS.find(t=>t.id===g.teamA);
                  const teamB = TEAMS.find(t=>t.id===g.teamB);
                  return (
                    <div key={g.id} style={{background:C.surface,border:`1px solid ${C.border}33`,borderRadius:12,padding:14,marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div>
                        <div style={{fontSize:12,color:C.muted,marginBottom:2}}>{g.date} {g.time}</div>
                        <div style={{fontSize:13,fontWeight:700}}>{teamA?.emoji} {teamA?.name} vs {teamB?.emoji} {teamB?.name}</div>
                        <Pill color={C.blue}>{g.field}</Pill>
                      </div>
                      {result?(
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:16,fontWeight:900,color:C.accent}}>{result.goalsA} - {result.goalsB}</div>
                          <Pill color={C.accent}>✓ Logged</Pill>
                        </div>
                      ):(
                        <Pill color={C.orange}>Pending</Pill>
                      )}
                    </div>
                  );
                })}
              </Card>
            </div>
          )}

          {/* TEAMS */}
          {tab==="teams"&&(
            <div>
              <H2 color={C.accent} size={18}>Team Rosters</H2>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
                {TEAMS.map(team=>(
                  <Card key={team.id} accent={team.color+"33"}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                      <div style={{fontSize:24}}>{team.emoji}</div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:800,fontSize:14,color:team.color}}>{team.name}</div>
                        <div style={{fontSize:10,color:C.muted}}>Avg MMR: {team.mmr}</div>
                      </div>
                    </div>
                    <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:8}}>PLAYERS</div>
                    {team.playerIds.map(pid=>{
                      const p = PLAYERS.find(x=>x.id===pid);
                      return <div key={pid} style={{fontSize:12,color:C.text,padding:"4px 0"}}>{p?.name}</div>;
                    })}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* PLAYER STATS */}
          {tab==="stats"&&(
            <div>
              <H2 color={C.accent} size={18}>Individual Player Stats</H2>
              <Card>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse"}}>
                    <thead><tr>
                      <TH left>Player</TH><TH left>Team</TH><TH center>Yellow Cards</TH><TH center>Red Cards</TH>
                    </tr></thead>
                    <tbody>
                      {PLAYERS.map((p,i)=>{
                        const team = TEAMS.find(t=>t.id===p.teamId);
                        const playerCards = results.flatMap(r=>r.cards||[]).filter(c=>c.playerId===p.id);
                        const yellows = playerCards.filter(c=>c.type==='yellow').length;
                        const reds = playerCards.filter(c=>c.type==='red').length;
                        return (
                          <tr key={p.id} style={{background:i%2===0?C.surface+"33":"transparent"}}>
                            <TD bold>{p.name}</TD>
                            <TD>{team?.emoji} {team?.name}</TD>
                            <TD center>{yellows > 0 ? <span style={{color:"#fbbf24",fontWeight:700}}>{"🟨".repeat(yellows)}</span> : "-"}</TD>
                            <TD center>{reds > 0 ? <span style={{color:C.red,fontWeight:700}}>{"🟥".repeat(reds)}</span> : "-"}</TD>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── REFEREE MODE ──
  if (!authRefPIN) {
    return (
      <div style={{fontFamily:"'Inter','Helvetica Neue',sans-serif",background:C.bg,minHeight:"100vh",color:C.text,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
        <div style={{fontSize:36,fontWeight:900,color:C.accent,letterSpacing:-1}}>LIGA <span style={{color:C.text}}>REAL</span> PRO</div>
        <div style={{fontSize:28,color:C.gold,marginBottom:12}}>🔐 Referee Authentication</div>
        <Card style={{width:320,maxWidth:"100%"}}>
          <H2 color={C.accent}>Enter Referee PIN</H2>
          <input type="password" value={refereePIN} onChange={e=>setRefereePIN(e.target.value)} onKeyDown={e=>e.key==="Enter"&&authenticateReferee()} placeholder="PIN" style={{width:"100%",padding:"12px",borderRadius:8,border:`1px solid ${C.border}`,background:C.surface,color:C.text,fontSize:14,marginBottom:16,outline:"none"}}/>
          <Btn onClick={authenticateReferee} style={{width:"100%"}}>Authenticate →</Btn>
          <div style={{fontSize:11,color:C.muted,marginTop:16,textAlign:"center"}}>Demo PIN: <strong>1234</strong></div>
        </Card>
      </div>
    );
  }

  // Referee dashboard
  return (
    <div style={{fontFamily:"'Inter','Helvetica Neue',sans-serif",background:C.bg,minHeight:"100vh",color:C.text}}>
      <style>{`button:hover{filter:brightness(1.1)}`}</style>

      {/* TOASTS */}
      <div style={{position:"fixed",top:16,right:16,zIndex:9999,display:"flex",flexDirection:"column",gap:8}}>
        {toasts.map(t=>(
          <div key={t.id} style={{background:t.color,color:"#000",padding:"10px 18px",borderRadius:12,fontWeight:800,fontSize:13,boxShadow:"0 8px 30px #0008"}}>{t.msg}</div>
        ))}
      </div>

      {/* HEADER */}
      <div style={{background:"linear-gradient(135deg,#04080f 0%,#091525 60%,#04080f 100%)",borderBottom:`2px solid ${C.orange}`}}>
        <div style={{maxWidth:1200,margin:"0 auto",padding:"16px 20px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{fontSize:28,fontWeight:900,letterSpacing:-1}}>🔧 <span style={{color:C.orange}}>REFEREE</span> DASH</div>
              <div style={{fontSize:11,color:C.muted,marginTop:2}}>Admin Mode - Live Game Logging</div>
            </div>
            <Btn color={C.muted} onClick={()=>{setAuthRefPIN(null);setMode('player')}} outline style={{fontSize:12}}>← Back to Player View</Btn>
          </div>
        </div>
      </div>

      <div style={{maxWidth:1200,margin:"0 auto",padding:"24px 20px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          {/* LOGGER */}
          <Card accent={C.orange+"33"}>
            <H2 color={C.orange}>Log Game Result</H2>
            <GameLogger games={games} results={results} onSubmit={(gid,w,ga,gb,c)=>submitGameResult(gid,w,ga,gb,c)}/>
          </Card>

          {/* STANDINGS */}
          <Card accent={C.accent+"33"}>
            <H2 color={C.accent}>Live Standings</H2>
            <div style={{overflowX:"auto",maxHeight:400,overflowY:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr>
                  <TH left>Team</TH><TH center>W-L</TH><TH center>Goals</TH>
                </tr></thead>
                <tbody>
                  {standings.map(s=>(
                    <tr key={s.team.id} style={{background:C.surface+"22"}}>
                      <TD bold>{s.team.emoji} {s.team.name}</TD>
                      <TD center>{s.wins}-{s.losses}</TD>
                      <TD center>{s.goalsFor}:{s.goalsAgainst}</TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* RECENT RESULTS */}
        <Card style={{marginTop:16}}>
          <H2>Recent Results</H2>
          {results.slice(-10).reverse().map(r=>{
            const game = games.find(g=>g.id===r.gameId);
            const teamA = TEAMS.find(t=>t.id===game?.teamA);
            const teamB = TEAMS.find(t=>t.id===game?.teamB);
            return (
              <div key={r.gameId+r.timestamp} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.border}33`,fontSize:12}}>
                <span>{teamA?.name} vs {teamB?.name}</span>
                <span style={{fontWeight:800,color:C.accent}}>{r.goalsA} - {r.goalsB}</span>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}

function GameLogger({ games, results, onSubmit }) {
  const [gameId, setGameId] = useState('');
  const [winner, setWinner] = useState('');
  const [goalsA, setGoalsA] = useState('0');
  const [goalsB, setGoalsB] = useState('0');
  const [cards, setCards] = useState([]);
  const [cardPlayer, setCardPlayer] = useState('');
  const [cardType, setCardType] = useState('yellow');

  const game = games.find(g=>g.id===gameId);
  const teamA = TEAMS.find(t=>t.id===game?.teamA);
  const teamB = TEAMS.find(t=>t.id===game?.teamB);
  const alreadyLogged = results.find(r=>r.gameId===gameId);

  const gamePlayerIds = game ? [...(teamA?.playerIds||[]),...(teamB?.playerIds||[])] : [];
  const gamePlayersWithTeam = gamePlayerIds.map(pid=>{
    const p = PLAYERS.find(x=>x.id===pid);
    const t = teamA?.playerIds.includes(pid) ? teamA : teamB;
    return { ...p, team: t };
  });

  function addCard() {
    if (!cardPlayer) return;
    setCards(c=>[...c,{playerId:cardPlayer,type:cardType}]);
    setCardPlayer('');
    setCardType('yellow');
  }

  function removeCard(idx) {
    setCards(c=>c.filter((_,i)=>i!==idx));
  }

  function handleSubmit() {
    onSubmit(gameId, winner, goalsA, goalsB, cards);
    // Reset
    setGameId('');
    setWinner('');
    setGoalsA('0');
    setGoalsB('0');
    setCards([]);
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div>
        <div style={{fontSize:11,color:C.muted,marginBottom:5,fontWeight:700}}>SELECT GAME</div>
        <select value={gameId} onChange={e=>{setGameId(e.target.value);setCards([]);}} style={{width:"100%",padding:"10px",borderRadius:8,border:`1px solid ${C.border}`,background:C.surface,color:C.text,fontSize:13,outline:"none"}}>
          <option value="">Choose a game...</option>
          {games.map(g=>{
            const ta=TEAMS.find(t=>t.id===g.teamA);
            const tb=TEAMS.find(t=>t.id===g.teamB);
            return <option key={g.id} value={g.id}>{g.date} {g.time} - {ta?.emoji} {ta?.name} vs {tb?.emoji} {tb?.name}</option>;
          })}
        </select>
      </div>

      {game&&(
        <>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:12}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>{teamA?.emoji} {teamA?.name} vs {teamB?.emoji} {teamB?.name}</div>
            {alreadyLogged&&<div style={{fontSize:11,color:C.orange,fontWeight:700}}>⚠ Already logged</div>}
          </div>

          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setWinner(game.teamA)} style={{flex:1,padding:"12px",borderRadius:8,cursor:"pointer",fontWeight:800,border:`2px solid ${winner===game.teamA?C.accent:C.border}`,background:winner===game.teamA?C.accent+"22":C.surface,color:winner===game.teamA?C.accent:C.muted}}>{teamA?.name} Win</button>
            <button onClick={()=>setWinner(game.teamB)} style={{flex:1,padding:"12px",borderRadius:8,cursor:"pointer",fontWeight:800,border:`2px solid ${winner===game.teamB?C.accent:C.border}`,background:winner===game.teamB?C.accent+"22":C.surface,color:winner===game.teamB?C.accent:C.muted}}>{teamB?.name} Win</button>
          </div>

          <div style={{display:"flex",gap:10}}>
            {[["Goals A",goalsA,setGoalsA],["Goals B",goalsB,setGoalsB]].map(([lbl,val,set])=>(
              <div key={lbl} style={{flex:1}}>
                <div style={{fontSize:11,color:C.muted,marginBottom:5}}>{lbl}</div>
                <input type="number" min="0" value={val} onChange={e=>set(e.target.value)} style={{width:"100%",padding:"10px",borderRadius:8,border:`1px solid ${C.border}`,background:C.surface,color:C.text,fontSize:14,outline:"none"}}/>
              </div>
            ))}
          </div>

          {/* Cards Section */}
          <div style={{background:C.surface+"44",borderRadius:10,padding:10}}>
            <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:8}}>CARDS (Yellow/Red)</div>
            <div style={{display:"flex",gap:6,marginBottom:8}}>
              <select value={cardPlayer} onChange={e=>setCardPlayer(e.target.value)} style={{flex:1,padding:"6px",borderRadius:6,border:`1px solid ${C.border}`,background:C.surface,color:C.text,fontSize:11,outline:"none"}}>
                <option value="">Select player...</option>
                {gamePlayersWithTeam.map(p=><option key={p.id} value={p.id}>{p.name} ({p.team?.name})</option>)}
              </select>
              <select value={cardType} onChange={e=>setCardType(e.target.value)} style={{padding:"6px 10px",borderRadius:6,border:`1px solid ${C.border}`,background:C.surface,color:C.text,fontSize:11,outline:"none"}}>
                <option value="yellow">🟨 Yellow</option>
                <option value="red">🟥 Red</option>
              </select>
              <button onClick={addCard} style={{padding:"6px 12px",borderRadius:6,background:C.accent,color:"#000",fontWeight:700,border:"none",cursor:"pointer",fontSize:11}}>+</button>
            </div>
            {cards.length>0&&(
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {cards.map((c,i)=>{
                  const p = PLAYERS.find(x=>x.id===c.playerId);
                  return (
                    <div key={i} style={{display:"flex",alignItems:"center",gap:4,background:c.type==='yellow'?"#fbbf2455":C.red+"55",padding:"2px 8px",borderRadius:6,fontSize:10}}>
                      <span>{p?.name} {c.type==='yellow'?'🟨':'🟥'}</span>
                      <button onClick={()=>removeCard(i)} style={{background:"none",border:"none",cursor:"pointer",color:"inherit",fontWeight:700}}>✕</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button onClick={handleSubmit} style={{width:"100%",padding:"12px",borderRadius:8,background:C.accent,color:"#000",fontWeight:800,border:"none",cursor:"pointer",fontSize:13}}>Submit Result ✓</button>
        </>
      )}
    </div>
  );
}
