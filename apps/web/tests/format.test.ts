import { describe, expect, it } from 'vitest'
import { formatDataIt, formatEuro, oggiIso, parseImportoIt } from '../src/lib/format'

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

  it('formatDataIt: ISO → gg/mm/aaaa', () => {
    expect(formatDataIt('2026-08-22')).toBe('22/08/2026')
  })
})
