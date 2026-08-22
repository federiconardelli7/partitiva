// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../src/App'
import { db } from '../src/db'

const XML_MINIMA = (numero: string, tipo = 'TD01') => `<?xml version="1.0" encoding="UTF-8"?>
<ns2:FatturaElettronica xmlns:ns2="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2" versione="FPR12">
<FatturaElettronicaHeader><CedentePrestatore><DatiAnagrafici>
<IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>01234567890</IdCodice></IdFiscaleIVA>
<Anagrafica><Nome>MARIO</Nome><Cognome>ROSSI</Cognome></Anagrafica>
<RegimeFiscale>RF19</RegimeFiscale></DatiAnagrafici></CedentePrestatore>
<CessionarioCommittente><DatiAnagrafici><IdFiscaleIVA><IdPaese>US</IdPaese><IdCodice>999999999</IdCodice></IdFiscaleIVA>
<Anagrafica><Denominazione>ACME SERVICES LLC</Denominazione></Anagrafica></DatiAnagrafici></CessionarioCommittente>
</FatturaElettronicaHeader>
<FatturaElettronicaBody><DatiGenerali><DatiGeneraliDocumento>
<TipoDocumento>${tipo}</TipoDocumento><Divisa>EUR</Divisa><Data>2026-07-15</Data><Numero>${numero}</Numero>
<DatiBollo><BolloVirtuale>SI</BolloVirtuale><ImportoBollo>2.00</ImportoBollo></DatiBollo>
<ImportoTotaleDocumento>4385.00</ImportoTotaleDocumento></DatiGeneraliDocumento></DatiGenerali>
<DatiBeniServizi><DettaglioLinee><NumeroLinea>1</NumeroLinea><Descrizione>consulenza</Descrizione>
<PrezzoUnitario>4385.00</PrezzoUnitario><PrezzoTotale>4385.00</PrezzoTotale><AliquotaIVA>0.00</AliquotaIVA><Natura>N2.2</Natura></DettaglioLinee>
</DatiBeniServizi></FatturaElettronicaBody></ns2:FatturaElettronica>`

async function apriRegistro() {
  render(<App />)
  const nav = await screen.findByRole('navigation')
  fireEvent.click(within(nav).getByText('I miei dati'))
  await screen.findByText(/Nuova fattura/i)
  const input = document.querySelector('input[type="file"][accept=".xml,.p7m"]')
  if (!(input instanceof HTMLInputElement)) throw new Error('input di import non trovato')
  return input
}

const carica = (input: HTMLInputElement, nome: string, contenuto: string) =>
  fireEvent.change(input, { target: { files: [new File([contenuto], nome, { type: 'text/xml' })] } })

describe('import XML nel registro', () => {
  beforeEach(async () => {
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    await db.fatture.clear()
    await db.profilo.put({ id: 1, annoApertura: 2025, ateco: '62.02.00', coefficiente: 0.67, copertura: 'piena' })
    window.history.pushState({}, '', '/')
  })
  afterEach(() => {
    vi.restoreAllMocks()
    cleanup()
  })

  it('import nuovo → fattura in Dexie come "emessa" col bollo dell’XML', async () => {
    const input = await apriRegistro()
    carica(input, 'IT01234567890_00010.xml', XML_MINIMA('10'))
    await expect.poll(() => db.fatture.count()).toBe(1)
    const salvata = (await db.fatture.toArray())[0]!
    expect(salvata.numero).toBe('10')
    expect(salvata.importoCents).toBe(438_500)
    expect(salvata.bolloCents).toBe(200)
    expect(salvata.dataIncasso).toBeNull()
  })

  it('lo stesso numero/anno due volte → il duplicato viene saltato', async () => {
    const input = await apriRegistro()
    carica(input, 'a.xml', XML_MINIMA('10'))
    await expect.poll(() => db.fatture.count()).toBe(1)
    carica(input, 'b.xml', XML_MINIMA('10'))
    await expect.poll(() => (window.alert as ReturnType<typeof vi.fn>).mock.calls.length).toBe(2)
    expect(await db.fatture.count()).toBe(1)
  })

  it('file non parsabile → nessuna riga e alert con l’errore', async () => {
    const input = await apriRegistro()
    carica(input, 'rotto.xml', 'questo non è xml')
    await expect.poll(() => (window.alert as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1)
    expect(await db.fatture.count()).toBe(0)
    expect(String((window.alert as ReturnType<typeof vi.fn>).mock.calls[0]?.[0])).toContain('✗')
  })

  it('nota di credito TD04 → saltata con spiegazione (mai importata come ricavo)', async () => {
    const input = await apriRegistro()
    carica(input, 'nc.xml', XML_MINIMA('11', 'TD04'))
    await expect.poll(() => (window.alert as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1)
    expect(await db.fatture.count()).toBe(0)
    expect(String((window.alert as ReturnType<typeof vi.fn>).mock.calls[0]?.[0])).toContain('TD04')
  })
})
