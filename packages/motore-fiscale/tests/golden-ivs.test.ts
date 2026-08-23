import { describe, expect, it } from 'vitest'
import { computeAnno, computeTimeline } from '../src/index'
import { getParams } from '../src/params'
import {
  artigiano,
  artigianoAnte96Massimale2026,
  artigianoSottoMinimale2026,
  commerciante2026,
} from './golden/caso-artigiano'

// Golden IVS artigiani/commercianti: valori sintetici quadrati a mano contro le
// circolari INPS 38/2025 e 14/2026 (v. commenti in caso-artigiano.ts).

describe('golden IVS — computeAnno (artigiani/commercianti)', () => {
  it('commerciante con riduzione 35%: ridotta anche la 0,48, maternità piena', () => {
    const r = computeAnno(
      { ...commerciante2026.input, gestione: { tipo: 'commercianti', anzianitaAl1995: false, riduzione: 'riduzione35' } },
      getParams(2026),
    )
    expect(r.redditoCents).toBe(commerciante2026.redditoCents)
    expect(r.explain['2026:contributiFissi']?.value).toBe(commerciante2026.r35.contributiFissiCents)
    expect(r.explain['2026:contributiEccedenza']?.value).toBe(commerciante2026.r35.contributiEccedenzaCents)
    expect(r.contributiDovutiCents).toBe(commerciante2026.r35.contributiDovutiCents)
    expect(r.flags.some((f) => f.codice === 'accredito-ridotto')).toBe(true)
  })

  it('commerciante con riduzione 50%: la 0,48 resta piena (circ. 83/2025 §3)', () => {
    const r = computeAnno(
      { ...commerciante2026.input, gestione: { tipo: 'commercianti', anzianitaAl1995: false, riduzione: 'riduzione50' } },
      getParams(2026),
    )
    expect(r.explain['2026:contributiFissi']?.value).toBe(commerciante2026.r50.contributiFissiCents)
    expect(r.explain['2026:contributiEccedenza']?.value).toBe(commerciante2026.r50.contributiEccedenzaCents)
    expect(r.contributiDovutiCents).toBe(commerciante2026.r50.contributiDovutiCents)
  })

  it('artigiano ante-1996 oltre fascia e massimale: scaglioni +1% e tetto (quadra col massimo ufficiale)', () => {
    const r = computeAnno(
      { ...artigianoAnte96Massimale2026.input, gestione: { tipo: 'artigiani', anzianitaAl1995: true, riduzione: 'nessuna' } },
      getParams(2026),
    )
    expect(r.explain['2026:contributiEccedenza']?.value).toBe(artigianoAnte96Massimale2026.atteso.contributiEccedenzaCents)
    expect(r.contributiDovutiCents).toBe(artigianoAnte96Massimale2026.atteso.contributiDovutiCents)
    expect(r.flags.some((f) => f.codice === 'massimale-ivs')).toBe(true)
  })

  it('reddito sotto il minimale: eccedenza zero ma i fissi si pagano comunque', () => {
    const r = computeAnno(
      { ...artigianoSottoMinimale2026.input, gestione: { tipo: 'artigiani', anzianitaAl1995: false, riduzione: 'nessuna' } },
      getParams(2026),
    )
    expect(r.explain['2026:contributiEccedenza']?.value).toBe(0)
    expect(r.contributiDovutiCents).toBe(artigianoSottoMinimale2026.atteso.contributiDovutiCents)
    expect(r.flags.some((f) => f.codice === 'sotto-minimale-ivs')).toBe(true)
  })

  it('reddito zero (nessun incasso): i fissi sono dovuti comunque e il flag lo spiega', () => {
    const r = computeAnno(
      { ...artigianoSottoMinimale2026.input, incassatoCents: 0, gestione: { tipo: 'artigiani', anzianitaAl1995: false, riduzione: 'nessuna' } },
      getParams(2026),
    )
    expect(r.contributiDovutiCents).toBe(artigianoSottoMinimale2026.atteso.contributiDovutiCents)
    expect(r.flags.some((f) => f.codice === 'sotto-minimale-ivs')).toBe(true)
  })

  it('senza gestione dichiarata resta la Gestione Separata di sempre (retrocompatibilità)', () => {
    const gs = computeAnno(
      { anno: 2026, incassatoCents: 3_000_000, coefficiente: 0.67, startup: true, copertura: 'piena', versatiContributiCents: 0 },
      getParams(2026),
    )
    expect(gs.contributiDovutiCents).toBe(524_007) // 20.100 × 26,07%
    expect(gs.explain['2026:contributiFissi']).toBeUndefined()
  })
})

describe('golden IVS — computeTimeline (rate fisse per cassa + eccedenza a saldo/acconti)', () => {
  const timeline = () =>
    computeTimeline(artigiano.inputs.map((i) => ({ ...i, gestione: artigiano.gestione })))

  it('2025 (apertura): dovuti fissi+eccedenza; versati = rate 1–3 per cassa; imponibile ridotto', () => {
    const t = timeline()
    const r = t.anni[2025]!
    expect(r.contributiDovutiCents).toBe(artigiano.atteso2025.contributiDovutiCents)
    expect(r.explain['2025:contributiFissi']?.value).toBe(artigiano.atteso2025.contributiFissiCents)
    expect(r.explain['2025:contributiEccedenza']?.value).toBe(artigiano.atteso2025.contributiEccedenzaCents)
    expect(r.versatiContributiCents).toBe(artigiano.atteso2025.versatiContributiCents)
    expect(r.imponibileCents).toBe(artigiano.atteso2025.imponibileCents)
    expect(r.impostaCents).toBe(artigiano.atteso2025.impostaCents)
  })

  it('le rate fisse hanno le date UFFICIALI: slittamento sab/dom → lunedì', () => {
    const t = timeline()
    const rate2025 = t.f24.filter((f) => f.anno === 2025 && f.scadenza.startsWith('rata-'))
    expect(rate2025.map((f) => f.dataScadenza)).toEqual([...artigiano.rate2025.date])
    expect(rate2025.every((f) => f.totaleCents === artigiano.rate2025.importoCents)).toBe(true)
    const rata4 = t.f24.find((f) => f.anno === 2026 && f.scadenza === 'rata-4')
    expect(rata4?.dataScadenza).toBe(artigiano.rata4Del2025.dataScadenza)
    expect(rata4?.totaleCents).toBe(artigiano.rata4Del2025.importoCents)
    const rate2026 = t.f24.filter((f) => f.anno === 2026 && f.scadenza.startsWith('rata-') && f.scadenza !== 'rata-4')
    expect(rate2026.map((f) => f.dataScadenza)).toEqual([...artigiano.rate2026.date])
    expect(rate2026.every((f) => f.righe[0]?.codice === 'AF')).toBe(true)
  })

  it('luglio e novembre 2026: saldo+acconti di imposta E eccedenza (causale AP)', () => {
    const t = timeline()
    const luglio = t.f24.find((f) => f.anno === 2026 && f.scadenza === 'luglio')!
    expect(luglio.totaleCents).toBe(artigiano.luglio2026.totaleCents)
    const accontoEcc = luglio.righe.find((r) => r.nodeId === '2026:accontoContributi:rata1')
    expect(accontoEcc?.importoCents).toBe(artigiano.luglio2026.accontoEccedenzaRata1Cents)
    expect(accontoEcc?.codice).toBe('AP')
    const novembre = t.f24.find((f) => f.anno === 2026 && f.scadenza === 'novembre')!
    expect(novembre.totaleCents).toBe(artigiano.novembre2026.totaleCents)
  })

  it('2026: versati per cassa (rata4 2025 + rate 1–3 + saldo e acconti eccedenza) e catena fiscale', () => {
    const t = timeline()
    const r = t.anni[2026]!
    expect(r.contributiDovutiCents).toBe(artigiano.atteso2026.contributiDovutiCents)
    expect(r.versatiContributiCents).toBe(artigiano.atteso2026.versatiContributiCents)
    expect(r.imponibileCents).toBe(artigiano.atteso2026.imponibileCents)
    expect(r.impostaCents).toBe(artigiano.atteso2026.impostaCents)
  })

  it('cambio di gestione tra anni consecutivi: errore esplicito, mai acconti col regime sbagliato', () => {
    const [i2025, i2026] = artigiano.inputs
    // GS 2025 → artigiani 2026: base e quota dell'acconto non sono modellate in transizione.
    expect(() => computeTimeline([{ ...i2025 }, { ...i2026, gestione: artigiano.gestione }])).toThrow(/gestione/i)
    // Stesso tipo con riduzione diversa per anno (finestra della 50%): resta valido.
    expect(() =>
      computeTimeline([
        { ...i2025, gestione: { ...artigiano.gestione, riduzione: 'riduzione50' } },
        { ...i2026, gestione: artigiano.gestione },
      ]),
    ).not.toThrow()
  })

  it('gli acconti usano i parametri e le agevolazioni dell’ANNO CORRENTE (istruzioni RR)', () => {
    // 50% nel 2025, piena dal 2026: l'acconto 2026 si calcola sul reddito 2025 (30.150)
    // con minimale 2026 (18.808) e SENZA la riduzione, che nel 2026 non spetta più:
    // (30.150 − 18.808) × 24% = 2.722,08 → rate da 1.361,04 (mai il 50% del dovuto 2025).
    const [i2025, i2026] = artigiano.inputs
    const t = computeTimeline([
      { ...i2025!, gestione: { ...artigiano.gestione, riduzione: 'riduzione50' } },
      { ...i2026!, gestione: artigiano.gestione },
    ])
    const luglio = t.f24.find((f) => f.anno === 2026 && f.scadenza === 'luglio')!
    const acconto = luglio.righe.find((r) => r.nodeId === '2026:accontoContributi:rata1')
    expect(acconto?.importoCents).toBe(136_104)
    // il saldo 2025, invece, resta quello del dovuto 2025 CON la riduzione del 2025
    const saldo = luglio.righe.find((r) => r.nodeId === '2025:saldoContributi')
    expect(saldo?.importoCents).toBe(139_140) // (30.150 − 18.555) × 24% × 0,5 = 1.391,40
  })

  it('anno di conguaglio: la rata 4 dell’ultimo anno compare (2027-02-16)', () => {
    const t = timeline()
    const rata4 = t.f24.find((f) => f.anno === 2027 && f.scadenza === 'rata-4')
    expect(rata4?.dataScadenza).toBe('2027-02-16')
    expect(rata4?.totaleCents).toBe(artigiano.rate2026.importoCents)
  })
})
