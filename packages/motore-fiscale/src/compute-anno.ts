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

export type RiduzioneIvs = 'nessuna' | 'riduzione35' | 'riduzione50'

export interface GestioneSeparataInput {
  tipo: 'gestione-separata'
  copertura: Copertura
}

export interface GestioneIvsInput {
  tipo: 'artigiani' | 'commercianti'
  /** Anzianità contributiva al 31/12/1995: cambia il massimale (caso raro, default false in app). */
  anzianitaAl1995: boolean
  /** Agevolazione attiva NELL'ANNO: la finestra (es. 36 mesi della 50%) la decide il chiamante. */
  riduzione: RiduzioneIvs
}

export type GestioneInput = GestioneSeparataInput | GestioneIvsInput

export interface AnnoInput {
  anno: number
  incassatoCents: number
  coefficiente: number
  startup: boolean
  copertura: Copertura
  /** Gestione previdenziale: assente = Gestione Separata con la `copertura` qui sopra. */
  gestione?: GestioneInput
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
  | 'massimale-ivs'
  | 'sotto-minimale-ivs'
  | 'accredito-ridotto'

export interface Flag {
  codice: FlagCodice
  messaggio: string
}

export interface RisultatoAnno {
  anno: number
  redditoCents: Cents
  contributiDovutiCents: Cents
  /** Solo gestioni IVS: componenti dei dovuti (i fissi si versano in 4 rate, l'eccedenza a saldo/acconti). */
  contributiFissiCents?: Cents
  contributiEccedenzaCents?: Cents
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

/** Quota IVS su un importo: aliquota base (× riduzione) + aliquota aggiuntiva commercianti
 *  (ridotta solo se la riduzione lo prevede: la 50% la lascia piena, circ. 83/2025 §3). */
function quotaIvs(
  importoCents: Cents,
  aliquotaBase: number,
  gestione: GestioneIvsInput,
  params: FiscalParams,
): Cents {
  const ivs = params.previdenzaIvs
  const riduzione = gestione.riduzione === 'nessuna' ? null : ivs.riduzioni.valore[gestione.riduzione]
  const base = riduzione
    ? mulRate(mulRate(importoCents, aliquotaBase), riduzione.moltiplicatore)
    : mulRate(importoCents, aliquotaBase)
  const aliquotaAggiuntiva =
    gestione.tipo === 'commercianti' ? ivs.aliquotaAggiuntivaCommercianti.valore : 0
  if (aliquotaAggiuntiva === 0) return base
  const aggiuntivaPiena = mulRate(importoCents, aliquotaAggiuntiva)
  const aggiuntiva =
    riduzione && riduzione.riduceAliquotaAggiuntiva
      ? mulRate(aggiuntivaPiena, riduzione.moltiplicatore)
      : aggiuntivaPiena
  return cents(base + aggiuntiva)
}

/** Contributi fissi annui sul minimale (maternità inclusa): servono anche alla timeline per le 4 rate. */
export function contributiFissiIvs(gestione: GestioneIvsInput, params: FiscalParams): Cents {
  const ivs = params.previdenzaIvs
  return cents(quotaIvs(ivs.minimale.valore, ivs.aliquotaBase.valore, gestione, params) + ivs.maternitaAnnua.valore)
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

  const gestione: GestioneInput = input.gestione ?? { tipo: 'gestione-separata', copertura: input.copertura }

  let contributiDovuti: Cents
  let contributiFissi: Cents | undefined
  let contributiEccedenza: Cents | undefined

  if (gestione.tipo === 'gestione-separata') {
    const aliquotaGs =
      gestione.copertura === 'piena' ? params.previdenza.aliquotaPiena : params.previdenza.aliquotaRidotta
    const massimale = params.previdenza.massimale.valore
    const oltreMassimale = reddito > massimale
    if (oltreMassimale) {
      flags.push({
        codice: 'massimale-gs',
        messaggio: 'Reddito oltre il massimale Gestione Separata: i contributi si calcolano sul massimale.',
      })
    }
    contributiDovuti = explain.nodo(
      id('contributiDovuti'),
      'Contributi Gestione Separata dovuti',
      'min(reddito, massimale) × aliquota GS',
      [id('reddito')],
      mulRate(oltreMassimale ? massimale : reddito, aliquotaGs.valore),
      { fonte: aliquotaGs.fonte },
    )
  } else {
    const ivs = params.previdenzaIvs
    const massimaleIvs = gestione.anzianitaAl1995
      ? ivs.massimaleAnzianita1995.valore
      : ivs.massimalePost1995.valore
    if (reddito > massimaleIvs) {
      flags.push({
        codice: 'massimale-ivs',
        messaggio: 'Reddito oltre il massimale IVS: i contributi si calcolano fino al massimale della tua fascia.',
      })
    }
    // Anche a reddito zero: i fissi sul minimale sono dovuti comunque (a differenza della GS).
    if (reddito < ivs.minimale.valore) {
      flags.push({
        codice: 'sotto-minimale-ivs',
        messaggio: 'Reddito sotto il minimale: i contributi fissi sul minimale si pagano comunque.',
      })
    }
    if (gestione.riduzione !== 'nessuna') {
      flags.push({
        codice: 'accredito-ridotto',
        messaggio:
          'Riduzione contributiva attiva: se il versato resta sotto il contributo pieno sul minimale, i mesi accreditati ai fini pensionistici sono proporzionalmente ridotti (art. 2, c. 29, L. 335/1995).',
      })
    }

    contributiFissi = explain.nodo(
      id('contributiFissi'),
      `Contributi fissi sul minimale (${gestione.tipo})`,
      'minimale × aliquota IVS (× eventuale riduzione) + maternità 7,44 € (mai ridotta)',
      [],
      contributiFissiIvs(gestione, params),
      { fonte: ivs.minimale.fonte },
    )
    const imponibileIvs = cents(Math.min(reddito, massimaleIvs))
    const fascia = ivs.fasciaPiuUno.valore
    const scaglione1 = cents(Math.max(0, Math.min(imponibileIvs, fascia) - ivs.minimale.valore))
    const scaglione2 = cents(Math.max(0, imponibileIvs - fascia))
    contributiEccedenza = explain.nodo(
      id('contributiEccedenza'),
      'Contributi sulla quota eccedente il minimale',
      'scaglioni oltre il minimale (fino al massimale) × aliquota, +1 punto oltre la prima fascia, × eventuale riduzione',
      [id('reddito')],
      cents(
        quotaIvs(scaglione1, ivs.aliquotaBase.valore, gestione, params) +
          quotaIvs(scaglione2, ivs.aliquotaBase.valore + ivs.incrementoOltreFascia.valore, gestione, params),
      ),
      { fonte: ivs.fasciaPiuUno.fonte },
    )
    contributiDovuti = explain.nodo(
      id('contributiDovuti'),
      `Contributi ${gestione.tipo} dovuti`,
      'contributi fissi sul minimale + quota eccedente',
      [id('contributiFissi'), id('contributiEccedenza')],
      cents(contributiFissi + contributiEccedenza),
    )
  }

  const versati = explain.nodo(
    id('versatiContributi'),
    'Contributi versati nell’anno (deducibili)',
    gestione.tipo === 'gestione-separata'
      ? 'saldo anno precedente + acconti pagati nell’anno (mai negativo)'
      : 'rate fisse pagate nell’anno + saldo e acconti sull’eccedenza (mai negativo)',
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
  if (gestione.tipo === 'gestione-separata' && reddito > 0 && reddito < params.previdenza.minimaleAccredito.valore) {
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
    ...(contributiFissi !== undefined ? { contributiFissiCents: contributiFissi } : {}),
    ...(contributiEccedenza !== undefined ? { contributiEccedenzaCents: contributiEccedenza } : {}),
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
