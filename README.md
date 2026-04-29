# Emondt Materiaalapp — Installatiehandleiding

## 📁 Bestanden op de server plaatsen

Upload alle onderstaande bestanden naar de root van je webserver (HTTPS vereist):

| Bestand | Omschrijving |
|---|---|
| `index.html` | De app |
| `manifest.json` | PWA-configuratie |
| `sw.js` | Service Worker (offline) |
| `icon-192.png` | App-icoon Android |
| `icon-512.png` | App-icoon groot |
| `apple-touch-icon.png` | App-icoon iPhone/iPad |
| `favicon-32.png` | Browser-tabicoon |
| `favicon-16.png` | Browser-tabicoon klein |

---

## 🗂️ Google Sheets koppelen

### Stap 1 — Google Sheet aanmaken

1. Ga naar sheets.google.com en maak een nieuw spreadsheet
2. Hernoem het eerste tabblad naar: **Artikelen**
3. Zet in rij 1 deze exacte kolomnamen:

   | A | B | C | D | E |
   |---|---|---|---|---|
   | code | naam | cat | subcat | eenheid |

4. Importeer `artikelen_export.csv` via **Bestand → Importeren → Uploaden**
   - Scheidingsteken: Komma
   - Voeg in op huidige blad (vervang niet de sheet zelf)

### Stap 2 — Google Apps Script aanmaken

1. Ga in de Google Sheet naar **Extensies → Apps Script**
2. Verwijder alle bestaande code
3. Kopieer de inhoud van `google-apps-script.js` en plak deze in het scriptvenster
4. Zoek: `const SHEET_ID = 'JOUW_SHEET_ID_HIER';`
5. Vervang `JOUW_SHEET_ID_HIER` door jouw Sheet ID uit de URL:
   - URL: `https://docs.google.com/spreadsheets/d/`**[SHEET_ID]**`/edit`
6. Sla op (Ctrl+S)

### Stap 3 — Deployen als Web App

1. Klik op **Implementeren** → **Nieuwe implementatie**
2. Klik op het tandwiel naast "Selecteer type" → **Webapplicatie**
3. Instellingen:
   - Uitvoeren als: **Ik**
   - Toegang: **Iedereen**
4. Klik **Implementeren** en geef toestemming
5. **Kopieer de Web App URL** (begint met https://script.google.com/macros/s/...)

### Stap 4 — URL invoeren in de app

1. Open de app → Hamburgermenu → **Beheer** (wachtwoord: `Eg@2026!#`)
2. Plak de Web App URL in het veld **Google Sheets koppeling**
3. Klik **Verbinding testen** — verwacht: ✅ Verbinding OK
4. Klik **Artikelen herladen**

De URL wordt opgeslagen en hoeft niet opnieuw ingevoerd te worden.

---

## ✏️ Artikelen beheren in Google Sheets

Wijzigingen zijn direct actief na het herladen van de app (hamburgermenu → Beheer → Artikelen herladen).

**Geldige categorieën (cat-kolom):**
Afvoermaterialen · Bevestigingsmateriaal · Diversen · Elektra · Isolatie · Koeltechnische hulpstukken · Koperleiding · Tape & Lijmen · Waterzijdig

**Subcategorieën (subcat-kolom):** Vrij in te vullen. Laat leeg voor geen subcategorie.

---

## 📱 PWA installeren

**Android (Chrome):** Drie puntjes → "Toevoegen aan beginscherm"
**iPhone/iPad (Safari):** Deelicoon → "Zet op beginscherm"

---

## 🔐 Beheerpagina

Wachtwoord: `Eg@2026!#` — Via hamburgermenu onderaan

---

*Ontworpen door Ruben Brinks — Emondt Groep*
