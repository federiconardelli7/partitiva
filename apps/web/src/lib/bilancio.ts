// Logica pura dell'app: dal registro fatture agli input della timeline del motore.
// Le REGOLE fiscali (cassa, bollo, catena) vivono nel motore; qui solo l'adattamento dei dati.
import {
  aggregaIncassato,
  cents,
  getParams,
  SUPPORTED_YEARS,
  type FiscalParams,
  type TimelineAnnoInput,
} from '@partitiva/motore-fiscale'
import type { Fattura, Profilo } from '../db'

/** Params dell'anno più vicino disponibile (≤ anno, altrimenti il primo supportato). */
export function paramsVicini(anno: number): FiscalParams {
  const precedenti = SUPPORTED_YEARS.filter((a) => a <= anno)
  const scelto = precedenti[precedenti.length - 1] ?? SUPPORTED_YEARS[0]
  if (scelto === undefined) throw new Error('Nessun anno di parametri disponibile')
  return getParams(scelto)
}

export const annoDi = (iso: string): number => Number(iso.slice(0, 4))

/** Bolli di competenza dell'anno di EMISSIONE (il bollo nasce con la fattura, non con l'incasso). */
export function bolliPerAnno(fatture: readonly Fattura[], anno: number): number {
  return fatture
    .filter((f) => annoDi(f.dataEmissione) === anno)
    .reduce((somma, f) => somma + f.bolloCents, 0)
}

export function buildTimelineInputs(
  profilo: Pick<Profilo, 'annoApertura' | 'coefficiente' | 'copertura'>,
  fatture: readonly Fattura[],
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
    inputs.push({
      anno,
      incassatoCents: aggregaIncassato(pagamenti, anno),
      coefficiente: profilo.coefficiente,
      startup: anno - profilo.annoApertura < anniStartup,
      copertura: profilo.copertura,
      bolliCents: bolliPerAnno(fatture, anno),
    })
  }
  return inputs
}

/** Anni residui di aliquota startup 5% per l'anno indicato (0 = già al 15%). */
export function anniResiduiStartup(annoApertura: number, anno: number): number {
  const anniStartup = paramsVicini(annoApertura).imposta.anniStartup.valore
  return Math.max(0, anniStartup - (anno - annoApertura + 1))
}
