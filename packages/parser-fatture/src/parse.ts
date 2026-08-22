// Parser FatturaPA (FPR12, tolleranza FPA12): DOMParser nativo, ricerca per local-name,
// firma XAdES ignorata. Un file può contenere PIÙ FatturaElettronicaBody (lotto): si parsano
// tutti, mai scartare in silenzio. Spec e casi noti: docs/parsing-fatture.md.
import { sbustaP7m } from './p7m'
import type { EsitoParse, FatturaParsed, SoggettoFattura } from './tipi'
import { estraiValutaOriginale } from './valuta'
import { centesimi, discendenti, primo, testo } from './xml'

function soggetto(radice: Element, contenitore: string): SoggettoFattura {
  const nodo = primo(radice, contenitore)
  if (!nodo) throw new Error(`Sezione mancante nella fattura: ${contenitore}`)
  const anagrafica = primo(nodo, 'Anagrafica')
  const denominazione =
    (anagrafica && testo(anagrafica, 'Denominazione')) ??
    [anagrafica && testo(anagrafica, 'Nome'), anagrafica && testo(anagrafica, 'Cognome')]
      .filter(Boolean)
      .join(' ')
  const idFiscale = primo(nodo, 'IdFiscaleIVA')
  return {
    paese: (idFiscale && testo(idFiscale, 'IdPaese')) ?? '',
    id: (idFiscale && testo(idFiscale, 'IdCodice')) ?? '',
    ...(testo(nodo, 'CodiceFiscale') ? { codiceFiscale: testo(nodo, 'CodiceFiscale') } : {}),
    denominazione,
    ...(testo(nodo, 'RegimeFiscale') ? { regimeFiscale: testo(nodo, 'RegimeFiscale') } : {}),
  }
}

function parseBody(
  body: Element,
  contesto: { versione: string; cedente: SoggettoFattura; committente: SoggettoFattura },
  warnings: string[],
): FatturaParsed {
  const datiDocumento = primo(body, 'DatiGeneraliDocumento')
  if (!datiDocumento) throw new Error('FatturaPA incompleta: DatiGeneraliDocumento mancante')

  const numero = testo(datiDocumento, 'Numero') ?? ''
  const importoTotaleCents = centesimi(
    testo(datiDocumento, 'ImportoTotaleDocumento'),
    'ImportoTotaleDocumento',
  )
  if (importoTotaleCents < 0) {
    throw new Error(
      `Importo totale negativo non supportato (fattura n. ${numero}): gestiscila manualmente`,
    )
  }

  const righe = discendenti(body, 'DettaglioLinee').map((linea) => ({
    numeroLinea: Number(testo(linea, 'NumeroLinea') ?? '0'),
    descrizione: testo(linea, 'Descrizione') ?? '',
    prezzoTotaleCents: centesimi(testo(linea, 'PrezzoTotale'), 'PrezzoTotale'),
    aliquotaIva: Number(testo(linea, 'AliquotaIVA') ?? '0'),
    ...(testo(linea, 'Natura') ? { natura: testo(linea, 'Natura') } : {}),
  }))

  const riepiloghi = discendenti(body, 'DatiRiepilogo').map((riepilogo) => ({
    imponibileCents: centesimi(testo(riepilogo, 'ImponibileImporto'), 'ImponibileImporto'),
    impostaCents: centesimi(testo(riepilogo, 'Imposta') ?? '0', 'Imposta'),
    ...(testo(riepilogo, 'Natura') ? { natura: testo(riepilogo, 'Natura') } : {}),
    ...(testo(riepilogo, 'RiferimentoNormativo')
      ? { riferimentoNormativo: testo(riepilogo, 'RiferimentoNormativo') }
      : {}),
  }))

  const sommaRighe = righe.reduce((somma, riga) => somma + riga.prezzoTotaleCents, 0)
  if (righe.length > 0 && sommaRighe !== importoTotaleCents) {
    warnings.push(
      `fattura n. ${numero}: la somma delle righe (${(sommaRighe / 100).toFixed(2)}) non coincide col totale documento (${(importoTotaleCents / 100).toFixed(2)})`,
    )
  }

  const nodoBollo = primo(datiDocumento, 'DatiBollo')

  return {
    versione: contesto.versione,
    tipoDocumento: testo(datiDocumento, 'TipoDocumento') ?? '',
    numero,
    data: testo(datiDocumento, 'Data') ?? '',
    divisa: testo(datiDocumento, 'Divisa') ?? 'EUR',
    importoTotaleCents,
    cedente: contesto.cedente,
    committente: contesto.committente,
    righe,
    riepiloghi,
    bollo: nodoBollo
      ? {
          virtuale: testo(nodoBollo, 'BolloVirtuale') === 'SI',
          importoCents: centesimi(testo(nodoBollo, 'ImportoBollo') ?? '0', 'ImportoBollo'),
        }
      : null,
    valutaOriginale: estraiValutaOriginale(righe.map((riga) => riga.descrizione).join(' ')),
  }
}

export function parseFatturaPA(xml: string): EsitoParse {
  const doc = new DOMParser().parseFromString(xml, 'text/xml')
  const radice = doc.documentElement
  if (!radice || radice.localName !== 'FatturaElettronica') {
    throw new Error('Il file non è una FatturaPA (radice FatturaElettronica non trovata)')
  }

  const header = primo(radice, 'FatturaElettronicaHeader')
  const bodies = discendenti(radice, 'FatturaElettronicaBody')
  if (!header || bodies.length === 0) throw new Error('FatturaPA incompleta: header o body mancanti')

  const contesto = {
    versione: radice.getAttribute('versione') ?? '',
    cedente: soggetto(header, 'CedentePrestatore'),
    committente: soggetto(header, 'CessionarioCommittente'),
  }

  const warnings: string[] = []
  if (contesto.cedente.regimeFiscale && contesto.cedente.regimeFiscale !== 'RF19') {
    warnings.push(
      `Regime del cedente ${contesto.cedente.regimeFiscale}: Partitiva è pensata per il forfettario (RF19)`,
    )
  }

  const fatture = bodies.map((body) => parseBody(body, contesto, warnings))
  return { fatture, warnings }
}

export function parseFatturaFile(nomeFile: string, bytes: Uint8Array): EsitoParse {
  if (nomeFile.toLowerCase().endsWith('.p7m')) {
    return parseFatturaPA(sbustaP7m(bytes))
  }
  // Rispetta l'encoding dichiarato nel prologo (alcuni gestionali emettono ISO-8859-1).
  const prologo = new TextDecoder('latin1').decode(bytes.slice(0, 200))
  const dichiarato = /encoding=["']([^"']+)["']/i.exec(prologo)?.[1]?.toLowerCase() ?? ''
  const codifica = dichiarato.includes('8859') || dichiarato === 'latin1' ? 'latin1' : 'utf-8'
  return parseFatturaPA(new TextDecoder(codifica).decode(bytes))
}
