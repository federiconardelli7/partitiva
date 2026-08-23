// Caso campione «dipendente» — dataset golden SINTETICO per il confronto «e se fossi
// dipendente?». Fonti: TUIR artt. 11/13/51, L. 207/2024 c. 4-9, DL 3/2020, D.Lgs.
// 148/2015, art. 2120 c.c., CCNL Terziario (v. regole-fiscali.md). Ipotesi dichiarate:
// impiegato a tempo indeterminato, anno intero, nessun carico di famiglia, nessun altro
// reddito; niente arrotondamento all'euro (conguaglio del sostituto in centesimi).
// Tutti gli importi in centesimi, quadrature a mano (esempi svolti della ricerca).

// ── A. RAL 30.000, 2026, solo IVS (default), niente fondo ─────────────────────────────
// contributi = 30.000 × 9,19%                             = 2.757,00
// RC = 30.000 − 2.757                                     = 27.243,00
// lorda 2026 = 27.243 × 23%                               = 6.265,89
// detr. art. 13: 1.910 + 1.190 × tronc4(757/13.000=0,0582) = 1.910 + 69,26 = 1.979,26
//   +65 (25.000 < RC ≤ 35.000)                            → 2.044,26
// ulteriore detrazione (20.000 < RC ≤ 32.000)             = 1.000,00 (capienza ok)
// IRPEF netta = 6.265,89 − 2.044,26 − 1.000               = 3.221,63
// netto ante addizionali = 30.000 − 2.757 − 3.221,63      = 24.021,37 (identico nel 2025)
// TFR accantonato = 30.000/13,5 − 0,50%×30.000 = 2.222,22 − 150 = 2.072,22
export const impiegato30k = {
  input: {
    ralCents: 3_000_000,
    dimensioneAzienda: null,
    fondoPensione: false,
    addizionaleRegionale: 0,
    addizionaleComunale: 0,
    sogliaEsenzioneComunaleCents: null,
  },
  atteso2026: {
    contributiCents: 275_700,
    imponibileIrpefCents: 2_724_300,
    irpefLordaCents: 626_589,
    detrazioneLavoroCents: 204_426,
    ulterioreDetrazioneCents: 100_000,
    irpefNettaCents: 322_163,
    sommaIntegrativaCents: 0,
    trattamentoIntegrativoCents: 0,
    nettoCents: 2_402_137,
    tfrCents: 207_222,
  },
} as const

// ── B. RAL 40.000, 2026 vs 2025: morde il 33% ─────────────────────────────────────────
// contributi 3.676; RC 36.324; lorda 2026 = 6.440 + 33%×8.324 = 9.186,92 (2025: 9.353,40)
// detr. alta: 1.910 × tronc4(13.676/22.000=0,6216) = 1.187,26 (niente +65: RC > 35.000)
// ulteriore: 1.000 × (40.000−36.324)/8.000 = 459,50 (precisione piena)
// netta 2026 = 9.186,92 − 1.187,26 − 459,50 = 7.540,16 · 2025 = 7.706,64
export const impiegato40k = {
  input: {
    ralCents: 4_000_000,
    dimensioneAzienda: null,
    fondoPensione: false,
    addizionaleRegionale: 0,
    addizionaleComunale: 0,
    sogliaEsenzioneComunaleCents: null,
  },
  atteso2026: { irpefLordaCents: 918_692, irpefNettaCents: 754_016, nettoCents: 4_000_000 - 367_600 - 754_016 },
  atteso2025: { irpefNettaCents: 770_664 },
} as const

// ── C. RAL 18.000, 2026: somma integrativa (cuneo) sulla fascia 4,8% ──────────────────
// contributi 1.654,20; RC = RLD = 16.345,80 ≤ 20.000 → somma = 4,8% × 16.345,80 = 784,60
// lorda = 16.345,80 × 23% = 3.759,53 (troncamento mulRate: 3.759,534 → 3.759,53)
// detr. media: tronc4(11.654,20/13.000 = 0,89647) = 0,8964 → 1.910 + 1.190×0,8964 = 2.976,72
// netta = 3.759,53 − 2.976,72 = 782,81; trattamento integrativo: RC > 15.000 → 0
// netto = 18.000 − 1.654,20 − 782,81 + 784,60 = 16.347,59
export const impiegato18k = {
  input: {
    ralCents: 1_800_000,
    dimensioneAzienda: null,
    fondoPensione: false,
    addizionaleRegionale: 0,
    addizionaleComunale: 0,
    sogliaEsenzioneComunaleCents: null,
  },
  atteso2026: {
    sommaIntegrativaCents: 78_460,
    irpefNettaCents: 78_281,
    ulterioreDetrazioneCents: 0,
    nettoCents: 1_634_759,
  },
} as const

// ── D. RAL 15.000, 2026: trattamento integrativo E somma integrativa cumulati ─────────
// contributi 1.378,50; RC = RLD = 15.000 − 1.378,50 = 13.621,50 ≤ 15.000
// lorda = 13.621,50 × 23% = 3.132,945 → 3.132,95 (half-up)
// detr. lett. a = 1.955 (fissa; minimo 690 irrilevante ad anno intero)
// trattamento: lorda 3.132,95 > 1.955 − 75 = 1.880 → 1.200,00
// somma integrativa: fascia 8.500 < RLD ≤ 15.000 → 5,3% × 13.621,50 = 721,94
// netta = 3.132,95 − 1.955 = 1.177,95
// netto = 15.000 − 1.378,50 − 1.177,95 + 721,94 + 1.200 = 14.365,49
export const impiegato15k = {
  input: {
    ralCents: 1_500_000,
    dimensioneAzienda: null,
    fondoPensione: false,
    addizionaleRegionale: 0,
    addizionaleComunale: 0,
    sogliaEsenzioneComunaleCents: null,
  },
  atteso2026: {
    trattamentoIntegrativoCents: 120_000,
    sommaIntegrativaCents: 72_194,
    irpefNettaCents: 117_795,
    nettoCents: 1_436_549,
  },
} as const

// ── E. RAL 30.000, oltre 15 dipendenti: FIS (⅓ di 0,80%) e CIGS 0,30 ──────────────────
// FIS lavoratore = (30.000 × 0,80%)/3 = 80,00 · CIGS = 30.000 × 0,30% = 90,00
// contributi = 2.757 + 80 + 90 = 2.927,00 (esempio della ricerca, esatto)
// RC = 27.073; lorda = 6.226,79; detr: tronc4(927/13.000=0,0713) → 1.910+84,85+65 = 2.059,85
// ulteriore 1.000; netta = 6.226,79 − 2.059,85 − 1.000 = 3.166,94
// netto = 30.000 − 2.927 − 3.166,94 = 23.906,06
export const impiegato30kAziendaGrande = {
  input: {
    ralCents: 3_000_000,
    dimensioneAzienda: 'oltre-15',
    fondoPensione: false,
    addizionaleRegionale: 0,
    addizionaleComunale: 0,
    sogliaEsenzioneComunaleCents: null,
  },
  atteso2026: { contributiCents: 292_700, irpefNettaCents: 316_694, nettoCents: 2_390_606 },
} as const

// ── F. RAL 30.000 con Fon.Te (default UI): 0,55% dedotto, 1,55% datore, TFR al fondo ──
// contributo lavoratore = 165,00 (entro il plafond 5.300) → RC = 27.243 − 165 = 27.078
// lorda = 6.227,94; detr: tronc4(922/13.000=0,0709) → 1.910+84,37+65 = 2.059,37
// ulteriore 1.000; netta = 6.227,94 − 2.059,37 − 1.000 = 3.168,57
// netto = 30.000 − 2.757 − 165 − 3.168,57 = 23.909,43
// vantaggi fuori busta: datore 1,55% = 465,00 · TFR conferito 2.072,22
export const impiegato30kConFonTe = {
  input: {
    ralCents: 3_000_000,
    dimensioneAzienda: null,
    fondoPensione: true,
    addizionaleRegionale: 0,
    addizionaleComunale: 0,
    sogliaEsenzioneComunaleCents: null,
  },
  atteso2026: {
    contributoFondoLavoratoreCents: 16_500,
    contributoFondoDatoreCents: 46_500,
    irpefNettaCents: 316_857,
    nettoCents: 2_390_943,
    tfrCents: 207_222,
  },
} as const

// ── G. RAL 130.000, 2026: massimale post-1995 e aliquota aggiuntiva 1% ────────────────
// pensionabile = min(130.000, 122.295); IVS = 122.295 × 9,19% = 11.238,91
// +1% su (122.295 − 56.224) = 660,71 → contributi = 11.899,62
// RC = 118.100,38; lorda = 6.440 + 7.260 + 43%×68.100,38 = 42.983,16
// detr 0 (RC > 50.000), ulteriore 0 (RC > 40.000); netto = 130.000 − 11.899,62 − 42.983,16 = 75.117,22
// TFR = 130.000/13,5 − 650 = 9.629,63 − 650 = 8.979,63
export const impiegato130k = {
  input: {
    ralCents: 13_000_000,
    dimensioneAzienda: null,
    fondoPensione: false,
    addizionaleRegionale: 0,
    addizionaleComunale: 0,
    sogliaEsenzioneComunaleCents: null,
  },
  atteso2026: {
    contributiCents: 1_189_962,
    imponibileIrpefCents: 11_810_038,
    irpefLordaCents: 4_298_316,
    irpefNettaCents: 4_298_316,
    nettoCents: 7_511_722,
    tfrCents: 897_963,
  },
} as const
