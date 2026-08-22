import { describe, expect, it } from 'vitest'
import { sbustaP7m } from '../src/p7m'

const XML = '<?xml version="1.0"?><ns2:FatturaElettronica versione="FPR12">contenuto</ns2:FatturaElettronica>'

const conRumore = (xml: string): Uint8Array => {
  const corpo = new TextEncoder().encode(xml)
  const prefisso = new Uint8Array([0x30, 0x82, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86])
  const suffisso = new Uint8Array([0xa0, 0x82, 0x03, 0x02, 0x01, 0x00])
  return new Uint8Array([...prefisso, ...corpo, ...suffisso])
}

describe('sbustamento p7m (CAdES)', () => {
  it('estrae il payload XML da un blob DER', () => {
    expect(sbustaP7m(conRumore(XML))).toBe(XML)
  })

  it('gestisce anche il p7m codificato base64', () => {
    const der = conRumore(XML)
    let binario = ''
    for (const byte of der) binario += String.fromCharCode(byte)
    const base64 = btoa(binario)
    const bytes = new TextEncoder().encode(base64)
    expect(sbustaP7m(bytes)).toBe(XML)
  })

  it('trova il payload anche senza dichiarazione <?xml', () => {
    const senzaDecl = '<p:FatturaElettronica versione="FPR12">x</p:FatturaElettronica>'
    expect(sbustaP7m(conRumore(senzaDecl))).toBe(senzaDecl)
  })

  it('nessun payload → errore esplicito', () => {
    expect(() => sbustaP7m(new Uint8Array([1, 2, 3, 4]))).toThrow(/payload/i)
  })

  it('il payload UTF-8 con accenti NON viene storpiato dal latin1 della busta', () => {
    const xml =
      '<?xml version="1.0"?><p:FatturaElettronica versione="FPR12">Attività per società àèìòù</p:FatturaElettronica>'
    expect(sbustaP7m(conRumore(xml))).toBe(xml)
  })
})
