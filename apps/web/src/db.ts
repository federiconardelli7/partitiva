// Storage locale (IndexedDB via Dexie): i dati fiscali non lasciano mai il dispositivo.
import type { RiduzioneIvs } from '@partitiva/motore-fiscale'
import Dexie, { type Table } from 'dexie'

export interface Profilo {
  /** Singleton: sempre 1. */
  id: number
  annoApertura: number
  ateco: string
  coefficiente: number
  /** Nome del gruppo dell'allegato 4: quattro gruppi condividono il 40%, il coefficiente
   *  da solo non basta a ricordare la scelta. Assente nei profili salvati prima di S10. */
  settore?: string
  copertura: 'piena' | 'ridotta'
  /** Gestione previdenziale: assente = Gestione Separata (profili pre-S11). */
  gestione?: 'gestione-separata' | 'artigiani' | 'commercianti'
  /** Solo gestioni IVS: anzianità contributiva al 31/12/1995 (cambia il massimale). */
  anzianitaAl1995?: boolean
  /** Solo gestioni IVS: agevolazione richiesta all'INPS (la finestra della 50% la deriva l'app). */
  riduzioneIvs?: RiduzioneIvs
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

/** Spesa NON deducibile (il coefficiente le forfetizza): pesa solo sul netto reale. */
export interface Spesa {
  id?: number
  /** ISO yyyy-mm-dd: la spesa appartiene all'anno di questa data (cassa). */
  data: string
  importoCents: number
  descrizione: string
}

class PartitivaDb extends Dexie {
  profilo!: Table<Profilo, number>
  fatture!: Table<Fattura, number>
  riepiloghi!: Table<RiepilogoAnnuale, number>
  spese!: Table<Spesa, number>

  constructor() {
    super('partitiva')
    this.version(1).stores({
      profilo: 'id',
      fatture: '++id, dataEmissione, dataIncasso',
    })
    this.version(2).stores({
      riepiloghi: 'anno',
    })
    this.version(3).stores({
      spese: '++id, data',
    })
  }
}

export const db = new PartitivaDb()
