// Euristiche sul testo estratto dal PDF «foglio di stile» della fattura elettronica (SdI).
// Best effort e mai un errore: in app il salvataggio passa SEMPRE dal form di revisione,
// quindi un campo mancante o sbagliato costa una correzione a mano, non un dato corrotto.

export interface EstrazionePdf {
  /** TD01 fattura, TD04 nota di credito, …; null se non riconosciuto. */
  tipoDocumento: string | null
  numero: string | null
  /** ISO yyyy-mm-dd. */
  data: string | null
  importoTotaleCents: number | null
  /** true se numero, data e totale sono stati trovati: guida il copy del form, non il salvataggio. */
  affidabile: boolean
  avvisi: string[]
}

const DATA_RE = /\b(\d{2})[-/](\d{2})[-/](\d{4})\b/
// Le stampe browser del foglio di stile (fatturapa.gov.it) riportano la data in ISO.
const DATA_ISO_RE = /\b(\d{4})-(\d{2})-(\d{2})\b/
const IMPORTO_RE = /\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2}/g
// Formato GREZZO dell'XML (stesse stampe): punto decimale con due cifre esatte, mai preceduto
// da un altro gruppo numerico (esclude l'831.33 dentro un «5,833.33» in formato EN).
const IMPORTO_XML_RE = /(?<![\d.,])\d+\.\d{2}(?!\d)/g

/** ISO solo se la data ESISTE sul calendario: un 07/15/2026 (formato US), un 31-02-2026
 *  o un 2026-02-31 devono produrre un avviso, mai finire nel registro. */
const dataValida = (anno: string, mese: string, giorno: string): string | null => {
  const verifica = new Date(Date.UTC(Number(anno), Number(mese) - 1, Number(giorno)))
  const esiste =
    verifica.getUTCFullYear() === Number(anno) &&
    verifica.getUTCMonth() === Number(mese) - 1 &&
    verifica.getUTCDate() === Number(giorno)
  return esiste ? `${anno}-${mese}-${giorno}` : null
}

/** Prima data nel testo, in gg/mm/aaaa o ISO aaaa-mm-gg: posizione del match e conversione
 *  (iso = null se la data non esiste sul calendario: il chiamante emetterà l'avviso). */
const trovaData = (testo: string): { index: number; iso: string | null } | null => {
  const it = DATA_RE.exec(testo)
  if (it) return { index: it.index, iso: dataValida(it[3]!, it[2]!, it[1]!) }
  const iso = DATA_ISO_RE.exec(testo)
  if (iso) return { index: iso.index, iso: dataValida(iso[1]!, iso[2]!, iso[3]!) }
  return null
}

const parseImportoItaliano = (testo: string): number | null => {
  const numero = Number(testo.replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(numero) && numero >= 0 ? Math.round(numero * 100) : null
}

/** L'etichetta viene prima del valore: sulla riga del totale conta l'ULTIMO importo.
 *  Prima il formato italiano (1.234,56 — il punto con 3 cifre resta delle migliaia);
 *  in sua assenza, il formato grezzo dell'XML (1234.56). */
const ultimoImporto = (riga: string): number | null => {
  const matchesIt = riga.match(IMPORTO_RE)
  const ultimoIt = matchesIt?.[matchesIt.length - 1]
  if (ultimoIt) return parseImportoItaliano(ultimoIt)
  const matchesXml = riga.match(IMPORTO_XML_RE)
  const ultimoXml = matchesXml?.[matchesXml.length - 1]
  if (!ultimoXml) return null
  const numero = Number(ultimoXml)
  return Number.isFinite(numero) && numero >= 0 ? Math.round(numero * 100) : null
}

/** Numero documento dalla riga dei valori: ultimo token utile prima della data,
 *  scartando la tipologia (TDxx), le parentesi descrittive e i SI/NO dell'art. 73. */
const candidatoNumero = (testo: string): string | null => {
  const tokens = testo
    .trim()
    .split(/\s+/)
    .filter(
      (t) => t !== '' && !/^TD\d{2}$/i.test(t) && !t.startsWith('(') && !t.endsWith(')') && !/^(SI|NO)$/i.test(t),
    )
  return tokens[tokens.length - 1] ?? null
}

export function estraiCampiPdf(righe: readonly string[]): EstrazionePdf {
  const avvisi: string[] = []

  const tipoMatch = /\bTD\d{2}\b/i.exec(righe.join('\n'))
  const tipoDocumento = tipoMatch ? tipoMatch[0].toUpperCase() : null

  let numero: string | null = null
  let data: string | null = null

  // Foglio di stile: etichette in una riga-intestazione, valori nella riga successiva.
  // Se però la riga con le etichette contiene GIÀ una data (colonne fuse dall'estrazione),
  // i valori sono lì: mai andare a pescare nelle righe dopo, dove vivono le date-esca.
  const idxIntestazione = righe.findIndex((r) => /numero documento/i.test(r) && /data documento/i.test(r))
  const rigaIntestazione = idxIntestazione >= 0 ? (righe[idxIntestazione] ?? '') : ''
  if (idxIntestazione >= 0 && trovaData(rigaIntestazione) === null) {
    for (let j = idxIntestazione + 1; j < Math.min(righe.length, idxIntestazione + 4); j++) {
      const riga = righe[j] ?? ''
      const match = trovaData(riga)
      if (match) {
        data = match.iso
        numero = candidatoNumero(riga.slice(0, match.index))
        break
      }
    }
  } else {
    // Variante «etichetta: valore» sulla stessa riga, ancorata alle etichette.
    const rigaNumero = righe.find((r) => /numero documento/i.test(r))
    if (rigaNumero) numero = rigaNumero.replace(/.*numero documento\s*:?\s*/i, '').split(/\s+/)[0] || null
    const rigaData = righe.find((r) => /data documento/i.test(r))
    if (rigaData) {
      const match = trovaData(rigaData.slice(rigaData.search(/data documento/i)))
      if (match) data = match.iso
    }
  }

  // In documenti multi-pagina «Totale documento» può ripetersi: l'ULTIMA occorrenza è il
  // riepilogo finale. Se quella riga non porta un importo, si risale alle precedenti.
  let importoTotaleCents: number | null = null
  for (let j = righe.length - 1; j >= 0 && importoTotaleCents === null; j--) {
    if (/totale documento/i.test(righe[j] ?? '')) {
      importoTotaleCents = ultimoImporto(righe[j] ?? '') ?? ultimoImporto(righe[j + 1] ?? '')
    }
  }

  if (righe.length === 0 || righe.every((r) => r.trim() === '')) {
    avvisi.push('Nessun testo nel PDF (è una scansione?): inserisci i dati a mano.')
  } else {
    if (tipoDocumento && tipoDocumento !== 'TD01') {
      avvisi.push(`Documento ${tipoDocumento}: non è una fattura ordinaria (TD01), non va importato come ricavo.`)
    }
    if (!tipoDocumento) avvisi.push('Tipologia documento non trovata: verifica che sia una fattura.')
    if (numero === null) avvisi.push('Numero documento non trovato.')
    if (data === null) avvisi.push('Data documento non trovata.')
    if (importoTotaleCents === null) avvisi.push('Totale documento non trovato.')
  }

  return {
    tipoDocumento,
    numero,
    data,
    importoTotaleCents,
    affidabile: numero !== null && data !== null && importoTotaleCents !== null,
    avvisi,
  }
}
