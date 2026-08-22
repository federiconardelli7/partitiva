// Formati italiani in UI (1.234,56 € — gg/mm/aaaa), ISO negli storage.

// useGrouping 'always': il CLDR italiano non raggrupperebbe sotto le 5 cifre (1234,56),
// ma i documenti fiscali italiani scrivono sempre 1.234,56.
const euroFormatter = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
  useGrouping: 'always',
})

export function formatEuro(cents: number): string {
  return euroFormatter.format(cents / 100)
}

export function formatPercento(rate: number): string {
  return `${(rate * 100).toLocaleString('it-IT', { maximumFractionDigits: 2 })}%`
}

export function formatDataIt(iso: string): string {
  const [anno, mese, giorno] = iso.split('-')
  return `${giorno}/${mese}/${anno}`
}

/**
 * "1.234,56" | "1234,56" | "1234.56" | "1234" | "1.500" → centesimi; null se non interpretabile.
 * Il punto seguito da gruppi di 3 cifre è separatore di MIGLIAIA (1.500 = 1.500,00 €).
 */
export function parseImportoIt(testo: string): number | null {
  const pulito = testo.trim()
  if (pulito.length === 0) return null
  const senzaMigliaia = /^\d{1,3}(\.\d{3})+$/.test(pulito) ? pulito.replace(/\./g, '') : pulito
  const normalizzato = senzaMigliaia.includes(',')
    ? senzaMigliaia.replace(/\./g, '').replace(',', '.')
    : senzaMigliaia
  const valore = Number(normalizzato)
  if (!Number.isFinite(valore) || valore < 0) return null
  return Math.round(valore * 100)
}

/** Data LOCALE in ISO (yyyy-mm-dd): mai UTC, o a mezzanotte italiana si scriverebbe ieri. */
export function oggiIso(adesso: Date = new Date()): string {
  const mese = String(adesso.getMonth() + 1).padStart(2, '0')
  const giorno = String(adesso.getDate()).padStart(2, '0')
  return `${adesso.getFullYear()}-${mese}-${giorno}`
}
