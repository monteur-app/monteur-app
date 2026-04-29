/**
 * ══════════════════════════════════════════════════════════════
 *  Emondt Materiaalapp — Google Apps Script API  v2
 *  Plak dit script in: script.google.com → Nieuw project
 * ══════════════════════════════════════════════════════════════
 *
 *  STAP 1 — Vul SHEET_ID in (zie URL van jouw Google Sheet)
 *  STAP 2 — Deploy als Web App:
 *            Implementeren → Nieuwe implementatie → Webapplicatie
 *            Uitvoeren als : Ik
 *            Toegang       : Iedereen   ← BELANGRIJK
 *  STAP 3 — Kopieer de Web App URL en plak in de app (Beheer)
 *
 *  LET OP: na elke codewijziging opnieuw deployen via
 *          Implementeren → Bestaande implementaties beheren → Bewerken
 *
 *  KOLOMMEN IN DE SHEET (rij 1 = headers, exact deze namen):
 *  code | naam | cat | subcat | eenheid | leverancier
 */

// ── CONFIGURATIE ──────────────────────────────────────────────
const SHEET_ID   = 'JOUW_SHEET_ID_HIER';  // ← vervang dit
const SHEET_NAAM = 'Artikelen';            // ← tabblad naam in Google Sheet

// ── CORS / JSONP OUTPUT HELPER ────────────────────────────────
// Google Apps Script Web Apps sturen van nature CORS-headers mee
// bij Toegang = Iedereen. Deze helper zorgt voor correcte JSON output.
function jsonOutput(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── GET: artikelen ophalen ────────────────────────────────────
function doGet(e) {
  try {
    const ss    = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAAM);

    if (!sheet) {
      return jsonOutput({ status: 'error', message: `Tabblad "${SHEET_NAAM}" niet gevonden. Controleer de tabnaam in de Sheet.` });
    }

    const data    = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim().toLowerCase());

    const artikelen = data
      .slice(1)
      .filter(rij => String(rij[0]).trim() !== '') // sla lege rijen over
      .map(rij => {
        const obj = {};
        headers.forEach((h, i) => {
          obj[h] = String(rij[i] ?? '').trim();
        });
        return obj;
      });

    return jsonOutput({ status: 'ok', artikelen: artikelen, count: artikelen.length });

  } catch (err) {
    return jsonOutput({ status: 'error', message: err.message });
  }
}

// ── POST: artikel toevoegen, bijwerken of verwijderen ─────────
function doPost(e) {
  try {
    const body  = JSON.parse(e.postData.contents);
    const actie = body.actie; // 'toevoegen' | 'bijwerken' | 'verwijderen'

    const sheet   = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAAM);
    const data    = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim().toLowerCase());
    const codeIdx = headers.indexOf('code');

    // ── TOEVOEGEN ────────────────────────────────────────────
    if (actie === 'toevoegen') {
      const rij = headers.map(h => body.artikel[h] || '');
      sheet.appendRow(rij);
      return jsonOutput({ status: 'ok', actie });
    }

    // ── BIJWERKEN / VERWIJDEREN ───────────────────────────────
    if (actie === 'bijwerken' || actie === 'verwijderen') {
      const zoekCode = String(body.code).trim();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][codeIdx]).trim() === zoekCode) {
          if (actie === 'verwijderen') {
            sheet.deleteRow(i + 1);
          } else {
            headers.forEach((h, j) => {
              if (body.artikel[h] !== undefined) {
                sheet.getRange(i + 1, j + 1).setValue(body.artikel[h]);
              }
            });
          }
          return jsonOutput({ status: 'ok', actie });
        }
      }
      return jsonOutput({ status: 'niet_gevonden', code: body.code });
    }

    return jsonOutput({ status: 'error', message: `Onbekende actie: ${actie}` });

  } catch (err) {
    return jsonOutput({ status: 'error', message: err.message });
  }
}
