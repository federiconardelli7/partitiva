import { describe, expect, it } from 'vitest'
import { computeAnno, computeTimeline } from '../src/index'
import { getParams } from '../src/params'

const base = { coefficiente: 0.67, startup: true, copertura: 'piena' as const }

describe('soglie di uscita dal regime', () => {
  it('86.000 incassati → flag uscita dall’anno successivo', () => {
    const r = computeAnno(
      { anno: 2026, incassatoCents: 8_600_000, versatiContributiCents: 0, ...base },
      getParams(2026),
    )
    expect(r.flags.some((f) => f.codice === 'soglia-85k')).toBe(true)
    expect(r.flags.some((f) => f.codice === 'soglia-100k')).toBe(false)
  })

  it('101.000 incassati → flag uscita immediata', () => {
    const r = computeAnno(
      { anno: 2026, incassatoCents: 10_100_000, versatiContributiCents: 0, ...base },
      getParams(2026),
    )
    expect(r.flags.some((f) => f.codice === 'soglia-100k')).toBe(true)
  })
})

describe('anno a fatturato zero — il bug del tracker NON va replicato', () => {
  const inputs = [
    { anno: 2025, incassatoCents: 2_400_000, ...base },
    { anno: 2026, incassatoCents: 0, ...base },
  ]

  it('zero incassato → zero imposta, MAI imponibile fantasma dagli acconti versati', () => {
    const t = computeTimeline(inputs)
    expect(t.anni[2026]?.redditoCents).toBe(0)
    expect(t.anni[2026]?.imponibileCents).toBe(0)
    expect(t.anni[2026]?.impostaCents).toBe(0)
  })

  it('i saldi a credito del 2027 sono esposti come credito, mai F24 negativi', () => {
    const t = computeTimeline(inputs)
    const luglio2027 = t.f24.find((f) => f.anno === 2027 && f.scadenza === 'luglio')
    for (const f24 of t.f24) expect(f24.totaleCents).toBeGreaterThanOrEqual(0)
    // dovuto 2026 = 0, ma nel 2026 sono stati versati acconti → credito esposto sull'F24 di conguaglio
    expect(luglio2027?.creditiCents).toBeGreaterThan(0)
  })
})

describe('soglie minime degli acconti (solo imposta sostitutiva)', () => {
  it('imposta ≤ 51,65 → nessun acconto l’anno dopo', () => {
    // incassato 1.500 → reddito 1.005 → imposta 50,25
    const t = computeTimeline([
      { anno: 2025, incassatoCents: 150_000, ...base },
      { anno: 2026, incassatoCents: 150_000, ...base },
    ])
    const rows2026 = t.f24.filter((f) => f.anno === 2026).flatMap((f) => f.righe)
    expect(rows2026.some((r) => r.codice === '1790' || r.codice === '1791')).toBe(false)
  })

  it('acconto tra 51,65 e 257,52 → rata unica a novembre col codice 1791', () => {
    // incassato 3.000 → reddito 2.010 → imposta 100,50 → acconto 100,50
    const t = computeTimeline([
      { anno: 2025, incassatoCents: 300_000, ...base },
      { anno: 2026, incassatoCents: 300_000, ...base },
    ])
    const luglio = t.f24.find((f) => f.anno === 2026 && f.scadenza === 'luglio')
    const novembre = t.f24.find((f) => f.anno === 2026 && f.scadenza === 'novembre')
    expect(luglio?.righe.some((r) => r.codice === '1790')).toBe(false)
    const unica = novembre?.righe.find((r) => r.codice === '1791')
    expect(unica?.importoCents).toBe(10_050)
  })

  it('le soglie NON si applicano ai contributi GS (default prudente, daVerificare)', () => {
    const t = computeTimeline([
      { anno: 2025, incassatoCents: 300_000, ...base },
      { anno: 2026, incassatoCents: 300_000, ...base },
    ])
    const righeGs2026 = t.f24
      .filter((f) => f.anno === 2026)
      .flatMap((f) => f.righe)
      .filter((r) => r.codice === 'PXX')
    // saldo 2025 + due rate acconto → i contributi viaggiano comunque in 2 rate
    expect(righeGs2026.length).toBeGreaterThanOrEqual(3)
  })
})

describe('copertura ridotta (24%) e causale P10', () => {
  it('aliquota 24% nel computo e causale P10 negli F24', () => {
    const r = computeAnno(
      { anno: 2026, incassatoCents: 7_500_000, versatiContributiCents: 0, ...base, copertura: 'ridotta' },
      getParams(2026),
    )
    expect(r.contributiDovutiCents).toBe(1_206_000) // 50.250 × 24 %
    const t = computeTimeline([
      { anno: 2025, incassatoCents: 2_400_000, ...base, copertura: 'ridotta' as const },
      { anno: 2026, incassatoCents: 2_400_000, ...base, copertura: 'ridotta' as const },
    ])
    const righe = t.f24.filter((f) => f.anno === 2026).flatMap((f) => f.righe)
    expect(righe.some((r2) => r2.codice === 'P10')).toBe(true)
    expect(righe.some((r2) => r2.codice === 'PXX')).toBe(false)
  })
})

describe('massimale Gestione Separata (warning + cap, mai raggiungibile da un forfettario tipico)', () => {
  it('reddito oltre il massimale → contributi sul massimale + flag', () => {
    const r = computeAnno(
      { anno: 2026, incassatoCents: 15_000_000, coefficiente: 0.86, startup: false, copertura: 'piena', versatiContributiCents: 0 },
      getParams(2026),
    )
    // reddito 129.000 > massimale 122.295 → base = massimale
    expect(r.contributiDovutiCents).toBe(3_188_231) // 122.295 × 26,07 % = 31.882,3065 → 31.882,31
    expect(r.flags.some((f) => f.codice === 'massimale-gs')).toBe(true)
  })
})

describe('metodo previsionale (opt-in, con warning sanzioni)', () => {
  it('l’imposta prevista si calcola sull’IMPONIBILE previsto (reddito − versamenti previsti), non sul lordo', () => {
    const t = computeTimeline(
      [
        { anno: 2025, incassatoCents: 2_400_000, ...base },
        { anno: 2026, incassatoCents: 7_500_000, ...base },
      ],
      { metodo: 'previsionale', incassatoPrevistoCents: { 2026: 7_500_000 } },
    )
    expect(t.flags.some((f) => f.codice === 'previsionale-sanzioni')).toBe(true)
    // previsione = 75.000 → reddito 50.250; versati previsti 2026 = saldo GS 2025 (4.192,06)
    // + acconti GS previsionali (10.480,14) = 14.672,20 → imponibile 35.577,80 → 35.578 (euro)
    // → imposta prevista 1.778,90 → rate 889,45 + 889,45
    const luglio = t.f24.find((f) => f.anno === 2026 && f.scadenza === 'luglio')
    const rata1790 = luglio?.righe.find((r) => r.codice === '1790')
    expect(rata1790?.importoCents).toBe(88_945)
  })

  it('la previsione vale anche per l’anno di conguaglio (previsto 0 → nessun acconto)', () => {
    const t = computeTimeline([{ anno: 2025, incassatoCents: 2_400_000, ...base }], {
      metodo: 'previsionale',
      incassatoPrevistoCents: { 2026: 0 },
    })
    const luglio = t.f24.find((f) => f.anno === 2026 && f.scadenza === 'luglio')
    const novembre = t.f24.find((f) => f.anno === 2026 && f.scadenza === 'novembre')
    // solo i saldi 2025 a luglio, niente rate di acconto, niente novembre
    expect(luglio?.righe).toHaveLength(2)
    expect(luglio?.righe.some((r) => r.codice === '1790')).toBe(false)
    expect(novembre).toBeUndefined()
  })
})

describe('validazione degli input della timeline', () => {
  it('anni non consecutivi → errore esplicito (il fold non è definito sui buchi)', () => {
    expect(() =>
      computeTimeline([
        { anno: 2025, incassatoCents: 100_000, ...base },
        { anno: 2027, incassatoCents: 100_000, ...base },
      ]),
    ).toThrow(/consecutiv/i)
  })

  it('anni duplicati → errore esplicito', () => {
    expect(() =>
      computeTimeline([
        { anno: 2026, incassatoCents: 100_000, ...base },
        { anno: 2026, incassatoCents: 100_000, ...base },
      ]),
    ).toThrow(/duplicat/i)
  })

  it('incassato negativo → errore esplicito, mai contributi negativi', () => {
    expect(() =>
      computeAnno(
        { anno: 2026, incassatoCents: -100_000, versatiContributiCents: 0, ...base },
        getParams(2026),
      ),
    ).toThrow(/negativ/i)
  })
})

describe('actuals con chiavi sconosciute — mai scartati in silenzio', () => {
  it('un refuso nella chiave fa fallire il calcolo nominando la chiave', () => {
    expect(() =>
      computeTimeline(
        [
          { anno: 2025, incassatoCents: 2_400_000, ...base },
          { anno: 2026, incassatoCents: 7_500_000, ...base },
        ],
        { actuals: { '2025:contributiDovutti': 419_100 } },
      ),
    ).toThrow(/contributiDovutti/)
  })

  it('actuals su rate mai create (ramo rata unica) → errore, non risultato teorico silenzioso', () => {
    // anno 1 con imposta piccola → acconto in unica rata: le rate 1/2 non esistono
    expect(() =>
      computeTimeline(
        [
          { anno: 2025, incassatoCents: 300_000, ...base },
          { anno: 2026, incassatoCents: 300_000, ...base },
        ],
        { actuals: { '2026:accontoImposta:rata1': 5_000 } },
      ),
    ).toThrow(/accontoImposta:rata1/)
  })
})

describe('soglie minime sui contributi GS quando il parametro lo attiva', () => {
  const conSoglieSuiContributi = (anno: number) => {
    const p = getParams(anno)
    return {
      ...p,
      acconti: {
        ...p.acconti,
        soglieApplicabiliAContributi: { ...p.acconti.soglieApplicabiliAContributi, valore: true },
      },
    }
  }

  it('acconto GS sotto 257,52 → unica rata a novembre (parametro, non hardcode)', () => {
    const t = computeTimeline(
      [
        { anno: 2025, incassatoCents: 100_000, ...base },
        { anno: 2026, incassatoCents: 100_000, ...base },
      ],
      { getParams: conSoglieSuiContributi },
    )
    const luglio = t.f24.find((f) => f.anno === 2026 && f.scadenza === 'luglio')
    const novembre = t.f24.find((f) => f.anno === 2026 && f.scadenza === 'novembre')
    // a luglio solo il saldo GS 2025, nessuna 1ª rata di acconto GS
    expect(luglio?.righe.some((r) => r.codice === 'PXX' && r.descrizione.includes('1ª rata'))).toBe(false)
    const unicaGs = novembre?.righe.find((r) => r.codice === 'PXX')
    expect(unicaGs?.importoCents).toBe(13_974) // 80% × 174,67 = 139,74 in unica soluzione
  })
})

describe('aliquota 15% dopo gli anni startup', () => {
  it('startup: false → 15%', () => {
    const r = computeAnno(
      { anno: 2026, incassatoCents: 7_500_000, versatiContributiCents: 754_369, ...base, startup: false },
      getParams(2026),
    )
    expect(r.impostaCents).toBe(640_590) // 42.706 × 15 %
  })
})
