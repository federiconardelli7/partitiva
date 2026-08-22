// Storage locale (IndexedDB via Dexie): i dati fiscali non lasciano mai il dispositivo.
import Dexie, { type Table } from 'dexie'

export interface Profilo {
  /** Singleton: sempre 1. */
  id: number
  annoApertura: number
  ateco: string
  coefficiente: number
  copertura: 'piena' | 'ridotta'
}

export interface Fattura {
  id?: number
  numero: string
  /** ISO yyyy-mm-dd. */
  dataEmissione: string
  /** null = emessa ma non ancora incassata (nel forfettario conta l'incasso). */
  dataIncasso: string | null
  importoCents: number
  bolloCents: number
  descrizione: string
}

class PartitivaDb extends Dexie {
  profilo!: Table<Profilo, number>
  fatture!: Table<Fattura, number>

  constructor() {
    super('partitiva')
    this.version(1).stores({
      profilo: 'id',
      fatture: '++id, dataEmissione, dataIncasso',
    })
  }
}

export const db = new PartitivaDb()
