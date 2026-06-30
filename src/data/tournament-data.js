// Liga Real Pro - Tournament Data (Jun 29 - Jul 5, 2026)
// 6 teams, 3 fields, 7 days

export const TEAMS = [
  { id: "T001", name: "Vip-Luis",         emoji: "⭐", color: "#f0c040", field: "Field 1", mmr: 1108, playerIds: ["P001","P002","P003","P004","P008"] },
  { id: "T002", name: "Challengers Team", emoji: "🟠", color: "#f97316", field: "Field 1", mmr: 1190, playerIds: ["P009","P010","P011","P012","P013"] },
  { id: "T003", name: "Men Team 1",       emoji: "🟢", color: "#22c55e", field: "Field 2", mmr: 1260, playerIds: ["P015","P022","P023","P024","P014"] },
  { id: "T004", name: "Men Team 2",       emoji: "🟠", color: "#f97316", field: "Field 2", mmr: 1260, playerIds: ["P025","P031","P016","P019","P032"] },
  { id: "T005", name: "Men Team 3",       emoji: "🟢", color: "#22c55e", field: "Field 3", mmr: 1242, playerIds: ["P033","P018","P027","P017","P028"] },
  { id: "T006", name: "Men Team 4",       emoji: "🟠", color: "#f97316", field: "Field 3", mmr: 1212, playerIds: ["P020","P029","P026","P030","P021"] },
];

const PLAYER_NAMES = {
  P001:"Alpha", P002:"Bravo",   P003:"Charlie", P004:"Delta",  P008:"Hotel",
  P009:"India", P010:"Juliet",  P011:"Kilo",    P012:"Lima",   P013:"Mike",
  P015:"Oscar", P022:"Victor",  P023:"Whiskey", P024:"Xray",   P014:"November",
  P025:"Yankee",P031:"Falcon",  P016:"Papa",    P019:"Sierra", P032:"Gator",
  P033:"Hawk",  P018:"Romeo",   P027:"Ace",     P017:"Quebec", P028:"Bolt",
  P020:"Tango", P029:"Cobra",   P026:"Zulu",    P030:"Duke",   P021:"Uniform",
};

export const PLAYERS = Object.entries(PLAYER_NAMES).map(([id, name]) => ({
  id, name,
  teamId: TEAMS.find(t => t.playerIds.includes(id))?.id,
}));

export const SCHEDULE = [
  // Day 1: Jun 29
  { id:"G001", date:"2026-06-29", time:"18:00", teamA:"T001", teamB:"T002", field:"Field 1" },
  { id:"G002", date:"2026-06-29", time:"18:00", teamA:"T003", teamB:"T004", field:"Field 2" },
  { id:"G003", date:"2026-06-29", time:"18:00", teamA:"T005", teamB:"T006", field:"Field 3" },
  { id:"G004", date:"2026-06-29", time:"18:30", teamA:"T001", teamB:"T003", field:"Field 1" },
  // Day 2: Jun 30
  { id:"G005", date:"2026-06-30", time:"18:00", teamA:"T002", teamB:"T004", field:"Field 1" },
  { id:"G006", date:"2026-06-30", time:"18:00", teamA:"T005", teamB:"T001", field:"Field 2" },
  { id:"G007", date:"2026-06-30", time:"18:30", teamA:"T003", teamB:"T006", field:"Field 3" },
  // Day 3: Jul 1
  { id:"G008", date:"2026-07-01", time:"18:00", teamA:"T001", teamB:"T004", field:"Field 1" },
  { id:"G009", date:"2026-07-01", time:"18:00", teamA:"T002", teamB:"T005", field:"Field 2" },
  { id:"G010", date:"2026-07-01", time:"18:30", teamA:"T003", teamB:"T006", field:"Field 3" },
  // Day 4: Jul 2
  { id:"G011", date:"2026-07-02", time:"18:00", teamA:"T002", teamB:"T006", field:"Field 1" },
  { id:"G012", date:"2026-07-02", time:"18:00", teamA:"T004", teamB:"T005", field:"Field 2" },
  // Day 5: Jul 3 — Playoffs
  { id:"G013", date:"2026-07-03", time:"18:00", teamA:"T001", teamB:"T005", field:"Field 1", round:"Playoffs" },
  { id:"G014", date:"2026-07-03", time:"18:30", teamA:"T002", teamB:"T003", field:"Field 2", round:"Playoffs" },
  // Day 6: Jul 4
  { id:"G015", date:"2026-07-04", time:"18:00", teamA:"T004", teamB:"T006", field:"Field 1", round:"Playoffs" },
  // Day 7: Jul 5 — Finals
  { id:"G016", date:"2026-07-05", time:"18:00", teamA:"TBD",  teamB:"TBD",  field:"Field 1", round:"Finals" },
];

export const C = {
  bg:      "#060b14",
  surface: "#0d1424",
  card:    "#0f1a2e",
  border:  "#1e2d4a",
  accent:  "#22c55e",
  orange:  "#f97316",
  gold:    "#f0c040",
  blue:    "#3b82f6",
  purple:  "#a855f7",
  red:     "#ef4444",
  text:    "#e2e8f0",
  muted:   "#64748b",
};
