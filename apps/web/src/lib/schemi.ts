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

export const riepilogoRecordSchema = z.object({
  anno: z.number().int().min(ANNO_MINIMO_PARAMS).max(new Date().getFullYear()),
  incassatoCents: z.number().int().nonnegative(),
  bolliCents: z.number().int().nonnegative(),
})

export const spesaRecordSchema = z.object({
  id: z.number().int().optional(),
  data: z.string().regex(ISO_DATE),
  importoCents: z.number().int().nonnegative(),
  descrizione: z.string(),
})

// Un riepilogo per anno: due voci sullo stesso anno sarebbero risolte in silenzio dall'import.
const riepiloghiUnici = z.array(riepilogoRecordSchema).superRefine((riepiloghi, ctx) => {
  if (new Set(riepiloghi.map((r) => r.anno)).size !== riepiloghi.length) {
    ctx.addIssue({ code: 'custom', message: 'Riepiloghi con anni duplicati' })
  }
})

const backupV1Schema = z.object({
  schemaVersion: z.literal(1),
  esportatoIl: z.string(),
  profilo: profiloSchema.nullable(),
  fatture: z.array(fatturaRecordSchema),
})

const backupV2Schema = z.object({
  schemaVersion: z.literal(2),
  esportatoIl: z.string(),
  profilo: profiloSchema.nullable(),
  fatture: z.array(fatturaRecordSchema),
  riepiloghi: riepiloghiUnici,
})

const backupV3Schema = z.object({
  schemaVersion: z.literal(3),
  esportatoIl: z.string(),
  profilo: profiloSchema.nullable(),
  fatture: z.array(fatturaRecordSchema),
  riepiloghi: riepiloghiUnici,
  spese: z.array(spesaRecordSchema),
})

/** v3 attuale; i backup v1 e v2 si importano ancora e diventano v3.
 *  Array vuoti creati per ogni parse: mai istanze condivise tra risultati. */
export const backupSchema = z.union([
  backupV3Schema,
  backupV2Schema.transform((v2) => ({
    ...v2,
    schemaVersion: 3 as const,
    spese: [] as z.infer<typeof spesaRecordSchema>[],
  })),
  backupV1Schema.transform((v1) => ({
    ...v1,
    schemaVersion: 3 as const,
    riepiloghi: [] as z.infer<typeof riepilogoRecordSchema>[],
    spese: [] as z.infer<typeof spesaRecordSchema>[],
  })),
])

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

export const riepilogoFormSchema = z.object({
  anno: z.coerce
    .number()
    .int()
    .min(ANNO_MINIMO_PARAMS)
    .max(new Date().getFullYear(), 'Il futuro si simula, non si registra'),
  incassato: z.string().refine((v) => parseImportoIt(v) !== null, 'Importo non valido (es. 10.000,00)'),
  bolli: z.string().refine((v) => v.trim() === '' || parseImportoIt(v) !== null, 'Importo non valido (es. 24,00)'),
})

export const spesaFormSchema = z.object({
  data: z.string().regex(ISO_DATE),
  importo: z.string().refine((v) => parseImportoIt(v) !== null, 'Importo non valido (es. 123,45)'),
  descrizione: z.string(),
})

export const fatturaFormSchema = z
  .object({
    numero: z.string().min(1, 'Obbligatorio'),
    dataEmissione: z.string().regex(ISO_DATE),
    importo: z.string().refine((v) => parseImportoIt(v) !== null, 'Importo non valido (es. 1.234,56)'),
    /** Vuoto = bollo automatico dalla regola dei params; pieno = override manuale. */
    bollo: z
      .string()
      .refine((v) => v.trim() === '' || parseImportoIt(v) !== null, 'Importo non valido (es. 2,00)')
      .default(''),
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
