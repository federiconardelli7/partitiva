import { describe, expect, it } from 'vitest'
import { cents, type Cents } from '../src/money'
import { invertiNetto } from '../src/inverso'

// Meccanica del solver su funzioni sintetiche deterministiche: la fedeltà fiscale
// è nei golden (golden-inverso.test.ts), qui si fissa il contratto dell'algoritmo.

const identita = (x: Cents): Cents => x

describe('invertiNetto — meccanica', () => {
  it('restituisce il più piccolo euro intero con netto ≥ obiettivo', () => {
    const r = invertiNetto(12_345, identita, { massimoCents: 100_000 })
    expect(r).toEqual({ lordoCents: 12_400, nettoCents: 12_400 })
  })

  it('obiettivo zero o negativo: basta lordo zero', () => {
    expect(invertiNetto(0, identita, { massimoCents: 10_000 })).toEqual({ lordoCents: 0, nettoCents: 0 })
    expect(invertiNetto(-5_000, identita, { massimoCents: 10_000 })).toEqual({ lordoCents: 0, nettoCents: 0 })
  })

  it('obiettivo oltre il massimo di ricerca: null', () => {
    expect(invertiNetto(20_000, identita, { massimoCents: 10_000 })).toBeNull()
  })

  it('netto che RICADE sotto l’obiettivo: espone anche il lordo stabile', () => {
    // Gradino sintetico: sopra l'obiettivo tra 60 e 100 €, ricade a zero tra 100 e 120 €.
    const gradino = (x: Cents): Cents => cents(x < 10_000 ? x : x < 12_000 ? 0 : x)
    const r = invertiNetto(6_000, gradino, { massimoCents: 20_000, passoCents: 1_000 })
    expect(r).toEqual({
      lordoCents: 6_000,
      nettoCents: 6_000,
      lordoStabileCents: 12_000,
      nettoStabileCents: 12_000,
    })
  })

  it('ricaduta che arriva fino al massimo di ricerca: null (non stabile)', () => {
    const gradino = (x: Cents): Cents => cents(x < 5_000 ? x : 0)
    expect(invertiNetto(3_000, gradino, { massimoCents: 10_000, passoCents: 1_000 })).toBeNull()
  })

  it('massimo non multiplo del passo: l’ultimo punto valutato è il massimo', () => {
    const r = invertiNetto(1_050, identita, { massimoCents: 1_100, passoCents: 1_000 })
    expect(r).toEqual({ lordoCents: 1_100, nettoCents: 1_100 })
  })

  it('rifiuta massimo o passo non in euro interi (e obiettivi non interi)', () => {
    expect(() => invertiNetto(1_000, identita, { massimoCents: 12_345 })).toThrow(/multiplo/)
    expect(() => invertiNetto(1_000, identita, { massimoCents: 0 })).toThrow(/multiplo/)
    expect(() => invertiNetto(1_000, identita, { massimoCents: 10_000, passoCents: 150 })).toThrow(/multiplo/)
    expect(() => invertiNetto(1_000, identita, { massimoCents: 10_000, passoCents: 0 })).toThrow(/multiplo/)
    expect(() => invertiNetto(10.5, identita, { massimoCents: 10_000 })).toThrow(/intero/)
  })
})
