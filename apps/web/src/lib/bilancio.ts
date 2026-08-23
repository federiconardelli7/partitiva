// Logica pura dell'app: dal registro fatture agli input della timeline del motore.
// Le REGOLE fiscali (cassa, bollo, catena) vivono nel motore; qui solo l'adattamento dei dati.
import {
  aggregaIncassato,
  cents,
  coefficientePerAteco,
  getParams,
  GRUPPI_ATECO,
  SUPPORTED_YEARS,
  type F24,
  type FiscalParams,
  type TimelineAnnoInput,
} from '@partitiva/motore-fiscale'
import type { Fattura, Profilo, RiepilogoAnnuale, Spesa } from '../db'

/** Anno dei parametri effettivamente usati per `anno` (l'ultimo disponibile ≤ anno). */
export function annoParamsVicini(anno: number): number {
  const precedenti = SUPPORTED_YEARS.filter((a) => a <= anno)
  const scelto = precedenti[precedenti.length - 1] ?? SUPPORTED_YEARS[0]
  if (scelto === undefined) throw new Error('Nessun anno di parametri disponibile')
  return scelto
}

/** Params dell'anno più vicino disponibile (≤ anno, altrimenti il primo supportato). */
export function paramsVicini(anno: number): FiscalParams {
  return getParams(annoParamsVicini(anno))
}

export const annoDi = (iso: string): number => Number(iso.slice(0, 4))

/** Bolli di competenza dell'anno di EMISSIONE (il bollo nasce con la fattura, non con l'incasso). */
export function bolliPerAnno(fatture: readonly Fattura[], anno: number): number {
  return fatture
    .filter((f) => annoDi(f.dataEmissione) === anno)
    .reduce((somma, f) => somma + f.bolloCents, 0)
}

/** Riepilogo dell'anno («pregresso»: totale non tracciato a fatture), null se assente. */
export function riepilogoDi(riepiloghi: readonly RiepilogoAnnuale[], anno: number): RiepilogoAnnuale | null {
  return riepiloghi.find((r) => r.anno === anno) ?? null
}

/** Spese dell'anno (cassa sulla data della spesa): pesano solo sul netto reale. */
export function spesePerAnno(spese: readonly Spesa[], anno: number): number {
  return spese.filter((s) => annoDi(s.data) === anno).reduce((somma, s) => somma + s.importoCents, 0)
}

export function buildTimelineInputs(
  profilo: Pick<Profilo, 'annoApertura' | 'coefficiente' | 'copertura'>,
  fatture: readonly Fattura[],
  riepiloghi: readonly RiepilogoAnnuale[],
  spese: readonly Spesa[],
  annoFinale: number,
): TimelineAnnoInput[] {
  const annoInizio = profilo.annoApertura
  if (annoFinale < annoInizio) return []
  const anniStartup = paramsVicini(annoInizio).imposta.anniStartup.valore
  const pagamenti = fatture
    .filter((f): f is Fattura & { dataIncasso: string } => f.dataIncasso !== null)
    .map((f) => ({ importoCents: cents(f.importoCents), dataIncasso: f.dataIncasso }))

  const inputs: TimelineAnnoInput[] = []
  for (let anno = annoInizio; anno <= annoFinale; anno++) {
    // Il pregresso si SOMMA alle fatture dell'anno: adattamento dati, non regola fiscale.
    const pregresso = riepilogoDi(riepiloghi, anno)
    inputs.push({
      anno,
      incassatoCents: aggregaIncassato(pagamenti, anno) + (pregresso?.incassatoCents ?? 0),
      coefficiente: profilo.coefficiente,
      startup: anno - profilo.annoApertura < anniStartup,
      copertura: profilo.copertura,
      bolliCents: bolliPerAnno(fatture, anno) + (pregresso?.bolliCents ?? 0),
      speseCents: spesePerAnno(spese, anno),
    })
  }
  return inputs
}

/** Ultimo anno di aliquota startup 5% (apertura 2025 e 5 anni → 2029). */
export function annoUltimoStartup(annoApertura: number): number {
  return annoApertura + paramsVicini(annoApertura).imposta.anniStartup.valore - 1
}

/** Anno di attività 1-based: nell'anno di apertura vale 1. */
export function numeroAnnoAttivita(annoApertura: number, anno: number): number {
  return anno - annoApertura + 1
}

/**
 * Nome del settore di un profilo. L'ATECO decide (se coerente col coefficiente salvato);
 * il solo coefficiente basta solo quando è univoco: quattro gruppi condividono il 40%,
 * e nominare quello sbagliato nella "sorgente di verità" sarebbe peggio che tacere.
 */
export function settoreProfilo(profilo: Pick<Profilo, 'ateco' | 'coefficiente' | 'settore'>): string | null {
  // Il nome salvato nel profilo (S10+) vince su ogni euristica, ma solo se è un gruppo
  // vero E coerente col coefficiente salvato (un backup può portare un nome scombinato).
  if (profilo.settore !== undefined) {
    const coerente = GRUPPI_ATECO.some(
      (g) => g.settore === profilo.settore && g.coefficiente === profilo.coefficiente,
    )
    return coerente ? profilo.settore : null
  }
  const daAteco = coefficientePerAteco(profilo.ateco)
  if (daAteco && daAteco.coefficiente === profilo.coefficiente) return daAteco.settore
  const stessoCoefficiente = GRUPPI_ATECO.filter((g) => g.coefficiente === profilo.coefficiente)
  return stessoCoefficiente.length === 1 ? (stessoCoefficiente[0]?.settore ?? null) : null
}

/** Fatture emesse ma senza data di incasso: quante e per quanto. */
export function daIncassare(fatture: readonly Fattura[]): { conteggio: number; importoCents: number } {
  const aperte = fatture.filter((f) => f.dataIncasso === null)
  return {
    conteggio: aperte.length,
    importoCents: aperte.reduce((somma, f) => somma + f.importoCents, 0),
  }
}

/** Primo F24 con scadenza non ancora passata (null se sono tutti alle spalle). */
export function prossimoF24(f24s: readonly F24[], oggi: string): F24 | null {
  const futuri = [...f24s]
    .filter((f) => f.dataScadenza >= oggi)
    .sort((a, b) => a.dataScadenza.localeCompare(b.dataScadenza))
  return futuri[0] ?? null
}

/** Giorni di calendario tra oggi e una data ISO (entrambe yyyy-mm-dd, confronto in UTC). */
export function giorniA(dataIso: string, oggi: string): number {
  const MS_PER_GIORNO = 86_400_000
  return Math.round((Date.parse(dataIso) - Date.parse(oggi)) / MS_PER_GIORNO)
}
