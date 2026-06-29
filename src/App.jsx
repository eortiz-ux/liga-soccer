import { useState, useEffect } from 'react';
import { TEAMS, PLAYERS, SCHEDULE, C } from './data/tournament-data';

const WEBHOOK_URL = process.env.REACT_APP_SHEETS_WEBHOOK ||
  'https://script.google.com/macros/s/AKfycbyLd5F6y1-bA_UUAgv84Ou_BZxL9qGWW29rJTzaJsR8okJqUoFp9ORF3n7NQwbX9Y9r/exec';

async function postToSheets(payload) {
  if (!WEBHOOK_URL) return;
  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.warn('Sheets sync failed (data saved locally):', e.message);
  }
}

const R = { card: 16, pill: 20, btn: 10, input: 8 };

const Pill = ({ color, children }) => (
  <span style={{
    background: color + '22', color,
    border: `1px solid ${color}44`, padding: '2px 10px',
    borderRadius: R.pill, fontSize: 11, fontWeight: 700, display: 'inline-block'
  }}>{children}</span>
);

const Btn = ({ color = C.accent, onClick, children, style = {}, disabled = false, outline = false, full = false }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: outline ? 'transparent' : color,
    color: outline ? color : color === C.accent ? '#000' : '#fff',
    border: outline ? `1.5px solid ${color}` : 'none',
    borderRadius: R.btn, padding: '11px 20px',
    fontWeight: 800, fontSize: 13, cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1, width: full ? '100%' : 'auto',
    transition: 'all .15s', ...style
  }}>{children}</button>
);

const Card = ({ children, accent = C.border, style = {} }) => (
  <div style={{
    background: C.card, border: `1px solid ${accent}`,
    borderRadius: R.card, padding: 20, ...style
  }}>{children}</div>
);

const TH = ({ children, left }) => (
  <th style={{
    padding: '10px 12px', textAlign: left ? 'left' : 'center',
    fontSize: 11, fontWeight: 700, color: C.muted,
    borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap',
    background: C.surface
  }}>{children}</th>
);

const TD = ({ children, color, bold, center, small }) => (
  <td style={{
    padding: '9px 12px', fontSize: small ? 10 : 13,
    color: color || C.text, fontWeight: bold ? 700 : 400,
    textAlign: center ? 'center' : 'left',
    borderBottom: `1px solid ${C.border}22`
  }}>{children}</td>
);

const StatBox = ({ label, value, color }) => (
  <div style={{ background: C.surface, border: `1px solid ${color}33`, borderRadius: 12, padding: '16px 18px' }}>
    <div style={{ fontSize: 22, fontWeight: 900, color }}>{value}</div>
    <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{label}</div>
  </div>
);

export default function App() {
  const [mode, setMode] = useState('player');
  const [tab, setTab] = useState('home');
  const [results, setResults] = useState([]);
  const [refereePIN, setRefereePIN] = useState('');
  const [authed, setAuthed] = useState(false);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('liga_tournament');
    if (saved) {
      try { setResults(JSON.parse(saved).results || []); } catch (_) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('liga_tournament', JSON.stringify({ results }));
  }, [results]);

  function pop(msg, color = C.accent) {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, color }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }

  function login() {
    if (refereePIN === '1234') { setAuthed(true); pop('Access granted', C.accent); }
    else pop('Invalid PIN', C.red);
  }

  function logout() { setAuthed(false); setRefereePIN(''); setMode('player'); }

  async function submitGameResult(gameId, winner, goalsA, goalsB, cards = []) {
    if (!winner) { pop('Select a winner', C.red); return; }
    const entry = { gameId, winner, goalsA: parseInt(goalsA) || 0, goalsB: parseInt(goalsB) || 0, cards, timestamp: new Date().toISOString() };
    setResults(prev => [...prev, entry]);
    const game = SCHEDULE.find(g => g.id === gameId);
    await postToSheets({ gameId, teamAId: game?.teamA, teamBId: game?.teamB, goalsA: entry.goalsA, goalsB: entry.goalsB, winner, cards });
    pop('Game logged' + (WEBHOOK_URL ? ' & synced' : ''), C.accent);
  }

  function getStandings() {
    const s = {};
    TEAMS.forEach(t => { s[t.id] = { team: t, wins: 0, losses: 0, gf: 0, ga: 0, pts: 0 }; });
    results.forEach(r => {
      const game = SCHEDULE.find(g => g.id === r.gameId);
      if (!game) return;
      const a = s[game.teamA], b = s[game.teamB];
      if (!a || !b) return;
      a.gf += r.goalsA; a.ga += r.goalsB;
      b.gf += r.goalsB; b.ga += r.goalsA;
      if (r.winner === game.teamA) { a.wins++; a.pts += 3; b.losses++; }
      else { b.wins++; b.pts += 3; a.losses++; }
    });
    return Object.values(s).sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga));
  }

  const standings = getStandings();
  const today = new Date().toISOString().split('T')[0];

  const Toasts = () => (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{ background: t.color, color: '#000', padding: '10px 18px', borderRadius: 12, fontWeight: 800, fontSize: 13, boxShadow: '0 8px 32px #0009' }}>{t.msg}</div>
      ))}
    </div>
  );

  if (mode === 'referee' && !authed) {
    return (
      <div style={{ fontFamily: "'Inter','Helvetica Neue',sans-serif", background: C.bg, minHeight: '100vh', color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`* { box-sizing: border-box; } button:hover:not(:disabled) { filter: brightness(1.12); }`}</style>
        <Toasts />
        <div style={{ width: 360, maxWidth: '90vw' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 12, color: C.muted, letterSpacing: 3, fontWeight: 700, marginBottom: 8 }}>LIGA REAL PRO</div>
            <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1 }}>Referee <span style={{ color: C.orange }}>Access</span></div>
          </div>
          <Card accent={C.orange + '44'}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 6, letterSpacing: .5 }}>REFEREE PIN</div>
            <input type="password" value={refereePIN} onChange={e => setRefereePIN(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()} placeholder="••••"
              style={{ width: '100%', padding: '13px 14px', borderRadius: R.input, border: `1.5px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 22, marginBottom: 14, outline: 'none', letterSpacing: 8, textAlign: 'center', boxSizing: 'border-box' }} />
            <Btn full color={C.orange} onClick={login}>Authenticate →</Btn>
            <button onClick={() => setMode('player')} style={{ width: '100%', marginTop: 10, background: 'none', border: 'none', color: C.muted, fontSize: 12, cursor: 'pointer', padding: 8 }}>← Back to Player View</button>
          </Card>
        </div>
      </div>
    );
  }

  if (mode === 'player') {
    const TABS = [
      { id: 'home', label: 'Home' }, { id: 'leaderboard', label: 'Standings' },
      { id: 'schedule', label: 'Schedule' }, { id: 'teams', label: 'Teams' }, { id: 'stats', label: 'Player Stats' },
    ];
    return (
      <div style={{ fontFamily: "'Inter','Helvetica Neue',sans-serif", background: C.bg, minHeight: '100vh', color: C.text }}>
        <style>{`* { box-sizing: border-box; } button:hover:not(:disabled) { filter: brightness(1.12); }`}</style>
        <Toasts />
        <div style={{ background: 'linear-gradient(160deg,#060d18 0%,#0a1628 100%)', borderBottom: `2px solid ${C.accent}` }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>LIGA <span style={{ color: C.accent }}>REAL</span> PRO</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>Jun 29 – Jul 6, 2026 · Live Tournament</div>
            </div>
            <Btn color={C.orange} onClick={() => setMode('referee')} style={{ fontSize: 12, padding: '9px 16px' }}>🔧 Referee</Btn>
          </div>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', overflowX: 'auto', padding: '0 16px' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '10px 14px', fontSize: 13, fontWeight: tab === t.id ? 700 : 400, color: tab === t.id ? C.accent : C.muted, whiteSpace: 'nowrap', borderBottom: `2px solid ${tab === t.id ? C.accent : 'transparent'}` }}>{t.label}</button>
            ))}
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
          {tab === 'home' && (
            <div>
              <div style={{ background: 'linear-gradient(135deg,#0a1f0e,#091525,#150a00)', border: `1px solid ${C.accent}33`, borderRadius: 20, padding: '28px', marginBottom: 20 }}>
                <Pill color={C.accent}>LIVE · DAY 1 OF 7</Pill>
                <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.15, margin: '12px 0 8px' }}>Battle for Glory.<br /><span style={{ color: C.accent }}>7 Days of Soccer.</span></div>
                <div style={{ fontSize: 13, color: C.muted, maxWidth: 440 }}>6 squads. 3 fields. Every goal shifts the standings.</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 12, marginBottom: 20 }}>
                <StatBox label="Teams" value={TEAMS.length} color={C.accent} />
                <StatBox label="Games Logged" value={results.length} color={C.blue} />
                <StatBox label="Total Games" value={SCHEDULE.length} color={C.orange} />
                <StatBox label="Leader" value={standings[0]?.team.emoji + ' ' + (standings[0]?.team.name.split(' ')[0] || 'TBD')} color={C.gold} />
              </div>
              <Card accent={C.accent + '33'}>
                <div style={{ fontWeight: 800, color: C.accent, fontSize: 15, marginBottom: 14 }}>Top 3 Teams</div>
                {standings.slice(0, 3).map((s, i) => (
                  <div key={s.team.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: `1px solid ${C.border}22` }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: [C.gold, C.muted, '#cd7f32'][i], width: 28, textAlign: 'center' }}>#{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{s.team.emoji} {s.team.name}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{s.pts} pts · {s.wins}W {s.losses}L</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 15, fontWeight: 900, color: s.team.color }}>{s.gf}:{s.ga}</div>
                    </div>
                  </div>
                ))}
                {results.length === 0 && <div style={{ fontSize: 12, color: C.muted, textAlign: 'center', padding: '16px 0' }}>No games logged yet</div>}
              </Card>
            </div>
          )}

          {tab === 'leaderboard' && (
            <div>
              <div style={{ fontWeight: 800, color: C.accent, fontSize: 18, marginBottom: 14 }}>Live Standings</div>
              <Card>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr><TH>#</TH><TH left>Team</TH><TH>MMR</TH><TH>Pts</TH><TH>W</TH><TH>L</TH><TH>GF</TH><TH>GA</TH><TH>+/-</TH></tr></thead>
                    <tbody>
                      {standings.map((s, i) => {
                        const diff = s.gf - s.ga;
                        return (
                          <tr key={s.team.id} style={{ background: i % 2 === 0 ? C.surface + '44' : 'transparent' }}>
                            <TD center bold color={i < 3 ? C.gold : C.muted}>#{i + 1}</TD>
                            <TD bold>{s.team.emoji} {s.team.name}</TD>
                            <TD center small>{s.team.mmr}</TD>
                            <TD center bold color={C.accent}>{s.pts}</TD>
                            <TD center bold color={C.accent}>{s.wins}</TD>
                            <TD center color={C.red}>{s.losses}</TD>
                            <TD center>{s.gf}</TD>
                            <TD center>{s.ga}</TD>
                            <TD center bold color={diff > 0 ? C.accent : diff < 0 ? C.red : C.muted}>{diff > 0 ? '+' : ''}{diff}</TD>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {tab === 'schedule' && (
            <div>
              <div style={{ fontWeight: 800, color: C.accent, fontSize: 18, marginBottom: 14 }}>Tournament Schedule</div>
              {SCHEDULE.map(g => {
                const result = results.find(r => r.gameId === g.id);
                const tA = TEAMS.find(t => t.id === g.teamA);
                const tB = TEAMS.find(t => t.id === g.teamB);
                const isToday = g.date === today;
                return (
                  <div key={g.id} style={{ background: isToday ? C.accent + '08' : C.surface, border: `1px solid ${isToday ? C.accent + '44' : C.border + '44'}`, borderRadius: 12, padding: '14px 16px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: C.muted }}>{g.date} · {g.time}</span>
                        <Pill color={C.blue}>{g.field}</Pill>
                        {isToday && <Pill color={C.accent}>Today</Pill>}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{tA?.emoji} {tA?.name} <span style={{ color: C.muted, fontWeight: 400 }}>vs</span> {tB?.emoji} {tB?.name}</div>
                    </div>
                    {result ? (
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 20, fontWeight: 900, color: C.accent }}>{result.goalsA} – {result.goalsB}</div>
                        <Pill color={C.accent}>Final</Pill>
                      </div>
                    ) : <Pill color={C.orange}>Upcoming</Pill>}
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'teams' && (
            <div>
              <div style={{ fontWeight: 800, color: C.accent, fontSize: 18, marginBottom: 14 }}>Team Rosters</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
                {TEAMS.map(team => {
                  const ts = standings.find(s => s.team.id === team.id);
                  return (
                    <Card key={team.id} accent={team.color + '44'}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <div style={{ fontSize: 26 }}>{team.emoji}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: 14, color: team.color }}>{team.name}</div>
                          <div style={{ fontSize: 11, color: C.muted }}>MMR {team.mmr} · {team.field}</div>
                        </div>
                        {ts && <div style={{ textAlign: 'right' }}><div style={{ fontSize: 13, fontWeight: 900, color: C.accent }}>{ts.pts} pts</div><div style={{ fontSize: 10, color: C.muted }}>{ts.wins}W {ts.losses}L</div></div>}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 8, letterSpacing: 1 }}>ROSTER</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {team.playerIds.map(pid => {
                          const p = PLAYERS.find(x => x.id === pid);
                          return (
                            <div key={pid} style={{ fontSize: 13, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: team.color, flexShrink: 0 }} />
                              {p?.name}
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'stats' && (
            <div>
              <div style={{ fontWeight: 800, color: C.accent, fontSize: 18, marginBottom: 14 }}>Player Stats</div>
              <Card>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr><TH left>Player</TH><TH left>Team</TH><TH>🟨 Yellows</TH><TH>🟥 Reds</TH></tr></thead>
                    <tbody>
                      {PLAYERS.map((p, i) => {
                        const team = TEAMS.find(t => t.id === p.teamId);
                        const pCards = results.flatMap(r => r.cards || []).filter(c => c.playerId === p.id);
                        const yellows = pCards.filter(c => c.type === 'yellow').length;
                        const reds = pCards.filter(c => c.type === 'red').length;
                        return (
                          <tr key={p.id} style={{ background: i % 2 === 0 ? C.surface + '44' : 'transparent' }}>
                            <TD bold>{p.name}</TD>
                            <TD><span style={{ color: team?.color }}>{team?.emoji}</span> {team?.name}</TD>
                            <TD center>{yellows > 0 ? <span style={{ color: '#fbbf24', fontWeight: 700 }}>🟨 {yellows}</span> : <span style={{ color: C.muted }}>—</span>}</TD>
                            <TD center>{reds > 0 ? <span style={{ color: C.red, fontWeight: 700 }}>🟥 {reds}</span> : <span style={{ color: C.muted }}>—</span>}</TD>
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

  // REFEREE DASHBOARD
  return (
    <div style={{ fontFamily: "'Inter','Helvetica Neue',sans-serif", background: C.bg, minHeight: '100vh', color: C.text }}>
      <style>{`* { box-sizing: border-box; } button:hover:not(:disabled) { filter: brightness(1.12); }`}</style>
      <Toasts />
      <div style={{ background: 'linear-gradient(160deg,#0d0a00 0%,#1a1200 100%)', borderBottom: `2px solid ${C.orange}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: 2, fontWeight: 700 }}>LIGA REAL PRO</div>
            <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.5 }}><span style={{ color: C.orange }}>Referee</span> Dashboard</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {WEBHOOK_URL && <Pill color={C.accent}>● Sheets Connected</Pill>}
            <Btn color={C.muted} onClick={logout} outline style={{ fontSize: 12, padding: '8px 14px' }}>Sign Out</Btn>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.3fr) minmax(0,1fr)', gap: 16 }}>
          <Card accent={C.orange + '44'}>
            <div style={{ fontWeight: 800, color: C.orange, fontSize: 15, marginBottom: 16 }}>Log Game Result</div>
            <GameLogger games={SCHEDULE} results={results} onSubmit={submitGameResult} />
          </Card>
          <Card accent={C.accent + '33'}>
            <div style={{ fontWeight: 800, color: C.accent, fontSize: 15, marginBottom: 16 }}>Live Standings</div>
            <div style={{ overflowY: 'auto', maxHeight: 420 }}>
              {standings.map((s, i) => (
                <div key={s.team.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: `1px solid ${C.border}22` }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: i < 3 ? C.gold : C.muted, width: 22 }}>#{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{s.team.emoji} {s.team.name}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>{s.pts} pts · {s.wins}W {s.losses}L</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: s.team.color }}>{s.gf}:{s.ga}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {results.length > 0 && (
          <Card style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 14 }}>Recent Results</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {results.slice(-10).reverse().map((r, i) => {
                const game = SCHEDULE.find(g => g.id === r.gameId);
                const tA = TEAMS.find(t => t.id === game?.teamA);
                const tB = TEAMS.find(t => t.id === game?.teamB);
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: C.surface, borderRadius: 8, fontSize: 13, flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ color: C.muted, fontSize: 11 }}>{game?.date} · {game?.field}</span>
                    <span style={{ fontWeight: 600 }}>{tA?.emoji} {tA?.name} vs {tB?.emoji} {tB?.name}</span>
                    <span style={{ fontWeight: 900, color: C.accent, fontSize: 15 }}>{r.goalsA} – {r.goalsB}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
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

  const game = games.find(g => g.id === gameId);
  const teamA = TEAMS.find(t => t.id === game?.teamA);
  const teamB = TEAMS.find(t => t.id === game?.teamB);
  const alreadyLogged = results.find(r => r.gameId === gameId);
  const gamePlayers = game
    ? [...(teamA?.playerIds || []), ...(teamB?.playerIds || [])].map(pid => ({ ...PLAYERS.find(x => x.id === pid), team: teamA?.playerIds.includes(pid) ? teamA : teamB }))
    : [];

  function handleSubmit() {
    onSubmit(gameId, winner, goalsA, goalsB, cards);
    setGameId(''); setWinner(''); setGoalsA('0'); setGoalsB('0'); setCards([]);
  }

  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: R.input, border: `1.5px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 5, letterSpacing: .5 }}>SELECT GAME</div>
        <select value={gameId} onChange={e => { setGameId(e.target.value); setCards([]); setWinner(''); }} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Choose a matchup...</option>
          {games.map(g => {
            const tA = TEAMS.find(t => t.id === g.teamA);
            const tB = TEAMS.find(t => t.id === g.teamB);
            const logged = results.find(r => r.gameId === g.id);
            return <option key={g.id} value={g.id}>{logged ? '✓ ' : ''}{g.date} {g.time} · {tA?.name} vs {tB?.name}</option>;
          })}
        </select>
      </div>

      {game && (
        <>
          {alreadyLogged && (
            <div style={{ background: C.orange + '22', border: `1px solid ${C.orange}44`, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: C.orange, fontWeight: 700 }}>
              ⚠ Already logged — submitting again will create a duplicate
            </div>
          )}

          <div>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 6, letterSpacing: .5 }}>WINNER</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ team: teamA, id: game.teamA }, { team: teamB, id: game.teamB }].map(({ team, id }) => (
                <button key={id} onClick={() => setWinner(id)} style={{ flex: 1, padding: '11px 8px', borderRadius: 8, cursor: 'pointer', fontWeight: 800, fontSize: 12, border: `2px solid ${winner === id ? team.color : C.border}`, background: winner === id ? team.color + '22' : C.surface, color: winner === id ? team.color : C.muted }}>
                  {team?.emoji} {team?.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 6, letterSpacing: .5 }}>GOALS</div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: teamA?.color, fontWeight: 700, marginBottom: 4 }}>{teamA?.name}</div>
                <input type="number" min="0" value={goalsA} onChange={e => setGoalsA(e.target.value)} style={{ ...inputStyle, textAlign: 'center', fontSize: 24, fontWeight: 900 }} />
              </div>
              <div style={{ color: C.muted, fontWeight: 900, fontSize: 20, paddingTop: 20 }}>–</div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: teamB?.color, fontWeight: 700, marginBottom: 4 }}>{teamB?.name}</div>
                <input type="number" min="0" value={goalsB} onChange={e => setGoalsB(e.target.value)} style={{ ...inputStyle, textAlign: 'center', fontSize: 24, fontWeight: 900 }} />
              </div>
            </div>
          </div>

          <div style={{ background: C.surface + '88', border: `1px solid ${C.border}44`, borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 10, letterSpacing: .5 }}>CARDS (OPTIONAL)</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <select value={cardPlayer} onChange={e => setCardPlayer(e.target.value)} style={{ ...inputStyle, flex: 1, fontSize: 12, padding: '8px 10px', cursor: 'pointer' }}>
                <option value="">Select player...</option>
                {gamePlayers.map(p => <option key={p.id} value={p.id}>{p.name} · {p.team?.name}</option>)}
              </select>
              <select value={cardType} onChange={e => setCardType(e.target.value)} style={{ ...inputStyle, width: 'auto', fontSize: 12, padding: '8px 10px', cursor: 'pointer' }}>
                <option value="yellow">🟨 Yellow</option>
                <option value="red">🟥 Red</option>
              </select>
              <button onClick={() => { if (!cardPlayer) return; setCards(c => [...c, { playerId: cardPlayer, type: cardType }]); setCardPlayer(''); setCardType('yellow'); }} style={{ padding: '8px 14px', borderRadius: 8, background: C.accent, color: '#000', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: 14 }}>+</button>
            </div>
            {cards.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {cards.map((c, i) => {
                  const p = PLAYERS.find(x => x.id === c.playerId);
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, background: c.type === 'yellow' ? '#fbbf2433' : C.red + '33', border: `1px solid ${c.type === 'yellow' ? '#fbbf24' : C.red}44`, padding: '3px 10px', borderRadius: 6, fontSize: 11 }}>
                      {c.type === 'yellow' ? '🟨' : '🟥'} {p?.name}
                      <button onClick={() => setCards(c => c.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontWeight: 700, padding: '0 2px' }}>✕</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button onClick={handleSubmit} disabled={!winner} style={{ width: '100%', padding: '13px', borderRadius: 10, background: winner ? C.orange : C.border, color: winner ? '#000' : C.muted, fontWeight: 900, border: 'none', cursor: winner ? 'pointer' : 'not-allowed', fontSize: 14 }}>
            Submit Result ✓
          </button>
        </>
      )}
    </div>
  );
}
