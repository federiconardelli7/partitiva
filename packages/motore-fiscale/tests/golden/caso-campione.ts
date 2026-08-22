// Caso campione «Mario Rossi» — dataset golden SINTETICO, coerente con docs/regole-fiscali.md.
// Nessun importo reale: la coerenza delle regole con documentazione vera è verificata solo in locale.
// Tutti gli importi sono in centesimi. I valori attesi sono ESATTI (il caso è sintetico):
// le tolleranze ±2 €/±0,01 € di TESTING.md servono per le verifiche locali su dati reali.

export const GOLDEN_YEARS = [2025, 2026] as const

export const anno2025 = {
  input: {
    anno: 2025,
    incassatoCents: 2_400_000, // 24.000,00 €
    coefficiente: 0.67,
    startup: true,
    copertura: 'piena',
    versatiContributiCents: 0,
  },
  atteso: {
    redditoCents: 1_608_000, // 16.080,00
    contributiDovutiCents: 419_206, // teorico 4.192,06
    imponibileCents: 1_608_000,
    impostaCents: 80_400, // 804,00
    nettoCompetenzaCents: 2_400_000 - 419_206 - 80_400,
  },
} as const

export const anno2026 = {
  input: {
    anno: 2026,
    incassatoCents: 7_500_000, // 75.000,00 €
    coefficiente: 0.67,
    startup: true,
    copertura: 'piena',
    versatiContributiCents: 754_369, // 7.543,69 (dal fold: 4.191,00 + 1.676,35 + 1.676,34)
  },
  atteso: {
    redditoCents: 5_025_000, // 50.250,00
    contributiDovutiCents: 1_310_018, // 13.100,18
    imponibileCents: 4_270_600, // 42.706,00 (euro-rounding di 42.706,31)
    impostaCents: 213_530, // 2.135,30
    nettoCompetenzaCents: 5_976_452, // 59.764,52
    quotaAccantonamento: 0.2031, // (13.100,18 + 2.135,30) / 75.000 ≈ 20,31 %
  },
} as const

// Actuals del caso campione, su due livelli:
// - actualsDichiarato: solo il dichiarato 2025 (4.191,00 al posto del teorico 4.192,06);
// - actuals: anche le rate INPS 2026 effettive (base implicita 4.190,86 ≠ 80% × dichiarato:
//   fenomeno degli arrotondamenti reali, riprodotto sinteticamente).
export const actualsDichiarato = {
  '2025:contributiDovuti': 419_100,
} as const

export const actuals = {
  ...actualsDichiarato,
  '2026:accontoContributi:rata1': 167_635,
  '2026:accontoContributi:rata2': 167_634,
} as const

export const f24Attesi = {
  luglio2026TeoricoPuro: 707_489, // 804 + 4.192,06 + 402 + 1.676,83 (nessun actual)
  luglio2026ConDichiarato: 707_340, // 804 + 4.191 + 402 + 1.676,40 (rate teoriche sul dichiarato)
  luglio2026Effettivo: 707_335, // …con la rata effettiva 1.676,35
  novembre2026Effettivo: 207_834, // 402 + 1.676,34
  versati2026: 754_369,
  luglio2027: 1_738_651, // saldo GS 9.747,49 + saldo imposta 1.331,30 + 1.067,65 + 5.240,07
  novembre2027: 630_772, // 1.067,65 + 5.240,07
} as const
