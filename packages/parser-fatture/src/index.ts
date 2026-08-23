// Parser fatture di Partitiva: FatturaPA XML (FPR12), buste p7m ed euristiche sul testo
// dei PDF col foglio di stile SdI (l'estrazione del testo, pdf.js, vive nell'app).
export { parseFatturaFile, parseFatturaPA } from './parse'
export { sbustaP7m } from './p7m'
export { estraiValutaOriginale } from './valuta'
export { estraiCampiPdf, type EstrazionePdf } from './pdf-testo'
export type {
  EsitoParse,
  FatturaParsed,
  RiepilogoIva,
  RigaFattura,
  SoggettoFattura,
  ValutaOriginale,
} from './tipi'

export const PARSER_NAME = 'parser-fatture' as const
