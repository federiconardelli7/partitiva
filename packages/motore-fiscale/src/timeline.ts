// Timeline multi-anno: fold in cui gli F24 dell'anno N dipendono dai risultati di N−1
// e il versato di N alimenta la deduzione di N. Crediti esposti, mai compensati in automatico.
import {
  computeAnnoConExplain,
  type Copertura,
  type Flag,
  type RisultatoAnno,
} from './compute-anno'
import {
  assertActualsUsati,
  createExplain,
  type Actuals,
  type ExplainMap,
  type NodeId,
} from './explain'
import { cents, mulRate, roundEuroToCents, splitInRate, type Cents } from './money'
import { getParams, SUPPORTED_YEARS } from './params'
import type { FiscalParams, ParamAnnuale, Rate } from './params/types'

export interface TimelineAnnoInput {
  anno: number
  incassatoCents: number
  coefficiente: number
  startup: boolean
  copertura: Copertura
  bolliCents?: number
  speseCents?: number
}

export interface F24Riga {
  codice: string
  descrizione: string
  importoCents: Cents
  nodeId: NodeId
}

export interface F24 {
  anno: number
  scadenza: 'luglio' | 'novembre'
  dataScadenza: string
  totaleCents: Cents
  /** Saldi a credito emersi a questa scadenza (esposti, MAI sottratti in automatico dall'F24). */
  creditiCents: Cents
  righe: F24Riga[]
}

export interface TimelineOpts {
  actuals?: Actuals
  metodo?: 'storico' | 'previsionale'
  /** Solo per il metodo previsionale: incassato previsto per anno. */
  incassatoPrevistoCents?: Record<number, number>
  /** Sorgente parametri alternativa (test, gestioni custom); default: registry per anno. */
  getParams?: (anno: number) => FiscalParams
}

export interface Timeline {
  anni: Record<number, RisultatoAnno>
  f24: F24[]
  flags: Flag[]
  explain: ExplainMap
}

interface AccontiAnno {
  impostaRata1: Cents
  impostaRata2: Cents
  impostaUnica: boolean
  contributiRata1: Cents
  contributiRata2: Cents
  contributiUnica: boolean
}

interface SaldiPrecedenti {
  anno: number
  impostaCents: Cents
  contributiCents: Cents
}

interface StatoPrecedente {
  result: RisultatoAnno
  acconti?: AccontiAnno
}

const ZERO = cents(0)

export function computeTimeline(inputs: TimelineAnnoInput[], opts: TimelineOpts = {}): Timeline {
  const ordinati = [...inputs].sort((a, b) => a.anno - b.anno)
  if (ordinati.length === 0) return { anni: {}, f24: [], flags: [], explain: {} }
  for (let i = 1; i < ordinati.length; i++) {
    const precedente = ordinati[i - 1]!.anno
    const corrente = ordinati[i]!.anno
    if (corrente === precedente) throw new Error(`Anno duplicato nella timeline: ${corrente}`)
    if (corrente !== precedente + 1) {
      throw new Error(
        `Gli anni della timeline devono essere consecutivi: manca il ${precedente + 1} tra ${precedente} e ${corrente}`,
      )
    }
  }

  const explain = createExplain(opts.actuals)
  const flags: Flag[] = []
  const anni: Record<number, RisultatoAnno> = {}
  const f24: F24[] = []
  const previsionale = opts.metodo === 'previsionale'
  if (previsionale) {
    flags.push({
      codice: 'previsionale-sanzioni',
      messaggio:
        'Acconti col metodo previsionale: se la previsione risulta troppo bassa scattano sanzioni e interessi sul minor versato.',
    })
  }

  const sorgenteParams = opts.getParams ?? getParams
  const fallbackFlagged = new Set<number>()
  const paramsPerAnno = (anno: number): FiscalParams => {
    try {
      return sorgenteParams(anno)
    } catch {
      const precedenti = SUPPORTED_YEARS.filter((a) => a < anno)
      const ultimo = precedenti[precedenti.length - 1]
      if (ultimo === undefined) throw new Error(`Nessun parametro disponibile per il ${anno} né per anni precedenti`)
      if (!fallbackFlagged.has(anno)) {
        fallbackFlagged.add(anno)
        flags.push({
          codice: 'params-fallback',
          messaggio: `Parametri ${anno} non ancora disponibili: uso quelli del ${ultimo} (da riverificare a inizio anno).`,
        })
      }
      return sorgenteParams(ultimo)
    }
  }

  const aliquotaGsPer = (copertura: Copertura, params: FiscalParams): ParamAnnuale<Rate> =>
    copertura === 'piena' ? params.previdenza.aliquotaPiena : params.previdenza.aliquotaRidotta

  /** Crea i nodi di spiegazione dei saldi dell'anno precedente e ne restituisce i valori effettivi. */
  const buildSaldi = (prev: StatoPrecedente): SaldiPrecedenti => {
    const annoPrec = prev.result.anno
    const acconti = prev.acconti
    const versatiImposta = (acconti?.impostaRata1 ?? 0) + (acconti?.impostaRata2 ?? 0)
    const versatiContributi = (acconti?.contributiRata1 ?? 0) + (acconti?.contributiRata2 ?? 0)
    const inputImposta: NodeId[] = [`${annoPrec}:imposta`]
    if (acconti && (acconti.impostaRata1 > 0 || acconti.impostaRata2 > 0)) {
      inputImposta.push(
        acconti.impostaUnica ? `${annoPrec}:accontoImposta:unica` : `${annoPrec}:accontoImposta:rata1`,
      )
    }
    const inputContributi: NodeId[] = [`${annoPrec}:contributiDovuti`]
    if (acconti && (acconti.contributiRata1 > 0 || acconti.contributiRata2 > 0)) {
      inputContributi.push(
        acconti.contributiUnica
          ? `${annoPrec}:accontoContributi:unica`
          : `${annoPrec}:accontoContributi:rata1`,
      )
    }
    const impostaEff = explain.nodo(
      `${annoPrec}:saldoImposta`,
      `Saldo imposta sostitutiva ${annoPrec}`,
      'imposta dovuta − acconti versati (negativo = credito)',
      inputImposta,
      cents(prev.result.impostaCents - versatiImposta),
    )
    const contributiEff = explain.nodo(
      `${annoPrec}:saldoContributi`,
      `Saldo contributi Gestione Separata ${annoPrec}`,
      'contributi dovuti − acconti versati (negativo = credito)',
      inputContributi,
      cents(prev.result.contributiDovutiCents - versatiContributi),
    )
    return { anno: annoPrec, impostaCents: impostaEff, contributiCents: contributiEff }
  }

  const accontiPerAnno = (
    anno: number,
    prev: StatoPrecedente | undefined,
    saldi: SaldiPrecedenti | undefined,
    params: FiscalParams,
    inputCorrente: TimelineAnnoInput | undefined,
  ): AccontiAnno | undefined => {
    if (!prev) return undefined

    const ripartizione = params.acconti.ripartizione.valore
    const minimo = params.acconti.minimoAcconto.valore
    const sogliaUnica = params.acconti.sogliaRataUnica.valore
    const soglieSuContributi = params.acconti.soglieApplicabiliAContributi.valore

    let baseImposta: Cents = prev.result.impostaCents
    let baseContributi: Cents = prev.result.contributiDovutiCents
    const previsto = previsionale ? opts.incassatoPrevistoCents?.[anno] : undefined
    let redditoPrevisto: Cents | undefined
    if (previsto !== undefined && inputCorrente) {
      redditoPrevisto = mulRate(cents(previsto), inputCorrente.coefficiente)
      const massimale = params.previdenza.massimale.valore
      baseContributi = mulRate(
        redditoPrevisto > massimale ? massimale : redditoPrevisto,
        aliquotaGsPer(inputCorrente.copertura, params).valore,
      )
    }

    // Contributi GS: calcolati per primi perché nel previsionale concorrono alla deduzione prevista.
    const gsDovuto = soglieSuContributi ? baseContributi > minimo : baseContributi > 0
    const gsTotale = gsDovuto ? mulRate(baseContributi, params.acconti.quotaContributi.valore) : ZERO
    const gsUnica = gsDovuto && soglieSuContributi && gsTotale < sogliaUnica
    let contributiRata1: Cents = ZERO
    let contributiRata2: Cents = ZERO
    if (gsDovuto && gsTotale > 0) {
      if (gsUnica) {
        contributiRata2 = explain.nodo(
          `${anno}:accontoContributi:unica`,
          `Acconto contributi GS ${anno} in unica rata (novembre)`,
          'contributi anno precedente × 80% (sotto la soglia: rata unica)',
          [`${anno - 1}:contributiDovuti`],
          gsTotale,
        )
      } else {
        const [rata1, rata2] = splitInRate(gsTotale, ripartizione)
        contributiRata1 = explain.nodo(
          `${anno}:accontoContributi:rata1`,
          `1ª rata acconto contributi GS ${anno}`,
          'contributi anno precedente × 80% × ripartizione',
          [`${anno - 1}:contributiDovuti`],
          rata1,
        )
        contributiRata2 = explain.nodo(
          `${anno}:accontoContributi:rata2`,
          `2ª rata acconto contributi GS ${anno}`,
          'contributi anno precedente × 80% × ripartizione',
          [`${anno - 1}:contributiDovuti`],
          rata2,
        )
      }
    }

    // Imposta: nel previsionale la base è l'imposta PREVISTA sull'imponibile previsto
    // (reddito previsto − versamenti previsti nell'anno), mai sul reddito lordo.
    if (redditoPrevisto !== undefined && inputCorrente) {
      const saldoGsPagato = saldi ? Math.max(0, saldi.contributiCents) : 0
      const versatiPrevisti = cents(saldoGsPagato + contributiRata1 + contributiRata2)
      const imponibilePrevisto = roundEuroToCents(cents(Math.max(0, redditoPrevisto - versatiPrevisti)))
      const aliquota = inputCorrente.startup ? params.imposta.startup : params.imposta.ordinaria
      baseImposta = mulRate(imponibilePrevisto, aliquota.valore)
    }

    const impostaDovuta = baseImposta > minimo
    const impostaTotale = impostaDovuta ? mulRate(baseImposta, params.acconti.quotaImposta.valore) : ZERO
    const impostaUnica = impostaDovuta && impostaTotale < sogliaUnica
    let impostaRata1: Cents = ZERO
    let impostaRata2: Cents = ZERO
    if (impostaDovuta && impostaUnica) {
      impostaRata2 = explain.nodo(
        `${anno}:accontoImposta:unica`,
        `Acconto imposta ${anno} in unica rata (novembre)`,
        'imposta di riferimento × 100% (sotto 257,52 €: rata unica)',
        [`${anno - 1}:imposta`],
        impostaTotale,
      )
    } else if (impostaDovuta) {
      const [rata1, rata2] = splitInRate(impostaTotale, ripartizione)
      impostaRata1 = explain.nodo(
        `${anno}:accontoImposta:rata1`,
        `1ª rata acconto imposta ${anno}`,
        'imposta di riferimento × 100% × ripartizione (art. 58 DL 124/2019)',
        [`${anno - 1}:imposta`],
        rata1,
      )
      impostaRata2 = explain.nodo(
        `${anno}:accontoImposta:rata2`,
        `2ª rata acconto imposta ${anno}`,
        'imposta di riferimento × 100% × ripartizione (art. 58 DL 124/2019)',
        [`${anno - 1}:imposta`],
        rata2,
      )
    }

    return { impostaRata1, impostaRata2, impostaUnica, contributiRata1, contributiRata2, contributiUnica: gsUnica }
  }

  interface EsitoF24 {
    luglio?: F24
    novembre?: F24
    versatiContributiCents: number
  }

  const buildF24 = (
    anno: number,
    params: FiscalParams,
    copertura: Copertura,
    saldi: SaldiPrecedenti | undefined,
    acconti: AccontiAnno | undefined,
  ): EsitoF24 => {
    const causale =
      copertura === 'piena' ? params.acconti.causaliInps.valore.piena : params.acconti.causaliInps.valore.ridotta
    const codici = params.acconti.codiciTributo.valore
    const righeLuglio: F24Riga[] = []
    let crediti = 0
    let versatiContributi = 0

    if (saldi) {
      if (saldi.impostaCents > 0) {
        righeLuglio.push({
          codice: codici.saldo,
          descrizione: `Saldo imposta sostitutiva ${saldi.anno}`,
          importoCents: saldi.impostaCents,
          nodeId: `${saldi.anno}:saldoImposta`,
        })
      } else if (saldi.impostaCents < 0) {
        crediti += -saldi.impostaCents
      }
      if (saldi.contributiCents > 0) {
        righeLuglio.push({
          codice: causale,
          descrizione: `Saldo contributi Gestione Separata ${saldi.anno}`,
          importoCents: saldi.contributiCents,
          nodeId: `${saldi.anno}:saldoContributi`,
        })
        versatiContributi += saldi.contributiCents
      } else if (saldi.contributiCents < 0) {
        crediti += -saldi.contributiCents
      }
    }

    if (acconti && acconti.impostaRata1 > 0) {
      righeLuglio.push({
        codice: codici.primoAcconto,
        descrizione: `1ª rata acconto imposta sostitutiva ${anno}`,
        importoCents: acconti.impostaRata1,
        nodeId: `${anno}:accontoImposta:rata1`,
      })
    }
    if (acconti && acconti.contributiRata1 > 0) {
      righeLuglio.push({
        codice: causale,
        descrizione: `1ª rata acconto contributi GS ${anno}`,
        importoCents: acconti.contributiRata1,
        nodeId: `${anno}:accontoContributi:rata1`,
      })
      versatiContributi += acconti.contributiRata1
    }

    const righeNovembre: F24Riga[] = []
    if (acconti && acconti.impostaRata2 > 0) {
      righeNovembre.push({
        codice: codici.secondoAcconto,
        descrizione: acconti.impostaUnica
          ? `Acconto imposta sostitutiva ${anno} (unica rata)`
          : `2ª rata acconto imposta sostitutiva ${anno}`,
        importoCents: acconti.impostaRata2,
        nodeId: acconti.impostaUnica ? `${anno}:accontoImposta:unica` : `${anno}:accontoImposta:rata2`,
      })
    }
    if (acconti && acconti.contributiRata2 > 0) {
      righeNovembre.push({
        codice: causale,
        descrizione: acconti.contributiUnica
          ? `Acconto contributi GS ${anno} (unica rata)`
          : `2ª rata acconto contributi GS ${anno}`,
        importoCents: acconti.contributiRata2,
        nodeId: acconti.contributiUnica ? `${anno}:accontoContributi:unica` : `${anno}:accontoContributi:rata2`,
      })
      versatiContributi += acconti.contributiRata2
    }

    const scadenze = params.acconti.scadenze.valore
    const totale = (righe: F24Riga[]): Cents => cents(righe.reduce((s, r) => s + r.importoCents, 0))

    const luglio =
      righeLuglio.length > 0 || crediti > 0
        ? {
            anno,
            scadenza: 'luglio' as const,
            dataScadenza: `${anno}-${scadenze.saldoEPrimaRata}`,
            totaleCents: totale(righeLuglio),
            creditiCents: cents(crediti),
            righe: righeLuglio,
          }
        : undefined
    const novembre =
      righeNovembre.length > 0
        ? {
            anno,
            scadenza: 'novembre' as const,
            dataScadenza: `${anno}-${scadenze.secondaRata}`,
            totaleCents: totale(righeNovembre),
            creditiCents: ZERO,
            righe: righeNovembre,
          }
        : undefined

    return { luglio, novembre, versatiContributiCents: versatiContributi }
  }

  let prev: StatoPrecedente | undefined
  for (const inputAnno of ordinati) {
    const params = paramsPerAnno(inputAnno.anno)
    const saldi = prev ? buildSaldi(prev) : undefined
    const acconti = accontiPerAnno(inputAnno.anno, prev, saldi, params, inputAnno)
    const esito = buildF24(inputAnno.anno, params, inputAnno.copertura, saldi, acconti)
    if (esito.luglio) f24.push(esito.luglio)
    if (esito.novembre) f24.push(esito.novembre)

    const result = computeAnnoConExplain(
      { ...inputAnno, versatiContributiCents: esito.versatiContributiCents },
      params,
      explain,
    )
    anni[inputAnno.anno] = result
    const flagNuovi = result.flags.filter(
      (f) => !flags.some((g) => g.codice === f.codice && g.messaggio === f.messaggio),
    )
    flags.push(...flagNuovi)
    prev = { result, acconti }
  }

  // Anno di conguaglio dopo l'ultimo anno di input: saldi + acconti (anche previsionali).
  if (prev) {
    const ultimo = ordinati[ordinati.length - 1]!
    const annoConguaglio = ultimo.anno + 1
    const params = paramsPerAnno(annoConguaglio)
    const saldi = buildSaldi(prev)
    const inputConguaglio: TimelineAnnoInput = { ...ultimo, anno: annoConguaglio, incassatoCents: 0 }
    const acconti = accontiPerAnno(annoConguaglio, prev, saldi, params, inputConguaglio)
    const esito = buildF24(annoConguaglio, params, ultimo.copertura, saldi, acconti)
    if (esito.luglio) f24.push(esito.luglio)
    if (esito.novembre) f24.push(esito.novembre)
  }

  assertActualsUsati(explain)
  return { anni, f24, flags, explain: explain.map }
}
