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

/** Totale annuo NON tracciato a fatture («pregresso»): si somma alle fatture dell'anno. */
export interface RiepilogoAnnuale {
  /** Chiave primaria: un riepilogo per anno. */
  anno: number
  incassatoCents: number
  bolliCents: number
}

class PartitivaDb extends Dexie {
  profilo!: Table<Profilo, number>
  fatture!: Table<Fattura, number>
  riepiloghi!: Table<RiepilogoAnnuale, number>

  constructor() {
    super('partitiva')
    this.version(1).stores({
      profilo: 'id',
      fatture: '++id, dataEmissione, dataIncasso',
    })
    this.version(2).stores({
      riepiloghi: 'anno',
    })
  }
}

export const db = new PartitivaDb()
