/**
 * Kummelnäskartan – backend som körs som Google Apps Script-webbapp,
 * kopplad till ett Google Sheet. Varje flik (sheet) = ett event, och
 * flikens namn är eventets id (t.ex. "halloween-2026").
 *
 * Se README.md för installation.
 */

// Event som webbappen känner till (samma id som fliknamnet och som i src/events.ts), och
// när det går att lägga till eller ändra hus. Andra flikar i Sheetet kan aldrig nås.
// Tider anges med tidszon: +01:00 vintertid, +02:00 sommartid. null = ingen gräns åt det hållet.
// Att ta bort sitt hus går alltid.
// ownDates: true = varje hus väljer eget datum (t.ex. loppisar). Samma som entryDates: 'own' i src/events.ts.
var EVENTS = {
  'halloween-2026': { signupOpensAt: null, signupClosesAt: '2026-11-01T00:00:00+01:00' },
  'loppisar': { signupOpensAt: null, signupClosesAt: null, ownDates: true },
  'pulkabackar-2026-27': { signupOpensAt: null, signupClosesAt: '2027-04-01T00:00:00+02:00' },
  'skridskor-2026-27': { signupOpensAt: null, signupClosesAt: '2027-04-01T00:00:00+02:00' }
};

// Skydd mot skräpposter. Gäller totalt för alla besökare (Apps Script ser inte IP-adresser).
var MAX_CREATES_PER_MINUTE = 15;
var MAX_ENTRIES_PER_EVENT = 300;

// 'paused' = huset är släckt (syns grått på kartan).
// 'openFrom'/'openUntil' = valfria klockslag "HH:MM", lagras som text.
// 'date' = husets eget datum "YYYY-MM-DD" (bara event med ownDates), lagras som text.
// Nya kolumner läggs till automatiskt i befintliga flikar.
var HEADERS = ['id', 'token', 'createdAt', 'updatedAt', 'address', 'lat', 'lng', 'name', 'note', 'paused', 'openFrom', 'openUntil', 'date'];
var TEXT_COLUMNS = ['openFrom', 'openUntil', 'date'];

// Hur långt fram man kan välja datum när varje hus har eget datum.
var MAX_DAYS_AHEAD = 366;

// Så många dagar efter att anmälan stängt (eller efter husets eget datum) visas husen inte längre,
// och cleanUp() raderar dem. Samma som HIDE_AFTER_DAYS i src/config.ts.
var HIDE_AFTER_DAYS = 7;

// När ett event har passerat sin tid sparas en sammanställning (antal hus och rutor) i en egen flik
// innan husen raderas. Den kan inte nås som event via API:t, bara som sammanställning.
var SUMMARY_SHEET = 'statistik';
var CELL_METERS = 250;
// Rutor med färre hus än så visas inte, så att ingen enskild går att peka ut. De räknas ändå in i totalen.
var MIN_HOUSES_PER_CELL = 3;

// Ungefärlig ruta runt Boo (Kummelnäs, Riset, Vikingshill, Eriksvik, Insjön, Kil m.fl.).
// Adresser utanför avvisas så att felaktiga geokodningar inte hamnar på kartan.
var BOUNDS = { south: 59.29, west: 18.15, north: 59.39, east: 18.38 };

var MAX_LENGTH = { address: 120, name: 60, note: 200 };

function doGet(e) {
  return handle_(function () {
    var eventId = e.parameter.event;
    var sheet = getEventSheet_(eventId);
    var entries = readRows_(sheet)
      .filter(function (entry) { return !isExpired_(eventId, entry); })
      .map(publicEntry_);
    var config = EVENTS[eventId];
    var summary = null;
    if (isEventExpired_(eventId)) {
      var lock = LockService.getScriptLock();
      lock.waitLock(10000);
      try {
        summary = ensureSummary_(eventId, sheet);
      } finally {
        lock.releaseLock();
      }
    }
    return {
      ok: true,
      entries: entries,
      signup: signupState_(eventId),
      signupOpensAt: config.signupOpensAt,
      summary: summary
    };
  });
}

function doPost(e) {
  return handle_(function () {
    var body = JSON.parse(e.postData.contents);
    var sheet = getEventSheet_(body.event);

    if (body.action === 'lookup') return lookup_(sheet, body);

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      switch (body.action) {
        case 'create': return create_(sheet, body);
        case 'update': return update_(sheet, body);
        case 'delete': return remove_(sheet, body);
        case 'setPaused': return setPaused_(sheet, body);
        default: throw userError_('bad_request', 'Okänd åtgärd.');
      }
    } finally {
      lock.releaseLock();
    }
  });
}

// --- Åtgärder ---------------------------------------------------------------

function lookup_(sheet, body) {
  var row = findByToken_(sheet, body.token);
  return { ok: true, entry: publicEntry_(row.entry) };
}

function create_(sheet, body) {
  requireSignupOpen_(body.event);
  if (readRows_(sheet).length >= MAX_ENTRIES_PER_EVENT) {
    throw userError_('event_full', 'Kartan är full för det här eventet. Kontakta den som ordnar.');
  }
  checkRateLimit_(body.event);
  var fields = cleanFields_(body);
  rejectDuplicate_(sheet, fields.address, null);
  var date = entryDate_(body.event, body.date);
  var position = resolvePosition_(fields.address, body.position);
  var now = new Date().toISOString();
  var entry = {
    id: Utilities.getUuid(),
    token: Utilities.getUuid(),
    createdAt: now,
    updatedAt: now,
    address: fields.address,
    lat: position.lat,
    lng: position.lng,
    name: fields.name,
    note: fields.note,
    paused: false,
    openFrom: fields.openFrom,
    openUntil: fields.openUntil,
    date: date
  };
  sheet.appendRow(HEADERS.map(function (h) { return entry[h]; }));
  return { ok: true, entry: publicEntry_(entry), token: entry.token };
}

function update_(sheet, body) {
  requireSignupOpen_(body.event);
  var row = findByToken_(sheet, body.token);
  var fields = cleanFields_(body);
  rejectDuplicate_(sheet, fields.address, row.entry.id);
  var date = entryDate_(body.event, body.date);
  var position = fields.address === row.entry.address && !body.position
    ? { lat: row.entry.lat, lng: row.entry.lng }
    : resolvePosition_(fields.address, body.position);
  var entry = row.entry;
  entry.updatedAt = new Date().toISOString();
  entry.address = fields.address;
  entry.lat = position.lat;
  entry.lng = position.lng;
  entry.name = fields.name;
  entry.note = fields.note;
  entry.openFrom = fields.openFrom;
  entry.openUntil = fields.openUntil;
  entry.date = date;
  writeRow_(sheet, row.rowNumber, entry);
  return { ok: true, entry: publicEntry_(entry) };
}

/** Släck eller tänd sitt hus. Går alltid, även när anmälan har stängt. */
function setPaused_(sheet, body) {
  var row = findByToken_(sheet, body.token);
  var entry = row.entry;
  entry.paused = body.paused === true;
  entry.updatedAt = new Date().toISOString();
  writeRow_(sheet, row.rowNumber, entry);
  return { ok: true, entry: publicEntry_(entry) };
}

function writeRow_(sheet, rowNumber, entry) {
  sheet.getRange(rowNumber, 1, 1, HEADERS.length)
    .setValues([HEADERS.map(function (h) { return entry[h]; })]);
}

function remove_(sheet, body) {
  var row = findByToken_(sheet, body.token);
  sheet.deleteRow(row.rowNumber);
  return { ok: true };
}

// --- Hjälpfunktioner --------------------------------------------------------

function handle_(fn) {
  var result;
  try {
    result = fn();
  } catch (err) {
    result = err && err.userError
      ? { ok: false, error: err.code, message: err.message }
      : { ok: false, error: 'server_error', message: 'Något gick fel. Försök igen.' };
    if (!err || !err.userError) console.error(err);
  }
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function userError_(code, message) {
  var err = new Error(message);
  err.userError = true;
  err.code = code;
  return err;
}

/** Endast flikar i EVENT_IDS räknas som event – inga nya skapas via API:t. */
function getEventSheet_(eventId) {
  if (typeof eventId !== 'string' || !Object.prototype.hasOwnProperty.call(EVENTS, eventId)) {
    throw userError_('unknown_event', 'Eventet finns inte.');
  }
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(eventId);
  if (!sheet) throw userError_('unknown_event', 'Eventet finns inte.');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    formatTextColumns_(sheet);
  } else if (sheet.getRange(1, HEADERS.length).getValue() !== HEADERS[HEADERS.length - 1]) {
    // Äldre flik utan de senaste kolumnerna: skriv om rubrikraden (datan påverkas inte).
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    formatTextColumns_(sheet);
  }
  return sheet;
}

/** Annars gör Sheets om "17:00" och "2026-11-14" till datum – även när man skriver in dem för hand. */
function formatTextColumns_(sheet) {
  TEXT_COLUMNS.forEach(function (name) {
    sheet.getRange(1, HEADERS.indexOf(name) + 1, sheet.getMaxRows(), 1).setNumberFormat('@');
  });
}

/** "HH:MM" eller ''. Klarar också värden som Sheets redan gjort om till klockslag. */
function timeValue_(value) {
  if (value instanceof Date) {
    var tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
    return Utilities.formatDate(value, tz, 'HH:mm');
  }
  return normalizeTime_(value);
}

/** "17", "17.30", "17:30", "1730" -> "17:00"/"17:30". Ogiltigt eller tomt -> ''. */
function normalizeTime_(value) {
  var match = String(value || '').trim().match(/^(\d{1,2})(?:[:.]?(\d{2}))?$/);
  if (!match) return '';
  var hours = Number(match[1]);
  var minutes = Number(match[2] || 0);
  if (hours > 24 || minutes > 59 || (hours === 24 && minutes > 0)) return '';
  if (hours === 24) hours = 0;
  return (hours < 10 ? '0' : '') + hours + ':' + (minutes < 10 ? '0' : '') + minutes;
}

function readRows_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues()
    .map(function (values) {
      var entry = {};
      HEADERS.forEach(function (h, i) { entry[h] = values[i]; });
      entry.lat = Number(entry.lat);
      entry.lng = Number(entry.lng);
      entry.updatedAt = String(entry.updatedAt);
      entry.paused = entry.paused === true || String(entry.paused).toUpperCase() === 'TRUE';
      entry.openFrom = timeValue_(entry.openFrom);
      entry.openUntil = timeValue_(entry.openUntil);
      entry.date = dateValue_(entry.date);
      return entry;
    })
    .filter(function (entry) { return entry.id && isFinite(entry.lat) && isFinite(entry.lng); });
}

/** 'notYetOpen' | 'open' | 'closed' utifrån EVENTS. */
function signupState_(eventId) {
  var config = EVENTS[eventId];
  var now = Date.now();
  if (config.signupOpensAt && now < Date.parse(config.signupOpensAt)) return 'notYetOpen';
  if (config.signupClosesAt && now >= Date.parse(config.signupClosesAt)) return 'closed';
  return 'open';
}

function requireSignupOpen_(eventId) {
  var state = signupState_(eventId);
  if (state === 'closed') {
    throw userError_('signup_closed', 'Det går inte längre att lägga till eller ändra hus för det här eventet.');
  }
  if (state === 'notYetOpen') {
    throw userError_('signup_not_open', 'Det går inte att lägga till hus för det här eventet än.');
  }
}

/** Räknar nya anmälningar per minut och event. Körs inuti låset i doPost. */
function checkRateLimit_(eventId) {
  var cache = CacheService.getScriptCache();
  var key = 'creates:' + eventId + ':' + Math.floor(Date.now() / 60000);
  var count = Number(cache.get(key) || 0);
  if (count >= MAX_CREATES_PER_MINUTE) {
    throw userError_('rate_limited', 'Många anmäler sig just nu. Vänta en minut och försök igen.');
  }
  cache.put(key, String(count + 1), 120);
}

function findByToken_(sheet, token) {
  if (typeof token !== 'string' || !token) throw userError_('not_found', 'Hittade ingen anmälan.');
  var rows = readRows_(sheet);
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].token === token) return { entry: rows[i], rowNumber: i + 2 };
  }
  throw userError_('not_found', 'Hittade ingen anmälan. Den kan redan vara borttagen.');
}

function publicEntry_(entry) {
  return {
    id: String(entry.id),
    address: String(entry.address),
    lat: entry.lat,
    lng: entry.lng,
    name: String(entry.name || ''),
    note: String(entry.note || ''),
    paused: entry.paused === true,
    openFrom: entry.openFrom || '',
    openUntil: entry.openUntil || '',
    date: entry.date || '',
    updatedAt: String(entry.updatedAt)
  };
}

/** "YYYY-MM-DD" eller ''. Klarar också värden som Sheets redan gjort om till datum. */
function dateValue_(value) {
  if (value instanceof Date) {
    var tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
    return Utilities.formatDate(value, tz, 'yyyy-MM-dd');
  }
  var text = String(value || '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
}

/** Dagens datum i Sverige, "YYYY-MM-DD", gärna med ett antal dagar framåt. */
function stockholmDate_(daysAhead) {
  return Utilities.formatDate(new Date(Date.now() + (daysAhead || 0) * 86400000), 'Europe/Stockholm', 'yyyy-MM-dd');
}

/** Husets datum: krävs för event med ownDates (från idag och ett år framåt), annars alltid ''. */
function entryDate_(eventId, value) {
  if (!EVENTS[eventId].ownDates) return '';
  var date = String(value || '').trim();
  var valid = /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date + 'T12:00:00Z'));
  if (!valid) throw userError_('bad_request', 'Välj ett datum.');
  if (date < stockholmDate_(0)) throw userError_('bad_request', 'Datumet har redan varit.');
  if (date > stockholmDate_(MAX_DAYS_AHEAD)) throw userError_('bad_request', 'Datumet ligger för långt fram.');
  return date;
}

/**
 * Samma adress får bara finnas en gång per event. Jämför en förenklad form så att
 * "Kummelnäsvägen 12 A, Saltsjö-Boo" och "kummelnäsvägen 12a" räknas som samma hus.
 */
function rejectDuplicate_(sheet, address, ownId) {
  var key = normalizeAddress_(address);
  var today = stockholmDate_(0);
  var taken = readRows_(sheet).some(function (entry) {
    // Ett hus vars dag har varit räknas inte: då kan man lägga in en ny dag även från en annan telefon.
    var over = entry.date && entry.date < today;
    return entry.id !== ownId && !over && normalizeAddress_(entry.address) === key;
  });
  if (taken) {
    throw userError_(
      'duplicate',
      'Det här huset finns redan på kartan. Har du lagt in det från en annan telefon kan du ändra det därifrån.'
    );
  }
}

function normalizeAddress_(address) {
  return String(address)
    .toLowerCase()
    .replace(/\b\d{3}\s?\d{2}\b/g, ' ') // postnummer
    .replace(/saltsjö-?\s?boo|nacka|sverige|sweden/g, ' ')
    .replace(/[^a-z0-9åäöéü]+/g, ' ')
    .replace(/(\d)\s+([a-zåäö])(?![a-zåäö])/g, '$1$2') // "12 A" -> "12a"
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanFields_(body) {
  var address = clean_(body.address, MAX_LENGTH.address);
  if (!address) throw userError_('bad_request', 'Fyll i en adress.');
  return {
    address: address,
    name: clean_(body.name, MAX_LENGTH.name),
    note: clean_(body.note, MAX_LENGTH.note),
    openFrom: normalizeTime_(body.openFrom),
    openUntil: normalizeTime_(body.openUntil)
  };
}

function clean_(value, maxLength) {
  // Inledande =, +, -, @ skulle tolkas som formel i Sheets.
  return String(value || '').trim().replace(/^[=+\-@]+/, '').slice(0, maxLength);
}

function insideBounds_(lat, lng) {
  return lat >= BOUNDS.south && lat <= BOUNDS.north && lng >= BOUNDS.west && lng <= BOUNDS.east;
}

/** Använd manuellt vald position om den finns, annars geokoda adressen. */
function resolvePosition_(address, position) {
  if (position) {
    var lat = Number(position.lat), lng = Number(position.lng);
    if (!isFinite(lat) || !isFinite(lng) || !insideBounds_(lat, lng)) {
      throw userError_('out_of_bounds', 'Platsen ligger för långt från Kummelnäs.');
    }
    return { lat: lat, lng: lng };
  }

  var query = /nacka|saltsjö-boo|boo/i.test(address) ? address : address + ', Saltsjö-Boo';
  var response = Maps.newGeocoder()
    .setRegion('se')
    .setLanguage('sv')
    .setBounds(BOUNDS.south, BOUNDS.west, BOUNDS.north, BOUNDS.east)
    .geocode(query);

  var results = (response.results || []).filter(function (r) {
    var loc = r.geometry.location;
    return insideBounds_(loc.lat, loc.lng);
  });
  if (results.length === 0) {
    throw userError_('address_not_found', 'Vi hittade inte adressen i Kummelnäs. Markera huset på kartan i stället.');
  }
  var loc = results[0].geometry.location;
  return { lat: loc.lat, lng: loc.lng };
}

/**
 * Har huset passerat sin tid? HIDE_AFTER_DAYS efter att anmälan stängt (signupClosesAt), eller för
 * event där varje hus har eget datum: HIDE_AFTER_DAYS efter husets datum.
 */
function isExpired_(eventId, entry) {
  if (isEventExpired_(eventId)) return true;
  var config = EVENTS[eventId];
  return Boolean(config.ownDates && entry.date && entry.date < stockholmDate_(-HIDE_AFTER_DAYS));
}

/** Hela eventet har passerat sin tid: HIDE_AFTER_DAYS efter att anmälan stängt. */
function isEventExpired_(eventId) {
  var closesAt = EVENTS[eventId].signupClosesAt;
  return Boolean(closesAt) && Date.parse(closesAt) <= Date.now() - HIDE_AFTER_DAYS * 86400000;
}

/**
 * Antal hus och hur många per ruta på ungefär CELL_METERS meter, bara rutor med minst
 * MIN_HOUSES_PER_CELL hus. Inga adresser, namn eller exakta positioner.
 */
function summarize_(entries) {
  var cellLat = CELL_METERS / 111320;
  var cellLng = CELL_METERS / (111320 * Math.cos((BOUNDS.south + BOUNDS.north) / 2 * Math.PI / 180));
  var counts = {};
  entries.forEach(function (entry) {
    var key = Math.floor(entry.lat / cellLat) + ':' + Math.floor(entry.lng / cellLng);
    counts[key] = (counts[key] || 0) + 1;
  });
  var cells = Object.keys(counts)
    .filter(function (key) { return counts[key] >= MIN_HOUSES_PER_CELL; })
    .map(function (key) {
      var parts = key.split(':');
      return { lat: (Number(parts[0]) + 0.5) * cellLat, lng: (Number(parts[1]) + 0.5) * cellLng, count: counts[key] };
    });
  return {
    households: entries.length,
    cellMeters: CELL_METERS,
    cellSize: { lat: cellLat, lng: cellLng },
    minPerCell: MIN_HOUSES_PER_CELL,
    cells: cells
  };
}

/** Sparad sammanställning för eventet, eller en ny från flikens hus om ingen finns. Körs inuti låset. */
function ensureSummary_(eventId, sheet) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var summarySheet = spreadsheet.getSheetByName(SUMMARY_SHEET) || spreadsheet.insertSheet(SUMMARY_SHEET);
  if (summarySheet.getLastRow() === 0) summarySheet.appendRow(['event', 'createdAt', 'summary']);
  var rows = summarySheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === eventId) return JSON.parse(rows[i][2]);
  }
  var summary = summarize_(readRows_(sheet));
  summarySheet.appendRow([eventId, new Date().toISOString(), JSON.stringify(summary)]);
  return summary;
}

/**
 * Raderar hus som har passerat sin tid (se isExpired_) i alla event. Körs varje natt efter
 * att installCleanUp() har körts en gång, men går också att köra för hand från editorn.
 */
function cleanUp() {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var dateColumn = HEADERS.indexOf('date');
    Object.keys(EVENTS).forEach(function (eventId) {
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(eventId);
      if (!sheet || sheet.getLastRow() < 2) return;
      // Spara sammanställningen innan husen raderas.
      if (isEventExpired_(eventId)) ensureSummary_(eventId, sheet);
      var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.length).getValues();
      // Nerifrån och upp, så att radnumren ovanför inte flyttas när en rad tas bort.
      for (var i = values.length - 1; i >= 0; i--) {
        if (isExpired_(eventId, { date: dateValue_(values[i][dateColumn]) })) sheet.deleteRow(i + 2);
      }
    });
  } finally {
    lock.releaseLock();
  }
}

/** Kör en gång från editorn: kör cleanUp() varje natt. Kör du den igen ersätts den gamla schemaläggningen. */
function installCleanUp() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'cleanUp') ScriptApp.deleteTrigger(trigger);
  });
  ScriptApp.newTrigger('cleanUp').timeBased().everyDays(1).atHour(3).create();
}

/** Kör en gång från editorn för att godkänna behörigheter (Sheets + Maps). */
function authorize() {
  Maps.newGeocoder().geocode('Kummelnäsvägen 1, Saltsjö-Boo');
  SpreadsheetApp.getActiveSpreadsheet().getName();
}
