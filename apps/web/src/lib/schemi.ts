// Schemi zod condivisi tra form, backup e test.
import { z } from 'zod'
import { parseImportoIt } from './format'

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export const profiloSchema = z.object({
  id: z.literal(1),
  annoApertura: z.number().int().min(2015),
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
