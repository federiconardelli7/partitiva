import { describe, expect, it } from 'vitest'
import { estraiCampiPdf } from '../src/index'

const LAYOUT_COLONNE = [
  'FATTURA ELETTRONICA - Versione FPR12',
  'Cedente/prestatore (fornitore)',
  'Identificativo fiscale ai fini IVA: IT01234567890',
  'Denominazione: MARIO ROSSI',
  'Tipologia documento Art. 73 Numero documento Data documento Codice destinatario',
  'TD01 (fattura) SI 7 15-07-2026 0000000',
  'Descrizione: consulenza informatica',
  'Imponibile importo 4.385,00',
  'Totale documento 4.385,00',
]

describe('estraiCampiPdf — euristiche sul foglio di stile SdI (best effort, mai errori)', () => {
  it('layout a colonne: numero, data ISO, totale e tipologia', () => {
    const e = estraiCampiPdf(LAYOUT_COLONNE)
    expect(e.tipoDocumento).toBe('TD01')
    expect(e.numero).toBe('7')
    expect(e.data).toBe('2026-07-15')
    expect(e.importoTotaleCents).toBe(438_500)
    expect(e.affidabile).toBe(true)
  })

  it('variante «etichetta: valore» su righe separate', () => {
    const e = estraiCampiPdf(['Numero documento: 12/B', 'Data documento: 03/02/2026', 'Totale documento: 1.000,00'])
    expect(e.numero).toBe('12/B')
    expect(e.data).toBe('2026-02-03')
    expect(e.importoTotaleCents).toBe(100_000)
    expect(e.affidabile).toBe(true)
  })

  it('una data-esca prima dell’intestazione non inganna l’estrazione', () => {
    const e = estraiCampiPdf([
      'Data scadenza pagamento 30-09-2026',
      'Tipologia documento Art. 73 Numero documento Data documento Codice destinatario',
      'TD01 (fattura) 7 15-07-2026 0000000',
      'Totale documento 4.385,00',
    ])
    expect(e.data).toBe('2026-07-15')
    expect(e.numero).toBe('7')
  })

  it('il totale può stare sulla riga dopo l’etichetta', () => {
    const e = estraiCampiPdf(['Numero documento: 5', 'Data documento: 01-03-2026', 'Totale documento', '2.500,50'])
    expect(e.importoTotaleCents).toBe(250_050)
  })

  it('TD04 riconosciuto e segnalato: non è una fattura ordinaria', () => {
    const e = estraiCampiPdf([
      'Tipologia documento Numero documento Data documento',
      'TD04 (nota di credito) 3 01-06-2026',
      'Totale documento 500,00',
    ])
    expect(e.tipoDocumento).toBe('TD04')
    expect(e.avvisi.some((a) => a.includes('TD04'))).toBe(true)
  })

  it('scansione senza testo: campi nulli e avviso di inserimento manuale', () => {
    const e = estraiCampiPdf([])
    expect(e.affidabile).toBe(false)
    expect(e.numero).toBeNull()
    expect(e.data).toBeNull()
    expect(e.importoTotaleCents).toBeNull()
    expect(e.avvisi.some((a) => /scansione/i.test(a))).toBe(true)
  })

  it('una data inesistente sul calendario non passa mai (formato US, 31 febbraio)', () => {
    const e = estraiCampiPdf([
      'Tipologia documento Numero documento Data documento',
      'TD01 (fattura) 7 07/15/2026 0000000',
      'Totale documento 4.385,00',
    ])
    expect(e.data).toBeNull()
    expect(e.affidabile).toBe(false)
    expect(e.avvisi.some((a) => /data documento non trovata/i.test(a))).toBe(true)
    expect(estraiCampiPdf(['Numero documento: 5', 'Data documento: 31-02-2026', 'Totale documento 1,00']).data).toBeNull()
    expect(estraiCampiPdf(['Numero documento: 5', 'Data documento: 99-99-9999', 'Totale documento 1,00']).data).toBeNull()
  })

  it('etichette e valori sulla stessa riga (colonne fuse): non pesca dalle righe dopo', () => {
    const e = estraiCampiPdf([
      'Numero documento: 7 Data documento: 15-07-2026',
      'Data scadenza pagamento 30-09-2026',
      'Totale documento 4.385,00',
    ])
    expect(e.numero).toBe('7')
    expect(e.data).toBe('2026-07-15')
    expect(e.affidabile).toBe(true)
  })

  it('con più «Totale documento» vince l’ultimo (il riepilogo finale del documento)', () => {
    const e = estraiCampiPdf([
      'Numero documento: 5',
      'Data documento: 01-03-2026',
      'Totale documento 100,00',
      'pagina 2 di 2',
      'Totale documento 4.385,00',
    ])
    expect(e.importoTotaleCents).toBe(438_500)
  })

  it('campi mancanti → avvisi espliciti, mai eccezioni', () => {
    const e = estraiCampiPdf(['Documento commerciale senza etichette note'])
    expect(e.affidabile).toBe(false)
    expect(e.avvisi.length).toBeGreaterThan(0)
  })
})

// Stampa da browser del foglio di stile SdI (fatturapa.gov.it): layout «etichetta: valore»
// con data in ISO e importi nel formato GREZZO dell'XML (punto decimale, niente migliaia).
// Righe sintetiche che riproducono la struttura osservata su un PDF reale (valori anonimi),
// incluse le esche: date di stampa/nome file nell'intestazione, importi EN nella descrizione.
const LAYOUT_STAMPA_BROWSER = [
  '14/08/2026, 00:42 Sdi_ fi le_12345678901_27/07/2026',
  'FATTURA ELETTRONICA',
  'Identi fi cativo fi scale ai fi ni IVA: IT01234567890',
  'Nome: MARIO',
  'Cognome: ROSSI',
  'Regime fi scale: RF19 (Regime forfettario)',
  'about:blank 1/3',
  'Dati generali del documento',
  'Tipologia documento: TD01 (fattura)',
  'Valuta importi: EUR',
  'Data documento: 2026-07-27 (27 Luglio 2026)',
  'Numero documento: 7',
  'Importo totale documento: 1234.56',
  'Bollo virtuale: SI',
  'Importo bollo: 2.00',
  'Descrizione bene/servizio: consulenza. USD $1,408.62 convertiti in data 27/07 al cambio 0,877',
  'Valore totale: 1234.56',
  'Totale imponibile/importo: 1234.56',
  'about:blank 3/3',
]

describe('estraiCampiPdf — stampa browser del foglio di stile (data ISO, importi XML)', () => {
  it('estrae numero, data ISO e totale col punto decimale; le esche non ingannano', () => {
    const e = estraiCampiPdf(LAYOUT_STAMPA_BROWSER)
    expect(e.tipoDocumento).toBe('TD01')
    expect(e.numero).toBe('7')
    expect(e.data).toBe('2026-07-27')
    expect(e.importoTotaleCents).toBe(123_456)
    expect(e.affidabile).toBe(true)
  })

  it('una data ISO inesistente sul calendario non passa', () => {
    const e = estraiCampiPdf(['Numero documento: 5', 'Data documento: 2026-02-31', 'Totale documento 1,00'])
    expect(e.data).toBeNull()
    expect(e.avvisi.some((a) => /data documento non trovata/i.test(a))).toBe(true)
  })

  it('il punto è decimale solo in formato XML (due cifre finali); l’it-IT resta prioritario', () => {
    const xml = estraiCampiPdf(['Numero documento: 5', 'Data documento: 05/03/2026', 'Importo totale documento: 980.50'])
    expect(xml.importoTotaleCents).toBe(98_050)
    // 1.500,00 in it-IT: il punto è delle migliaia, mai 1,50 €
    const it = estraiCampiPdf(['Numero documento: 5', 'Data documento: 05/03/2026', 'Totale documento 1.500,00'])
    expect(it.importoTotaleCents).toBe(150_000)
  })
})

// Copia di cortesia (il PDF che si scarica all'invio, in alternativa all'XML): niente
// etichette «… documento» né TDxx — «Numero:», data coi PUNTI senza etichetta nel blocco
// sotto il numero (fusa con l'indirizzo del committente), totale su una riga «TOTALE …
// (EUR)». Righe sintetiche che riproducono la struttura osservata su un PDF reale.
const LAYOUT_COPIA_CORTESIA = [
  'ROSSI, MARIO - C.F. RSSMRA80A01H501U - P.IVA 01234567890',
  '(IT)',
  'Regime fiscale: Regime forfettario (art.1, c.54-89, L. 190/2014)',
  'Sede: VIA MILANO N 1 - 00100 ROMA (RM - IT)',
  'Cessionario/committente',
  'Fattura ACME SERVICES LLC - P.IVA 999999999 (US)',
  'Numero: 7',
  'Sede: 1 Main Street, 100 - 10001 New York',
  '27.07.2026 City (US)',
  'Descrizione Quantità Sconto/Magg. Ritenuta I.V.A. Importo',
  'Fixed contract. Invoice for work',
  '1 1.234,56 0,00% 1.234,56',
  'mensile. USD $1,408.62 convertiti in',
  'data 27/07 al cambio 0,877',
  'Natura: Non soggette - altri casi',
  'Dati di riepilogo',
  'Aliquota Natura Spese accessorie Arrotondamento Imponibile Imposta',
  '0,00% 1.234,56 0,00',
  'Rif. Normativo: operazione effettuata ai sensi art1 commi da 54 a 89 L 190/2014 non soggetto art 7 ter dpr 633/72,',
  'Bollo',
  'Bollo assolto ai sensi del',
  'Tipo decreto MEF 17 GIUGNO 2014 TOTALE 1.234,56 (EUR)',
  '(ART. 6)',
  'Importo 2,00',
]

describe('estraiCampiPdf — copia di cortesia («Numero:», data coi punti, riga TOTALE)', () => {
  it('estrae numero, data e totale; il bollo e il riepilogo non ingannano', () => {
    const e = estraiCampiPdf(LAYOUT_COPIA_CORTESIA)
    expect(e.numero).toBe('7')
    expect(e.data).toBe('2026-07-27')
    expect(e.importoTotaleCents).toBe(123_456)
    expect(e.affidabile).toBe(true)
    // niente TDxx nelle copie di cortesia: l'avviso resta (la revisione è comunque obbligatoria)
    expect(e.tipoDocumento).toBeNull()
    expect(e.avvisi.some((a) => /tipologia/i.test(a))).toBe(true)
  })

  it('la data coi punti vale anche nel layout con etichetta', () => {
    const e = estraiCampiPdf(['Numero documento: 5', 'Data documento: 03.02.2026', 'Totale documento 1.000,00'])
    expect(e.data).toBe('2026-02-03')
  })

  it('«Totale imposta/imponibile/IVA» non sono mai il totale; senza una riga TOTALE vera resta null', () => {
    const conTotale = estraiCampiPdf(['Numero: 9', '01.03.2026', 'Totale imposta 0,00', 'TOTALE 2.500,50 (EUR)'])
    expect(conTotale.importoTotaleCents).toBe(250_050)
    const senzaTotale = estraiCampiPdf(['Numero: 9', '01.03.2026', 'Totale imposta 123,00'])
    expect(senzaTotale.importoTotaleCents).toBeNull()
    expect(senzaTotale.avvisi.some((a) => /totale documento non trovato/i.test(a))).toBe(true)
  })

  it('la data senza etichetta si cerca SOLO nel blocco del numero, non in tutto il documento', () => {
    // la data-esca in coda (scadenza di pagamento) non deve mai vincere
    const e = estraiCampiPdf(['Numero: 3', 'qui niente data', 'ancora niente', 'nulla', 'Scadenza pagamento: 30.09.2026', 'TOTALE 100,00 (EUR)'])
    expect(e.data).toBeNull()
    expect(e.avvisi.some((a) => /data documento non trovata/i.test(a))).toBe(true)
  })
})
