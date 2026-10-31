/**
 * Snyggar till en adress för visning, utan att ändra det som är sparat:
 * "Regentvägen 1, 132 37 Saltsjö-Boo" → "Regentvägen 1"
 * "7 Frövägen, 132 37 Stockholm, Sverige" → "Frövägen 7"
 * "Kummelnäsvägen, 64" → "Kummelnäsvägen 64"
 */
export function displayAddress(address: string): string {
  const cleaned = address
    .replace(/,?\s*\b\d{3}\s?\d{2}\b[^,]*/g, '') // postnummer och ort
    .replace(/,\s*(sverige|sweden)\s*$/i, '')
    .replace(/,\s*(saltsjö-?\s?boo|nacka|stockholm)\s*$/i, '')
    .replace(/,\s*(?=\d)/, ' ') // "Kummelnäsvägen, 64"
    .replace(/\s+/g, ' ')
    .trim()
  // "7 Frövägen" → "Frövägen 7"
  return cleaned.replace(/^(\d+\s?[a-zåäö]?)\s+(\D.*)$/i, '$2 $1')
}
