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
  imposta: {
    startup: ParamAnnuale<Rate>
    ordinaria: ParamAnnuale<Rate>
    anniStartup: ParamAnnuale<number>
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
  imposta: z.object({
    startup: param(rate),
    ordinaria: param(rate),
    anniStartup: param(z.number().int().positive()),
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
