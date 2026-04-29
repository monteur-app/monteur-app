/**
 * ══════════════════════════════════════════════════════════════
 *  Emondt Materiaalapp — Google Apps Script API
 *  Plak dit script in: script.google.com → Nieuw project
 *  Koppel het aan jouw Google Sheet via SHEET_ID hieronder
 * ══════════════════════════════════════════════════════════════
 *
 *  KOLOMMEN IN DE SHEET (rij 1 = headers, exact deze namen):
 *  code | naam | cat | subcat | eenheid | leverancier
 *
 *  DEPLOYINSTRUCTIES (zie README voor screenshots):
 *  1. Klik op "Implementeren" → "Nieuwe implementatie"
 *  2. Type: Webapplicatie
 *  3. Uitvoeren als: Ik (jouw Google-account)
 *  4. Toegang: Iedereen
 *  5. Klik "Implementeren" en kopieer de Web App URL
 *  6. Plak die URL in index.html bij SHEETS_API_URL
 */

// ── CONFIGURATIE ──────────────────────────────────────────────
const SHEET_ID   = 'JOUW_SHEET_ID_HIER';   // ← vervang dit
const SHEET_NAAM = 'Artikelen';             // ← tabblad naam

// ── CORS HEADERS ──────────────────────────────────────────────
function setCors(output) {
  return output
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ── GET: artikelen ophalen ────────────────────────────────────
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAAM);
    const data  = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim().toLowerCase());

    const artikelen = data.slice(1)
      .filter(rij => rij[0]) // sla lege rijen over
      .map(rij => {
        const obj = {};
        headers.forEach((h, i) => obj[h] = String(rij[i] || '').trim());
        return obj;
      });

    const payload = JSON.stringify({ status: 'ok', artikelen, count: artikelen.length });
    return setCors(ContentService.createTextOutput(payload).setMimeType(ContentService.MimeType.JSON));

  } catch (err) {
    const error = JSON.stringify({ status: 'error', message: err.message });
    return setCors(ContentService.createTextOutput(error).setMimeType(ContentService.MimeType.JSON));
  }
}

// ── POST: artikel toevoegen of bijwerken ─────────────────────
function doPost(e) {
  try {
    const body   = JSON.parse(e.postData.contents);
    const actie  = body.actie; // 'toevoegen' | 'bijwerken' | 'verwijderen'
    const sheet  = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAAM);
    const data   = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim().toLowerCase());
    const codeIdx = headers.indexOf('code');

    if (actie === 'toevoegen') {
      const rij = headers.map(h => body.artikel[h] || '');
      sheet.appendRow(rij);
      return setCors(ContentService.createTextOutput(JSON.stringify({ status: 'ok', actie })).setMimeType(ContentService.MimeType.JSON));
    }

    if (actie === 'bijwerken' || actie === 'verwijderen') {
      const zoekCode = body.code;
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][codeIdx]).trim() === zoekCode) {
          if (actie === 'verwijderen') {
            sheet.deleteRow(i + 1);
          } else {
            headers.forEach((h, j) => {
              if (body.artikel[h] !== undefined) sheet.getRange(i + 1, j + 1).setValue(body.artikel[h]);
            });
          }
          return setCors(ContentService.createTextOutput(JSON.stringify({ status: 'ok', actie })).setMimeType(ContentService.MimeType.JSON));
        }
      }
      return setCors(ContentService.createTextOutput(JSON.stringify({ status: 'niet_gevonden' })).setMimeType(ContentService.MimeType.JSON));
    }

    return setCors(ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Onbekende actie' })).setMimeType(ContentService.MimeType.JSON));

  } catch (err) {
    return setCors(ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.message })).setMimeType(ContentService.MimeType.JSON));
  }
}

// ── OPTIONS: preflight voor CORS ─────────────────────────────
function doOptions() {
  return setCors(ContentService.createTextOutput(''));
}
