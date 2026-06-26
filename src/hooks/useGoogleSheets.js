// Google Sheets Integration Hook
// Sends game results to a Google Apps Script webhook

export function useGoogleSheets() {
  const WEBHOOK_URL = process.env.REACT_APP_SHEETS_WEBHOOK || '';

  const submitToSheets = async (gameResult) => {
    if (!WEBHOOK_URL) {
      console.log('No Google Sheets webhook configured. Data stored locally.');
      return { success: true, local: true };
    }

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        body: JSON.stringify(gameResult),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return { success: true, synced: true };
    } catch (error) {
      console.error('Sheets sync failed:', error);
      // Fail gracefully - data is still in localStorage
      return { success: false, error: error.message };
    }
  };

  return { submitToSheets };
}

// Google Apps Script Template (copy to Google Sheets)
// Paste this in Extensions > Apps Script
/*
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
*/
