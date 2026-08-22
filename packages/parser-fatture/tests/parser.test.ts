// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseFatturaFile, parseFatturaPA } from '../src/index'

const xmlFixture = readFileSync(join(__dirname, 'fixtures', 'fattura-fpr12-esempio.xml'), 'utf-8')

describe('parseFatturaPA — fixture FPR12 con firma XAdES', () => {
  const { fatture, warnings } = parseFatturaPA(xmlFixture)
  const fattura = fatture[0]!

  it('estrae i dati generali del documento', () => {
    expect(fatture).toHaveLength(1)
    expect(fattura.versione).toBe('FPR12')
    expect(fattura.tipoDocumento).toBe('TD01')
    expect(fattura.numero).toBe('3')
    expect(fattura.data).toBe('2026-07-15')
    expect(fattura.divisa).toBe('EUR')
    expect(fattura.importoTotaleCents).toBe(438_500)
  })

  it('estrae cedente (con regime RF19) e committente estero', () => {
    expect(fattura.cedente.paese).toBe('IT')
    expect(fattura.cedente.id).toBe('01234567890')
    expect(fattura.cedente.codiceFiscale).toBe('RSSMRA80A01H501U')
    expect(fattura.cedente.denominazione).toBe('MARIO ROSSI')
    expect(fattura.cedente.regimeFiscale).toBe('RF19')
    expect(fattura.committente.paese).toBe('US')
    expect(fattura.committente.denominazione).toBe('ACME SERVICES LLC')
  })

  it('estrae righe, riepiloghi con natura N2.2 e riferimento normativo', () => {
    expect(fattura.righe).toHaveLength(1)
    expect(fattura.righe[0]?.prezzoTotaleCents).toBe(438_500)
    expect(fattura.righe[0]?.natura).toBe('N2.2')
    expect(fattura.riepiloghi[0]?.imponibileCents).toBe(438_500)
    expect(fattura.riepiloghi[0]?.riferimentoNormativo).toContain('190/2014')
  })

  it('estrae DatiBollo (bollo virtuale 2,00 €)', () => {
    expect(fattura.bollo).toEqual({ virtuale: true, importoCents: 200 })
  })

  it('euristica valuta/cambio dalla descrizione (USD $5,000.00 al cambio 0,877)', () => {
    expect(fattura.valutaOriginale?.valuta).toBe('USD')
    expect(fattura.valutaOriginale?.importoOriginaleCents).toBe(500_000)
    expect(fattura.valutaOriginale?.cambio).toBeCloseTo(0.877, 5)
  })

  it('la firma XAdES è ignorata e non produce warning', () => {
    expect(warnings).toEqual([])
  })
})

describe('parseFatturaPA — lotto con più fatture nello stesso file', () => {
  const inizioBody = xmlFixture.indexOf('<FatturaElettronicaBody>')
  const fineBody = xmlFixture.indexOf('</FatturaElettronicaBody>') + '</FatturaElettronicaBody>'.length
  const body = xmlFixture.slice(inizioBody, fineBody)
  const secondoBody = body.replace('<Numero>3</Numero>', '<Numero>4</Numero>')
  const lotto = xmlFixture.replace('</FatturaElettronicaBody>', `</FatturaElettronicaBody>${secondoBody}`)

  it('OGNI body diventa una fattura: mai scartare in silenzio', () => {
    const { fatture, warnings } = parseFatturaPA(lotto)
    expect(fatture).toHaveLength(2)
    expect(fatture.map((f) => f.numero)).toEqual(['3', '4'])
    expect(fatture[1]?.importoTotaleCents).toBe(438_500)
    expect(warnings).toEqual([])
  })
})

describe('parseFatturaPA — warnings e casi limite', () => {
  it('regime del cedente diverso da RF19 → warning', () => {
    const { warnings } = parseFatturaPA(xmlFixture.replace('RF19', 'RF01'))
    expect(warnings.some((w) => w.includes('RF01'))).toBe(true)
  })

  it('somma delle righe diversa dal totale documento → warning con il numero della fattura', () => {
    const modificato = xmlFixture.replace(
      '<ImportoTotaleDocumento>4385.00</ImportoTotaleDocumento>',
      '<ImportoTotaleDocumento>5000.00</ImportoTotaleDocumento>',
    )
    const { warnings } = parseFatturaPA(modificato)
    expect(warnings.some((w) => w.toLowerCase().includes('totale'))).toBe(true)
  })

  it('nota di credito TD04: il tipo documento è esposto (il blocco sta nell’import)', () => {
    const { fatture } = parseFatturaPA(xmlFixture.replace('TD01', 'TD04'))
    expect(fatture[0]?.tipoDocumento).toBe('TD04')
  })

  it('importo totale negativo → errore esplicito, mai incassato ridotto in silenzio', () => {
    const negativo = xmlFixture.replace(
      '<ImportoTotaleDocumento>4385.00</ImportoTotaleDocumento>',
      '<ImportoTotaleDocumento>-4385.00</ImportoTotaleDocumento>',
    )
    expect(() => parseFatturaPA(negativo)).toThrow(/negativ/i)
  })

  it('XML che non è una FatturaPA → errore esplicito', () => {
    expect(() => parseFatturaPA('<altro/>')).toThrow(/FatturaPA/i)
  })
})

describe('parseFatturaFile — dispatch ed encoding', () => {
  it('.xml → parse diretto', () => {
    const bytes = new TextEncoder().encode(xmlFixture)
    const { fatture } = parseFatturaFile('IT01234567890_00003.xml', bytes)
    expect(fatture[0]?.numero).toBe('3')
  })

  it('.xml.p7m → sbustamento e parse', () => {
    const xmlBytes = new TextEncoder().encode(xmlFixture)
    const junkPrefix = new Uint8Array([0x30, 0x82, 0x1f, 0x8b, 0x06, 0x09, 0x2a, 0x86])
    const junkSuffix = new Uint8Array([0xa0, 0x82, 0x05, 0x00, 0xff, 0xfe])
    const p7m = new Uint8Array([...junkPrefix, ...xmlBytes, ...junkSuffix])
    const { fatture } = parseFatturaFile('IT01234567890_00003.xml.p7m', p7m)
    expect(fatture[0]?.numero).toBe('3')
    expect(fatture[0]?.importoTotaleCents).toBe(438_500)
  })

  it('XML dichiarato ISO-8859-1 → gli accenti sopravvivono', () => {
    const conAccenti = xmlFixture
      .replace('encoding="UTF-8"', 'encoding="ISO-8859-1"')
      .replace('Fixed monthly contract.', 'Attività per società.')
    const bytesLatin1 = Uint8Array.from(conAccenti, (c) => c.charCodeAt(0))
    const { fatture } = parseFatturaFile('IT01234567890_00003.xml', bytesLatin1)
    expect(fatture[0]?.righe[0]?.descrizione).toContain('Attività per società')
  })
})
