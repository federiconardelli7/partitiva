import { describe, expect, it } from 'vitest'
import { computeAnno, computeTimeline } from '../src/index'
import { getParams } from '../src/params'
import { actuals, actualsDichiarato, anno2025, anno2026, f24Attesi } from './golden/caso-campione'

// I valori del caso campione sono sintetici e coerenti → asserzioni ESATTE al centesimo.
// Le tolleranze di TESTING.md (±2 € / ±0,01 €) valgono per le verifiche locali su dati reali.

describe('golden — caso campione «Mario Rossi», computeAnno', () => {
  it('2025 (anno 1: nessun versato, imponibile pieno)', () => {
    const r = computeAnno(anno2025.input, getParams(2025))
    expect(r.redditoCents).toBe(anno2025.atteso.redditoCents)
    expect(r.contributiDovutiCents).toBe(anno2025.atteso.contributiDovutiCents)
    expect(r.imponibileCents).toBe(anno2025.atteso.imponibileCents)
    expect(r.impostaCents).toBe(anno2025.atteso.impostaCents)
    expect(r.nettoCompetenzaCents).toBe(anno2025.atteso.nettoCompetenzaCents)
  })

  it('2026 (deduzione = versati nell’anno, euro-rounding sull’imponibile)', () => {
    const r = computeAnno(anno2026.input, getParams(2026))
    expect(r.redditoCents).toBe(anno2026.atteso.redditoCents)
    expect(r.contributiDovutiCents).toBe(anno2026.atteso.contributiDovutiCents)
    expect(r.imponibileCents).toBe(anno2026.atteso.imponibileCents)
    expect(r.impostaCents).toBe(anno2026.atteso.impostaCents)
    expect(r.nettoCompetenzaCents).toBe(anno2026.atteso.nettoCompetenzaCents)
    expect(r.quotaAccantonamento).toBeCloseTo(anno2026.atteso.quotaAccantonamento, 4)
  })

  it('nettoReale sottrae bolli e spese (nettoCompetenza quando sono zero)', () => {
    const senza = computeAnno(anno2026.input, getParams(2026))
    expect(senza.nettoRealeCents).toBe(senza.nettoCompetenzaCents)
    const con = computeAnno(
      { ...anno2026.input, bolliCents: 2_400, speseCents: 35_000 },
      getParams(2026),
    )
    expect(con.nettoRealeCents).toBe(con.nettoCompetenzaCents - 2_400 - 35_000)
  })
})

describe('golden — caso campione, computeTimeline (fold multi-anno)', () => {
  const inputs = [
    { anno: 2025, incassatoCents: 2_400_000, coefficiente: 0.67, startup: true, copertura: 'piena' as const },
    { anno: 2026, incassatoCents: 7_500_000, coefficiente: 0.67, startup: true, copertura: 'piena' as const },
  ]

  it('senza actuals: F24 di luglio 2026 interamente teorico', () => {
    const t = computeTimeline(inputs)
    const luglio = t.f24.find((f) => f.anno === 2026 && f.scadenza === 'luglio')
    expect(luglio?.totaleCents).toBe(f24Attesi.luglio2026TeoricoPuro)
  })

  it('col solo dichiarato 2025: F24 di luglio 2026 con rate teoriche sul dichiarato', () => {
    const t = computeTimeline(inputs, { actuals: actualsDichiarato })
    const luglio = t.f24.find((f) => f.anno === 2026 && f.scadenza === 'luglio')
    expect(luglio?.totaleCents).toBe(f24Attesi.luglio2026ConDichiarato)
  })

  it('con actuals (dichiarato 2025 + rate effettive 2026): F24 2026 e 2027 esatti', () => {
    const t = computeTimeline(inputs, { actuals })
    const per = (anno: number, scadenza: 'luglio' | 'novembre') =>
      t.f24.find((f) => f.anno === anno && f.scadenza === scadenza)

    expect(per(2025, 'luglio')).toBeUndefined() // anno 1: nessun F24
    expect(per(2026, 'luglio')?.totaleCents).toBe(f24Attesi.luglio2026Effettivo)
    expect(per(2026, 'novembre')?.totaleCents).toBe(f24Attesi.novembre2026Effettivo)
    expect(per(2027, 'luglio')?.totaleCents).toBe(f24Attesi.luglio2027)
    expect(per(2027, 'novembre')?.totaleCents).toBe(f24Attesi.novembre2027)
  })

  it('la deduzione 2026 derivata dal fold è la somma delle righe INPS pagate nel 2026', () => {
    const t = computeTimeline(inputs, { actuals })
    expect(t.anni[2026]?.versatiContributiCents).toBe(f24Attesi.versati2026)
    // …e il risultato 2026 coincide col computeAnno golden
    expect(t.anni[2026]?.impostaCents).toBe(anno2026.atteso.impostaCents)
    expect(t.anni[2026]?.imponibileCents).toBe(anno2026.atteso.imponibileCents)
  })

  it('le righe F24 portano codici tributo e causali giusti', () => {
    const t = computeTimeline(inputs, { actuals })
    const luglio2026 = t.f24.find((f) => f.anno === 2026 && f.scadenza === 'luglio')
    const codici = luglio2026?.righe.map((r) => r.codice)
    expect(codici).toContain('1792') // saldo imposta 2025
    expect(codici).toContain('1790') // 1ª rata acconto imposta 2026
    expect(codici).toContain('PXX') // contributi GS aliquota piena
    const saldoImposta = luglio2026?.righe.find((r) => r.codice === '1792')
    expect(saldoImposta?.importoCents).toBe(80_400)
  })

  it('explain: ogni importo ha il suo nodo; gli override sono marcati "reale" col teorico conservato', () => {
    const t = computeTimeline(inputs, { actuals })
    const nodo = t.explain['2025:contributiDovuti']
    expect(nodo?.origine).toBe('reale')
    expect(nodo?.value).toBe(419_100)
    expect(nodo?.valoreCalcolato).toBe(419_206)
    const imposta = t.explain['2026:imposta']
    expect(imposta?.origine).toBe('calcolato')
    expect(imposta?.formula).toBeTruthy()
    expect(imposta?.inputs).toContain('2026:imponibile')
  })

  it('anche i saldi hanno il loro nodo di spiegazione e le righe F24 puntano lì', () => {
    const t = computeTimeline(inputs, { actuals })
    const saldoGs = t.explain['2025:saldoContributi']
    expect(saldoGs?.value).toBe(419_100) // dichiarato 4.191,00 − acconti 2025 (zero)
    expect(saldoGs?.inputs).toContain('2025:contributiDovuti')
    const luglio2026 = t.f24.find((f) => f.anno === 2026 && f.scadenza === 'luglio')
    const rigaSaldoGs = luglio2026?.righe.find((r) => r.descrizione.includes('Saldo contributi'))
    expect(rigaSaldoGs?.nodeId).toBe('2025:saldoContributi')
    const rigaSaldoImposta = luglio2026?.righe.find((r) => r.codice === '1792')
    expect(rigaSaldoImposta?.nodeId).toBe('2025:saldoImposta')
  })

  it('il 2027 senza params dedicati usa il fallback con warning', () => {
    const t = computeTimeline(inputs, { actuals })
    expect(t.flags.some((f) => f.codice === 'params-fallback' && f.messaggio.includes('2027'))).toBe(true)
  })
})
