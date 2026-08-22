import { computeTimeline } from '@partitiva/motore-fiscale'
import { describe, expect, it } from 'vitest'
import type { Fattura } from '../src/db'
import { anniResiduiStartup, bolliPerAnno, buildTimelineInputs } from '../src/lib/bilancio'

const profilo = { annoApertura: 2025, coefficiente: 0.67, copertura: 'piena' as const }

const fatture: Fattura[] = [
  { id: 1, numero: '1', dataEmissione: '2025-03-10', dataIncasso: '2025-03-15', importoCents: 2_400_000, bolloCents: 200, descrizione: '' },
  { id: 2, numero: '2', dataEmissione: '2026-05-05', dataIncasso: '2026-05-10', importoCents: 7_500_000, bolloCents: 200, descrizione: '' },
  // emessa a dicembre 2026, incassata a gennaio 2027 → per cassa è del 2027
  { id: 3, numero: '3', dataEmissione: '2026-12-28', dataIncasso: '2027-01-05', importoCents: 250_000, bolloCents: 200, descrizione: '' },
  // emessa e mai incassata → non conta per cassa, il bollo sì (competenza emissione)
  { id: 4, numero: '4', dataEmissione: '2026-06-01', dataIncasso: null, importoCents: 100_000, bolloCents: 200, descrizione: '' },
]

describe('dal registro fatture agli input del motore', () => {
  it('aggrega gli incassi per anno solare della DATA DI INCASSO', () => {
    const inputs = buildTimelineInputs(profilo, fatture, 2027)
    expect(inputs.map((i) => i.anno)).toEqual([2025, 2026, 2027])
    expect(inputs[0]?.incassatoCents).toBe(2_400_000)
    expect(inputs[1]?.incassatoCents).toBe(7_500_000) // la n.3 NON conta nel 2026
    expect(inputs[2]?.incassatoCents).toBe(250_000) // …conta nel 2027
  })

  it('i bolli seguono l’anno di EMISSIONE, incassata o no', () => {
    expect(bolliPerAnno(fatture, 2026)).toBe(600) // n.2 + n.3 + n.4
    const inputs = buildTimelineInputs(profilo, fatture, 2026)
    expect(inputs[1]?.bolliCents).toBe(600)
  })

  it('startup segue l’anno di apertura e il parametro anniStartup', () => {
    const inputs = buildTimelineInputs(profilo, fatture, 2027)
    expect(inputs.every((i) => i.startup)).toBe(true) // 2025–2027 nei primi 5 anni
    expect(anniResiduiStartup(2025, 2025)).toBe(4)
    expect(anniResiduiStartup(2025, 2029)).toBe(0)
  })

  it('gli input alimentano la timeline del motore senza errori e con la catena giusta', () => {
    const timeline = computeTimeline(buildTimelineInputs(profilo, fatture, 2026))
    expect(timeline.anni[2026]?.redditoCents).toBe(5_025_000)
    expect(timeline.anni[2026]?.bolliCents).toBe(600)
  })
})
