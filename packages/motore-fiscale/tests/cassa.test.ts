import { describe, expect, it } from 'vitest'
import { aggregaIncassato } from '../src/cassa'
import { cents } from '../src/money'

describe('principio di cassa — aggregaIncassato', () => {
  const pagamenti = [
    { importoCents: cents(438_500), dataIncasso: '2026-07-20' },
    { importoCents: cents(100_000), dataIncasso: '2026-12-28' },
    // fattura emessa il 28/12/2026 ma incassata il 05/01/2027 → conta nel 2027 (golden di TESTING.md)
    { importoCents: cents(250_000), dataIncasso: '2027-01-05' },
  ]

  it('somma solo gli incassi dell’anno solare richiesto', () => {
    expect(aggregaIncassato(pagamenti, 2026)).toBe(538_500)
  })

  it('la fattura di dicembre incassata a gennaio appartiene all’anno dopo', () => {
    expect(aggregaIncassato(pagamenti, 2027)).toBe(250_000)
  })

  it('anno senza incassi → 0', () => {
    expect(aggregaIncassato(pagamenti, 2025)).toBe(0)
    expect(aggregaIncassato([], 2026)).toBe(0)
  })
})
