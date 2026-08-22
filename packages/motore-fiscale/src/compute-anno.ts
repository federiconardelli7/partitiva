// Catena di competenza di un anno fiscale in regime forfettario (Gestione Separata).
// Regole e fonti: docs/regole-fiscali.md. Ogni importo è un nodo di spiegazione.
import {
  assertActualsUsati,
  createExplain,
  type Actuals,
  type Explain,
  type ExplainMap,
  type NodeId,
} from './explain'
import { cents, mulRate, roundEuroToCents, type Cents } from './money'
import type { FiscalParams } from './params/types'

export type Copertura = 'piena' | 'ridotta'

export interface AnnoInput {
  anno: number
  incassatoCents: number
  coefficiente: number
  startup: boolean
  copertura: Copertura
  /** Contributi previdenziali versati nell'anno (deduzione per cassa). Derivati dagli F24 nella timeline. */
  versatiContributiCents: number
  bolliCents?: number
  speseCents?: number
  actuals?: Actuals
}

export type FlagCodice =
  | 'soglia-85k'
  | 'soglia-100k'
  | 'massimale-gs'
  | 'minimale-accredito'
  | 'params-fallback'
  | 'previsionale-sanzioni'

export interface Flag {
  codice: FlagCodice
  messaggio: string
}

export interface RisultatoAnno {
  anno: number
  redditoCents: Cents
  contributiDovutiCents: Cents
  versatiContributiCents: Cents
  imponibileCents: Cents
  impostaCents: Cents
  bolliCents: Cents
  speseCents: Cents
  nettoCompetenzaCents: Cents
  nettoRealeCents: Cents
  /** Quota consigliata da accantonare su ogni incasso: (contributi + imposta) / incassato. */
  quotaAccantonamento: number
  flags: Flag[]
  explain: ExplainMap
}

export function computeAnno(input: AnnoInput, params: FiscalParams): RisultatoAnno {
  const explain = createExplain(input.actuals)
  const risultato = computeAnnoConExplain(input, params, explain)
  assertActualsUsati(explain)
  return risultato
}

/** Variante interna: explain (e actuals) condivisi, usata dalla timeline multi-anno. */
export function computeAnnoConExplain(
  input: AnnoInput,
  params: FiscalParams,
  explain: Explain,
): RisultatoAnno {
  const { anno } = input
  if (input.incassatoCents < 0) {
    throw new Error(`Incassato negativo non valido per il ${anno}: ${input.incassatoCents}`)
  }
  const id = (campo: string): NodeId => `${anno}:${campo}`
  const flags: Flag[] = []

  const incassato = explain.nodo(
    id('incassato'),
    `Incassato ${anno} (principio di cassa)`,
    'somma degli incassi con data di incasso nell’anno solare',
    [],
    cents(input.incassatoCents),
  )

  const reddito = explain.nodo(
    id('reddito'),
    'Reddito forfettario',
    'incassato × coefficiente di redditività',
    [id('incassato')],
    mulRate(incassato, input.coefficiente),
  )

  const aliquotaGs =
    input.copertura === 'piena' ? params.previdenza.aliquotaPiena : params.previdenza.aliquotaRidotta
  const massimale = params.previdenza.massimale.valore
  const oltreMassimale = reddito > massimale
  if (oltreMassimale) {
    flags.push({
      codice: 'massimale-gs',
      messaggio: 'Reddito oltre il massimale Gestione Separata: i contributi si calcolano sul massimale.',
    })
  }
  const contributiDovuti = explain.nodo(
    id('contributiDovuti'),
    'Contributi Gestione Separata dovuti',
    'min(reddito, massimale) × aliquota GS',
    [id('reddito')],
    mulRate(oltreMassimale ? massimale : reddito, aliquotaGs.valore),
    { fonte: aliquotaGs.fonte },
  )

  const versati = explain.nodo(
    id('versatiContributi'),
    'Contributi versati nell’anno (deducibili)',
    'saldo anno precedente + acconti pagati nell’anno (mai negativo)',
    [],
    cents(Math.max(0, input.versatiContributiCents)),
  )

  const imponibile = explain.nodo(
    id('imponibile'),
    'Imponibile fiscale',
    'max(0, reddito − versati), arrotondato all’euro come in dichiarazione',
    [id('reddito'), id('versatiContributi')],
    roundEuroToCents(cents(Math.max(0, reddito - versati))),
  )

  const aliquotaImposta = input.startup ? params.imposta.startup : params.imposta.ordinaria
  const imposta = explain.nodo(
    id('imposta'),
    'Imposta sostitutiva',
    'imponibile × aliquota (5% startup / 15%)',
    [id('imponibile')],
    mulRate(imponibile, aliquotaImposta.valore),
    { fonte: aliquotaImposta.fonte },
  )

  const bolli = cents(input.bolliCents ?? 0)
  const spese = cents(input.speseCents ?? 0)

  const nettoCompetenza = explain.nodo(
    id('nettoCompetenza'),
    'Netto di competenza',
    'incassato − contributi dovuti − imposta',
    [id('incassato'), id('contributiDovuti'), id('imposta')],
    cents(incassato - contributiDovuti - imposta),
  )
  const nettoReale = explain.nodo(
    id('nettoReale'),
    'Netto reale',
    'netto di competenza − bolli − spese',
    [id('nettoCompetenza')],
    cents(nettoCompetenza - bolli - spese),
  )

  if (incassato > params.soglie.uscitaImmediata.valore) {
    flags.push({
      codice: 'soglia-100k',
      messaggio: 'Incassato oltre 100.000 €: uscita IMMEDIATA dal regime forfettario.',
    })
  } else if (incassato > params.soglie.uscitaAnnoSuccessivo.valore) {
    flags.push({
      codice: 'soglia-85k',
      messaggio: 'Incassato oltre 85.000 €: uscita dal regime forfettario dall’anno successivo.',
    })
  }
  if (reddito > 0 && reddito < params.previdenza.minimaleAccredito.valore) {
    flags.push({
      codice: 'minimale-accredito',
      messaggio: 'Reddito sotto il minimale: l’anno non accredita 12 mesi di contributi (informativo).',
    })
  }

  const quotaAccantonamento = incassato > 0 ? (contributiDovuti + imposta) / incassato : 0

  return {
    anno,
    redditoCents: reddito,
    contributiDovutiCents: contributiDovuti,
    versatiContributiCents: versati,
    imponibileCents: imponibile,
    impostaCents: imposta,
    bolliCents: bolli,
    speseCents: spese,
    nettoCompetenzaCents: nettoCompetenza,
    nettoRealeCents: nettoReale,
    quotaAccantonamento,
    flags,
    explain: explain.map,
  }
}
