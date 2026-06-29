// Calculate individual player stats from game results
export function calculatePlayerStats(players, results, games) {
  const stats = {};

  players.forEach(p => {
    stats[p.id] = {
      player: p,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      gamesPlayed: 0,
      goalsPerGame: 0,
    };
  });

  results.forEach(result => {
    const game = games.find(g => g.id === result.gameId);
    if (!game || !result.cards) return;

    // Count cards by player
    result.cards.forEach(card => {
      if (stats[card.playerId]) {
        if (card.type === 'yellow') stats[card.playerId].yellowCards++;
        if (card.type === 'red') stats[card.playerId].redCards++;
      }
    });
  });

  // Calculate derived stats
  Object.values(stats).forEach(s => {
    if (s.gamesPlayed > 0) {
      s.goalsPerGame = (s.goals / s.gamesPlayed).toFixed(2);
    }
  });

  return stats;
}

// Generate playoff bracket from group stage
export function generatePlayoffs(standings, totalTeams = 6) {
  // Top 2 teams → Finals, 3-4 → 3rd place, 5-6 → 5th place
  if (standings.length < 2) return [];

  return [
    {
      id: 'P001',
      date: '2026-07-03',
      time: '18:00',
      round: 'Semifinals',
      teamA: standings[0]?.team.id,
      teamB: standings[1]?.team.id,
      field: 'Field 1',
    },
    {
      id: 'P002',
      date: '2026-07-03',
      time: '18:30',
      round: 'Semifinals',
      teamA: standings[2]?.team.id,
      teamB: standings[3]?.team.id,
      field: 'Field 2',
    },
    {
      id: 'P003',
      date: '2026-07-04',
      time: '18:00',
      round: '3rd Place',
      teamA: null,
      teamB: null,
      field: 'Field 1',
    },
    {
      id: 'P004',
      date: '2026-07-05',
      time: '18:00',
      round: 'Finals',
      teamA: null,
      teamB: null,
      field: 'Field 1',
    },
  ];
}

// Format time remaining
export function formatTimeRemaining(date) {
  const now = new Date();
  const gameDate = new Date(date);
  const diff = gameDate - now;

  if (diff < 0) return 'Final';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) return `${Math.floor(hours / 24)}d away`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m away`;
}

// Determine if a team is eliminated (e.g., 3+ losses)
export function isEliminated(teamStandings, maxLosses = 4) {
  return teamStandings.losses >= maxLosses;
}
