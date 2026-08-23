import { describe, expect, it } from 'vitest'
import { calcolaAddizionaleRegionale, computeOrdinario, strutturaAddizionaleRegionale } from '../src/index'
import { getParams } from '../src/params'
import { professionista2026 } from './golden/caso-ordinario'

// Addizionale regionale automatica: strutture 2025/2026 verificate su MEF (portale del
// federalismo fiscale) con cross-check AdE Allegato C 730/2026. Quadrature a mano.

const add = (entita: Parameters<typeof strutturaAddizionaleRegionale>[0], anno: number, imponibileEuro: number) =>
  calcolaAddizionaleRegionale(
    (imponibileEuro * 100) as never,
    strutturaAddizionaleRegionale(entita, anno),
  )

describe('addizionale regionale — golden per struttura', () => {
  it('Trento: deduzione-cliff a 30.000 (≤ 30k → zero, oltre → tutto), scaglione 1,73 oltre 50k', () => {
    expect(add('trento', 2026, 30_000)).toBe(0)
    expect(add('trento', 2026, 30_001)).toBe(36_901) // 1,23% sull'intero: 369,01
    expect(add('trento', 2026, 60_000)).toBe(78_800) // AdE: «615 + 1,73% sulla parte eccedente 50.000»
    // 2025 = 2026 (LP 5/2025 ha unificato la deduzione a 30.000 per tutto il 2025)
    expect(add('trento', 2025, 60_000)).toBe(add('trento', 2026, 60_000))
  })

  it('Bolzano: no-tax fino a 35.000, cliff della detrazione a 90.000, rampa equivalente allo scaglione a 75k', () => {
    expect(add('bolzano', 2026, 30_000)).toBe(0) // 369 − 430,50 → clamp a zero
    expect(add('bolzano', 2026, 35_000)).toBe(0) // 430,50 − 430,50: confine esatto della no-tax area
    expect(add('bolzano', 2026, 35_100)).toBe(123) // 431,73 − 430,50 = 1,23
    expect(add('bolzano', 2026, 60_000)).toBe(30_750) // reale: 615+173−50(rampa)−430,50 = 307,50
    expect(add('bolzano', 2026, 100_000)).toBe(135_500) // oltre 90k niente detrazione: 922,50+432,50
  })

  it('Friuli VG: aliquota condizionale sull’INTERO importo (mai per scaglioni)', () => {
    expect(add('friuli-venezia-giulia', 2026, 15_000)).toBe(10_500) // 0,70%
    expect(add('friuli-venezia-giulia', 2026, 15_001)).toBe(18_451) // 1,23% su tutto: lo scalino c'è
    expect(add('friuli-venezia-giulia', 2025, 30_000)).toBe(36_900) // esempio AdE: 369,00
  })

  it('Lazio: flat 1,73 fino a 28k, scaglioni sopra, detrazione a fascia (35k nel 2025 → 30k nel 2026)', () => {
    expect(add('lazio', 2026, 25_000)).toBe(43_250) // 1,73% sull'intero
    expect(add('lazio', 2026, 29_000)).toBe(66_570) // 259,50 + 3,33%×14.000 − 60
    expect(add('lazio', 2026, 31_000)).toBe(79_230) // fuori fascia nel 2026
    expect(add('lazio', 2025, 31_000)).toBe(73_230) // nel 2025 la fascia arrivava a 35.000: −60
  })

  it('Valle d’Aosta: esenzione a scalino a 15.000', () => {
    expect(add('valle-daosta', 2026, 15_000)).toBe(0)
    expect(add('valle-daosta', 2026, 15_001)).toBe(18_451) // 1,23% sull'intero imponibile
  })

  it('griglia previgente a 4 scaglioni (Piemonte 2026) e aliquota unica (Calabria)', () => {
    expect(add('piemonte', 2026, 40_000)).toBe(98_860) // 243 + 348,40 + 397,20
    expect(add('calabria', 2026, 20_000)).toBe(34_600) // 1,73 unica
  })

  it('fallback carry-over (c. 728 L. 207/2024): anni senza dato usano l’anno più vicino', () => {
    expect(strutturaAddizionaleRegionale('emilia-romagna', 2027)).toEqual(
      strutturaAddizionaleRegionale('emilia-romagna', 2026),
    )
    expect(strutturaAddizionaleRegionale('emilia-romagna', 2024)).toEqual(
      strutturaAddizionaleRegionale('emilia-romagna', 2025),
    )
  })
})

describe('addizionale regionale — dentro computeOrdinario', () => {
  it('con la regione impostata l’aliquota manuale è ignorata e si usa la struttura ufficiale', () => {
    const r = computeOrdinario({ ...professionista2026.input, regione: 'trento' }, getParams(2026))
    // RC 36.965 > 30.000: niente deduzione, 1,23% sull'intero → 454,67 (non 639,49 dell'1,73 manuale)
    expect(r.addizionaleRegionaleCents).toBe(45_467)
    expect(r.addizionaleComunaleCents).toBe(professionista2026.atteso.addizionaleComunaleCents)
    expect(r.totaleCents).toBe(2_288_759)
  })

  it('le addizionali sono dovute solo se l’IRPEF netta supera 10 € (Allegato C 730)', () => {
    // reddito 7.487 → contributi 26,07% → RC 5.535 → lorda 1.273,05 − detrazione 1.263,78 = netta 9,27
    const r = computeOrdinario(
      {
        incassatoCents: 1_000_000,
        costiCents: 251_300,
        oneri19Cents: 0,
        figli: 'nessuno',
        addizionaleRegionale: 0.0173,
        addizionaleComunale: 0.008,
        sogliaEsenzioneComunaleCents: null,
        copertura: 'piena',
      },
      getParams(2026),
    )
    expect(r.irpefNettaCents).toBe(927)
    expect(r.addizionaleRegionaleCents).toBe(0)
    expect(r.addizionaleComunaleCents).toBe(0)
  })
})
