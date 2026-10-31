/**
 * Kummelnäskartan – backend som körs som Google Apps Script-webbapp,
 * kopplad till ett Google Sheet. Varje flik (sheet) = ett event, och
 * flikens namn är eventets id (t.ex. "halloween-2026").
 *
 * Se README.md för installation.
 */

// Endast dessa flikar räknas som event. Lägg till nya här (samma id som i src/events.ts).
// Andra flikar i samma Sheet kan då aldrig läsas eller skrivas via webbappen.
var EVENT_IDS = ['halloween-2026'];

// Skydd mot skräpposter. Gäller totalt för alla besökare (Apps Script ser inte IP-adresser).
var MAX_CREATES_PER_MINUTE = 15;
var MAX_ENTRIES_PER_EVENT = 300;

var HEADERS = ['id', 'token', 'createdAt', 'updatedAt', 'address', 'lat', 'lng', 'name', 'note'];

// Ungefärlig ruta runt Boo (Kummelnäs, Riset, Vikingshill, Eriksvik, Insjön, Kil m.fl.).
// Adresser utanför avvisas så att felaktiga geokodningar inte hamnar på kartan.
var BOUNDS = { south: 59.29, west: 18.15, north: 59.39, east: 18.38 };

var MAX_LENGTH = { address: 120, name: 60, note: 200 };

function doGet(e) {
  return handle_(function () {
    var sheet = getEventSheet_(e.parameter.event);
    var entries = readRows_(sheet).map(publicEntry_);
    return { ok: true, entries: entries };
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
  if (readRows_(sheet).length >= MAX_ENTRIES_PER_EVENT) {
    throw userError_('event_full', 'Kartan är full för det här eventet. Kontakta den som ordnar.');
  }
  checkRateLimit_(body.event);
  var fields = cleanFields_(body);
  rejectDuplicate_(sheet, fields.address, null);
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
    note: fields.note
  };
  sheet.appendRow(HEADERS.map(function (h) { return entry[h]; }));
  return { ok: true, entry: publicEntry_(entry), token: entry.token };
}

function update_(sheet, body) {
  var row = findByToken_(sheet, body.token);
  var fields = cleanFields_(body);
  rejectDuplicate_(sheet, fields.address, row.entry.id);
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
  sheet.getRange(row.rowNumber, 1, 1, HEADERS.length)
    .setValues([HEADERS.map(function (h) { return entry[h]; })]);
  return { ok: true, entry: publicEntry_(entry) };
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
  if (typeof eventId !== 'string' || EVENT_IDS.indexOf(eventId) === -1) {
    throw userError_('unknown_event', 'Eventet finns inte.');
  }
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(eventId);
  if (!sheet) throw userError_('unknown_event', 'Eventet finns inte.');
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
  return sheet;
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
      return entry;
    })
    .filter(function (entry) { return entry.id && isFinite(entry.lat) && isFinite(entry.lng); });
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
    updatedAt: String(entry.updatedAt)
  };
}

/**
 * Samma adress får bara finnas en gång per event. Jämför en förenklad form så att
 * "Kummelnäsvägen 12 A, Saltsjö-Boo" och "kummelnäsvägen 12a" räknas som samma hus.
 */
function rejectDuplicate_(sheet, address, ownId) {
  var key = normalizeAddress_(address);
  var taken = readRows_(sheet).some(function (entry) {
    return entry.id !== ownId && normalizeAddress_(entry.address) === key;
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
    note: clean_(body.note, MAX_LENGTH.note)
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

/** Kör en gång från editorn för att godkänna behörigheter (Sheets + Maps). */
function authorize() {
  Maps.newGeocoder().geocode('Kummelnäsvägen 1, Saltsjö-Boo');
  SpreadsheetApp.getActiveSpreadsheet().getName();
}
