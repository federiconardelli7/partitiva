import { describe, expect, it } from 'vitest'
import type { Fattura, Spesa } from '../src/db'
import { csvFatture, csvSpese } from '../src/lib/csv'

const fatture: Fattura[] = [
  {
    id: 1,
    numero: '7',
    dataEmissione: '2026-07-15',
    dataIncasso: '2026-07-20',
    importoCents: 438_500,
    bolloCents: 200,
    descrizione: 'consulenza; "extra"',
  },
  { id: 2, numero: '8', dataEmissione: '2026-08-01', dataIncasso: null, importoCents: 100_000, bolloCents: 0, descrizione: '' },
]

describe('export CSV dei registri (per Excel italiano: «;» e virgola decimale)', () => {
  it('fatture: intestazione, date gg/mm/aaaa, importi con virgola, campi con ; o " quotati', () => {
    const righe = csvFatture(fatture).split('\r\n')
    expect(righe[0]).toBe('Numero;Emessa;Incassata;Importo;Bollo;Descrizione')
    expect(righe[1]).toBe('7;15/07/2026;20/07/2026;4385,00;2,00;"consulenza; ""extra"""')
    expect(righe[2]).toBe('8;01/08/2026;;1000,00;0,00;')
  })

  it('spese: intestazione e righe', () => {
    const spese: Spesa[] = [{ id: 1, data: '2026-03-10', importoCents: 12_050, descrizione: 'hosting' }]
    const righe = csvSpese(spese).split('\r\n')
    expect(righe[0]).toBe('Data;Importo;Descrizione')
    expect(righe[1]).toBe('10/03/2026;120,50;hosting')
  })

  it('niente formule Excel: i campi che iniziano con = + - @ vengono neutralizzati', () => {
    // le descrizioni arrivano anche da XML di terzi: Excel valuta le formule pure tra virgolette
    const spese: Spesa[] = [
      { id: 1, data: '2026-01-10', importoCents: 100, descrizione: '- consulenza gennaio' },
      { id: 2, data: '2026-01-11', importoCents: 100, descrizione: '=1+1' },
    ]
    const righe = csvSpese(spese).split('\r\n')
    expect(righe[1]).toBe("10/01/2026;1,00;'- consulenza gennaio")
    expect(righe[2]).toBe("11/01/2026;1,00;'=1+1")
  })
})
