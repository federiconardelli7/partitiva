import type { ValutaOriginale } from './tipi'

// Pattern osservato nelle descrizioni: "USD $5,000.00 convertiti in data 15/07 al cambio 0,877".
// Best effort: se non matcha, nessun metadato e nessun errore.
const PATTERN =
  /(?<valuta>[A-Z]{3})?\s*\$?\s*(?<importo>\d[\d.,]*)\s+convertit\w*\s+in data\s+(?<data>[\d/]+)\s+al cambio\s+(?<cambio>[\d.,]+)/i

export function estraiValutaOriginale(descrizione: string): ValutaOriginale | null {
  const match = PATTERN.exec(descrizione)
  if (!match?.groups) return null
  const { valuta, importo, data, cambio } = match.groups
  if (!importo || !cambio) return null

  // Importo in formato anglosassone (5,000.00): virgole = migliaia.
  const importoNumero = Number(importo.replace(/,/g, ''))
  const cambioNumero = Number(cambio.replace(',', '.'))
  if (!Number.isFinite(importoNumero) || !Number.isFinite(cambioNumero)) return null

  return {
    valuta: valuta?.toUpperCase() ?? 'USD',
    importoOriginaleCents: Math.round(importoNumero * 100),
    cambio: cambioNumero,
    ...(data ? { dataTesto: data } : {}),
  }
}
