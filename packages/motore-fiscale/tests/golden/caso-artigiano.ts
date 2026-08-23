// Caso campione IVS «artigiano/commerciante» — dataset golden SINTETICO.
// Fonti dei parametri: circ. INPS 38 del 07/02/2025 e 14 del 09/02/2026 (valori verificati
// su PDF, v. docs/regole-fiscali.md). Tutti gli importi in centesimi, quadrature a mano.

// ── Artigiano post-1995, apertura 2025, coeff 0,67, nessuna riduzione ────────────────
// 2025: incassato 45.000 → reddito 30.150.
//   fissi   = 18.555×24% + 7,44        = 4.453,20 + 7,44   = 4.460,64
//   ecced.  = (30.150 − 18.555) × 24%  = 11.595 × 0,24     = 2.782,80
//   dovuti  = 7.243,44
//   versati 2025 (cassa) = rate fisse 1–3 = 3 × 1.115,16   = 3.345,48
//   imponibile = roundEuro(30.150 − 3.345,48 = 26.804,52)  = 26.805,00 → imposta 5% = 1.340,25
// 2026: incassato 60.000 → reddito 40.200.
//   fissi   = 18.808×24% + 7,44        = 4.513,92 + 7,44   = 4.521,36 (rata 1.130,34)
//   ecced.  = (40.200 − 18.808) × 24%  = 21.392 × 0,24     = 5.134,08
//   dovuti  = 9.655,44
//   versati 2026 = rata4/2025 (1.115,16) + rate 1–3/2026 (3.391,02)
//                + saldo ecc. 2025 (2.782,80) + acconti ecc. 2026 (1.391,40 × 2) = 10.071,78
//   imponibile = roundEuro(40.200 − 10.071,78 = 30.128,22) = 30.128,00 → imposta 1.506,40
// Scadenze (slittamento sab/dom → lunedì, riproduce le date UFFICIALI delle circolari):
//   2025: 16/05 (ven), 20/08, 17/11 (16/11 è domenica), 16/02/2026 (lun)
//   2026: 18/05 (16/05 è sabato), 20/08, 16/11 (lun), 16/02/2027 (mar)

export const artigiano = {
  gestione: { tipo: 'artigiani', anzianitaAl1995: false, riduzione: 'nessuna' } as const,
  inputs: [
    { anno: 2025, incassatoCents: 4_500_000, coefficiente: 0.67, startup: true, copertura: 'piena' as const },
    { anno: 2026, incassatoCents: 6_000_000, coefficiente: 0.67, startup: true, copertura: 'piena' as const },
  ],
  atteso2025: {
    contributiDovutiCents: 724_344,
    contributiFissiCents: 446_064,
    contributiEccedenzaCents: 278_280,
    versatiContributiCents: 334_548,
    imponibileCents: 2_680_500,
    impostaCents: 134_025,
  },
  atteso2026: {
    contributiDovutiCents: 965_544,
    versatiContributiCents: 1_007_178,
    imponibileCents: 3_012_800,
    impostaCents: 150_640,
  },
  rate2025: { importoCents: 111_516, date: ['2025-05-16', '2025-08-20', '2025-11-17'] },
  rata4Del2025: { importoCents: 111_516, dataScadenza: '2026-02-16' },
  rate2026: { importoCents: 113_034, date: ['2026-05-18', '2026-08-20', '2026-11-16'] },
  luglio2026: {
    // saldo imposta 1.340,25 + 1º acc. imposta 670,13 + saldo ecc. 2.782,80 + 1º acc. ecc. 1.391,40
    totaleCents: 134_025 + 67_013 + 278_280 + 139_140,
    accontoEccedenzaRata1Cents: 139_140,
  },
  novembre2026: {
    // 2º acc. imposta 670,12 + 2º acc. ecc. 1.391,40
    totaleCents: 67_012 + 139_140,
  },
} as const

// ── Commerciante 2026, reddito 30.000 (post-1995) — riduzioni a confronto ────────────
// pieno:  fissi = 4.513,92 + 90,28 + 7,44 = 4.611,64 (= valore circolare, quadrato)
// r35 (riduce ANCHE la 0,48, lettura letterale circ. 35/2016 — daVerificare):
//   fissi = 4.513,92×0,65 (=2.934,05) + 90,28×0,65 (=58,68) + 7,44 = 3.000,17
//   ecced. = 11.192×24%×0,65 (=1.745,95) + 11.192×0,48%×0,65 (=34,92) = 1.780,87
//   dovuti = 4.781,04
// r50 (la 0,48 resta PIENA, circ. 83/2025 §3):
//   fissi = 4.513,92×0,50 (=2.256,96) + 90,28 + 7,44 = 2.354,68
//   ecced. = 2.686,08×0,50 (=1.343,04) + 53,72 = 1.396,76
//   dovuti = 3.751,44
export const commerciante2026 = {
  input: { anno: 2026, incassatoCents: 7_500_000, coefficiente: 0.4, startup: true, copertura: 'piena' as const, versatiContributiCents: 0 },
  redditoCents: 3_000_000,
  r35: { contributiFissiCents: 300_017, contributiEccedenzaCents: 178_087, contributiDovutiCents: 478_104 },
  r50: { contributiFissiCents: 235_468, contributiEccedenzaCents: 139_676, contributiDovutiCents: 375_144 },
} as const

// ── Artigiano ante-1996 oltre fascia e oltre massimale, 2026 ─────────────────────────
// reddito 100.000 > massimale 93.707:
//   (56.224 − 18.808) × 24% = 8.979,84 · (93.707 − 56.224) × 25% = 9.370,75
//   ecced. = 18.350,59 · fissi 4.521,36 · dovuti = 22.871,95
//   Cross-check circolare 14/2026 §4: contributo massimo artigiano ante-96 = 22.864,51
//   (esclude la maternità): 22.864,51 + 7,44 = 22.871,95 ✓
export const artigianoAnte96Massimale2026 = {
  input: { anno: 2026, incassatoCents: 25_000_000, coefficiente: 0.4, startup: false, copertura: 'piena' as const, versatiContributiCents: 0 },
  atteso: { contributiEccedenzaCents: 1_835_059, contributiDovutiCents: 2_287_195 },
} as const

// ── Artigiano sotto il minimale, 2026: i fissi si pagano comunque ────────────────────
export const artigianoSottoMinimale2026 = {
  input: { anno: 2026, incassatoCents: 2_500_000, coefficiente: 0.4, startup: true, copertura: 'piena' as const, versatiContributiCents: 0 },
  atteso: { contributiDovutiCents: 452_136, contributiEccedenzaCents: 0 },
} as const
