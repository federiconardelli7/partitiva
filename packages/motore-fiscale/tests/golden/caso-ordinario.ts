// Caso campione «regime ordinario» — dataset golden SINTETICO per il confronto
// «quando conviene uscire». Fonti dei parametri: art. 11/13/15/16-ter TUIR vigenti,
// L. 199/2025, D.Lgs. 68/2011, D.Lgs. 360/1998 (v. docs/regole-fiscali.md e
// params/2025-2026). Tutti gli importi in centesimi, quadrature a mano.

// ── A. Professionista GS piena, 2026: incassato 60.000, costi 10.000, niente oneri ────
// reddito  = 60.000 − 10.000 = 50.000
// contributi GS = 50.000 × 26,07%                        = 13.035,00
// RC       = roundEuro(50.000 − 13.035)                  = 36.965,00
// IRPEF lorda 2026: 28.000×23% + (36.965−28.000)×33%     = 6.440 + 2.958,45 = 9.398,45
// detr. LA (fascia alta): (50.000−36.965)/22.000 = 0,59250 → tronc4 0,5925
//          500 × 0,5925                                  = 296,25 (niente +50: RC > 17.000)
// IRPEF netta = 9.398,45 − 296,25                        = 9.102,20
// addizionali (dovute, netta > 0): reg. 1,73% × 36.965   = 639,49
//                                  com. 0,80% × 36.965   = 295,72
// totale imposte+contributi = 13.035 + 9.102,20 + 639,49 + 295,72 = 23.072,41
export const professionista2026 = {
  input: {
    incassatoCents: 6_000_000,
    costiCents: 1_000_000,
    oneri19Cents: 0,
    figli: 'nessuno',
    addizionaleRegionale: 0.0173,
    addizionaleComunale: 0.008,
    sogliaEsenzioneComunaleCents: null,
    copertura: 'piena',
  },
  atteso: {
    redditoCents: 5_000_000,
    contributiDovutiCents: 1_303_500,
    imponibileIrpefCents: 3_696_500,
    irpefLordaCents: 939_845,
    detrazioneLavoroAutonomoCents: 29_625,
    detrazioneOneriCents: 0,
    irpefNettaCents: 910_220,
    addizionaleRegionaleCents: 63_949,
    addizionaleComunaleCents: 29_572,
    totaleCents: 2_307_241,
  },
} as const

// ── B. Stesso caso, 2025 (scaglione centrale al 35%) ──────────────────────────────────
// IRPEF lorda 2025: 6.440 + 8.965×35% = 6.440 + 3.137,75 = 9.577,75
// IRPEF netta = 9.577,75 − 296,25                        = 9.281,50
export const professionista2025 = {
  atteso: { irpefLordaCents: 957_775, irpefNettaCents: 928_150 },
} as const

// ── C. Redditi alti 2026: massimale GS, tetto oneri, degressione e taglio −440 ────────
// incassato 280.000, costi 30.000 → reddito 250.000
// contributi GS = massimale 122.295 × 26,07%             = 31.882,31
// RC = roundEuro(250.000 − 31.882,31 = 218.117,69)       = 218.118,00
// lorda: 6.440 + 22.000×33% (=7.260) + (218.118−50.000)×43% (=72.290,74) = 85.990,74
// detr. LA: zero (RC > 50.000)
// oneri 19% in input 2.000: RC > 100k → tetto spese 8.000 × 0,50 (0 figli) = 4.000
//   spese ammesse min(2.000, 4.000) = 2.000 → 19%        = 380,00
//   degressione: × (240.000 − 218.118)/120.000 = × 21.882/120.000 → 69,29 (half-up)
//   taglio alti redditi (RC > 200.000): max(0, 69,29 − 440) = 0  ← clamp esercitato
// IRPEF netta = 85.990,74 − 0 − 0                        = 85.990,74
// addizionali: reg. 1,73% × 218.118 = 3.773,44 · com. 0,80% × 218.118 = 1.744,94
// totale = 31.882,31 + 85.990,74 + 3.773,44 + 1.744,94   = 123.391,43
export const redditiAlti2026 = {
  input: {
    incassatoCents: 28_000_000,
    costiCents: 3_000_000,
    oneri19Cents: 200_000,
    figli: 'nessuno',
    addizionaleRegionale: 0.0173,
    addizionaleComunale: 0.008,
    sogliaEsenzioneComunaleCents: null,
    copertura: 'piena',
  },
  atteso: {
    contributiDovutiCents: 3_188_231,
    imponibileIrpefCents: 21_811_800,
    irpefLordaCents: 8_599_074,
    detrazioneOneriCents: 0,
    irpefNettaCents: 8_599_074,
    totaleCents: 12_339_143,
  },
} as const

// ── D. Artigiano IVS post-1995, 2026: fissi + eccedenza su reddito effettivo ──────────
// incassato 80.000, costi 20.000 → reddito 60.000
// fissi 4.521,36; eccedenza: (56.224−18.808)×24% = 8.979,84 + (60.000−56.224)×25% = 944,00
// contributi = 4.521,36 + 9.923,84                       = 14.445,20
// RC = roundEuro(60.000 − 14.445,20 = 45.554,80)         = 45.555,00
// lorda: 6.440 + (45.555−28.000)×33%                     = 6.440 + 5.793,15 = 12.233,15
// detr. LA: (50.000−45.555)/22.000 = 0,20204… → 0,2020 → 500 × 0,2020 = 101,00
// netta = 12.233,15 − 101,00                             = 12.132,15
// addizionali: reg. 788,10 · com. 364,44
// totale = 14.445,20 + 12.132,15 + 788,10 + 364,44       = 27.729,89
export const artigianoOrdinario2026 = {
  input: {
    incassatoCents: 8_000_000,
    costiCents: 2_000_000,
    oneri19Cents: 0,
    figli: 'nessuno',
    addizionaleRegionale: 0.0173,
    addizionaleComunale: 0.008,
    sogliaEsenzioneComunaleCents: null,
    copertura: 'piena',
    gestione: { tipo: 'artigiani', anzianitaAl1995: false, riduzione: 'nessuna' },
  },
  atteso: {
    contributiDovutiCents: 1_444_520,
    imponibileIrpefCents: 4_555_500,
    irpefLordaCents: 1_223_315,
    detrazioneLavoroAutonomoCents: 10_100,
    irpefNettaCents: 1_213_215,
    totaleCents: 2_772_989,
  },
} as const

// ── E. Perdita (costi > incassato), artigiano: reddito a zero ma i fissi restano ───────
// incassato 10.000, costi 15.000 → reddito clampato a 0 (flag), IRPEF e addizionali zero;
// contributi = SOLI fissi 4.521,36 (l'eccedenza è zero).
export const perditaArtigiano2026 = {
  input: {
    incassatoCents: 1_000_000,
    costiCents: 1_500_000,
    oneri19Cents: 0,
    figli: 'nessuno',
    addizionaleRegionale: 0.0173,
    addizionaleComunale: 0.008,
    sogliaEsenzioneComunaleCents: null,
    copertura: 'piena',
    gestione: { tipo: 'artigiani', anzianitaAl1995: false, riduzione: 'nessuna' },
  },
  atteso: { redditoCents: 0, contributiDovutiCents: 452_136, irpefNettaCents: 0, totaleCents: 452_136 },
} as const

// ── F. Fascia media con bonus 50 e soglia comunale a scalino, GS 2026 ─────────────────
// incassato 20.000, costi 4.000 → reddito 16.000; contributi = 16.000 × 26,07% = 4.171,20
// RC = roundEuro(16.000 − 4.171,20 = 11.828,80)          = 11.829,00
// lorda = 11.829 × 23%                                   = 2.720,67
// detr. LA (media): 500 + 765 × (28.000−11.829)/22.500 = 765 × 0,7187 (tronc4) = 549,81
//   → 1.049,81; bonus +50 (11.000 < RC ≤ 17.000)         = 1.099,81
// netta = 2.720,67 − 1.099,81                            = 1.620,86
// add. reg. 1,73% × 11.829                               = 204,64
// add. com. 0,80% con soglia 12.000: RC ≤ soglia → 0 (a scalino); senza soglia = 94,63
export const fasciaMedia2026 = {
  input: {
    incassatoCents: 2_000_000,
    costiCents: 400_000,
    oneri19Cents: 0,
    figli: 'nessuno',
    addizionaleRegionale: 0.0173,
    addizionaleComunale: 0.008,
    sogliaEsenzioneComunaleCents: 1_200_000,
    copertura: 'piena',
  },
  atteso: {
    imponibileIrpefCents: 1_182_900,
    irpefLordaCents: 272_067,
    detrazioneLavoroAutonomoCents: 109_981,
    irpefNettaCents: 162_086,
    addizionaleRegionaleCents: 20_464,
    addizionaleComunaleCents: 0,
  },
  comunaleSenzaSogliaCents: 9_463,
} as const
