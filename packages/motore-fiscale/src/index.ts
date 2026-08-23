// Motore fiscale di Partitiva — TypeScript puro, zero dipendenze UI/storage.
// Sviluppato in TDD sui golden test del caso campione (vedi TESTING.md).
export { computeAnno, contributiFissiIvs } from './compute-anno'
export type {
  AnnoInput,
  Copertura,
  Flag,
  FlagCodice,
  GestioneInput,
  GestioneIvsInput,
  GestioneSeparataInput,
  RiduzioneIvs,
  RisultatoAnno,
} from './compute-anno'
export { computeTimeline } from './timeline'
export type { F24, F24Riga, Timeline, TimelineAnnoInput, TimelineOpts } from './timeline'
export { computeOrdinario } from './ordinario'
export type { FigliACarico, OrdinarioInput, RisultatoOrdinario } from './ordinario'
export { aggregaIncassato } from './cassa'
export type { Pagamento } from './cassa'
export { bolloPerFattura } from './bollo'
export { cents, euro, mulRate, roundEuroToCents, splitInRate } from './money'
export type { Cents } from './money'
export { defineParams, getParams, SUPPORTED_YEARS } from './params'
export type { FiscalParams, Fonte, ParamAnnuale, Rate } from './params'
export { coefficientePerAteco, GRUPPI_ATECO } from './params/ateco'
export type { GruppoAteco } from './params/ateco'
export type { Actuals, ExplainedValue, ExplainMap, NodeId, Origine } from './explain'

export const ENGINE_NAME = 'motore-fiscale' as const
