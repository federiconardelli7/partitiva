// Export/import JSON: unico meccanismo di backup, visto che i dati vivono solo in IndexedDB.
import type { Fattura, Profilo, RiepilogoAnnuale, Spesa } from '../db'
import { ANNO_MINIMO_PARAMS, backupSchema } from './schemi'

export interface Backup {
  schemaVersion: 3
  esportatoIl: string
  profilo: Profilo | null
  fatture: Fattura[]
  riepiloghi: RiepilogoAnnuale[]
  spese: Spesa[]
}

export function serializzaBackup(
  profilo: Profilo | null,
  fatture: Fattura[],
  riepiloghi: RiepilogoAnnuale[],
  spese: Spesa[],
  esportatoIl: string,
): string {
  const backup: Backup = { schemaVersion: 3, esportatoIl, profilo, fatture, riepiloghi, spese }
  return JSON.stringify(backup, null, 2)
}

export function deserializzaBackup(json: string): Backup {
  let dati: unknown
  try {
    dati = JSON.parse(json)
  } catch {
    throw new Error('File non valido: non è un JSON')
  }
  const esito = backupSchema.safeParse(dati)
  if (!esito.success) {
    // La causa più frequente merita un errore che la NOMINA: anno fuori dai params.
    const anno = (dati as { profilo?: { annoApertura?: unknown } } | null)?.profilo?.annoApertura
    if (typeof anno === 'number' && (anno < ANNO_MINIMO_PARAMS || anno > new Date().getFullYear())) {
      throw new Error(
        `Backup non importabile: annoApertura ${anno} fuori dagli anni supportati (dal ${ANNO_MINIMO_PARAMS}, non nel futuro)`,
      )
    }
    throw new Error('File di backup non riconosciuto (schemaVersion o struttura non validi)')
  }
  return esito.data as Backup
}
