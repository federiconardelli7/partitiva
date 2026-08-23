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
