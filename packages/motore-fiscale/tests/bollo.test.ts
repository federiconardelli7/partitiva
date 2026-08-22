import { describe, expect, it } from 'vitest'
import { bolloPerFattura } from '../src/bollo'
import { cents } from '../src/money'
import { getParams } from '../src/params'

describe('bollo — 2,00 € sopra 77,47 € (DPR 642/1972)', () => {
  const params = getParams(2026)

  it('fattura del caso campione (4.385,00) → bollo 2,00', () => {
    expect(bolloPerFattura(cents(438_500), params)).toBe(200)
  })

  it('fattura da 50,00 → nessun bollo', () => {
    expect(bolloPerFattura(cents(5_000), params)).toBe(0)
  })

  it('la soglia è esclusiva: 77,47 → 0; 77,48 → 2,00', () => {
    expect(bolloPerFattura(cents(7_747), params)).toBe(0)
    expect(bolloPerFattura(cents(7_748), params)).toBe(200)
  })
})
