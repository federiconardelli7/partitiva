// Parametri fiscali = DATI versionati per anno, ogni valore con la sua fonte (principi 2 e 3).
// I tipi TS portano i Cents brandizzati; lo schema zod valida i file al load (defineParams).
import { z } from 'zod'
import type { Cents } from '../money'

export type Rate = number

export interface Fonte {
  riferimento: string
  url?: string
  /** Data dell'ultima verifica, ISO yyyy-mm-dd. */
  verificatoIl: string
  /** Presente quando la fonte primaria non è ancora stata riletta integralmente. */
  daVerificare?: true
}

export interface ParamAnnuale<T> {
  valore: T
  fonte: Fonte
}

export interface FiscalParams {
  anno: number
  previdenza: {
    tipo: 'gestione-separata'
    aliquotaPiena: ParamAnnuale<Rate>
    aliquotaRidotta: ParamAnnuale<Rate>
    massimale: ParamAnnuale<Cents>
    /** Reddito minimo per l'accredito di 12 mesi di contributi (informativo, NON un minimo di versamento). */
    minimaleAccredito: ParamAnnuale<Cents>
  }
  /** Artigiani ed esercenti attività commerciali (IVS): fissi sul minimale + eccedenza. */
  previdenzaIvs: {
    minimale: ParamAnnuale<Cents>
    aliquotaBase: ParamAnnuale<Rate>
    /** 0,48% commercianti (0,46 indennizzo cessazione + 0,02 gestione). Zero per gli artigiani. */
    aliquotaAggiuntivaCommercianti: ParamAnnuale<Rate>
    /** 0,62 €/mese, sempre dovuta per intero, inclusa nelle rate fisse. */
    maternitaAnnua: ParamAnnuale<Cents>
    /** Prima fascia di retribuzione pensionabile: oltre, l'aliquota sale di un punto. */
    fasciaPiuUno: ParamAnnuale<Cents>
    incrementoOltreFascia: ParamAnnuale<Rate>
    massimaleAnzianita1995: ParamAnnuale<Cents>
    massimalePost1995: ParamAnnuale<Cents>
    /** MM-DD base delle 4 rate fisse (la 4ª è dell'anno successivo); sabato/domenica → lunedì. */
    scadenzeRateFisse: ParamAnnuale<[string, string, string, string]>
    causali: ParamAnnuale<{
      fissiArtigiani: string
      fissiCommercianti: string
      eccedenzaArtigiani: string
      eccedenzaCommercianti: string
    }>
    /** Quota degli acconti sull'eccedenza (ripartita con acconti.ripartizione). */
    quotaAccontiEccedenza: ParamAnnuale<Rate>
    riduzioni: ParamAnnuale<{
      riduzione35: { moltiplicatore: Rate; riduceAliquotaAggiuntiva: boolean }
      riduzione50: { moltiplicatore: Rate; riduceAliquotaAggiuntiva: boolean }
    }>
  }
  imposta: {
    startup: ParamAnnuale<Rate>
    ordinaria: ParamAnnuale<Rate>
    anniStartup: ParamAnnuale<number>
  }
  /** Regime ordinario, per il confronto «quando conviene uscire»: IRPEF e addizionali. */
  irpef: {
    /** Scaglioni in ordine crescente; l'ultimo ha finoACents = null (oltre). */
    scaglioni: ParamAnnuale<{ finoACents: number | null; aliquota: Rate }[]>
    /** Art. 13 c. 5/5-ter/6 TUIR: detrazione per redditi di lavoro autonomo e impresa minore.
     *  I «rapporti» si assumono alle prime QUATTRO cifre decimali (c. 6): troncamento, non round. */
    detrazioneLavoroAutonomo: ParamAnnuale<{
      bassa: { finoACents: number; importoCents: number }
      media: { finoACents: number; baseCents: number; extraCents: number; divisoreCents: number }
      alta: { finoACents: number; baseCents: number; divisoreCents: number }
      bonus: { oltreCents: number; finoACents: number; importoCents: number }
    }>
    /** Oneri detraibili al 19% SOGGETTI ai meccanismi (esclusi sanitarie e mutui, che ne sono
     *  fuori per legge): tetto di spesa 16-ter, degressione 15 c. 3-bis, taglio oltre 200k. */
    oneriDetraibili: ParamAnnuale<{
      aliquota: Rate
      tetto: {
        daCents: number
        sogliaBase100kCents: number
        importoBaseCents: { fino100k: number; oltre100k: number }
        coefficientiFigli: { nessuno: Rate; uno: Rate; due: Rate; oltreODisabilita: Rate }
      }
      degressione: { daCents: number; aCents: number }
      taglioAltiRedditi: { sogliaCents: number; importoCents: number } | null
    }>
    /** Limiti di legge per le aliquote delle addizionali (le aliquote vere sono input utente). */
    addizionali: ParamAnnuale<{ regionaleBase: Rate; regionaleMax: Rate; comunaleMax: Rate }>
  }
  acconti: {
    quotaImposta: ParamAnnuale<Rate>
    quotaContributi: ParamAnnuale<Rate>
    ripartizione: ParamAnnuale<[Rate, Rate]>
    /** Nessun acconto imposta se l'imposta dell'anno precedente non supera questa soglia. */
    minimoAcconto: ParamAnnuale<Cents>
    /** Sotto questa soglia l'acconto imposta si versa in unica rata a novembre. */
    sogliaRataUnica: ParamAnnuale<Cents>
    /** Se le soglie minime valgano anche per gli acconti dei contributi GS (default prudente: no). */
    soglieApplicabiliAContributi: ParamAnnuale<boolean>
    maggiorazioneDifferimento: ParamAnnuale<Rate>
    scadenze: ParamAnnuale<{ saldoEPrimaRata: string; secondaRata: string }>
    codiciTributo: ParamAnnuale<{ primoAcconto: string; secondoAcconto: string; saldo: string }>
    causaliInps: ParamAnnuale<{ piena: string; ridotta: string }>
  }
  soglie: {
    uscitaAnnoSuccessivo: ParamAnnuale<Cents>
    uscitaImmediata: ParamAnnuale<Cents>
  }
  bollo: {
    soglia: ParamAnnuale<Cents>
    importo: ParamAnnuale<Cents>
  }
}

const fonteSchema = z.object({
  riferimento: z.string().min(3),
  url: z.url().optional(),
  verificatoIl: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  daVerificare: z.literal(true).optional(),
})

const param = <T extends z.ZodType>(valore: T) => z.object({ valore, fonte: fonteSchema })
const rate = z.number().min(0).max(1)
const centsSchema = z.number().int().nonnegative()
const scadenza = z.string().regex(/^\d{2}-\d{2}$/)

const fiscalParamsSchema = z.object({
  anno: z.number().int().min(2015),
  previdenza: z.object({
    tipo: z.literal('gestione-separata'),
    aliquotaPiena: param(rate),
    aliquotaRidotta: param(rate),
    massimale: param(centsSchema),
    minimaleAccredito: param(centsSchema),
  }),
  previdenzaIvs: z.object({
    minimale: param(centsSchema),
    aliquotaBase: param(rate),
    aliquotaAggiuntivaCommercianti: param(rate),
    maternitaAnnua: param(centsSchema),
    fasciaPiuUno: param(centsSchema),
    incrementoOltreFascia: param(rate),
    massimaleAnzianita1995: param(centsSchema),
    massimalePost1995: param(centsSchema),
    scadenzeRateFisse: param(z.tuple([scadenza, scadenza, scadenza, scadenza])),
    causali: param(
      z.object({
        fissiArtigiani: z.string(),
        fissiCommercianti: z.string(),
        eccedenzaArtigiani: z.string(),
        eccedenzaCommercianti: z.string(),
      }),
    ),
    quotaAccontiEccedenza: param(rate),
    riduzioni: param(
      z.object({
        riduzione35: z.object({ moltiplicatore: rate, riduceAliquotaAggiuntiva: z.boolean() }),
        riduzione50: z.object({ moltiplicatore: rate, riduceAliquotaAggiuntiva: z.boolean() }),
      }),
    ),
  }),
  imposta: z.object({
    startup: param(rate),
    ordinaria: param(rate),
    anniStartup: param(z.number().int().positive()),
  }),
  irpef: z.object({
    scaglioni: param(
      z
        .array(z.object({ finoACents: z.number().int().positive().nullable(), aliquota: rate }))
        .min(2)
        .refine((s) => s[s.length - 1]!.finoACents === null, 'l’ultimo scaglione deve essere aperto (finoACents null)'),
    ),
    detrazioneLavoroAutonomo: param(
      z.object({
        bassa: z.object({ finoACents: centsSchema, importoCents: centsSchema }),
        media: z.object({ finoACents: centsSchema, baseCents: centsSchema, extraCents: centsSchema, divisoreCents: centsSchema }),
        alta: z.object({ finoACents: centsSchema, baseCents: centsSchema, divisoreCents: centsSchema }),
        bonus: z.object({ oltreCents: centsSchema, finoACents: centsSchema, importoCents: centsSchema }),
      }),
    ),
    oneriDetraibili: param(
      z.object({
        aliquota: rate,
        tetto: z.object({
          daCents: centsSchema,
          sogliaBase100kCents: centsSchema,
          importoBaseCents: z.object({ fino100k: centsSchema, oltre100k: centsSchema }),
          coefficientiFigli: z.object({ nessuno: rate, uno: rate, due: rate, oltreODisabilita: rate }),
        }),
        degressione: z.object({ daCents: centsSchema, aCents: centsSchema }),
        taglioAltiRedditi: z.object({ sogliaCents: centsSchema, importoCents: centsSchema }).nullable(),
      }),
    ),
    addizionali: param(z.object({ regionaleBase: rate, regionaleMax: rate, comunaleMax: rate })),
  }),
  acconti: z.object({
    quotaImposta: param(rate),
    quotaContributi: param(rate),
    ripartizione: param(z.tuple([rate, rate])),
    minimoAcconto: param(centsSchema),
    sogliaRataUnica: param(centsSchema),
    soglieApplicabiliAContributi: param(z.boolean()),
    maggiorazioneDifferimento: param(rate),
    scadenze: param(z.object({ saldoEPrimaRata: scadenza, secondaRata: scadenza })),
    codiciTributo: param(
      z.object({ primoAcconto: z.string(), secondoAcconto: z.string(), saldo: z.string() }),
    ),
    causaliInps: param(z.object({ piena: z.string(), ridotta: z.string() })),
  }),
  soglie: z.object({
    uscitaAnnoSuccessivo: param(centsSchema),
    uscitaImmediata: param(centsSchema),
  }),
  bollo: z.object({
    soglia: param(centsSchema),
    importo: param(centsSchema),
  }),
})

/** Valida un file params al momento del load: una PR di dati malformata fallisce all'import. */
export function defineParams(params: FiscalParams): FiscalParams {
  fiscalParamsSchema.parse(params)
  return params
}
