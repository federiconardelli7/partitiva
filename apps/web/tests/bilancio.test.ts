import { computeTimeline } from '@partitiva/motore-fiscale'
import { describe, expect, it } from 'vitest'
import type { Fattura } from '../src/db'
import {
  annoUltimoStartup,
  bolliPerAnno,
  buildTimelineInputs,
  daIncassare,
  giorniA,
  numeroAnnoAttivita,
  prossimoF24,
  settoreProfilo,
} from '../src/lib/bilancio'

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
  })

  it('gli input alimentano la timeline del motore senza errori e con la catena giusta', () => {
    const timeline = computeTimeline(buildTimelineInputs(profilo, fatture, 2026))
    expect(timeline.anni[2026]?.redditoCents).toBe(5_025_000)
    expect(timeline.anni[2026]?.bolliCents).toBe(600)
  })
})

describe('helper della Panoramica', () => {
  it('daIncassare conta e somma solo le fatture senza data di incasso', () => {
    expect(daIncassare(fatture)).toEqual({ conteggio: 1, importoCents: 100_000 })
    expect(daIncassare([])).toEqual({ conteggio: 0, importoCents: 0 })
  })

  it('prossimoF24 è la prima scadenza non ancora passata; null se non ce ne sono', () => {
    const { f24 } = computeTimeline(buildTimelineInputs(profilo, fatture, 2026))
    const prossimo = prossimoF24(f24, '2026-08-22')
    expect(prossimo?.anno).toBe(2026)
    expect(prossimo?.scadenza).toBe('novembre')
    // la timeline fino al 2026 emette anche il luglio 2027 (saldo 2026): dopo quello, nulla
    expect(prossimoF24(f24, '2027-01-01')?.dataScadenza).toBe('2027-07-20')
    expect(prossimoF24(f24, '2027-12-01')).toBeNull()
  })

  it('giorniA conta i giorni di calendario tra due date ISO', () => {
    expect(giorniA('2026-11-30', '2026-08-22')).toBe(100)
    expect(giorniA('2026-08-22', '2026-08-22')).toBe(0)
  })

  it('numeroAnnoAttivita è 1-based: apertura 2025 → il 2026 è il 2º anno', () => {
    expect(numeroAnnoAttivita(2025, 2025)).toBe(1)
    expect(numeroAnnoAttivita(2025, 2026)).toBe(2)
  })

  it('annoUltimoStartup: apertura 2025 e 5 anni di startup → il 5% dura fino al 2029', () => {
    expect(annoUltimoStartup(2025)).toBe(2029)
  })

  it('settoreProfilo: decide l’ATECO; il coefficiente da solo basta solo se univoco', () => {
    // quattro gruppi condividono il 40%: senza ATECO non si può nominare un settore
    expect(settoreProfilo({ ateco: '', coefficiente: 0.4 })).toBeNull()
    expect(settoreProfilo({ ateco: '56.10.11', coefficiente: 0.4 })).toBe(
      'Attività dei servizi di alloggio e di ristorazione',
    )
    // coefficiente univoco → il settore è certo anche senza ATECO
    expect(settoreProfilo({ ateco: '', coefficiente: 0.67 })).toBe('Altre attività economiche')
    // ATECO incoerente col coefficiente scelto a mano → conta il coefficiente (se univoco)
    expect(settoreProfilo({ ateco: '62.02.00', coefficiente: 0.78 })).toBe(
      'Attività professionali, scientifiche, tecniche, sanitarie, di istruzione, servizi finanziari e assicurativi',
    )
    expect(settoreProfilo({ ateco: '99', coefficiente: 0.4 })).toBeNull()
  })
})
