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

### Tid i id:t

Varje gång ett event kommer tillbaka blir det ett nytt event med en ny flik och en tom karta, så att inga
gamla hus ligger kvar. Tiden står i id:t: år för en dag (`halloween-2026`), vinter för en säsong
(`pulkabackar-2026-27`). Nästa vinter kopierar du eventet till `pulkabackar-2027-28` med nya datum (fasta
platser som backar och isbanor följer med i koden). Loppisar pågår hela tiden och har ingen tid i id:t.

### Startsidan

Startsidan visar en karta med allt som händer idag: hus som lyser i pågående event och fasta platser i
säsong, med filter per event. Den hämtar alla event i ett anrop (`?overview=1` i `Code.gs`). Popupen länkar
till eventets sida, där man lägger in sitt hus och ser kommande och släckta. Listan visar pågående event med
antal idag, kommande event och tidigare event med antal hushåll från sammanställningen. Varje event har en
ikon (`icon` i `src/events.ts`).

### Kommande, På gång och Tidigare

`startsAt` och `endsAt` i `src/events.ts` styr var eventet listas på startsidan: "Kommande" innan det börjar,
"På gång" medan det pågår och "Tidigare event" när det är slut. Ett event kan vara en kväll (Halloween) eller
en hel vinter (pulkabackar). Under ett långt event kan grannar ha sitt hus inlagt hela perioden och släcka det
de dagar det inte passar. Öppettiderna gäller varje dag.

### När husen är öppna (loppisar, pulkabackar)

Med `entryDates: { kind: 'own', defaultMode }` i `src/events.ts` och `ownDates: true` i `apps-script/Code.gs`
väljer varje hus själv i formuläret: **tills vidare**, **en dag** eller **en period** (`defaultMode` är förvalt).
Huset lyser när det är öppet (öppettiderna gäller varje dag), syns grått med datum innan, och grått med
"har varit" efter sista dagen tills det tas bort `HIDE_AFTER_DAYS` dagar senare. Tills vidare gäller tills
huset tas bort eller eventet tar slut. Med `entryDates: { kind: 'event' }` (Halloween) finns inga datum.

### Fasta platser (lekplatser, badplatser, allmänna pulkabackar …)

Platser som ingen äger läggs in direkt i `places.items` i `src/events.ts`, inte via formuläret:

```ts
{ id: 'sagsjon-bad', name: 'Sågsjöns badplats', category: 'bad', season: 'summer', lat: 59.346, lng: 18.2806 },
```

- `category` styr ikon och namn (`PLACE_CATEGORIES`): lekplats, bad, isbana, grillplats, utsikt, vindskydd,
  fiske, aktivitet, båtbrygga, pulkabacke. Finns det fler än en kategori kan man filtrera.
- `season` (valfritt): `'summer'` visas juni–augusti, `'winter'` december–mars. Utan säsong visas platsen året runt.
- `note` och `warning` (valfria): en kort beskrivning, och en brasklapp som syns tydligt (t.ex. för naturis).

Koordinater får du genom att högerklicka på platsen i Google Maps.

**Tips från besökare:** under listan står "Vet du en allmän plats som borde vara med? Tipsa om den" (med `tipName`, t.ex. "allmän backe" på pulkakartan). Besökaren väljer vad det är, skriver ett namn
och sätter ut platsen på en karta som börjar på ens egen position. Tipset hamnar i fliken `tips` i Sheetet
(skapas automatiskt, med en länk till Google Maps), och `Code.gs` mejlar det till `TIP_EMAIL`. Tipsen syns
inte på kartan. Lägg in de bra här. Kör `authorize` en gång från Apps Script-editorn så att skriptet får
skicka mejl. Utan `SCRIPT_URL` finns bara en mejllänk.

**Bara platser, inga hus:** med `signup: null` (som "Ute i Kummelnäs") finns inget formulär, och sidan hämtar
inget från Apps Script. Ingen flik i Sheetet och ingen rad i `Code.gs` behövs.

### Tider

| Var | Fält | Styr |
|---|---|---|
| `apps-script/Code.gs` | `signupOpensAt`, `signupClosesAt` | När man kan lägga till och ändra hus. Skriptet spärrar, sidan följer. Ta bort går alltid. |
| `src/events.ts` | `startsAt`, `endsAt` | Om eventet listas under "Kommande", "På gång" eller "Tidigare event", och Event-data för Google. |

Tider skrivs med tidszon: `2026-11-01T00:00:00+01:00` (vintertid) eller `+02:00` (sommartid). Eventet får automatiskt en egen sida
   (`kummelnaskartan.se/<id>/`) med titel, beskrivning och Event-data för Google, och hamnar i sitemap.xml.

### Kolumner i Sheetet

`id`, `token`, `createdAt`, `updatedAt`, `address`, `lat`, `lng`, `name`, `note`, `paused`, `openFrom`, `openUntil`, `date`, `dateTo`.
Nya kolumner läggs till automatiskt. `paused` = TRUE/FALSE (släckt hus). `openFrom`/`openUntil` = klockslag
som `17:00` (kolumnerna sätts till ren text så att Sheets inte gör om dem). När `openUntil` har passerat visas
huset som stängt. `date`/`dateTo` = när huset är öppet, som `2026-11-14`: båda tomma = tills vidare, bara `date` = en dag, båda = en period.

## Sidor och sökmotorer

Appen använder vanliga sökvägar (`/`, `/halloween-2026/`). Efter `vite build` kör
`scripts/prerender.ts` och skriver en färdig HTML-fil per sida, med titel, beskrivning, Open Graph,
strukturerad data (schema.org) och synligt innehåll, plus `404.html` som fångar övriga adresser
(t.ex. ändringslänkar) och `sitemap.xml`. Gamla `#/`-länkar skickas vidare till de nya adresserna.

## Rapporter

I popupen för varje hus och plats finns **Rapportera**. Besökaren väljer vad som är fel (fel information,
inte en allmän plats, sin egen adress utlagd utan lov, eller annat), kan skriva en kommentar och lämna
kontaktuppgifter. Rapporten hamnar i fliken `rapporter` (skapas automatiskt) och mejlas till `TIP_EMAIL`.
**Inget döljs automatiskt.** Ett hus tar du bort genom att radera dess rad i eventets flik. Det sparas
ingenting om vem som lagt in något (inga konton, och Apps Script ser inga IP-adresser), så det går inte
att blockera en person. Spärrarna är `MAX_CREATES_PER_MINUTE`, `MAX_ENTRIES_PER_EVENT` och att stänga
anmälan med `signupClosesAt`.

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

Husen visas bara `HIDE_AFTER_DAYS` (7) dagar efter att anmälan stängt (`signupClosesAt`), eller för loppisar efter
husets eget datum. `cleanUp()` i `Code.gs` raderar sedan raderna. Kör **`installCleanUp`** en gång från
Apps Script-editorn (och godkänn behörigheten) så körs `cleanUp` varje natt. Sidan beskriver detta under
"Om kartan och dina uppgifter", med kontaktadressen `CONTACT_EMAIL` i `src/config.ts`.

Innan husen i ett event raderas sparas en sammanställning i fliken `statistik` (skapas automatiskt): antal hus
och antal per ruta på 250 meter, bara rutor med minst 3 hus. Inga adresser, namn eller exakta positioner.
Sidan för ett avslutat event visar "71 hushåll var med" och rutorna på kartan. Fliken kan inte läsas som ett
event via webbappen. Vill du räkna om ett event, radera dess rad i `statistik` innan husen har raderats.
