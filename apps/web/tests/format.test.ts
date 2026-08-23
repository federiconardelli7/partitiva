import { describe, expect, it } from 'vitest'
import {
  descriviGiorni,
  formatDataIt,
  formatEuro,
  formatEuroIntero,
  oggiIso,
  parseImportoIt,
  propostaDataIncasso,
} from '../src/lib/format'

describe('formati italiani', () => {
  it('parseImportoIt accetta 1.234,56 / 1234,56 / 1234.56 / 1234', () => {
    expect(parseImportoIt('1.234,56')).toBe(123_456)
    expect(parseImportoIt('1234,56')).toBe(123_456)
    expect(parseImportoIt('1234.56')).toBe(123_456)
    expect(parseImportoIt('1234')).toBe(123_400)
    expect(parseImportoIt('12,5')).toBe(1_250)
  })

  it('parseImportoIt: il punto con gruppi di 3 cifre è separatore di migliaia, non decimale', () => {
    expect(parseImportoIt('1.500')).toBe(150_000) // 1.500 € — NON 1,50 €
    expect(parseImportoIt('12.345')).toBe(1_234_500)
    expect(parseImportoIt('1.234.567')).toBe(123_456_700)
  })

  it('oggiIso usa la data LOCALE, non UTC (a mezzanotte italiana non torna ieri)', () => {
    expect(oggiIso(new Date(2026, 11, 31, 23, 30))).toBe('2026-12-31')
    expect(oggiIso(new Date(2027, 0, 1, 0, 30))).toBe('2027-01-01')
    expect(oggiIso(new Date(2026, 0, 5, 12, 0))).toBe('2026-01-05')
  })

  it('parseImportoIt rifiuta vuoto, testo e negativi', () => {
    expect(parseImportoIt('')).toBeNull()
    expect(parseImportoIt('abc')).toBeNull()
    expect(parseImportoIt('-5')).toBeNull()
  })

  it('formatEuro rende il formato italiano', () => {
    expect(formatEuro(123_456)).toContain('1.234,56')
    expect(formatEuro(200)).toContain('2,00')
  })

  it('formatEuroIntero: euro senza decimali per le etichette compatte', () => {
    expect(formatEuroIntero(8_500_000)).toContain('85.000')
    expect(formatEuroIntero(8_500_000)).not.toContain(',')
    expect(formatEuroIntero(10_000_000)).toContain('100.000')
  })

  it('formatDataIt: ISO → gg/mm/aaaa', () => {
    expect(formatDataIt('2026-08-22')).toBe('22/08/2026')
  })

  it('descriviGiorni: mai «tra 0 giorni»', () => {
    expect(descriviGiorni(0)).toBe('oggi')
    expect(descriviGiorni(1)).toBe('domani')
    expect(descriviGiorni(100)).toBe('tra 100 giorni')
  })

  it('propostaDataIncasso: oggi solo per le fatture del mese corrente, altrimenti la data della fattura', () => {
    // fattura del mese corrente: si sta segnando un incasso appena arrivato → oggi
    expect(propostaDataIncasso('2026-08-05', '2026-08-23')).toBe('2026-08-23')
    // fattura storica (import di anni/mesi passati): mai «oggi», l'anno fiscale cambierebbe
    expect(propostaDataIncasso('2025-07-28', '2026-08-23')).toBe('2025-07-28')
    // mesi adiacenti ma diversi: vale la data della fattura
    expect(propostaDataIncasso('2026-07-31', '2026-08-01')).toBe('2026-07-31')
  })
})
