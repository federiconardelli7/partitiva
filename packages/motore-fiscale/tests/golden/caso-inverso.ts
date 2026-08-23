// Caso campione «inverso» — dataset golden SINTETICO per il calcolo inverso («che
// fatturato per X € netti»). Nessun parametro nuovo: si invertono le tre catene già
// golden-testate (computeAnno, computeOrdinario, computeDipendente), quindi ogni valore
// qui sotto è quadrato a mano RIFACENDO la catena forward al lordo atteso e all'euro
// precedente. Il risultato è in EURO INTERI (multipli di 100 centesimi): al centesimo
// gli arrotondamenti della catena micro-oscillano (v. inverso.ts), all'euro no.
// Tutti gli importi in centesimi.

// ── A. Forfettario 2026, coefficiente 78%, startup 5%, GS piena, versati 0 ─────────────
// Netto desiderato 30.000,00. Atteso: fatturato 39.596,00.
//   reddito = 3.959.600 × 0,78 = 3.088.488 (esatto) → contributi = × 26,07% =
//   805.168,82 → 805.169; imponibile = round€(30.884,88) = 3.088.500 → imposta 5% =
//   154.425; netto = 3.959.600 − 805.169 − 154.425 = 3.000.006 ≥ 3.000.000 ✓
// Euro precedente 39.595,00: reddito = 3.088.410 (esatto) → contributi 805.148,49 →
//   805.148; imponibile round€(30.884,10) = 3.088.400 → imposta 154.420;
//   netto = 3.959.500 − 805.148 − 154.420 = 2.999.932 < 3.000.000 ✓
// (flip al centesimo: 39.595,92 → netto esattamente 3.000.000; il golden fissa l'euro)
export const inversoForfettario = {
  targetCents: 3_000_000,
  scenario: { anno: 2026, coefficiente: 0.78, startup: true, copertura: 'piena', versatiContributiCents: 0 },
  atteso: { lordoCents: 3_959_600, nettoCents: 3_000_006 },
} as const

// ── B. Forfettario 2026, coefficiente 40% (commercio), aliquota 15%, GS piena ──────────
// Netto desiderato 72.000,00: NON raggiungibile entro il tetto di permanenza (85.000).
//   Al tetto: reddito = 8.500.000 × 0,40 = 3.400.000 → contributi 26,07% = 886.380;
//   imponibile 3.400.000 (già tondo) → imposta 15% = 510.000;
//   netto = 8.500.000 − 886.380 − 510.000 = 7.103.620 (71.036,20) < 7.200.000 → null ✓
export const inversoForfettarioIrraggiungibile = {
  targetCents: 7_200_000,
  scenario: { anno: 2026, coefficiente: 0.4, startup: false, copertura: 'piena', versatiContributiCents: 0 },
  nettoAlTettoCents: 7_103_620,
} as const

// ── C. Dipendente 2026 (solo IVS, niente fondo, addizionali 0) ─────────────────────────
// Netto desiderato = il netto del golden A di caso-dipendente (24.021,37): la RAL minima
// è ESATTAMENTE 30.000,00 — l'inverso ritrova il forward.
// Euro precedente 29.999,00: contributi = 2.999.900 × 9,19% = 275.690,81 → 275.691;
//   RC = 2.724.209;
//   lorda 23% = 626.568,07 → 626.568; detr. media: tronc4(75.791/1.300.000 = 0,0583) →
//   1.910 + 1.190×0,0583 = 1.910 + 69,38 → 1.979,38, +65 → 2.044,38;
//   ulteriore 1.000 (capienza ok); netta = 626.568 − 204.438 − 100.000 = 322.130;
//   netto = 2.999.900 − 275.691 − 322.130 = 2.402.079 < 2.402.137 ✓
export const inversoDipendente = {
  targetCents: 2_402_137,
  input: {
    dimensioneAzienda: null,
    fondoPensione: false,
    addizionaleRegionale: 0,
    addizionaleComunale: 0,
    sogliaEsenzioneComunaleCents: null,
  },
  atteso: { lordoCents: 3_000_000, nettoCents: 2_402_137 },
} as const

// ── D. Dipendente 2026: la trappola del trattamento integrativo (risultato instabile) ──
// Netto desiderato 15.450,00. A RC ≤ 15.000 il netto gode di trattamento integrativo
// 1.200 + somma integrativa 5,3%; un centesimo oltre perde ENTRAMBI i benefici (TI −1.200,
// somma alla fascia 4,8%) e il netto RICADE. Griglia da 50 €: 16.500 sopra, 16.550 e
// 16.600 sotto, da 16.650 di nuovo sopra → il risultato espone anche il lordo stabile.
//
// RAL minima 16.452,00: contributi 9,19% = 151.193,88 → 151.194; RC = 1.494.006 ≤ 15.000
//   → detr. 1.955 fissa; lorda 23% = 343.621,38 → 343.621 > 1.880 → TI 1.200;
//   somma 5,3% = 79.182,318 → 79.182; netta = 343.621 − 195.500 = 148.121;
//   netto = 1.645.200 − 151.194 − 148.121 + 79.182 + 120.000 = 1.545.067 ≥ 1.545.000 ✓
// Euro precedente 16.451,00: contributi 151.184,69 → 151.185; RC = 1.493.915;
//   lorda 343.600,45 → 343.600; netta 148.100; somma 79.177,495 → 79.177;
//   netto = 1.645.100 − 151.185 − 148.100 + 79.177 + 120.000 = 1.544.992 < target ✓
// Dentro la trappola (griglia), RAL 16.550,00: contributi 152.094,5 → 152.095;
//   RC = 1.502.905 > 15.000 → TI 0, somma 4,8% = 72.139; lorda 345.668; detr. media:
//   tronc4(1.297.095/1.300.000 = 0,9977) → 1.910 + 1.190×0,9977 = 3.097,26;
//   netta = 345.668 − 309.726 = 35.942;
//   netto = 1.655.000 − 152.095 − 35.942 + 72.139 = 1.539.102 < target (−104,65!) ✓
// Lordo stabile 16.640,00: contributi 152.921,6 → 152.922; RC = 1.511.078;
//   lorda 347.547,94 → 347.548; detr. media: tronc4(1.288.922/1.300.000 = 0,9914) →
//   1.910 + 1.190×0,9914 → 1.179,766 → 1.910 + 1.179,77 = 3.089,77;
//   netta = 347.548 − 308.977 = 38.571; somma 4,8% = 72.531,744 → 72.532;
//   netto = 1.664.000 − 152.922 − 38.571 + 72.532 = 1.545.039 ≥ target ✓
//   (euro precedente 16.639,00 → netto 1.544.977 < target ✓)
export const inversoDipendenteTrappola = {
  targetCents: 1_545_000,
  input: {
    dimensioneAzienda: null,
    fondoPensione: false,
    addizionaleRegionale: 0,
    addizionaleComunale: 0,
    sogliaEsenzioneComunaleCents: null,
  },
  atteso: {
    lordoCents: 1_645_200,
    nettoCents: 1_545_067,
    lordoStabileCents: 1_664_000,
    nettoStabileCents: 1_545_039,
  },
  nellaTrappola: { ralCents: 1_655_000, nettoCents: 1_539_102 },
} as const

// ── E. Ordinario 2026, GS piena, costi/oneri 0, regionale a mano 1,23%, comunale 0 ─────
// Netto desiderato 25.000,00 (netto = incassato − costi − totale). Atteso: 44.870,00.
//   contributi = 4.487.000 × 26,07% = 1.169.760,9 → 1.169.761;
//   imponibile = round€(4.487.000 − 1.169.761 = 3.317.239) = 3.317.200;
//   lorda = 23%×2.800.000 + 33%×517.200 = 644.000 + 170.676 = 814.676;
//   detr. LA alta: tronc4(1.682.800/2.200.000 = 0,7649) → 500×0,7649 = 382,45;
//   netta = 814.676 − 38.245 = 776.431 (> 10 € → addizionali dovute);
//   regionale = 1,23% × 3.317.200 = 40.801,56 → 40.802;
//   netto = 4.487.000 − 1.169.761 − 776.431 − 40.802 = 2.500.006 ≥ 2.500.000 ✓
// Euro precedente 44.869,00: contributi 1.169.734,83 → 1.169.735; imponibile
//   round€(3.317.165) = 3.317.200 (stesso plateau) → netta 776.431, regionale 40.802;
//   netto = 4.486.900 − 1.169.735 − 776.431 − 40.802 = 2.499.932 < target ✓
export const inversoOrdinario = {
  targetCents: 2_500_000,
  input: {
    costiCents: 0,
    oneri19Cents: 0,
    figli: 'nessuno',
    addizionaleRegionale: 0.0123,
    addizionaleComunale: 0,
    sogliaEsenzioneComunaleCents: null,
    copertura: 'piena',
  },
  atteso: { lordoCents: 4_487_000, nettoCents: 2_500_006 },
} as const
