# Kummelnäskartan

En gemensam karta för grannaktiviteter i Kummelnäs, som Halloween och promenadloppisar. Den som är med i ett event
lägger in sin adress, och huset dyker upp på kartan så att andra ser var de kan gå.

- **Frontend:** Vite + React + TypeScript + Leaflet (OpenStreetMap), hostad på GitHub Pages.
- **Data:** ett Google Sheet med en flik per event.
- **"Backend":** ett Google Apps Script som hör till Sheetet (`apps-script/Code.gs`). Google kör det gratis.
  Det läser och skriver rader och omvandlar adresser till koordinater med Googles geokodning.
  Det behövs eftersom en statisk sida inte kan skriva till ett Sheet utan att lägga ut inloggningsuppgifter.

## Hur ändra/ta bort fungerar utan inloggning

När man anmäler sig skapar servern en hemlig **token**. Den sparas i webbläsaren, så samma telefon kan ändra eller
ta bort anmälan. Man kan också spara en *ändringslänk* (`#/e/<event>/andra/<token>`) för att ändra från en annan enhet.
Tokens finns bara i Sheetet och skickas aldrig ut i den publika listan.

## Sätta upp Google Sheet + Apps Script (ca 5 min)

1. Skapa ett nytt Google Sheet, t.ex. "Kummelnäskartan".
2. Döp om första fliken till **`halloween-2026`**. Fliknamnet måste vara exakt samma som `id` i `src/events.ts`.
   Rubrikraden skapas automatiskt.
3. Välj **Tillägg → Apps Script**. Ersätt innehållet i `Code.gs` med innehållet i [`apps-script/Code.gs`](apps-script/Code.gs) och spara.
4. Välj funktionen `authorize` i rullistan och tryck **Kör**. Godkänn behörigheterna (Sheets + Maps).
5. **Distribuera → Ny distribution → Typ: Webbapp**
   - *Kör som:* Jag
   - *Vem har åtkomst:* **Alla**
6. Kopiera webbappens URL (slutar på `/exec`) och klistra in den i `SCRIPT_URL` i [`src/config.ts`](src/config.ts).

> Ändrar du `Code.gs` senare: **Distribuera → Hantera distributioner → Redigera → Ny version**, annars körs den gamla koden.

## Publicera på GitHub Pages

1. Under **Settings → Pages → Build and deployment → Source** i repot: välj **GitHub Actions**.
2. Pusha till `main`, eller kör workflowet *Deploy till GitHub Pages* manuellt under **Actions**.
3. Sidan hamnar på `https://antonwestman.github.io/kummelnaskartan/`.

## Lägga till ett nytt event

1. Lägg till en ny flik i Sheetet, t.ex. `promenadloppis-2027`.
2. Lägg till eventet i `EVENTS` överst i `apps-script/Code.gs` med samma id och när det går att lägga
   in hus (`signupOpensAt`, `signupClosesAt`, med tidszon, `null` = ingen gräns). Klistra in i Apps Script
   och publicera en ny version.
3. Lägg till eventet i `src/events.ts` med samma `id`, `startsAt` och `endsAt`.

### Tider

| Var | Fält | Styr |
|---|---|---|
| `apps-script/Code.gs` | `signupOpensAt`, `signupClosesAt` | När man kan lägga till och ändra hus. Skriptet spärrar, sidan följer. Ta bort går alltid. |
| `src/events.ts` | `startsAt`, `endsAt` | Om eventet listas under "På gång" eller "Tidigare event", och Event-data för Google. |

Tider skrivs med tidszon: `2026-11-01T00:00:00+01:00` (vintertid) eller `+02:00` (sommartid). Eventet får automatiskt en egen sida
   (`kummelnaskartan.se/<id>/`) med titel, beskrivning och Event-data för Google, och hamnar i sitemap.xml.

## Sidor och sökmotorer

Appen använder vanliga sökvägar (`/`, `/halloween-2026/`). Efter `vite build` kör
`scripts/prerender.ts` och skriver en färdig HTML-fil per sida, med titel, beskrivning, Open Graph,
strukturerad data (schema.org) och synligt innehåll, plus `404.html` som fångar övriga adresser
(t.ex. ändringslänkar) och `sitemap.xml`. Gamla `#/`-länkar skickas vidare till de nya adresserna.

## Säkerhet

- Ändra/ta bort kräver anmälans hemliga token. Tokens visas aldrig publikt.
- Bara flikar listade i `EVENT_IDS` kan läsas eller skrivas. Andra flikar i Sheetet är skyddade.
- Högst `MAX_CREATES_PER_MINUTE` nya anmälningar per minut (totalt) och `MAX_ENTRIES_PER_EVENT` per event.
- Vem som helst kan lägga in en adress. Håll koll på Sheetet och radera rader som ser fel ut.

## Utveckling

```bash
npm install
npm run dev      # lokal server
npm test         # tester
npm run lint
npm run build
```

## Integritet

Adresser, namn och meddelanden syns publikt på kartan. Själva Sheetet är privat. Apps Scriptet skickar bara ut de
publika fälten. Vill du ta bort en anmälan manuellt räcker det att radera raden i Sheetet.
