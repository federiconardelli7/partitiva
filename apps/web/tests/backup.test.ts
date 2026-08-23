import { describe, expect, it } from 'vitest'
import type { Fattura, Profilo } from '../src/db'
import { deserializzaBackup, serializzaBackup } from '../src/lib/backup'

const profilo: Profilo = { id: 1, annoApertura: 2025, ateco: '62.02.00', coefficiente: 0.67, copertura: 'piena' }
const fatture: Fattura[] = [
  { id: 3, numero: '3', dataEmissione: '2026-12-28', dataIncasso: '2027-01-05', importoCents: 250_000, bolloCents: 200, descrizione: 'dic→gen' },
]

describe('backup JSON (export/import)', () => {
  it('round-trip senza perdita', () => {
    const json = serializzaBackup(profilo, fatture, [], [], '2026-08-22')
    const letto = deserializzaBackup(json)
    expect(letto.profilo).toEqual(profilo)
    expect(letto.fatture).toEqual(fatture)
    expect(letto.schemaVersion).toBe(3)
  })

  it('round-trip v3 con riepiloghi e spese', () => {
    const riepiloghi = [{ anno: 2025, incassatoCents: 2_400_000, bolliCents: 200 }]
    const spese = [{ id: 1, data: '2026-03-10', importoCents: 12_050, descrizione: 'hosting' }]
    const letto = deserializzaBackup(serializzaBackup(profilo, fatture, riepiloghi, spese, '2026-08-22'))
    expect(letto.riepiloghi).toEqual(riepiloghi)
    expect(letto.spese).toEqual(spese)
  })

  it('i file v1 e v2 salvati in passato si importano ancora', () => {
    const v1 = JSON.stringify({ schemaVersion: 1, esportatoIl: '2026-08-22', profilo, fatture })
    const lettoV1 = deserializzaBackup(v1)
    expect(lettoV1.schemaVersion).toBe(3)
    expect(lettoV1.riepiloghi).toEqual([])
    expect(lettoV1.spese).toEqual([])
    expect(lettoV1.fatture).toEqual(fatture)
    const v2 = JSON.stringify({
      schemaVersion: 2,
      esportatoIl: '2026-08-22',
      profilo,
      fatture,
      riepiloghi: [{ anno: 2025, incassatoCents: 100, bolliCents: 0 }],
    })
    const lettoV2 = deserializzaBackup(v2)
    expect(lettoV2.schemaVersion).toBe(3)
    expect(lettoV2.riepiloghi).toHaveLength(1)
    expect(lettoV2.spese).toEqual([])
  })

  it('import di JSON non valido → errore esplicito', () => {
    expect(() => deserializzaBackup('{"schemaVersion":99}')).toThrow(/backup/i)
    expect(() => deserializzaBackup('non-json')).toThrow()
  })

  it('annoApertura fuori dagli anni coperti dai params → import rifiutato (mai pagina bianca)', () => {
    const passato = serializzaBackup({ ...profilo, annoApertura: 2015 }, [], [], [], '2026-08-22')
    expect(() => deserializzaBackup(passato)).toThrow(/backup/i)
    expect(() => deserializzaBackup(passato)).toThrow(/annoApertura 2015/) // l'errore NOMINA la causa
    const futuro = serializzaBackup({ ...profilo, annoApertura: new Date().getFullYear() + 1 }, [], [], [], '2026-08-22')
    expect(() => deserializzaBackup(futuro)).toThrow(/backup/i)
  })
})
