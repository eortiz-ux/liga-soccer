# Liga Real Pro - Tournament Management App

A live tournament management system for squad-based soccer with real-time leaderboards, referee admin dashboard, and player tracking.

## Features

✅ **Player View**
- Live leaderboard with standings
- Tournament schedule & match results
- Team rosters and player information
- Individual player card tracking (yellow/red)

✅ **Referee Admin Dashboard**
- PIN-authenticated access (demo: `1234`)
- Quick game logger (pick winner, log goals, track cards)
- Real-time leaderboard updates
- Recent results history

✅ **Data Persistence**
- localStorage (default, works offline)
- Google Sheets integration (optional)
- Card tracking per player
- Complete game history

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm start

# App runs on http://localhost:3000
```

### Demo Credentials
- **Referee PIN**: `1234`

## Tournament Structure

- **Teams**: 6 squads across 3 fields
- **Players**: 30 total (5 per team)
- **Duration**: 7 days (Jun 29 - Jul 6)
- **Games**: 16 group stage + 4 playoff matches

## Google Sheets Integration (Optional)

To sync results to Google Sheets:

1. **Create a Google Sheet** with these columns:
   - Timestamp
   - Game ID
   - Team A ID
   - Team B ID
   - Goals A
   - Goals B
   - Winner
   - Cards (JSON)

2. **Create Google Apps Script**:
   - Go to Extensions > Apps Script in your Google Sheet
   - Paste this code:

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = JSON.parse(e.postData.contents);

  const row = [
    new Date(),
    data.gameId,
    data.teamAId,
    data.teamBId,
    data.goalsA,
    data.goalsB,
    data.winner,
    JSON.stringify(data.cards || [])
  ];

  sheet.appendRow(row);
  return ContentService.createTextOutput(JSON.stringify({success: true}))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. **Deploy as web app**:
   - Click Deploy > New deployment
   - Type: Web app
   - Execute as: Your email
   - Who has access: Anyone
   - Copy the deployment URL

4. **Set environment variable**:
   ```bash
   # Create .env file
   REACT_APP_SHEETS_WEBHOOK=https://script.google.com/macros/d/YOUR_SCRIPT_ID/usercontent
   ```

5. **Restart dev server**:
   ```bash
   npm start
   ```

Results will now auto-sync to Google Sheets on submit!

## File Structure

```
src/
├── App.jsx                    # Main app with Player & Referee modes
├── index.js                   # React entry point
├── data/
│   └── tournament-data.js     # Teams, players, schedule, colors
├── hooks/
│   └── useGoogleSheets.js     # Google Sheets webhook integration
└── utils/
    └── tournament-utils.js    # Stats calc, playoff generation
```

## Key Components

### Player View Tabs
- **Home**: Quick stats, top 3 teams
- **Leaderboard**: Full standings with W-L, goal differential
- **Schedule**: All games with live result tracking
- **Teams**: Complete team rosters
- **Player Stats**: Individual card tracking

### Referee Dashboard
- Game logger with card tracking
- Live standings display
- Recent results history
- PIN authentication

## Data Flow

1. **Referee logs game** → Game logger captures winner, goals, cards
2. **Submit result** → Updates localStorage + Google Sheets (if configured)
3. **Leaderboard recalculates** → W-L records, goal differential updated
4. **Player view refreshes** → Shows live standings instantly

## Development

```bash
# Available scripts
npm start       # Start dev server (port 3000)
npm build       # Create production build
npm test        # Run tests
npm eject       # Eject from Create React App
```

## Browser Support

- Chrome/Chromium (recommended)
- Safari 14+
- Firefox
- Edge

Mobile-friendly UI for field referees using tablets/phones.

## API/Integrations

### Google Sheets Webhook
- **Method**: POST
- **Body**: `{ gameId, teamAId, teamBId, winner, goalsA, goalsB, cards: [...] }`
- **Response**: `{ success: true }`

### localStorage
- Key: `liga_tournament`
- Stores: `{ results: [...] }`

## License

Built for Liga Real Pro Tournament 2026

---

**Questions?** Check the tournament data in `src/data/tournament-data.js` for schedule, teams, and game configuration.
