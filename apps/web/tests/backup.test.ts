import { describe, expect, it } from 'vitest'
import type { Fattura, Profilo } from '../src/db'
import { deserializzaBackup, serializzaBackup } from '../src/lib/backup'

const profilo: Profilo = { id: 1, annoApertura: 2025, ateco: '62.02.00', coefficiente: 0.67, copertura: 'piena' }
const fatture: Fattura[] = [
  { id: 3, numero: '3', dataEmissione: '2026-12-28', dataIncasso: '2027-01-05', importoCents: 250_000, bolloCents: 200, descrizione: 'dic→gen' },
]

describe('backup JSON (export/import)', () => {
  it('round-trip senza perdita', () => {
    const json = serializzaBackup(profilo, fatture, '2026-08-22')
    const letto = deserializzaBackup(json)
    expect(letto.profilo).toEqual(profilo)
    expect(letto.fatture).toEqual(fatture)
    expect(letto.schemaVersion).toBe(1)
  })

  it('import di JSON non valido → errore esplicito', () => {
    expect(() => deserializzaBackup('{"schemaVersion":99}')).toThrow(/backup/i)
    expect(() => deserializzaBackup('non-json')).toThrow()
  })
})
