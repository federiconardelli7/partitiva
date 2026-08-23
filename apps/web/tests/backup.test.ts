import { describe, expect, it } from 'vitest'
import type { Fattura, Profilo } from '../src/db'
import { deserializzaBackup, serializzaBackup } from '../src/lib/backup'

const profilo: Profilo = { id: 1, annoApertura: 2025, ateco: '62.02.00', coefficiente: 0.67, copertura: 'piena' }
const fatture: Fattura[] = [
  { id: 3, numero: '3', dataEmissione: '2026-12-28', dataIncasso: '2027-01-05', importoCents: 250_000, bolloCents: 200, descrizione: 'dic→gen' },
]

describe('backup JSON (export/import)', () => {
  it('round-trip senza perdita', () => {
    const json = serializzaBackup(profilo, fatture, [], '2026-08-22')
    const letto = deserializzaBackup(json)
    expect(letto.profilo).toEqual(profilo)
    expect(letto.fatture).toEqual(fatture)
    expect(letto.schemaVersion).toBe(2)
  })

  it('round-trip v2 coi riepiloghi annuali', () => {
    const riepiloghi = [{ anno: 2025, incassatoCents: 2_400_000, bolliCents: 200 }]
    const letto = deserializzaBackup(serializzaBackup(profilo, fatture, riepiloghi, '2026-08-22'))
    expect(letto.riepiloghi).toEqual(riepiloghi)
  })

  it('un file v1 salvato in passato si importa ancora (riepiloghi vuoti)', () => {
    const v1 = JSON.stringify({ schemaVersion: 1, esportatoIl: '2026-08-22', profilo, fatture })
    const letto = deserializzaBackup(v1)
    expect(letto.schemaVersion).toBe(2)
    expect(letto.riepiloghi).toEqual([])
    expect(letto.fatture).toEqual(fatture)
  })

  it('import di JSON non valido → errore esplicito', () => {
    expect(() => deserializzaBackup('{"schemaVersion":99}')).toThrow(/backup/i)
    expect(() => deserializzaBackup('non-json')).toThrow()
  })

  it('annoApertura fuori dagli anni coperti dai params → import rifiutato (mai pagina bianca)', () => {
    const passato = serializzaBackup({ ...profilo, annoApertura: 2015 }, [], [], '2026-08-22')
    expect(() => deserializzaBackup(passato)).toThrow(/backup/i)
    const futuro = serializzaBackup({ ...profilo, annoApertura: new Date().getFullYear() + 1 }, [], [], '2026-08-22')
    expect(() => deserializzaBackup(futuro)).toThrow(/backup/i)
  })
})
