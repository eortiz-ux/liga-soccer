// ============================================================
// Liga Real Pro — Google Apps Script Backend
// Paste this into Extensions > Apps Script in your Google Sheet
// Then Deploy > New Deployment > Web App > Anyone > Deploy
// ============================================================

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);
    data.timestamp = data.timestamp || new Date().toISOString();

    // Route to the correct sheet tab based on the "sheet" field
    var sheetName = data.sheet || 'Results';
    delete data.sheet; // don't write this meta-field as a column

    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    // Auto-create column headers from the first request
    if (sheet.getLastColumn() === 0 || sheet.getLastRow() === 0) {
      var headers = Object.keys(data);
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    // Match data to existing column headers
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var row = headers.map(function(key) {
      return data[key] !== undefined ? data[key] : '';
    });

    sheet.appendRow(row);
    Logger.log('Row added to ' + sheetName + ': ' + JSON.stringify(data));

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, sheet: sheetName }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log('Error: ' + err);
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Confirms the endpoint is live when visited in a browser
function doGet(e) {
  return ContentService
    .createTextOutput('Liga Real Pro API is live! Sheets: Results, Registrations')
    .setMimeType(ContentService.MimeType.TEXT);
}
