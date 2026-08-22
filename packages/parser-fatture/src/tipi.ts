// Tipi del parser FatturaPA. Gli importi sono in centesimi interi, come nel motore.

export interface SoggettoFattura {
  paese: string
  /** P.IVA (IdCodice) o identificativo fiscale estero. */
  id: string
  codiceFiscale?: string
  denominazione: string
  regimeFiscale?: string
}

export interface RigaFattura {
  numeroLinea: number
  descrizione: string
  prezzoTotaleCents: number
  aliquotaIva: number
  natura?: string
}

export interface RiepilogoIva {
  imponibileCents: number
  impostaCents: number
  natura?: string
  riferimentoNormativo?: string
}

export interface ValutaOriginale {
  valuta: string
  importoOriginaleCents: number
  cambio: number
  dataTesto?: string
}

export interface FatturaParsed {
  versione: string
  /** TD01 fattura, TD04 nota di credito, ecc.: l'import accetta solo TD01. */
  tipoDocumento: string
  numero: string
  /** ISO yyyy-mm-dd (campo Data del documento). */
  data: string
  divisa: string
  importoTotaleCents: number
  cedente: SoggettoFattura
  committente: SoggettoFattura
  righe: RigaFattura[]
  riepiloghi: RiepilogoIva[]
  bollo: { virtuale: boolean; importoCents: number } | null
  /** Metadati opzionali estratti euristicamente dalla descrizione (fatture in valuta). */
  valutaOriginale: ValutaOriginale | null
}

export interface EsitoParse {
  /** Un file FPR12 può essere un LOTTO: ogni FatturaElettronicaBody è una fattura. */
  fatture: FatturaParsed[]
  warnings: string[]
}
