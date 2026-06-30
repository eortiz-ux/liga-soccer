import { useState, useEffect } from 'react';
import { TEAMS, PLAYERS, SCHEDULE, C } from './data/tournament-data';

// ─── Config ──────────────────────────────────────────────────────────────────
const WEBHOOK_URL = process.env.REACT_APP_SHEETS_WEBHOOK ||
  'https://script.google.com/macros/s/AKfycbyLd5F6y1-bA_UUAgv84Ou_BZxL9qGWW29rJTzaJsR8okJqUoFp9ORF3n7NQwbX9Y9r/exec';

const REFEREE_PIN = '1234';

const TIERS = [
  { name: 'DIAMOND', min: 1600, color: '#a78bfa', emoji: '💎' },
  { name: 'GOLD',    min: 1400, color: '#f0c040', emoji: '🥇' },
  { name: 'SILVER',  min: 1200, color: '#94a3b8', emoji: '🥈' },
  { name: 'BRONZE',  min: 0,    color: '#cd7f32', emoji: '🥉' },
];
const getTier = mmr => TIERS.find(t => mmr >= t.min) || TIERS[TIERS.length - 1];

const PRIZE_POOL = [
  { place: '1st', prize: '$500', color: '#f0c040', emoji: '🥇' },
  { place: '2nd', prize: '$200', color: '#94a3b8', emoji: '🥈' },
  { place: '3rd', prize: '$100', color: '#cd7f32', emoji: '🥉' },
  { place: 'Top Scorer', prize: '$50', color: '#22c55e', emoji: '⚽' },
  { place: 'Best GK', prize: '$50', color: '#3b82f6', emoji: '🧤' },
];

const RULES = [
  { title: 'Team Size', body: '5 players per team. Teams are drafted each session from checked-in players.' },
  { title: 'Game Duration', body: '25-minute games. 3 points for a win, 1 for a draw, 0 for a loss.' },
  { title: 'MMR System', body: 'Win: +15 MMR. Draw: ±0. Loss: -10 MMR. Goal differential adjusts by ±1 per goal.' },
  { title: 'Yellow Cards', body: 'Yellow card = -15 MMR. Suspended from next game.' },
  { title: 'Red Cards', body: 'Red card = -25 MMR. Banned for 2 sessions.' },
  { title: 'Priority Drafting', body: 'Pre-registered groups (Duos, Trios, Quads) are drafted together first.' },
  { title: 'Check-In', body: 'Players must check in each session to be drafted. No check-in = no game.' },
  { title: 'Fair Play', body: 'Sportsmanship is mandatory. Referee decisions are final.' },
];

// ─── Sheets ──────────────────────────────────────────────────────────────────
async function postToSheets(payload) {
  if (!WEBHOOK_URL) return { ok: false };
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });
    return { ok: res.ok };
  } catch (e) {
    console.warn('Sheets offline, saved locally:', e.message);
    return { ok: false };
  }
}

// ─── Design System ───────────────────────────────────────────────────────────
const R = { card: 16, pill: 20, btn: 10, input: 8 };

const Pill = ({ color, children, sm }) => (
  <span style={{
    background: color + '22', color, border: `1px solid ${color}44`,
    padding: sm ? '1px 8px' : '2px 10px', borderRadius: R.pill,
    fontSize: sm ? 10 : 11, fontWeight: 700, display: 'inline-block', whiteSpace: 'nowrap'
  }}>{children}</span>
);

const Btn = ({ color = C.accent, onClick, children, style = {}, disabled = false, outline = false, full = false, sm = false }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: outline ? 'transparent' : color,
    color: outline ? color : '#fff',
    border: outline ? `1.5px solid ${color}` : 'none',
    borderRadius: R.btn, padding: sm ? '8px 14px' : '11px 20px',
    fontWeight: 800, fontSize: sm ? 12 : 13, cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1, width: full ? '100%' : 'auto',
    transition: 'all .15s', ...style
  }}>{children}</button>
);

const Card = ({ children, accent = C.border, style = {}, onClick }) => (
  <div onClick={onClick} style={{
    background: C.card, border: `1px solid ${accent}`,
    borderRadius: R.card, padding: 20, cursor: onClick ? 'pointer' : 'default', ...style
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

const StatBox = ({ label, value, color, sub }) => (
  <div style={{ background: C.surface, border: `1px solid ${color}33`, borderRadius: 12, padding: '14px 16px' }}>
    <div style={{ fontSize: 22, fontWeight: 900, color }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{sub}</div>}
    <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{label}</div>
  </div>
);

const Input = ({ label, value, onChange, type = 'text', placeholder, required, extra = {} }) => (
  <div>
    {label && <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 5, letterSpacing: .5 }}>{label}{required ? ' *' : ''}</div>}
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
      style={{ width: '100%', padding: '11px 13px', borderRadius: R.input, border: `1.5px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 14, outline: 'none', boxSizing: 'border-box', ...extra }} />
  </div>
);

const Select = ({ label, value, onChange, options, placeholder }) => (
  <div>
    {label && <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 5, letterSpacing: .5 }}>{label}</div>}
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width: '100%', padding: '11px 13px', borderRadius: R.input, border: `1.5px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 14, outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }}>
      <option value="">{placeholder || 'Select...'}</option>
      {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
    </select>
  </div>
);

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [mode, setMode] = useState('player'); // 'player' | 'referee'
  const [playerTab, setPlayerTab] = useState('home');
  const [refTab, setRefTab] = useState('matches');
  const [pin, setPin] = useState('');
  const [authed, setAuthed] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Data
  const [results, setResults] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [checkedIn, setCheckedIn] = useState({}); // { playerId: true }
  const [playerMmr, setPlayerMmr] = useState(() => {
    const m = {};
    PLAYERS.forEach(p => { m[p.id] = TEAMS.find(t => t.id === p.teamId)?.mmr || 1000; });
    return m;
  });

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('liga2_data');
    if (saved) {
      try {
        const d = JSON.parse(saved);
        setResults(d.results || []);
        setRegistrations(d.registrations || []);
        setCheckedIn(d.checkedIn || {});
        setPlayerMmr(d.playerMmr || {});
      } catch (_) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('liga2_data', JSON.stringify({ results, registrations, checkedIn, playerMmr }));
  }, [results, registrations, checkedIn, playerMmr]);

  function pop(msg, color = C.accent) {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, msg, color }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }

  function login() {
    if (pin === REFEREE_PIN) { setAuthed(true); pop('Referee access granted', C.accent); }
    else pop('Wrong PIN', C.red);
  }

  function logout() { setAuthed(false); setPin(''); setMode('player'); }

  // Standings calculation
  function getStandings() {
    const s = {};
    TEAMS.forEach(t => { s[t.id] = { team: t, wins: 0, losses: 0, draws: 0, gf: 0, ga: 0, pts: 0 }; });
    results.forEach(r => {
      const game = SCHEDULE.find(g => g.id === r.gameId);
      if (!game) return;
      const a = s[game.teamA], b = s[game.teamB];
      if (!a || !b) return;
      a.gf += r.goalsA; a.ga += r.goalsB;
      b.gf += r.goalsB; b.ga += r.goalsA;
      if (r.goalsA > r.goalsB)      { a.wins++; a.pts += 3; b.losses++; }
      else if (r.goalsB > r.goalsA) { b.wins++; b.pts += 3; a.losses++; }
      else                           { a.draws++; a.pts++; b.draws++; b.pts++; }
    });
    return Object.values(s).sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga));
  }

  async function submitGame(gameId, goalsA, goalsB, cards) {
    const game = SCHEDULE.find(g => g.id === gameId);
    const entry = { gameId, goalsA, goalsB, cards, timestamp: new Date().toISOString() };
    setResults(prev => [...prev, entry]);

    // Update MMR
    const newMmr = { ...playerMmr };
    const tA = TEAMS.find(t => t.id === game.teamA);
    const tB = TEAMS.find(t => t.id === game.teamB);
    const wonA = goalsA > goalsB, wonB = goalsB > goalsA, draw = goalsA === goalsB;
    const gd = goalsA - goalsB;

    tA?.playerIds.forEach(pid => {
      const change = (wonA ? 15 : draw ? 0 : -10) + (wonA ? Math.abs(gd) : draw ? 0 : -Math.abs(gd));
      newMmr[pid] = Math.max(100, (newMmr[pid] || 1000) + change);
    });
    tB?.playerIds.forEach(pid => {
      const change = (wonB ? 15 : draw ? 0 : -10) + (wonB ? Math.abs(gd) : draw ? 0 : -Math.abs(gd));
      newMmr[pid] = Math.max(100, (newMmr[pid] || 1000) + change);
    });
    cards.forEach(c => {
      newMmr[c.playerId] = Math.max(100, (newMmr[c.playerId] || 1000) - (c.type === 'red' ? 25 : 15));
    });
    setPlayerMmr(newMmr);

    const { ok } = await postToSheets({ sheet: 'Results', gameId, teamA: game.teamA, teamB: game.teamB, goalsA, goalsB, cards: JSON.stringify(cards), timestamp: entry.timestamp });
    pop(ok ? 'Game logged & synced to Sheets ✓' : 'Saved locally (Sheets offline)', ok ? C.accent : C.orange);
  }

  async function submitRegistration(form) {
    const entry = { ...form, registeredAt: new Date().toISOString() };
    setRegistrations(prev => [...prev, entry]);
    const { ok } = await postToSheets({ sheet: 'Registrations', ...entry });
    return ok;
  }

  const standings = getStandings();
  const today = new Date().toISOString().split('T')[0];
  const checkedInCount = Object.keys(checkedIn).filter(id => checkedIn[id]).length;

  const Toasts = () => (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
      {toasts.map(t => (
        <div key={t.id} style={{ background: t.color, color: '#fff', padding: '10px 18px', borderRadius: 12, fontWeight: 800, fontSize: 13, boxShadow: '0 8px 32px #0009' }}>{t.msg}</div>
      ))}
    </div>
  );

  // ── PIN Screen ──
  if (mode === 'referee' && !authed) {
    return (
      <div style={{ fontFamily: "'Inter','Helvetica Neue',sans-serif", background: C.bg, minHeight: '100vh', color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`* { box-sizing: border-box; } button:hover:not(:disabled) { filter: brightness(1.1); }`}</style>
        <Toasts />
        <div style={{ width: 360, maxWidth: '92vw' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: 3, fontWeight: 700, marginBottom: 8 }}>LIGA REAL PRO</div>
            <div style={{ fontSize: 28, fontWeight: 900 }}>Referee <span style={{ color: C.orange }}>Access</span></div>
          </div>
          <Card accent={C.orange + '55'}>
            <Input label="REFEREE PIN" value={pin} onChange={setPin} type="password" placeholder="••••"
              extra={{ fontSize: 22, letterSpacing: 8, textAlign: 'center' }} />
            <div style={{ height: 12 }} />
            <Btn full color={C.orange} onClick={login}>Authenticate →</Btn>
            <button onClick={() => setMode('player')} style={{ width: '100%', marginTop: 10, background: 'none', border: 'none', color: C.muted, fontSize: 12, cursor: 'pointer', padding: 8 }}>← Back to Player View</button>
          </Card>
        </div>
      </div>
    );
  }

  // ── Player Mode ──
  if (mode === 'player') {
    const TABS = [
      { id: 'home', label: '🏠 Home' },
      { id: 'standings', label: '🏆 Standings' },
      { id: 'schedule', label: '📅 Schedule' },
      { id: 'teams', label: '👥 Teams' },
      { id: 'mystats', label: '📊 My Stats' },
      { id: 'signup', label: '✚ Sign Up' },
      { id: 'prizes', label: '💰 Prizes' },
      { id: 'rules', label: '📋 Rules' },
    ];
    return (
      <div style={{ fontFamily: "'Inter','Helvetica Neue',sans-serif", background: C.bg, minHeight: '100vh', color: C.text }}>
        <style>{`* { box-sizing: border-box; } button:hover:not(:disabled) { filter: brightness(1.1); } input:focus, select:focus { border-color: ${C.accent} !important; }`}</style>
        <Toasts />

        {/* Header */}
        <div style={{ background: 'linear-gradient(160deg,#060d18 0%,#0a1628 100%)', borderBottom: `2px solid ${C.accent}33`, position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.5 }}>LIGA <span style={{ color: C.accent }}>REAL</span> PRO</div>
              <div style={{ fontSize: 10, color: C.muted }}>Jun 29 – Jul 5, 2026 · {checkedInCount} checked in today</div>
            </div>
            <Btn color={C.orange} sm onClick={() => setMode('referee')}>🔧 Referee</Btn>
          </div>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', overflowX: 'auto', padding: '0 16px', gap: 2 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setPlayerTab(t.id)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '9px 12px', fontSize: 12, fontWeight: playerTab === t.id ? 700 : 400,
                color: playerTab === t.id ? C.accent : C.muted, whiteSpace: 'nowrap',
                borderBottom: `2px solid ${playerTab === t.id ? C.accent : 'transparent'}`
              }}>{t.label}</button>
            ))}
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>

          {/* HOME */}
          {playerTab === 'home' && (
            <div>
              <div style={{ background: 'linear-gradient(135deg,#0a1f0e,#091525,#150a00)', border: `1px solid ${C.accent}22`, borderRadius: 20, padding: 28, marginBottom: 20 }}>
                <Pill color={C.accent}>⚡ LIVE TOURNAMENT</Pill>
                <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.2, margin: '12px 0 8px' }}>
                  Battle for Glory.<br /><span style={{ color: C.accent }}>7 Days of Soccer.</span>
                </div>
                <div style={{ fontSize: 13, color: C.muted }}>6 squads · 3 fields · Every goal shifts the standings.</div>
                <div style={{ marginTop: 16 }}>
                  <Btn color={C.accent} sm onClick={() => setPlayerTab('signup')}>Join the Tournament →</Btn>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: 10, marginBottom: 20 }}>
                <StatBox label="Teams" value={TEAMS.length} color={C.accent} />
                <StatBox label="Games Played" value={results.length} color={C.blue} />
                <StatBox label="Checked In" value={checkedInCount} color={C.orange} />
                <StatBox label="Leader" value={standings[0]?.team.emoji || '—'} sub={standings[0]?.team.name.split(' ')[0]} color={C.gold} />
              </div>

              {/* Top 3 */}
              <Card accent={C.accent + '22'} style={{ marginBottom: 14 }}>
                <div style={{ fontWeight: 800, color: C.accent, fontSize: 14, marginBottom: 14 }}>🏆 Top Teams</div>
                {standings.slice(0, 3).map((s, i) => (
                  <div key={s.team.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 2 ? `1px solid ${C.border}22` : 'none' }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: [C.gold, C.muted, '#cd7f32'][i], width: 26 }}>#{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{s.team.emoji} {s.team.name}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{s.pts} pts · {s.wins}W {s.draws}D {s.losses}L</div>
                    </div>
                    <div style={{ fontWeight: 900, color: s.team.color, fontSize: 15 }}>{s.gf}:{s.ga}</div>
                  </div>
                ))}
                {results.length === 0 && <div style={{ fontSize: 12, color: C.muted, textAlign: 'center', padding: 12 }}>No games logged yet</div>}
              </Card>

              {/* Today's games */}
              <Card>
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12 }}>📅 Today's Games</div>
                {SCHEDULE.filter(g => g.date === today).length === 0
                  ? <div style={{ fontSize: 12, color: C.muted }}>No games scheduled today</div>
                  : SCHEDULE.filter(g => g.date === today).map(g => {
                    const tA = TEAMS.find(t => t.id === g.teamA);
                    const tB = TEAMS.find(t => t.id === g.teamB);
                    const res = results.find(r => r.gameId === g.id);
                    return (
                      <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.border}22`, flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{tA?.emoji} {tA?.name} vs {tB?.emoji} {tB?.name}</div>
                          <div style={{ fontSize: 11, color: C.muted }}>{g.time} · {g.field}</div>
                        </div>
                        {res ? <span style={{ fontWeight: 900, color: C.accent }}>{res.goalsA} – {res.goalsB}</span> : <Pill color={C.orange}>Upcoming</Pill>}
                      </div>
                    );
                  })}
              </Card>
            </div>
          )}

          {/* STANDINGS */}
          {playerTab === 'standings' && (
            <div>
              <div style={{ fontWeight: 800, color: C.accent, fontSize: 18, marginBottom: 14 }}>Live Standings</div>
              <Card>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr><TH>#</TH><TH left>Team</TH><TH>Pts</TH><TH>W</TH><TH>D</TH><TH>L</TH><TH>GF</TH><TH>GA</TH><TH>+/-</TH><TH>MMR</TH></tr></thead>
                    <tbody>
                      {standings.map((s, i) => {
                        const diff = s.gf - s.ga;
                        return (
                          <tr key={s.team.id} style={{ background: i % 2 === 0 ? C.surface + '44' : 'transparent' }}>
                            <TD center bold color={i < 3 ? C.gold : C.muted}>#{i + 1}</TD>
                            <TD bold>{s.team.emoji} {s.team.name}</TD>
                            <TD center bold color={C.accent}>{s.pts}</TD>
                            <TD center bold color={C.accent}>{s.wins}</TD>
                            <TD center color={C.muted}>{s.draws}</TD>
                            <TD center color={C.red}>{s.losses}</TD>
                            <TD center>{s.gf}</TD>
                            <TD center>{s.ga}</TD>
                            <TD center bold color={diff > 0 ? C.accent : diff < 0 ? C.red : C.muted}>{diff > 0 ? '+' : ''}{diff}</TD>
                            <TD center small>{s.team.mmr}</TD>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* SCHEDULE */}
          {playerTab === 'schedule' && (
            <div>
              <div style={{ fontWeight: 800, color: C.accent, fontSize: 18, marginBottom: 14 }}>Tournament Schedule</div>
              {['2026-06-29','2026-06-30','2026-07-01','2026-07-02','2026-07-03','2026-07-04','2026-07-05'].map((date, di) => {
                const dayGames = SCHEDULE.filter(g => g.date === date);
                if (!dayGames.length) return null;
                return (
                  <div key={date} style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      DAY {di + 1} — {date}
                      {date === today && <Pill color={C.accent} sm>Today</Pill>}
                    </div>
                    {dayGames.map(g => {
                      const res = results.find(r => r.gameId === g.id);
                      const tA = TEAMS.find(t => t.id === g.teamA);
                      const tB = TEAMS.find(t => t.id === g.teamB);
                      return (
                        <div key={g.id} style={{ background: date === today ? C.accent + '06' : C.surface, border: `1px solid ${date === today ? C.accent + '33' : C.border + '44'}`, borderRadius: 12, padding: '12px 16px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>{tA?.emoji} {tA?.name} <span style={{ color: C.muted, fontWeight: 400 }}>vs</span> {tB?.emoji} {tB?.name}</div>
                            <div style={{ fontSize: 11, color: C.muted, marginTop: 3, display: 'flex', gap: 8 }}>
                              <span>{g.time}</span>
                              <Pill color={C.blue} sm>{g.field}</Pill>
                              {g.round && <Pill color={C.purple} sm>{g.round}</Pill>}
                            </div>
                          </div>
                          {res
                            ? <div style={{ textAlign: 'right' }}><div style={{ fontSize: 20, fontWeight: 900, color: C.accent }}>{res.goalsA} – {res.goalsB}</div><Pill color={C.accent} sm>Final</Pill></div>
                            : <Pill color={C.orange}>Upcoming</Pill>}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {/* TEAMS */}
          {playerTab === 'teams' && (
            <div>
              <div style={{ fontWeight: 800, color: C.accent, fontSize: 18, marginBottom: 14 }}>Team Rosters</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: 14 }}>
                {TEAMS.map(team => {
                  const ts = standings.find(s => s.team.id === team.id);
                  return (
                    <Card key={team.id} accent={team.color + '44'}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <div style={{ fontSize: 28 }}>{team.emoji}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: 14, color: team.color }}>{team.name}</div>
                          <div style={{ fontSize: 11, color: C.muted }}>MMR {team.mmr} · {team.field}</div>
                        </div>
                        {ts && <div style={{ textAlign: 'right' }}><div style={{ fontSize: 14, fontWeight: 900, color: C.accent }}>{ts.pts}pts</div><div style={{ fontSize: 10, color: C.muted }}>{ts.wins}W {ts.draws}D {ts.losses}L</div></div>}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 8, letterSpacing: 1 }}>ROSTER</div>
                      {team.playerIds.map(pid => {
                        const p = PLAYERS.find(x => x.id === pid);
                        const mmr = playerMmr[pid] || 1000;
                        const tier = getTier(mmr);
                        return (
                          <div key={pid} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: `1px solid ${C.border}22` }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: team.color, flexShrink: 0 }} />
                            <div style={{ flex: 1, fontSize: 13 }}>{p?.name}</div>
                            <span style={{ fontSize: 10 }}>{tier.emoji}</span>
                            <span style={{ fontSize: 10, color: tier.color, fontWeight: 700 }}>{mmr}</span>
                            {checkedIn[pid] && <Pill color={C.accent} sm>✓ In</Pill>}
                          </div>
                        );
                      })}
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* MY STATS */}
          {playerTab === 'mystats' && <MyStats results={results} playerMmr={playerMmr} />}

          {/* SIGN UP */}
          {playerTab === 'signup' && <SignUpForm onSubmit={submitRegistration} pop={pop} />}

          {/* PRIZES */}
          {playerTab === 'prizes' && (
            <div style={{ maxWidth: 520, margin: '0 auto' }}>
              <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 6 }}>💰 Prize <span style={{ color: C.accent }}>Pool</span></div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Top performers earn cash prizes at the end of the tournament.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {PRIZE_POOL.map((p, i) => (
                  <div key={i} style={{ background: C.card, border: `1px solid ${p.color}44`, borderRadius: 14, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ fontSize: 24 }}>{p.emoji}</div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 15, color: p.color }}>{p.place}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>End of tournament</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: p.color }}>{p.prize}</div>
                  </div>
                ))}
              </div>
              <Card style={{ marginTop: 20 }} accent={C.gold + '33'}>
                <div style={{ fontWeight: 700, marginBottom: 8, color: C.gold }}>💡 How to Win</div>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                  Win games to earn MMR and climb the standings. The team with the most points at the end of Day 7 wins 1st place. Individual awards (Top Scorer, Best GK) are tracked by the referee each session.
                </div>
              </Card>
            </div>
          )}

          {/* RULES */}
          {playerTab === 'rules' && (
            <div style={{ maxWidth: 600, margin: '0 auto' }}>
              <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 6 }}>📋 Official <span style={{ color: C.accent }}>Rules</span></div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Liga Real Pro — Season 2026</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {RULES.map((r, i) => (
                  <Card key={i}>
                    <div style={{ fontWeight: 800, color: C.accent, marginBottom: 6 }}>{i + 1}. {r.title}</div>
                    <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{r.body}</div>
                  </Card>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  // ── Referee Mode ──
  const REF_TABS = [
    { id: 'matches', label: '⚽ Log Game' },
    { id: 'checkin', label: '✅ Check-In' },
    { id: 'standings', label: '📊 Standings' },
    { id: 'history', label: '🕐 History' },
    { id: 'signups', label: `📝 Sign-Ups (${registrations.length})` },
  ];

  return (
    <div style={{ fontFamily: "'Inter','Helvetica Neue',sans-serif", background: C.bg, minHeight: '100vh', color: C.text }}>
      <style>{`* { box-sizing: border-box; } button:hover:not(:disabled) { filter: brightness(1.1); } input:focus, select:focus { border-color: ${C.orange} !important; }`}</style>
      <Toasts />

      {/* Referee Header */}
      <div style={{ background: 'linear-gradient(160deg,#110800 0%,#1a0f00 100%)', borderBottom: `2px solid ${C.orange}44`, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: 2, fontWeight: 700 }}>LIGA REAL PRO</div>
            <div style={{ fontSize: 18, fontWeight: 900 }}><span style={{ color: C.orange }}>Referee</span> Dashboard</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {WEBHOOK_URL && <Pill color={C.accent}>● Sheets Live</Pill>}
            <Btn color={C.muted} sm outline onClick={logout}>Sign Out</Btn>
          </div>
        </div>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', overflowX: 'auto', padding: '0 16px', gap: 2 }}>
          {REF_TABS.map(t => (
            <button key={t.id} onClick={() => setRefTab(t.id)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '9px 12px', fontSize: 12, fontWeight: refTab === t.id ? 700 : 400,
              color: refTab === t.id ? C.orange : C.muted, whiteSpace: 'nowrap',
              borderBottom: `2px solid ${refTab === t.id ? C.orange : 'transparent'}`
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>

        {/* LOG GAME */}
        {refTab === 'matches' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)', gap: 16 }}>
            <Card accent={C.orange + '44'}>
              <div style={{ fontWeight: 800, color: C.orange, fontSize: 15, marginBottom: 16 }}>Log Game Result</div>
              <GameLogger games={SCHEDULE} results={results} onSubmit={submitGame} />
            </Card>
            <Card accent={C.accent + '22'}>
              <div style={{ fontWeight: 800, color: C.accent, fontSize: 14, marginBottom: 14 }}>Live Standings</div>
              <div style={{ overflowY: 'auto', maxHeight: 460 }}>
                {standings.map((s, i) => (
                  <div key={s.team.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${C.border}22` }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: i < 3 ? C.gold : C.muted, width: 20 }}>#{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{s.team.emoji} {s.team.name}</div>
                      <div style={{ fontSize: 10, color: C.muted }}>{s.pts}pts · {s.wins}W {s.draws}D {s.losses}L</div>
                    </div>
                    <div style={{ fontWeight: 800, color: s.team.color, fontSize: 13 }}>{s.gf}:{s.ga}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* CHECK-IN */}
        {refTab === 'checkin' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 18, color: C.orange }}>Player Check-In</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn sm color={C.accent} onClick={() => {
                  const all = {};
                  PLAYERS.forEach(p => { all[p.id] = true; });
                  setCheckedIn(all);
                  pop('All players checked in', C.accent);
                }}>Check In All</Btn>
                <Btn sm color={C.red} outline onClick={() => { setCheckedIn({}); pop('All cleared', C.red); }}>Clear All</Btn>
              </div>
            </div>
            <div style={{ marginBottom: 10, fontSize: 13, color: C.muted }}>
              {checkedInCount} of {PLAYERS.length} players checked in
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 10 }}>
              {TEAMS.map(team => (
                <Card key={team.id} accent={team.color + '33'}>
                  <div style={{ fontWeight: 700, color: team.color, marginBottom: 10, fontSize: 13 }}>{team.emoji} {team.name}</div>
                  {team.playerIds.map(pid => {
                    const p = PLAYERS.find(x => x.id === pid);
                    const isIn = !!checkedIn[pid];
                    return (
                      <div key={pid} onClick={() => {
                        setCheckedIn(prev => ({ ...prev, [pid]: !prev[pid] }));
                        pop(`${p?.name} ${isIn ? 'checked out' : 'checked in'}`, isIn ? C.red : C.accent);
                      }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, marginBottom: 4, cursor: 'pointer', background: isIn ? C.accent + '18' : C.surface, border: `1px solid ${isIn ? C.accent + '44' : C.border + '33'}` }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: isIn ? C.accent : C.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 800, flexShrink: 0 }}>
                          {isIn ? '✓' : ''}
                        </div>
                        <div style={{ flex: 1, fontSize: 13, fontWeight: isIn ? 700 : 400 }}>{p?.name}</div>
                        <div style={{ fontSize: 10, color: C.muted }}>{playerMmr[pid] || 1000}</div>
                      </div>
                    );
                  })}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* STANDINGS (referee) */}
        {refTab === 'standings' && (
          <div>
            <div style={{ fontWeight: 800, color: C.orange, fontSize: 18, marginBottom: 14 }}>Full Standings & MMR</div>
            <Card>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><TH>#</TH><TH left>Team</TH><TH>Pts</TH><TH>W</TH><TH>D</TH><TH>L</TH><TH>GF</TH><TH>GA</TH><TH>+/-</TH></tr></thead>
                  <tbody>
                    {standings.map((s, i) => {
                      const diff = s.gf - s.ga;
                      return (
                        <tr key={s.team.id} style={{ background: i % 2 === 0 ? C.surface + '44' : 'transparent' }}>
                          <TD center bold color={i < 3 ? C.gold : C.muted}>#{i + 1}</TD>
                          <TD bold>{s.team.emoji} {s.team.name}</TD>
                          <TD center bold color={C.accent}>{s.pts}</TD>
                          <TD center bold color={C.accent}>{s.wins}</TD>
                          <TD center color={C.muted}>{s.draws}</TD>
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

            <div style={{ marginTop: 20, fontWeight: 800, fontSize: 15, marginBottom: 12 }}>Player MMR Rankings</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 8 }}>
              {[...PLAYERS].sort((a, b) => (playerMmr[b.id] || 1000) - (playerMmr[a.id] || 1000)).map((p, i) => {
                const mmr = playerMmr[p.id] || 1000;
                const tier = getTier(mmr);
                const team = TEAMS.find(t => t.id === p.teamId);
                return (
                  <div key={p.id} style={{ background: C.surface, border: `1px solid ${C.border}44`, borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: 11, color: C.muted, width: 20 }}>#{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: team?.color }}>{team?.name}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: tier.color }}>{mmr}</div>
                      <div style={{ fontSize: 10 }}>{tier.emoji} {tier.name}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* HISTORY */}
        {refTab === 'history' && (
          <div>
            <div style={{ fontWeight: 800, color: C.orange, fontSize: 18, marginBottom: 14 }}>Match History</div>
            {results.length === 0
              ? <Card><div style={{ textAlign: 'center', color: C.muted, fontSize: 13, padding: 20 }}>No games logged yet</div></Card>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[...results].reverse().map((r, i) => {
                  const game = SCHEDULE.find(g => g.id === r.gameId);
                  const tA = TEAMS.find(t => t.id === game?.teamA);
                  const tB = TEAMS.find(t => t.id === game?.teamB);
                  return (
                    <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}44`, borderRadius: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{tA?.emoji} {tA?.name} vs {tB?.emoji} {tB?.name}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>{game?.date} · {game?.field}</div>
                        {r.cards?.length > 0 && (
                          <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {r.cards.map((c, ci) => {
                              const p = PLAYERS.find(x => x.id === c.playerId);
                              return <span key={ci} style={{ fontSize: 10, background: c.type === 'yellow' ? '#fbbf2422' : C.red + '22', color: c.type === 'yellow' ? '#fbbf24' : C.red, padding: '2px 6px', borderRadius: 4 }}>{c.type === 'yellow' ? '🟨' : '🟥'} {p?.name}</span>;
                            })}
                          </div>
                        )}
                      </div>
                      <div style={{ fontWeight: 900, fontSize: 22, color: C.accent }}>{r.goalsA} – {r.goalsB}</div>
                    </div>
                  );
                })}
              </div>
            }
          </div>
        )}

        {/* SIGN-UPS */}
        {refTab === 'signups' && (
          <div>
            <div style={{ fontWeight: 800, color: C.orange, fontSize: 18, marginBottom: 14 }}>Player Sign-Ups</div>
            {registrations.length === 0
              ? <Card><div style={{ textAlign: 'center', color: C.muted, fontSize: 13, padding: 20 }}>No sign-ups yet</div></Card>
              : <Card>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr><TH left>Name</TH><TH left>Codename</TH><TH left>Email</TH><TH left>Position</TH><TH left>Level</TH><TH left>Registered</TH></tr></thead>
                    <tbody>
                      {[...registrations].reverse().map((r, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? C.surface + '44' : 'transparent' }}>
                          <TD bold>{r.name}</TD>
                          <TD color={C.muted}>{r.codename || '—'}</TD>
                          <TD small>{r.email}</TD>
                          <TD small>{r.position || '—'}</TD>
                          <TD small>{r.experience || '—'}</TD>
                          <TD small color={C.muted}>{r.registeredAt?.split('T')[0]}</TD>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            }
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Game Logger ──────────────────────────────────────────────────────────────
function GameLogger({ games, results, onSubmit }) {
  const [gameId, setGameId] = useState('');
  const [goalsA, setGoalsA] = useState('0');
  const [goalsB, setGoalsB] = useState('0');
  const [cards, setCards] = useState([]);
  const [cardPlayer, setCardPlayer] = useState('');
  const [cardType, setCardType] = useState('yellow');
  const [submitting, setSubmitting] = useState(false);

  const game = games.find(g => g.id === gameId);
  const teamA = TEAMS.find(t => t.id === game?.teamA);
  const teamB = TEAMS.find(t => t.id === game?.teamB);
  const logged = results.find(r => r.gameId === gameId);
  const gamePlayers = game
    ? [...(teamA?.playerIds || []), ...(teamB?.playerIds || [])].map(pid => {
        const p = PLAYERS.find(x => x.id === pid);
        return { ...p, teamName: teamA?.playerIds.includes(pid) ? teamA?.name : teamB?.name };
      })
    : [];

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    await onSubmit(gameId, parseInt(goalsA) || 0, parseInt(goalsB) || 0, cards);
    setGameId(''); setGoalsA('0'); setGoalsB('0'); setCards([]);
    setSubmitting(false);
  }

  const IS = { width: '100%', padding: '10px 12px', borderRadius: R.input, border: `1.5px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 5, letterSpacing: .5 }}>SELECT GAME</div>
        <select value={gameId} onChange={e => { setGameId(e.target.value); setCards([]); setGoalsA('0'); setGoalsB('0'); }} style={{ ...IS, cursor: 'pointer' }}>
          <option value="">Choose a matchup...</option>
          {games.map(g => {
            const tA = TEAMS.find(t => t.id === g.teamA);
            const tB = TEAMS.find(t => t.id === g.teamB);
            const done = results.find(r => r.gameId === g.id);
            return <option key={g.id} value={g.id}>{done ? '✓ ' : ''}{g.date} {g.time} · {tA?.name} vs {tB?.name}</option>;
          })}
        </select>
      </div>

      {game && (
        <>
          {logged && <div style={{ background: C.orange + '18', border: `1px solid ${C.orange}44`, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: C.orange, fontWeight: 700 }}>⚠ Already logged — resubmitting creates a duplicate</div>}

          <div>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 6, letterSpacing: .5 }}>GOALS</div>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: teamA?.color, fontWeight: 700, marginBottom: 4 }}>{teamA?.emoji} {teamA?.name}</div>
                <input type="number" min="0" value={goalsA} onChange={e => setGoalsA(e.target.value)} style={{ ...IS, textAlign: 'center', fontSize: 28, fontWeight: 900, color: C.accent }} />
              </div>
              <div style={{ color: C.muted, fontWeight: 900, fontSize: 22, paddingTop: 22 }}>–</div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: teamB?.color, fontWeight: 700, marginBottom: 4 }}>{teamB?.emoji} {teamB?.name}</div>
                <input type="number" min="0" value={goalsB} onChange={e => setGoalsB(e.target.value)} style={{ ...IS, textAlign: 'center', fontSize: 28, fontWeight: 900, color: C.accent }} />
              </div>
            </div>
          </div>

          <div style={{ background: C.surface + '88', border: `1px solid ${C.border}44`, borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 8, letterSpacing: .5 }}>CARDS (OPTIONAL)</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <select value={cardPlayer} onChange={e => setCardPlayer(e.target.value)} style={{ ...IS, flex: 1, fontSize: 12, padding: '8px 10px', cursor: 'pointer' }}>
                <option value="">Select player...</option>
                {gamePlayers.map(p => <option key={p.id} value={p.id}>{p.name} · {p.teamName}</option>)}
              </select>
              <select value={cardType} onChange={e => setCardType(e.target.value)} style={{ ...IS, width: 'auto', fontSize: 12, padding: '8px 10px', cursor: 'pointer' }}>
                <option value="yellow">🟨 Yellow</option>
                <option value="red">🟥 Red</option>
              </select>
              <button onClick={() => { if (!cardPlayer) return; setCards(c => [...c, { playerId: cardPlayer, type: cardType }]); setCardPlayer(''); setCardType('yellow'); }}
                style={{ padding: '8px 14px', borderRadius: 8, background: C.accent, color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: 14 }}>+</button>
            </div>
            {cards.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {cards.map((c, i) => {
                  const p = PLAYERS.find(x => x.id === c.playerId);
                  return (
                    <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, background: c.type === 'yellow' ? '#fbbf2422' : C.red + '22', border: `1px solid ${c.type === 'yellow' ? '#fbbf2444' : C.red + '44'}`, padding: '3px 8px', borderRadius: 6, fontSize: 11 }}>
                      {c.type === 'yellow' ? '🟨' : '🟥'} {p?.name}
                      <button onClick={() => setCards(cs => cs.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: '0 2px' }}>✕</button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <button onClick={handleSubmit} disabled={submitting} style={{ width: '100%', padding: 13, borderRadius: 10, background: submitting ? C.border : C.orange, color: submitting ? C.muted : '#fff', fontWeight: 900, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 14 }}>
            {submitting ? 'Submitting...' : 'Submit Result ✓'}
          </button>
        </>
      )}
    </div>
  );
}

// ─── My Stats ────────────────────────────────────────────────────────────────
function MyStats({ results, playerMmr }) {
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);

  const q = query.toLowerCase().trim();
  const player = q.length > 1 ? PLAYERS.find(p => p.name.toLowerCase().includes(q)) : null;
  const team = player ? TEAMS.find(t => t.id === player.teamId) : null;
  const mmr = player ? (playerMmr[player.id] || 1000) : 1000;
  const tier = getTier(mmr);

  const teamGames = player && team
    ? results.filter(r => { const g = SCHEDULE.find(s => s.id === r.gameId); return g && (g.teamA === team.id || g.teamB === team.id); })
    : [];
  const wins = teamGames.filter(r => { const g = SCHEDULE.find(s => s.id === r.gameId); return g && ((g.teamA === team?.id && r.goalsA > r.goalsB) || (g.teamB === team?.id && r.goalsB > r.goalsA)); }).length;
  const draws = teamGames.filter(r => r.goalsA === r.goalsB).length;
  const losses = teamGames.length - wins - draws;
  const pCards = player ? results.flatMap(r => r.cards || []).filter(c => c.playerId === player.id) : [];

  return (
    <div style={{ maxWidth: 540, margin: '0 auto' }}>
      <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 6 }}>My <span style={{ color: C.accent }}>Stats</span></div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Search by your name to see your tournament stats and MMR.</div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input value={query} onChange={e => { setQuery(e.target.value); setSearched(false); }} onKeyDown={e => e.key === 'Enter' && setSearched(true)}
          placeholder="Type your name..." style={{ flex: 1, padding: '11px 13px', borderRadius: R.input, border: `1.5px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
        <button onClick={() => setSearched(true)} style={{ padding: '11px 20px', borderRadius: R.input, background: C.accent, color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: 14 }}>Search</button>
      </div>

      {searched && !player && q.length > 1 && (
        <Card>
          <div style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Player not found</div>
            <div style={{ fontSize: 13, color: C.muted }}>Try your full name. If you're new, use <strong>Sign Up</strong> to register.</div>
          </div>
        </Card>
      )}

      {player && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card accent={team?.color + '44'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: team?.color + '22', border: `2px solid ${team?.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{team?.emoji}</div>
              <div>
                <div style={{ fontSize: 19, fontWeight: 900 }}>{player.name}</div>
                <div style={{ fontSize: 12, color: team?.color, fontWeight: 700 }}>{team?.name}</div>
                <div style={{ fontSize: 12, color: tier.color, fontWeight: 700 }}>{tier.emoji} {tier.name} · {mmr} MMR</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {[['Games', teamGames.length, C.blue], ['Wins', wins, C.accent], ['Draws', draws, C.muted], ['Losses', losses, C.red]].map(([l, v, c]) => (
                <div key={l} style={{ background: C.surface, borderRadius: 10, padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: c }}>{v}</div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Disciplinary Record</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, background: '#fbbf2411', border: '1px solid #fbbf2433', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#fbbf24' }}>{pCards.filter(c => c.type === 'yellow').length}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>🟨 Yellows</div>
              </div>
              <div style={{ flex: 1, background: C.red + '11', border: `1px solid ${C.red}33`, borderRadius: 10, padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: C.red }}>{pCards.filter(c => c.type === 'red').length}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>🟥 Reds</div>
              </div>
            </div>
          </Card>

          {teamGames.length > 0 && (
            <Card>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Game History</div>
              {teamGames.map((r, i) => {
                const g = SCHEDULE.find(s => s.id === r.gameId);
                const tA = TEAMS.find(t => t.id === g?.teamA);
                const tB = TEAMS.find(t => t.id === g?.teamB);
                const won = (g?.teamA === team.id && r.goalsA > r.goalsB) || (g?.teamB === team.id && r.goalsB > r.goalsA);
                const draw = r.goalsA === r.goalsB;
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: won ? C.accent + '11' : draw ? C.muted + '11' : C.red + '11', borderRadius: 8, marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{tA?.emoji} {tA?.name} vs {tB?.emoji} {tB?.name}</div>
                      <div style={{ fontSize: 10, color: C.muted }}>{g?.date}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontWeight: 900 }}>{r.goalsA} – {r.goalsB}</span>
                      <Pill color={won ? C.accent : draw ? C.muted : C.red} sm>{won ? 'W' : draw ? 'D' : 'L'}</Pill>
                    </div>
                  </div>
                );
              })}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sign Up Form ─────────────────────────────────────────────────────────────
function SignUpForm({ onSubmit, pop }) {
  const [form, setForm] = useState({ name: '', codename: '', email: '', phone: '', position: '', experience: '' });
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.email) { pop('Name and email required', C.red); return; }
    setLoading(true);
    const ok = await onSubmit(form);
    setLoading(false);
    setDone(true);
    pop(ok ? 'Registered & synced to Sheets ✓' : 'Saved locally (will sync when online)', ok ? C.accent : C.orange);
  }

  if (done) return (
    <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center', padding: '48px 0' }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
      <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>You're Registered!</div>
      <div style={{ fontSize: 14, color: C.muted, marginBottom: 28 }}>The organizer will assign you to a team. Check back before your first session.</div>
      <Btn onClick={() => { setDone(false); setForm({ name: '', codename: '', email: '', phone: '', position: '', experience: '' }); }}>Register Another Player</Btn>
    </div>
  );

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 6 }}>Join the <span style={{ color: C.accent }}>Tournament</span></div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Fill out your info. The organizer will place you on a team before the next session.</div>
      <Card>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="FULL NAME" value={form.name} onChange={v => set('name', v)} placeholder="Your real name" required />
          <Input label="CODENAME / GAMERTAG" value={form.codename} onChange={v => set('codename', v)} placeholder="e.g. El Toro, Ghost, Ace..." />
          <Input label="EMAIL" value={form.email} onChange={v => set('email', v)} type="email" placeholder="your@email.com" required />
          <Input label="PHONE (OPTIONAL)" value={form.phone} onChange={v => set('phone', v)} type="tel" placeholder="+1 (555) 000-0000" />
          <Select label="POSITION" value={form.position} onChange={v => set('position', v)} placeholder="Select position..."
            options={['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Flexible']} />
          <Select label="EXPERIENCE LEVEL" value={form.experience} onChange={v => set('experience', v)} placeholder="Select level..."
            options={['Beginner', 'Intermediate', 'Advanced', 'Semi-Pro']} />
          <button type="submit" disabled={loading} style={{ padding: 13, borderRadius: 10, background: loading ? C.border : C.accent, color: '#fff', fontWeight: 900, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14, marginTop: 4 }}>
            {loading ? 'Submitting...' : 'Register for Tournament →'}
          </button>
        </form>
      </Card>
    </div>
  );
}
