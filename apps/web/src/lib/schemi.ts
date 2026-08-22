// Schemi zod condivisi tra form, backup e test.
import { z } from 'zod'
import { parseImportoIt } from './format'

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** Anno minimo supportato: i parametri fiscali versionati partono dal 2025. */
export const ANNO_MINIMO_PARAMS = 2025

// Stessi limiti del form: un profilo fuori dagli anni coperti dai params farebbe
// lanciare computeTimeline al mount della Panoramica (pagina bianca da backup).
export const profiloSchema = z.object({
  id: z.literal(1),
  annoApertura: z.number().int().min(ANNO_MINIMO_PARAMS).max(new Date().getFullYear()),
  ateco: z.string(),
  coefficiente: z.number().min(0.01).max(1),
  copertura: z.enum(['piena', 'ridotta']),
})

export const fatturaRecordSchema = z.object({
  id: z.number().int().optional(),
  numero: z.string(),
  dataEmissione: z.string().regex(ISO_DATE),
  dataIncasso: z.string().regex(ISO_DATE).nullable(),
  importoCents: z.number().int().nonnegative(),
  bolloCents: z.number().int().nonnegative(),
  descrizione: z.string(),
})

export const backupSchema = z.object({
  schemaVersion: z.literal(1),
  esportatoIl: z.string(),
  profilo: profiloSchema.nullable(),
  fatture: z.array(fatturaRecordSchema),
})

export const profiloFormSchema = z.object({
  annoApertura: z.coerce
    .number()
    .int()
    .min(ANNO_MINIMO_PARAMS, 'I parametri partono dal 2025 (per anni precedenti: contribuisci!)')
    .max(new Date().getFullYear(), 'Anno nel futuro'),
  ateco: z
    .string()
    .regex(/^\d{2}(\.\d{2}(\.\d{2})?)?$/, 'Formato atteso: 62.02.00')
    .or(z.literal('')),
  coefficiente: z.coerce
    .number()
    .min(0.01, 'Scegli il settore o inserisci il codice ATECO')
    .max(1),
  copertura: z.enum(['piena', 'ridotta']),
})

export const fatturaFormSchema = z
  .object({
    numero: z.string().min(1, 'Obbligatorio'),
    dataEmissione: z.string().regex(ISO_DATE),
    importo: z.string().refine((v) => parseImportoIt(v) !== null, 'Importo non valido (es. 1.234,56)'),
    descrizione: z.string(),
    incassata: z.boolean(),
    dataIncasso: z.string().regex(ISO_DATE).or(z.literal('')),
  })
  .superRefine((valori, ctx) => {
    if (valori.incassata && !ISO_DATE.test(valori.dataIncasso)) {
      ctx.addIssue({
        code: 'custom',
        path: ['dataIncasso'],
        message: 'Indica la data di incasso (o togli la spunta)',
      })
    }
  })
