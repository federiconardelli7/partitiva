// Addizionale regionale all'IRPEF: strutture UFFICIALI 2025 e 2026 delle 19 regioni e
// 2 province autonome, dal portale MEF del federalismo fiscale (canale di pubblicazione
// legale ex art. 50, c. 3, D.Lgs. 446/1997), cross-check AdE Allegato C 730/2026 sul 2025.
// Semplificazioni dichiarate (docs/regole-fiscali.md, sez. «Regime ordinario»):
// - le detrazioni per figli a carico/disabilità (Campania, Liguria 2025, Marche, Piemonte,
//   Puglia, Sardegna, Veneto, Trento, Bolzano) NON sono modellate: senza carichi di famiglia
//   il calcolo è esatto, con carichi l'addizionale reale può essere più bassa;
// - Trento: la «deduzione di 30.000 se imponibile ≤ 30.000» è modellata come esenzione a
//   scalino (identica per costruzione: base zero sotto, base piena sopra — algoritmo AdE);
// - Bolzano: la detrazione a rampa min(125, (RC−50k)×125/25k) equivale ESATTAMENTE allo
//   scaglione 1,23 esteso fino a 75.000 (dimostrazione in regole-fiscali.md): qui si modella
//   così, con la detrazione fissa 430,50 fino a 90.000 (cliff).
import type { Fonte } from './types'

export type EntitaRegionale =
  | 'abruzzo'
  | 'basilicata'
  | 'bolzano'
  | 'calabria'
  | 'campania'
  | 'emilia-romagna'
  | 'friuli-venezia-giulia'
  | 'lazio'
  | 'liguria'
  | 'lombardia'
  | 'marche'
  | 'molise'
  | 'piemonte'
  | 'puglia'
  | 'sardegna'
  | 'sicilia'
  | 'toscana'
  | 'trento'
  | 'umbria'
  | 'valle-daosta'
  | 'veneto'

export type CalcoloAddizionale =
  | { tipo: 'unica'; aliquota: number }
  | { tipo: 'scaglioni'; scaglioni: { finoACents: number | null; aliquota: number }[] }

export interface StrutturaAddizionaleRegionale {
  /** Regimi condizionali sull'imponibile: si applica il PRIMO con imponibile ≤ soglia
   *  (null = senza limite). «unica» vale sull'INTERO importo (FVG, Lazio/Umbria sotto 28k);
   *  «scaglioni» è progressiva come l'IRPEF. */
  regimi: { seImponibileFinoACents: number | null; calcolo: CalcoloAddizionale }[]
  /** Esenzione totale a scalino: imponibile ≤ soglia → zero. */
  esenzioneCents?: number
  /** Detrazione fissa dall'imposta se imponibile ≤ soglia (cliff). */
  detrazioneFissa?: { importoCents: number; seImponibileFinoACents: number }
  /** Detrazione fissa se l'imponibile cade nella fascia (oltre, finoA]. */
  detrazioneAFascia?: { importoCents: number; oltreCents: number; finoACents: number }
}

interface EntitaAddizionale {
  id: EntitaRegionale
  nome: string
  perAnno: { 2025: StrutturaAddizionaleRegionale; 2026: StrutturaAddizionaleRegionale }
  fonte: Fonte
}

const VERIFICA = '2026-08-23'
const mefUrl = (reg: string) =>
  `https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/addregirpef.php?reg=${reg}&anno=2026`

const unica = (aliquota: number): StrutturaAddizionaleRegionale => ({
  regimi: [{ seImponibileFinoACents: null, calcolo: { tipo: 'unica', aliquota } }],
})
const scaglioni = (s: { finoACents: number | null; aliquota: number }[]): StrutturaAddizionaleRegionale => ({
  regimi: [{ seImponibileFinoACents: null, calcolo: { tipo: 'scaglioni', scaglioni: s } }],
})

const ENTITA: EntitaAddizionale[] = [
  {
    id: 'abruzzo',
    nome: 'Abruzzo',
    perAnno: {
      2025: scaglioni([
        { finoACents: 2_800_000, aliquota: 0.0167 },
        { finoACents: 5_000_000, aliquota: 0.0287 },
        { finoACents: null, aliquota: 0.0333 },
      ]),
      2026: scaglioni([
        { finoACents: 2_800_000, aliquota: 0.0167 },
        { finoACents: 5_000_000, aliquota: 0.0287 },
        { finoACents: null, aliquota: 0.0333 },
      ]),
    },
    fonte: { riferimento: 'MEF addizionale regionale, Abruzzo 2025/2026 (art. 1 c. 1 LR 9/2025; art. 1 c. 8 LR 44/2006): 1,67/2,87/3,33 sui 3 scaglioni statali', url: mefUrl('01'), verificatoIl: VERIFICA },
  },
  {
    id: 'basilicata',
    nome: 'Basilicata',
    perAnno: { 2025: unica(0.0123), 2026: unica(0.0123) },
    fonte: { riferimento: 'MEF, Basilicata 2025/2026: aliquota di base 1,23% (art. 6 D.Lgs. 68/2011)', url: mefUrl('02'), verificatoIl: VERIFICA },
  },
  {
    id: 'bolzano',
    nome: 'Provincia autonoma di Bolzano',
    perAnno: {
      2025: {
        regimi: [{ seImponibileFinoACents: null, calcolo: { tipo: 'scaglioni', scaglioni: [{ finoACents: 7_500_000, aliquota: 0.0123 }, { finoACents: null, aliquota: 0.0173 }] } }],
        detrazioneFissa: { importoCents: 43_050, seImponibileFinoACents: 9_000_000 },
      },
      2026: {
        regimi: [{ seImponibileFinoACents: null, calcolo: { tipo: 'scaglioni', scaglioni: [{ finoACents: 7_500_000, aliquota: 0.0123 }, { finoACents: null, aliquota: 0.0173 }] } }],
        detrazioneFissa: { importoCents: 43_050, seImponibileFinoACents: 9_000_000 },
      },
    },
    fonte: { riferimento: 'MEF, Bolzano 2025/2026 (art. 21-sexiesdecies LP 9/1998): 1,23 ≤50k, 1,73 oltre, detrazione 430,50 ≤90k (cliff) + rampa fino a 125 oltre 50k ≡ scaglione 1,23 fino a 75k (equivalenza dimostrata in regole-fiscali); detrazione 340/figlio NON modellata', url: mefUrl('03'), verificatoIl: VERIFICA },
  },
  {
    id: 'calabria',
    nome: 'Calabria',
    perAnno: { 2025: unica(0.0173), 2026: unica(0.0173) },
    fonte: { riferimento: 'MEF, Calabria 2025/2026: unica 1,73% (LR 30/2002 mod. LR 1/2006; confermata da tabella AdE 2025)', url: mefUrl('04'), verificatoIl: VERIFICA },
  },
  {
    id: 'campania',
    nome: 'Campania',
    perAnno: {
      2025: scaglioni([
        { finoACents: 1_500_000, aliquota: 0.0173 },
        { finoACents: 2_800_000, aliquota: 0.0296 },
        { finoACents: 5_000_000, aliquota: 0.032 },
        { finoACents: null, aliquota: 0.0333 },
      ]),
      2026: scaglioni([
        { finoACents: 1_500_000, aliquota: 0.0173 },
        { finoACents: 2_800_000, aliquota: 0.0296 },
        { finoACents: 5_000_000, aliquota: 0.032 },
        { finoACents: null, aliquota: 0.0333 },
      ]),
    },
    fonte: { riferimento: 'MEF, Campania 2025/2026 (LR 31/2021, LR 7/2022): 1,73/2,96/3,20/3,33 su griglia previgente 15k/28k/50k; detrazioni figli NON modellate', url: mefUrl('05'), verificatoIl: VERIFICA },
  },
  {
    id: 'emilia-romagna',
    nome: 'Emilia-Romagna',
    perAnno: {
      2025: scaglioni([
        { finoACents: 1_500_000, aliquota: 0.0133 },
        { finoACents: 2_800_000, aliquota: 0.0193 },
        { finoACents: 5_000_000, aliquota: 0.0293 },
        { finoACents: null, aliquota: 0.0333 },
      ]),
      2026: scaglioni([
        { finoACents: 1_500_000, aliquota: 0.0133 },
        { finoACents: 2_800_000, aliquota: 0.0193 },
        { finoACents: 5_000_000, aliquota: 0.0278 },
        { finoACents: null, aliquota: 0.0333 },
      ]),
    },
    fonte: { riferimento: 'MEF, Emilia-Romagna (art. 2 LR 19/2006 mod. LR 1/2025; 2026: LR 9/2025): terzo scaglione 2,93 → 2,78 dal 2026', url: mefUrl('06'), verificatoIl: VERIFICA },
  },
  {
    id: 'friuli-venezia-giulia',
    nome: 'Friuli Venezia Giulia',
    perAnno: {
      2025: {
        regimi: [
          { seImponibileFinoACents: 1_500_000, calcolo: { tipo: 'unica', aliquota: 0.007 } },
          { seImponibileFinoACents: null, calcolo: { tipo: 'unica', aliquota: 0.0123 } },
        ],
      },
      2026: {
        regimi: [
          { seImponibileFinoACents: 1_500_000, calcolo: { tipo: 'unica', aliquota: 0.007 } },
          { seImponibileFinoACents: null, calcolo: { tipo: 'unica', aliquota: 0.0123 } },
        ],
      },
    },
    fonte: { riferimento: 'MEF, FVG 2025/2026 (art. 1 c. 5 LR 14/2012): 0,70% sull’INTERO importo se ≤15k, 1,23% sull’intero se oltre (AdE: «non vigendo il principio di progressività per scaglioni»)', url: mefUrl('07'), verificatoIl: VERIFICA },
  },
  {
    id: 'lazio',
    nome: 'Lazio',
    perAnno: {
      2025: {
        regimi: [
          { seImponibileFinoACents: 2_800_000, calcolo: { tipo: 'unica', aliquota: 0.0173 } },
          { seImponibileFinoACents: null, calcolo: { tipo: 'scaglioni', scaglioni: [{ finoACents: 1_500_000, aliquota: 0.0173 }, { finoACents: null, aliquota: 0.0333 }] } },
        ],
        detrazioneAFascia: { importoCents: 6_000, oltreCents: 2_800_000, finoACents: 3_500_000 },
      },
      2026: {
        regimi: [
          { seImponibileFinoACents: 2_800_000, calcolo: { tipo: 'unica', aliquota: 0.0173 } },
          { seImponibileFinoACents: null, calcolo: { tipo: 'scaglioni', scaglioni: [{ finoACents: 1_500_000, aliquota: 0.0173 }, { finoACents: null, aliquota: 0.0333 }] } },
        ],
        detrazioneAFascia: { importoCents: 6_000, oltreCents: 2_800_000, finoACents: 3_000_000 },
      },
    },
    fonte: { riferimento: 'MEF, Lazio (2025: LR 22/2024; 2026: LR 20 del 31/12/2025): ≤28k flat 1,73 sull’intero; oltre, scaglioni 1,73(≤15k)/3,33 con detrazione 60 nella fascia 28.001–35.000 (2025) → 28.001–30.000 (2026)', url: mefUrl('08'), verificatoIl: VERIFICA },
  },
  {
    id: 'liguria',
    nome: 'Liguria',
    perAnno: {
      2025: scaglioni([
        { finoACents: 2_800_000, aliquota: 0.0123 },
        { finoACents: 5_000_000, aliquota: 0.0318 },
        { finoACents: null, aliquota: 0.0323 },
      ]),
      2026: scaglioni([
        { finoACents: 2_800_000, aliquota: 0.0123 },
        { finoACents: 5_000_000, aliquota: 0.0318 },
        { finoACents: null, aliquota: 0.0323 },
      ]),
    },
    fonte: { riferimento: 'MEF, Liguria 2025/2026 (LR 17/2024 art. 2-bis mod. LR 3/2025): 1,23/3,18/3,23 sui 3 scaglioni statali; detrazione figli (solo 2025) NON modellata', url: mefUrl('09'), verificatoIl: VERIFICA },
  },
  {
    id: 'lombardia',
    nome: 'Lombardia',
    perAnno: {
      2025: scaglioni([
        { finoACents: 1_500_000, aliquota: 0.0123 },
        { finoACents: 2_800_000, aliquota: 0.0158 },
        { finoACents: 5_000_000, aliquota: 0.0172 },
        { finoACents: null, aliquota: 0.0173 },
      ]),
      2026: scaglioni([
        { finoACents: 1_500_000, aliquota: 0.0123 },
        { finoACents: 2_800_000, aliquota: 0.0158 },
        { finoACents: 5_000_000, aliquota: 0.0172 },
        { finoACents: null, aliquota: 0.0173 },
      ]),
    },
    fonte: { riferimento: 'MEF, Lombardia 2025/2026 (art. 72 c. 1 LR 10/2003): 1,23/1,58/1,72/1,73 su griglia previgente', url: mefUrl('10'), verificatoIl: VERIFICA },
  },
  {
    id: 'marche',
    nome: 'Marche',
    perAnno: {
      2025: scaglioni([
        { finoACents: 1_500_000, aliquota: 0.0123 },
        { finoACents: 2_800_000, aliquota: 0.0153 },
        { finoACents: 5_000_000, aliquota: 0.017 },
        { finoACents: null, aliquota: 0.0173 },
      ]),
      2026: scaglioni([
        { finoACents: 1_500_000, aliquota: 0.0123 },
        { finoACents: 2_800_000, aliquota: 0.0153 },
        { finoACents: 5_000_000, aliquota: 0.017 },
        { finoACents: null, aliquota: 0.0173 },
      ]),
    },
    fonte: { riferimento: 'MEF, Marche 2025/2026 (art. 1 LR 5/2022): 1,23/1,53/1,70/1,73 su griglia previgente; aliquota agevolata figli disabili NON modellata', url: mefUrl('11'), verificatoIl: VERIFICA },
  },
  {
    id: 'molise',
    nome: 'Molise',
    perAnno: {
      2025: scaglioni([
        { finoACents: 1_500_000, aliquota: 0.0203 },
        { finoACents: 2_800_000, aliquota: 0.0223 },
        { finoACents: null, aliquota: 0.0363 },
      ]),
      2026: scaglioni([
        { finoACents: 1_500_000, aliquota: 0.0203 },
        { finoACents: 2_800_000, aliquota: 0.0223 },
        { finoACents: null, aliquota: 0.0363 },
      ]),
    },
    fonte: { riferimento: 'MEF, Molise 2025/2026 (art. 2 LR 9/2013 + automatismi sanitari art. 2 c. 86 L. 191/2009, già incorporati): 2,03/2,23/3,63', url: mefUrl('12'), verificatoIl: VERIFICA },
  },
  {
    id: 'piemonte',
    nome: 'Piemonte',
    perAnno: {
      2025: scaglioni([
        { finoACents: 1_500_000, aliquota: 0.0162 },
        { finoACents: 2_800_000, aliquota: 0.0213 },
        { finoACents: 5_000_000, aliquota: 0.0275 },
        { finoACents: null, aliquota: 0.0333 },
      ]),
      2026: scaglioni([
        { finoACents: 1_500_000, aliquota: 0.0162 },
        { finoACents: 2_800_000, aliquota: 0.0268 },
        { finoACents: 5_000_000, aliquota: 0.0331 },
        { finoACents: null, aliquota: 0.0333 },
      ]),
    },
    fonte: { riferimento: 'MEF, Piemonte (LR 4/2022; 2026: LR 16 del 6/8/2025): 2º e 3º scaglione 2,13→2,68 e 2,75→3,31 dal 2026; detrazioni figli NON modellate', url: mefUrl('13'), verificatoIl: VERIFICA },
  },
  {
    id: 'puglia',
    nome: 'Puglia',
    perAnno: {
      2025: scaglioni([
        { finoACents: 1_500_000, aliquota: 0.0133 },
        { finoACents: 2_800_000, aliquota: 0.0143 },
        { finoACents: 5_000_000, aliquota: 0.0163 },
        { finoACents: null, aliquota: 0.0185 },
      ]),
      2026: scaglioni([
        { finoACents: 1_500_000, aliquota: 0.0133 },
        { finoACents: 2_800_000, aliquota: 0.0213 },
        { finoACents: 5_000_000, aliquota: 0.0323 },
        { finoACents: null, aliquota: 0.0333 },
      ]),
    },
    fonte: { riferimento: 'MEF, Puglia (2025: LR 8/2022; 2026: Decreto Commissario ad acta n. 3 del 28/5/2026, disavanzo sanitario): forte aumento dal 2026; detrazioni figli NON modellate', url: mefUrl('14'), verificatoIl: VERIFICA },
  },
  {
    id: 'sardegna',
    nome: 'Sardegna',
    perAnno: { 2025: unica(0.0123), 2026: unica(0.0123) },
    fonte: { riferimento: 'MEF, Sardegna 2025/2026: unica 1,23%; detrazione figli minorenni NON modellata', url: mefUrl('15'), verificatoIl: VERIFICA },
  },
  {
    id: 'sicilia',
    nome: 'Sicilia',
    perAnno: { 2025: unica(0.0123), 2026: unica(0.0123) },
    fonte: { riferimento: 'MEF, Sicilia 2025/2026: unica 1,23%', url: mefUrl('16'), verificatoIl: VERIFICA },
  },
  {
    id: 'toscana',
    nome: 'Toscana',
    perAnno: {
      2025: scaglioni([
        { finoACents: 1_500_000, aliquota: 0.0142 },
        { finoACents: 2_800_000, aliquota: 0.0143 },
        { finoACents: 5_000_000, aliquota: 0.0332 },
        { finoACents: null, aliquota: 0.0333 },
      ]),
      2026: scaglioni([
        { finoACents: 1_500_000, aliquota: 0.0142 },
        { finoACents: 2_800_000, aliquota: 0.0143 },
        { finoACents: 5_000_000, aliquota: 0.0332 },
        { finoACents: null, aliquota: 0.0333 },
      ]),
    },
    fonte: { riferimento: 'MEF, Toscana 2025/2026 (art. 1 LR 48/2023): 1,42/1,43/3,32/3,33 su griglia previgente; calcolare SEMPRE dalle aliquote (le costanti della tabella AdE hanno un refuso)', url: mefUrl('17'), verificatoIl: VERIFICA },
  },
  {
    id: 'trento',
    nome: 'Provincia autonoma di Trento',
    perAnno: {
      2025: {
        regimi: [{ seImponibileFinoACents: null, calcolo: { tipo: 'scaglioni', scaglioni: [{ finoACents: 5_000_000, aliquota: 0.0123 }, { finoACents: null, aliquota: 0.0173 }] } }],
        esenzioneCents: 3_000_000,
      },
      2026: {
        regimi: [{ seImponibileFinoACents: null, calcolo: { tipo: 'scaglioni', scaglioni: [{ finoACents: 5_000_000, aliquota: 0.0123 }, { finoACents: null, aliquota: 0.0173 }] } }],
        esenzioneCents: 3_000_000,
      },
    },
    fonte: { riferimento: 'MEF + AdE Allegato C §19.24.3.1.10, Trento 2025/2026 (art. 1 c. 2-quater/2-sexies/3-bis LP 13/2019, mod. LP 5/2025 e LP 11/2025): 1,23 ≤50k, 1,73 oltre; deduzione 30.000 se imponibile ≤30.000 (cliff → base zero: modellata come esenzione); detrazione 246/figlio ≤50k NON modellata', url: mefUrl('18'), verificatoIl: VERIFICA },
  },
  {
    id: 'umbria',
    nome: 'Umbria',
    perAnno: {
      2025: {
        regimi: [
          { seImponibileFinoACents: 2_800_000, calcolo: { tipo: 'unica', aliquota: 0.0123 } },
          { seImponibileFinoACents: null, calcolo: { tipo: 'scaglioni', scaglioni: [{ finoACents: 1_500_000, aliquota: 0.0173 }, { finoACents: 2_800_000, aliquota: 0.0302 }, { finoACents: 5_000_000, aliquota: 0.0312 }, { finoACents: null, aliquota: 0.0333 }] } },
        ],
        detrazioneAFascia: { importoCents: 15_000, oltreCents: 2_800_000, finoACents: 5_000_000 },
      },
      2026: {
        regimi: [
          { seImponibileFinoACents: 2_800_000, calcolo: { tipo: 'unica', aliquota: 0.0123 } },
          { seImponibileFinoACents: null, calcolo: { tipo: 'scaglioni', scaglioni: [{ finoACents: 1_500_000, aliquota: 0.0173 }, { finoACents: 2_800_000, aliquota: 0.0302 }, { finoACents: 5_000_000, aliquota: 0.0312 }, { finoACents: null, aliquota: 0.0333 }] } },
        ],
        detrazioneAFascia: { importoCents: 15_000, oltreCents: 2_800_000, finoACents: 5_000_000 },
      },
    },
    fonte: { riferimento: 'MEF, Umbria 2025/2026 (art. 1 LR 2 dell’11/4/2025): ≤28k flat 1,23 sull’intero (maggiorazioni disapplicate); oltre, scaglioni 1,73/3,02/3,12/3,33 con detrazione 150 nella fascia 28.001–50.000', url: mefUrl('19'), verificatoIl: VERIFICA },
  },
  {
    id: 'valle-daosta',
    nome: 'Valle d’Aosta',
    perAnno: {
      2025: { ...unica(0.0123), esenzioneCents: 1_500_000 },
      2026: { ...unica(0.0123), esenzioneCents: 1_500_000 },
    },
    fonte: { riferimento: 'MEF, Valle d’Aosta (2025: LR 32/2022; 2026: LR 29 del 23/12/2025): esenzione ≤15.000 (scalino, verificata dall’AdE sull’imponibile), oltre 1,23% sull’intero', url: mefUrl('20'), verificatoIl: VERIFICA },
  },
  {
    id: 'veneto',
    nome: 'Veneto',
    perAnno: { 2025: unica(0.0123), 2026: unica(0.0123) },
    fonte: { riferimento: 'MEF, Veneto 2025/2026 (LR 19/2005 mod. LR 30/2022): unica 1,23%; aliquota 0,9 per disabilità NON modellata', url: mefUrl('21'), verificatoIl: VERIFICA },
  },
]

/** Per i select dell'app: id e nome, in ordine alfabetico MEF. */
export const ENTITA_REGIONALI: { id: EntitaRegionale; nome: string }[] = ENTITA.map(({ id, nome }) => ({ id, nome }))

/** Fonte della singola entità (per spiegazioni e docs). */
export function fonteAddizionaleRegionale(entita: EntitaRegionale): Fonte {
  return ENTITA.find((e) => e.id === entita)!.fonte
}

/** Struttura vigente per l'anno: fuori dal 2025/2026 vale l'anno più vicino — è la regola
 *  legale di carry-over (art. 1, c. 728, L. 207/2024, mod. c. 649 L. 199/2025, anni 2025-2028). */
export function strutturaAddizionaleRegionale(entita: EntitaRegionale, anno: number): StrutturaAddizionaleRegionale {
  const voce = ENTITA.find((e) => e.id === entita)
  if (!voce) throw new Error(`Entità regionale sconosciuta: ${entita}`)
  return anno >= 2026 ? voce.perAnno[2026] : voce.perAnno[2025]
}
