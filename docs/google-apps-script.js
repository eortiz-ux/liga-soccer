// ============================================================
// Liga Real Pro — Google Apps Script Backend
// Paste this into Extensions > Apps Script in your Google Sheet
// Then Deploy > New Deployment > Web App > Anyone > Deploy
// ============================================================

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();

    var data = JSON.parse(e.postData.contents);
    data.timestamp = new Date();

    // Auto-create headers from first request
    if (sheet.getLastColumn() === 0) {
      var headers = Object.keys(data);
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }

    // Match columns to headers
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var row = headers.map(function(key) {
      return data[key] !== undefined ? data[key] : '';
    });

    sheet.appendRow(row);
    Logger.log('Row added: ' + JSON.stringify(data));

    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log('Error: ' + err);
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Confirms the endpoint is live when visited in a browser
function doGet(e) {
  return ContentService.createTextOutput('Liga Real Pro API is live!')
    .setMimeType(ContentService.MimeType.TEXT);
}
