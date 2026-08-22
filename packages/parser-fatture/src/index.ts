// Parser fatture di Partitiva: FatturaPA XML (FPR12) e buste p7m. Il parser PDF arriva in S6.
export { parseFatturaFile, parseFatturaPA } from './parse'
export { sbustaP7m } from './p7m'
export { estraiValutaOriginale } from './valuta'
export type {
  EsitoParse,
  FatturaParsed,
  RiepilogoIva,
  RigaFattura,
  SoggettoFattura,
  ValutaOriginale,
} from './tipi'

export const PARSER_NAME = 'parser-fatture' as const
