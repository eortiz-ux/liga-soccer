// ========================================================
// THEME — Dark Pro League | Oswald Font
// ========================================================
var THEME = {
  navyDeep:   "#0d1b2a",
  navyMid:    "#1b2a3b",
  navyLight:  "#1e3a5f",
  redAccent:  "#e94560",
  goldAccent: "#ffd60a",
  scoreBlue:  "#0f3460",
  scoreText:  "#e0f0ff",
  teamA:      "#162447",
  teamB:      "#1a1a3e",
  white:      "#ffffff",
  offWhite:   "#e8eaf0",
  checkedIn:  "#d4edda",
  notPlaying: "#f8f9fa",
  suspended:  "#fff9c4",
  banned:     "#fce5cd",
  yellowCard: "#fff2cc",
  redCard:    "#fce5cd",
};
var FONT = "Oswald";

// Styles the header row of any sheet
function applyHeaderStyle(sheet, numCols) {
  var hdr = sheet.getRange(1, 1, 1, numCols);
  hdr.setBackground(THEME.navyDeep)
     .setFontColor(THEME.white)
     .setFontFamily(FONT)
     .setFontSize(11)
     .setFontWeight("bold")
     .setHorizontalAlignment("center")
     .setVerticalAlignment("middle");
  sheet.setRowHeight(1, 32);
  sheet.setFrozenRows(1);
}

// Styles match rows: alternating navy A/B, red field label, blue score cells
function applyMatchSheetStyle(sheet, rowCount) {
  if (rowCount < 1) return;
  applyHeaderStyle(sheet, 9);

  for (var r = 0; r < rowCount; r++) {
    var rowNum = r + 2;
    var isA = (r % 2 === 0);

    // Full row
    sheet.getRange(rowNum, 1, 1, 9)
      .setBackground(isA ? THEME.teamA : THEME.teamB)
      .setFontColor(THEME.offWhite)
      .setFontFamily(FONT)
      .setFontSize(11)
      .setVerticalAlignment("middle");

    // Field label (col 1) — red badge
    sheet.getRange(rowNum, 1)
      .setBackground(THEME.redAccent)
      .setFontColor(THEME.white)
      .setFontWeight("bold")
      .setHorizontalAlignment("center");

    // MMR (col 6) — gold
    sheet.getRange(rowNum, 6)
      .setFontColor(THEME.goldAccent)
      .setFontWeight("bold")
      .setHorizontalAlignment("center");

    // Score cells (cols 7-9) — dark blue input
    sheet.getRange(rowNum, 7, 1, 3)
      .setBackground(THEME.scoreBlue)
      .setFontColor(THEME.scoreText)
      .setFontFamily(FONT)
      .setFontSize(13)
      .setFontWeight("bold")
      .setHorizontalAlignment("center");

    sheet.setRowHeight(rowNum, 28);
  }

  // Column widths
  sheet.setColumnWidth(1, 90);
  sheet.setColumnWidth(2, 185);
  sheet.setColumnWidth(3, 75);
  sheet.setColumnWidth(4, 195);
  sheet.setColumnWidth(5, 215);
  sheet.setColumnWidth(6, 80);
  sheet.setColumnWidth(7, 90);
  sheet.setColumnWidth(8, 145);
  sheet.setColumnWidth(9, 145);
}

// ========================================================
// 1. USER INTERFACE MENU INITIALIZER
// ========================================================
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🏆 Liga Real Pro X Conveyor')
    .addItem('🔄 1. Sync Check-Ins & Update Base Only', 'manualSyncAndFlush')
    .addSeparator()
    .addItem('🎲 2. Generate Live Active Matches', 'generateLiveMatchesInitial')
    .addItem('📋 3. Queue Next On-Deck Matchup', 'generateNextOnDeckMatchup')
    .addItem('💾 4. Submit Live Scores & Advance Pipeline', 'submitLiveScoresAndAdvance')
    .addSeparator()
    .addItem('🤝 Register Custom Team Formation', 'registerCustomTeamFromSelection')
    .addItem('🧹 Reset Daily Session Attendance', 'clearAttendanceClearBoard')
    .addToUi();
}

function safeAlert(message) {
  try {
    var ui = SpreadsheetApp.getUi();
    if (ui) ui.alert(message);
  } catch (e) {
    Logger.log("Alert omitted: " + message);
  }
}

// ========================================================
// 2. CUSTOM TEAM REGISTRATION UTILITY
// ========================================================
function registerCustomTeamFromSelection() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var playerSheet = ss.getSheetByName("Player_Database");
  var customTeamSheet = ss.getSheetByName("Custom_Teams") || ss.insertSheet("Custom_Teams");

  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt("Create Custom Team", "Enter a unique Custom Team Name:", ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() !== ui.Button.OK) return;
  var teamName = response.getResponseText().trim();
  if (!teamName) {
    safeAlert("Team Name cannot be blank.");
    return;
  }

  var activeRange = playerSheet.getActiveRange();
  if (!activeRange) {
    safeAlert("Please highlight the row(s) or Player ID cells in the Player Database first!");
    return;
  }

  var values = activeRange.getValues();
  var detectedIds = [];

  for (var r = 0; r < values.length; r++) {
    for (var c = 0; c < values[r].length; c++) {
      var val = values[r][c].toString().trim().toUpperCase();
      if (val.match(/^P\d+$/)) {
        detectedIds.push(val);
      }
    }
  }

  detectedIds = detectedIds.filter((item, index) => detectedIds.indexOf(item) === index);

  if (detectedIds.length === 0) {
    safeAlert("No valid Player IDs (e.g., P001, P002) found in your highlighted selection.");
    return;
  }

  var fullDbData = playerSheet.getDataRange().getValues();
  var updatedCount = 0;

  for (var i = 1; i < fullDbData.length; i++) {
    var dbId = fullDbData[i][0].toString().trim().toUpperCase();
    if (detectedIds.indexOf(dbId) !== -1) {
      var currentCredits = Number(fullDbData[i][10]) || 0;
      if (currentCredits < 1) {
        safeAlert("Warning: Player " + dbId + " does not have enough tournament credits to register! Add credits first.");
        return;
      }
      fullDbData[i][8] = teamName;
      updatedCount++;
    }
  }

  playerSheet.getDataRange().setValues(fullDbData);

  if (customTeamSheet.getLastRow() === 0) {
    customTeamSheet.appendRow(["Timestamp", "Custom Team Name", "Roster Size", "Player IDs Linked"]);
    applyHeaderStyle(customTeamSheet, 4);
  }
  customTeamSheet.appendRow([new Date(), teamName, detectedIds.length, detectedIds.join(", ")]);

  safeAlert("Success! Registered team '" + teamName + "' with " + updatedCount + " players. They are locked for priority selection.");
}

// ========================================================
// 3. ISOLATED SYNC ENGINE: FORM RESPONSES -> DATABASE
// ========================================================
function syncFormCheckInsToDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var formSheet = ss.getSheetByName("Form Responses 2");
  var playerSheet = ss.getSheetByName("Player_Database");

  if (!formSheet || !playerSheet) return 0;

  var formData = formSheet.getDataRange().getValues();
  var playerLastRow = playerSheet.getLastRow();
  if (playerLastRow < 2) return 0;

  var playerRange = playerSheet.getRange(1, 1, playerLastRow, 15);
  var playerData = playerRange.getValues();

  var dbRowMap = {};
  for (var i = 1; i < playerData.length; i++) {
    var id = playerData[i][0] ? playerData[i][0].toString().trim().toUpperCase() : "";
    if (id) dbRowMap[id] = i;
  }

  var activeUpdatesCount = 0;

  for (var j = 1; j < formData.length; j++) {
    var rawTimestamp = formData[j][0];
    var pId = formData[j][1] ? formData[j][1].toString().trim().toUpperCase() : "";
    var statusInput = formData[j][2] ? formData[j][2].toString().trim().toLowerCase() : "";

    if (!pId || dbRowMap[pId] === undefined) continue;

    var targetRowIdx = dbRowMap[pId];
    var currentStatus = playerData[targetRowIdx][5] ? playerData[targetRowIdx][5].toString().trim() : "";

    if (currentStatus === "Suspended" || currentStatus === "Banned") continue;

    var formattedTime = rawTimestamp
      ? Utilities.formatDate(new Date(rawTimestamp), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss")
      : Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");

    var isCheckingOut = (statusInput.indexOf("out") !== -1 || statusInput.indexOf("done") !== -1 || statusInput.indexOf("not") !== -1);

    if (isCheckingOut) {
      playerData[targetRowIdx][5] = "Not Playing";
    } else {
      playerData[targetRowIdx][5] = "Checked-In";
      playerData[targetRowIdx][14] = formattedTime;
    }
    activeUpdatesCount++;
  }

  playerRange.setValues(playerData);

  // Refresh Player_Database row colors after sync
  applyHeaderStyle(playerSheet, 15);
  for (var k = 1; k < playerData.length; k++) {
    var st = playerData[k][5] ? playerData[k][5].toString().trim() : "Not Playing";
    var bg = THEME.notPlaying, fg = "#6c757d";
    if (st === "Checked-In")  { bg = THEME.checkedIn;  fg = "#155724"; }
    if (st === "Suspended")   { bg = THEME.suspended;  fg = "#856404"; }
    if (st === "Banned")      { bg = THEME.banned;     fg = "#721c24"; }
    playerSheet.getRange(k + 1, 1, 1, 15)
      .setBackground(bg).setFontColor(fg)
      .setFontFamily(FONT).setFontSize(11);
  }

  SpreadsheetApp.flush();
  return activeUpdatesCount;
}

function manualSyncAndFlush() {
  var count = syncFormCheckInsToDatabase();
  safeAlert("Sync Complete! Re-processed " + count + " entries.");
}

// ========================================================
// 4. OPERATIONAL ENGINE (FLEXIBLE PRIORITY CUSTOM GROUPS)
// ========================================================
function draftPoolsEngine(excludeLivePlayers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var playerSheet = ss.getSheetByName("Player_Database");
  var matchSheet = ss.getSheetByName("Live_Active_Matches") || ss.insertSheet("Live_Active_Matches");
  var onDeckSheet = ss.getSheetByName("On_Deck_Matches");

  var totalFieldsAvailable = Number(matchSheet.getRange("L1").getValue()) || 3;
  var teamSizeConfig = Number(matchSheet.getRange("L2").getValue()) || 5;
  var matchCapacityRequirement = teamSizeConfig * 2;

  syncFormCheckInsToDatabase();

  var lockedPlayerIds = {};

  [matchSheet, onDeckSheet].forEach(sheet => {
    if (excludeLivePlayers && sheet) {
      var d = sheet.getDataRange().getValues();
      for (var m = 1; m < d.length; m++) {
        var ids = d[m][3] ? d[m][3].toString() : "";
        if (ids) ids.split(",").forEach(id => { var c = id.trim().toUpperCase(); if (c) lockedPlayerIds[c] = true; });
      }
    }
  });

  var lastRow = playerSheet.getLastRow();
  var playerRange = playerSheet.getRange(1, 1, lastRow, 15);
  var data = playerRange.getValues();

  var customTeamGroups = {};
  var strictMenPool = [];
  var strictWomenPool = [];
  var coedPool = [];
  var nameMap = {};

  // PHASE 1: COLLECT AND ROUTE POOLS
  for (var i = 1; i < data.length; i++) {
    var pId = data[i][0] ? data[i][0].toString().trim().toUpperCase() : "";
    var pName = data[i][1] ? data[i][1].toString().trim() : "";
    var pMmr = Number(data[i][2]) || 1000;
    var status = data[i][5] ? data[i][5].toString().trim() : "Not Playing";
    var customTeamVal = data[i][8] ? data[i][8].toString().trim() : "None";
    var pDiv = data[i][6] ? data[i][6].toString().trim() : "Coed";
    var pGender = data[i][7] ? data[i][7].toString().trim() : "Coed";
    var gamesToday = Number(data[i][9]) || 0;
    var credits = Number(data[i][10]) || 0;
    var rawTime = data[i][14];

    if (!pId) continue;
    nameMap[pId] = pName;

    if (status === "Checked-In") {
      if (excludeLivePlayers && lockedPlayerIds[pId]) continue;

      var playerObj = {
        id: pId, name: pName, mmr: pMmr, divisionPref: pDiv,
        gender: pGender, games: gamesToday, checkedInTime: rawTime ? new Date(rawTime).getTime() : 0,
        dbIndex: i
      };

      if (customTeamVal !== "None" && customTeamVal !== "" && credits > 0) {
        if (!customTeamGroups[customTeamVal]) customTeamGroups[customTeamVal] = [];
        customTeamGroups[customTeamVal].push(playerObj);
      } else {
        if (pDiv.indexOf("Men") !== -1) strictMenPool.push(playerObj);
        else if (pDiv.indexOf("Women") !== -1) strictWomenPool.push(playerObj);
        else coedPool.push(playerObj);
      }
    }
  }

  // Sort free agents by priority before filling gaps
  var structuralPools = { "Men": strictMenPool, "Women": strictWomenPool, "Coed": coedPool };
  for (var key in structuralPools) {
    structuralPools[key].sort(function(a, b) {
      if (a.games !== b.games) return a.games - b.games;
      if (a.checkedInTime !== b.checkedInTime) return a.checkedInTime - b.checkedInTime;
      return b.mmr - a.mmr;
    });
  }

  var finalOutputRows = [];
  var globalFieldCounter = 1;

  // PHASE 2: FLEXIBLE PRIORITY SEEDING (DUOS, TRIPLES, QUADS, FULL TEAMS)
  for (var teamGroupName in customTeamGroups) {
    var teamRoster = customTeamGroups[teamGroupName];
    var rosterSize = teamRoster.length;

    if (rosterSize >= 2 && globalFieldCounter <= totalFieldsAvailable) {

      var sampleDiv = teamRoster[0].divisionPref;
      var targetPool = structuralPools["Coed"];
      if (sampleDiv.indexOf("Men") !== -1 && structuralPools["Men"].length >= (teamSizeConfig - rosterSize)) targetPool = structuralPools["Men"];
      else if (sampleDiv.indexOf("Women") !== -1 && structuralPools["Women"].length >= (teamSizeConfig - rosterSize)) targetPool = structuralPools["Women"];

      while (teamRoster.length < teamSizeConfig && targetPool.length > 0) {
        teamRoster.push(targetPool.shift());
      }

      if (teamRoster.length === teamSizeConfig) {
        var avgMmr = Math.round(teamRoster.reduce((sum, p) => sum + p.mmr, 0) / teamSizeConfig);

        var sizeLabel = "Full Custom";
        if (rosterSize === 4) sizeLabel = "Quad Group";
        else if (rosterSize === 3) sizeLabel = "Trio Group";
        else if (rosterSize === 2) sizeLabel = "Duo Group";

        var opponents = [];
        var targetOppPool = structuralPools["Coed"].length >= teamSizeConfig ? structuralPools["Coed"] : (structuralPools["Men"].length >= teamSizeConfig ? structuralPools["Men"] : structuralPools["Women"]);

        if (targetOppPool.length >= teamSizeConfig) {
          opponents = targetOppPool.splice(0, teamSizeConfig);
        }

        if (opponents.length === teamSizeConfig) {
          var oppAvgMmr = Math.round(opponents.reduce((sum, p) => sum + p.mmr, 0) / teamSizeConfig);

          teamRoster.forEach(p => {
            if (p.dbIndex !== undefined) {
              data[p.dbIndex][8] = "None";
              data[p.dbIndex][10] = Math.max(0, (Number(data[p.dbIndex][10]) || 1) - 1);
            }
          });

          finalOutputRows.push([
            "Field " + globalFieldCounter, teamGroupName + " (⭐ " + sizeLabel + ")", sampleDiv,
            teamRoster.map(p => p.id).join(", "), teamRoster.map(p => nameMap[p.id]).join(", "),
            avgMmr, "", "", ""
          ]);

          finalOutputRows.push([
            "Field " + globalFieldCounter, "Challengers Team (🟠 Orange)", sampleDiv,
            opponents.map(p => p.id).join(", "), opponents.map(p => nameMap[p.id]).join(", "),
            oppAvgMmr, "", "", ""
          ]);

          globalFieldCounter++;
        }
      }
    }
  }

  playerRange.setValues(data);

  if (coedPool.length < matchCapacityRequirement) {
    while (coedPool.length > 0) {
      var movingPlayer = coedPool.shift();
      if (movingPlayer.gender === "Men") strictMenPool.push(movingPlayer);
      else if (movingPlayer.gender === "Women") strictWomenPool.push(movingPlayer);
    }
  }

  // PHASE 3: RESIDUAL CASUAL SNAKE DRAFT (FREE AGENTS SECOND)
  var divisionsList = ["Men", "Women", "Coed"];
  divisionsList.forEach(div => {
    var pool = structuralPools[div];
    var draftTeamsPossible = Math.floor(pool.length / teamSizeConfig);

    if (draftTeamsPossible >= 2) {
      var pairsPossible = Math.floor(draftTeamsPossible / 2);

      if (globalFieldCounter > totalFieldsAvailable) return;
      if ((globalFieldCounter + pairsPossible - 1) > totalFieldsAvailable) {
        pairsPossible = totalFieldsAvailable - globalFieldCounter + 1;
      }

      var totalDraftedPlayers = pairsPossible * 2 * teamSizeConfig;
      var draftPool = pool.splice(0, totalDraftedPlayers);

      draftPool.sort((a, b) => b.mmr - a.mmr);
      var localTeamsCount = pairsPossible * 2;
      var localTeams = Array.from({ length: localTeamsCount }, (_, idx) => ({
        name: div + " Team " + (idx + 1),
        division: div,
        players: []
      }));

      for (var p = 0; p < draftPool.length; p++) {
        var round = Math.floor(p / localTeamsCount);
        var peerIndex = p % localTeamsCount;
        var targetTeamIndex = (round % 2 === 0) ? peerIndex : (localTeamsCount - 1 - peerIndex);
        localTeams[targetTeamIndex].players.push(draftPool[p]);
      }

      for (var f = 0; f < pairsPossible; f++) {
        var teamA = localTeams[f * 2];
        var teamB = localTeams[(f * 2) + 1];
        var avgMmrA = Math.round(teamA.players.reduce((sum, p) => sum + p.mmr, 0) / teamSizeConfig);
        var avgMmrB = Math.round(teamB.players.reduce((sum, p) => sum + p.mmr, 0) / teamSizeConfig);

        finalOutputRows.push([
          "Field " + globalFieldCounter, teamA.name + " (🟢 Green)", div,
          teamA.players.map(p => p.id).join(", "), teamA.players.map(p => nameMap[p.id]).join(", "),
          avgMmrA, "", "", ""
        ]);
        finalOutputRows.push([
          "Field " + globalFieldCounter, teamB.name + " (🟠 Orange)", div,
          teamB.players.map(p => p.id).join(", "), teamB.players.map(p => nameMap[p.id]).join(", "),
          avgMmrB, "", "", ""
        ]);
        globalFieldCounter++;
      }
    }
  });

  return finalOutputRows;
}

// ========================================================
// 5. PIPELINE GENERATION INTERFACES
// ========================================================
function generateLiveMatchesInitial() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var matchSheet = ss.getSheetByName("Live_Active_Matches") || ss.insertSheet("Live_Active_Matches");
  var adminBackupConfig = matchSheet.getRange("K1:L2").getValues();

  var matches = draftPoolsEngine(false);

  matchSheet.clear();
  matchSheet.appendRow(["Field", "Team ID", "Division", "Player IDs", "Player Names", "Avg MMR", "Goals Scored", "Yellow Cards (IDs)", "Red Cards (IDs)"]);

  if (matches.length > 0) {
    matchSheet.getRange(2, 1, matches.length, 9).setValues(matches);
    applyMatchSheetStyle(matchSheet, matches.length);
    safeAlert("Matches generated! Custom groups (Full, Quads, Trios, Duos) successfully prioritized on main fields.");
  } else {
    applyHeaderStyle(matchSheet, 9);
    safeAlert("No active matches could be drafted. Check attendance metrics.");
  }
  matchSheet.getRange("K1:L2").setValues(adminBackupConfig);
}

function generateNextOnDeckMatchup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var onDeckSheet = ss.getSheetByName("On_Deck_Matches") || ss.insertSheet("On_Deck_Matches");

  var matches = draftPoolsEngine(true);
  onDeckSheet.clear();
  onDeckSheet.appendRow(["Field", "Team ID", "Division", "Player IDs", "Player Names", "Avg MMR", "Goals Scored", "Yellow Cards (IDs)", "Red Cards (IDs)"]);

  if (matches.length > 0) {
    onDeckSheet.getRange(2, 1, matches.length, 9).setValues(matches);
    applyMatchSheetStyle(onDeckSheet, matches.length);
    safeAlert("On-Deck pipeline populated with remaining priority groups!");
  } else {
    applyHeaderStyle(onDeckSheet, 9);
    safeAlert("Pipeline refreshed, but no unassigned player combinations remain.");
  }
}

function submitLiveScoresAndAdvance() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var matchSheet = ss.getSheetByName("Live_Active_Matches");
  var onDeckSheet = ss.getSheetByName("On_Deck_Matches");
  var playerSheet = ss.getSheetByName("Player_Database");
  var historySheet = ss.getSheetByName("Match_History_Log") || ss.insertSheet("Match_History_Log");
  var winnersSheet = ss.getSheetByName("Tournament_Winners") || ss.insertSheet("Tournament_Winners");

  var adminBackupConfig = matchSheet.getRange("K1:L2").getValues();
  var matchData = matchSheet.getDataRange().getValues();
  var onDeckData = onDeckSheet.getDataRange().getValues();
  var playerData = playerSheet.getDataRange().getValues();

  var rowMap = {};
  for (var i = 1; i < playerData.length; i++) {
    if (playerData[i][0]) rowMap[playerData[i][0].toString().trim().toUpperCase()] = i;
  }

  if (matchData.length >= 3) {
    var roundTeams = [];
    var timestamp = new Date();
    var historyLogs = [];

    for (var m = 1; m < matchData.length; m += 2) {
      if ((m + 1) >= matchData.length) break;
      var rowA = matchData[m];
      var rowB = matchData[m + 1];

      if (rowA[0] === "" || rowA[0].toString().indexOf("Field") === -1) continue;

      if (rowA[6] === "" || rowB[6] === "") {
        safeAlert("Submission blocked: Goals are missing from active matches.");
        return;
      }

      var goalsA = Number(rowA[6]) || 0;
      var goalsB = Number(rowB[6]) || 0;
      var yellowText = (rowA[7] ? rowA[7].toString().trim() : "") + "," + (rowB[7] ? rowB[7].toString().trim() : "");
      var redText = (rowA[8] ? rowA[8].toString().trim() : "") + "," + (rowB[8] ? rowB[8].toString().trim() : "");

      var ptsA = goalsA > goalsB ? 3 : (goalsA === goalsB ? 1 : 0);
      var ptsB = goalsB > goalsA ? 3 : (goalsA === goalsB ? 1 : 0);

      historyLogs.push([timestamp, rowA[0], rowA[1], rowB[1], goalsA, goalsB, rowA[3], rowA[4], rowB[3], rowB[4], yellowText, redText]);

      roundTeams.push({ name: rowA[1], ids: rowA[3].toString().split(","), gf: goalsA, ga: goalsB, gd: goalsA - goalsB, matchPts: ptsA, yellow: yellowText, red: redText });
      roundTeams.push({ name: rowB[1], ids: rowB[3].toString().split(","), gf: goalsB, ga: goalsA, gd: goalsB - goalsA, matchPts: ptsB, yellow: yellowText, red: redText });
    }

    if (historyLogs.length > 0) {
      if (historySheet.getLastRow() === 0) {
        historySheet.appendRow(["Timestamp", "Field", "Team A", "Team B", "Score A", "Score B", "Team A IDs", "Team A Names", "Team B IDs", "Team B Names", "Yellows", "Reds"]);
        applyHeaderStyle(historySheet, 12);
      }
      historySheet.getRange(historySheet.getLastRow() + 1, 1, historyLogs.length, 12).setValues(historyLogs);
    }

    roundTeams.sort((a, b) => (b.matchPts !== a.matchPts) ? (b.matchPts - a.matchPts) : (b.gd - a.gd));
    var multipliers = [2.0, 1.7, 1.5, 1.2, 1.2, 1.2];
    var winnerLogs = [];

    for (var t = 0; t < roundTeams.length; t++) {
      var teamRankMult = multipliers[t] || 1.0;
      var team = roundTeams[t];
      if (t < 6) {
        winnerLogs.push([timestamp, t + 1, team.name, team.ids.join(", "), (team.gd >= 0 ? "+" : "") + team.gd, teamRankMult + "x"]);
      }
      updatePersonalProfileMemory(team, teamRankMult, rowMap, playerData, playerSheet);
    }

    if (winnerLogs.length > 0) {
      if (winnersSheet.getLastRow() <= 1) {
        winnersSheet.clearContents();
        winnersSheet.appendRow(["Timestamp", "Rank", "Team", "Player IDs", "Goal Diff", "Multiplier"]);
        applyHeaderStyle(winnersSheet, 6);
      }
      if (winnersSheet.getLastRow() > 1) winnersSheet.getRange(2, 1, winnersSheet.getLastRow() - 1, 6).clearContent();
      winnersSheet.getRange(2, 1, winnerLogs.length, 6).setValues(winnerLogs);

      // Gold / silver / bronze / remaining rows
      var podiumColors = [
        ["#ffd60a", "#0d1b2a"],
        ["#c0c0c0", "#1a1a2e"],
        ["#cd7f32", "#ffffff"],
      ];
      for (var w = 0; w < winnerLogs.length; w++) {
        var wRange = winnersSheet.getRange(w + 2, 1, 1, 6);
        wRange.setFontFamily(FONT).setFontSize(11);
        if (w < 3) {
          wRange.setBackground(podiumColors[w][0]).setFontColor(podiumColors[w][1]).setFontWeight("bold");
        } else {
          wRange.setBackground(THEME.navyLight).setFontColor(THEME.offWhite);
        }
      }
    }

    playerSheet.getRange(1, 1, playerData.length, 15).setValues(playerData);
  }

  matchSheet.clear();
  matchSheet.appendRow(["Field", "Team ID", "Division", "Player IDs", "Player Names", "Avg MMR", "Goals Scored", "Yellow Cards (IDs)", "Red Cards (IDs)"]);
  applyHeaderStyle(matchSheet, 9);
  matchSheet.getRange("K1:L2").setValues(adminBackupConfig);

  if (onDeckData.length >= 2) {
    var extractedOnDeckRows = onDeckSheet.getRange(2, 1, onDeckSheet.getLastRow() - 1, 9).getValues();
    matchSheet.getRange(2, 1, extractedOnDeckRows.length, 9).setValues(extractedOnDeckRows);
    applyMatchSheetStyle(matchSheet, extractedOnDeckRows.length);

    onDeckSheet.clear();
    onDeckSheet.appendRow(["Field", "Team ID", "Division", "Player IDs", "Player Names", "Avg MMR", "Goals Scored", "Yellow Cards (IDs)", "Red Cards (IDs)"]);
    applyHeaderStyle(onDeckSheet, 9);
    safeAlert("Scores submitted. Sidelined rosters advanced to live game grids!");
  } else {
    safeAlert("Scores saved. Sidelined pipeline empty.");
  }
}

// ========================================================
// 6. ACCURATE ALGORITHM MATH & CONDITIONAL ROW COLORING
// ========================================================
function updatePersonalProfileMemory(team, multiplier, rowMap, playerData, playerSheet) {
  var currentTimestampString = Utilities.formatDate(new Date(), SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(), "yyyy-MM-dd HH:mm:ss");
  var isDraw = (team.gd === 0);
  var isCleanSheet = (team.ga === 0);

  team.ids.forEach(function(rawId) {
    var id = rawId.trim().toUpperCase();
    var rowIndex = rowMap[id];
    if (rowIndex !== undefined) {
      var currentMmr = Number(playerData[rowIndex][2]) || 1000;
      var currentPoints = Number(playerData[rowIndex][3]) || 0;
      var currentGamesToday = Number(playerData[rowIndex][9]) || 0;
      var careerGames = Number(playerData[rowIndex][11]) || 0;
      var yellowCardsCount = Number(playerData[rowIndex][12]) || 0;
      var redCardsCount = Number(playerData[rowIndex][13]) || 0;

      var basePerformance = 10;
      var offensiveBonus = team.gf * 5;
      var drawBonus = isDraw ? 8 : 0;
      var cleanSheetBonus = isCleanSheet ? 8 : 0;

      var localPerformanceSum = basePerformance + offensiveBonus + drawBonus + cleanSheetBonus;
      var scaledCalculatedPoints = Math.round(localPerformanceSum * multiplier);

      var disciplinaryDeduction = 0;
      var bookingStatusUpdate = "Checked-In";

      var stringYellowTokens = team.yellow.toUpperCase().split(",");
      var stringRedTokens = team.red.toUpperCase().split(",");

      if (stringYellowTokens.indexOf(id) !== -1) {
        yellowCardsCount += 1;
        disciplinaryDeduction += 15;
        bookingStatusUpdate = "Suspended";
        playerSheet.getRange(rowIndex + 1, 1, 1, 15)
          .setBackground(THEME.yellowCard)
          .setFontColor("#856404")
          .setFontFamily(FONT);
      }

      if (stringRedTokens.indexOf(id) !== -1) {
        redCardsCount += 1;
        disciplinaryDeduction += 25;
        bookingStatusUpdate = "Banned";
        playerSheet.getRange(rowIndex + 1, 1, 1, 15)
          .setBackground(THEME.redCard)
          .setFontColor("#721c24")
          .setFontFamily(FONT);
      }

      var totalRoundPointsYield = scaledCalculatedPoints - disciplinaryDeduction;
      var newPoints = Math.max(0, currentPoints + totalRoundPointsYield);

      var won = team.matchPts === 3;
      var mmrChange = (won ? 15 : (isDraw ? 0 : -10)) + team.gd;
      var newMmr = Math.max(100, currentMmr + mmrChange);

      var tier = "🥉 Bronze";
      if (newMmr >= 1600) tier = "💎 Diamond";
      else if (newMmr >= 1400) tier = "🥇 Gold";
      else if (newMmr >= 1200) tier = "🥈 Silver";

      playerData[rowIndex][2] = newMmr;
      playerData[rowIndex][3] = newPoints;
      playerData[rowIndex][4] = tier;

      if (bookingStatusUpdate !== "Checked-In") {
        playerData[rowIndex][5] = bookingStatusUpdate;
      } else {
        playerData[rowIndex][5] = "Checked-In";
      }

      playerData[rowIndex][9] = currentGamesToday + 1;
      playerData[rowIndex][11] = careerGames + 1;
      playerData[rowIndex][12] = yellowCardsCount;
      playerData[rowIndex][13] = redCardsCount;
      playerData[rowIndex][14] = currentTimestampString;
    }
  });
}

// ========================================================
// 7. DATA RESET CONTROL
// ========================================================
function clearAttendanceClearBoard() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var playerSheet = ss.getSheetByName("Player_Database");
  var formSheet = ss.getSheetByName("Form Responses 2");

  if (playerSheet) {
    var lastRow = playerSheet.getLastRow();
    if (lastRow >= 2) {
      playerSheet.getRange(2, 6, lastRow - 1, 1).setValue("Not Playing");
      playerSheet.getRange(2, 9, lastRow - 1, 1).setValue("None");
      playerSheet.getRange(2, 10, lastRow - 1, 1).setValue(0);
      playerSheet.getRange(2, 15, lastRow - 1, 1).clearContent();
      playerSheet.getRange(2, 1, lastRow - 1, 15)
        .setBackground(THEME.notPlaying)
        .setFontColor("#6c757d")
        .setFontFamily(FONT)
        .setFontSize(11);
    }
  }

  if (formSheet) {
    var formHeader = formSheet.getRange(1, 1, 1, formSheet.getLastRow()).getValues();
    formSheet.clear();
    formSheet.getRange(1, 1, 1, formHeader[0].length).setValues(formHeader);
  }

  var sheetsToClear = ["Live_Active_Matches", "On_Deck_Matches"];
  sheetsToClear.forEach(name => {
    var sh = ss.getSheetByName(name);
    if (sh) {
      var backup = (name === "Live_Active_Matches") ? sh.getRange("K1:L2").getValues() : null;
      sh.clear();
      sh.appendRow(["Field", "Team ID", "Division", "Player IDs", "Player Names", "Avg MMR", "Goals Scored", "Yellow Cards (IDs)", "Red Cards (IDs)"]);
      applyHeaderStyle(sh, 9);
      if (backup) sh.getRange("K1:L2").setValues(backup);
    }
  });

  safeAlert("Session wiped cleanly. Disciplinary styles and custom assignments have reset.");
}

// ========================================================
// 8. WEB APP ENDPOINT (doPost / doGet)
// ========================================================
// Called by the React app to log game results and player sign-ups
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);
    data.timestamp = data.timestamp || new Date().toISOString();

    var sheetName = data.sheet || 'Results';
    delete data.sheet;

    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    if (sheet.getLastColumn() === 0 || sheet.getLastRow() === 0) {
      var headers = Object.keys(data);
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      applyHeaderStyle(sheet, headers.length);
    }

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

function doGet(e) {
  return ContentService
    .createTextOutput('Liga Real Pro API is live! Sheets: Results, Registrations')
    .setMimeType(ContentService.MimeType.TEXT);
}
