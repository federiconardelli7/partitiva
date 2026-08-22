import { describe, expect, it } from 'vitest'
import { getParams, SUPPORTED_YEARS } from '../src/params'
import { GOLDEN_YEARS } from './golden/caso-campione'

describe('params per anno — dati con fonte obbligatoria', () => {
  it('exposes 2025 and 2026', () => {
    expect(SUPPORTED_YEARS).toContain(2025)
    expect(SUPPORTED_YEARS).toContain(2026)
  })

  it('throws on unsupported years, listing the supported ones', () => {
    expect(() => getParams(1999)).toThrow(/2025/)
  })

  it('2026 carries the verified values from circolare INPS 8/2026 and L. 190/2014', () => {
    const p = getParams(2026)
    expect(p.previdenza.aliquotaPiena.valore).toBe(0.2607)
    expect(p.previdenza.aliquotaRidotta.valore).toBe(0.24)
    expect(p.previdenza.massimale.valore).toBe(12_229_500)
    expect(p.imposta.startup.valore).toBe(0.05)
    expect(p.imposta.ordinaria.valore).toBe(0.15)
    expect(p.soglie.uscitaAnnoSuccessivo.valore).toBe(8_500_000)
    expect(p.soglie.uscitaImmediata.valore).toBe(10_000_000)
    expect(p.bollo.soglia.valore).toBe(7_747)
    expect(p.bollo.importo.valore).toBe(200)
    expect(p.acconti.quotaImposta.valore).toBe(1)
    expect(p.acconti.quotaContributi.valore).toBe(0.8)
    expect(p.acconti.ripartizione.valore).toEqual([0.5, 0.5])
    expect(p.acconti.minimoAcconto.valore).toBe(5_165)
    expect(p.acconti.sogliaRataUnica.valore).toBe(25_752)
    expect(p.acconti.codiciTributo.valore).toEqual({
      primoAcconto: '1790',
      secondoAcconto: '1791',
      saldo: '1792',
    })
    expect(p.acconti.causaliInps.valore).toEqual({ piena: 'PXX', ridotta: 'P10' })
  })

  it('la maggiorazione del differimento è un parametro per anno (0,40% nel 2025, 0,80% nel 2026)', () => {
    expect(getParams(2025).acconti.maggiorazioneDifferimento.valore).toBe(0.004)
    expect(getParams(2026).acconti.maggiorazioneDifferimento.valore).toBe(0.008)
  })

  it('ogni parametro porta la sua fonte con riferimento e data di verifica', () => {
    for (const anno of SUPPORTED_YEARS) {
      const raccolti: Array<{ riferimento?: string; verificatoIl?: string }> = []
      const walk = (nodo: unknown): void => {
        if (nodo === null || typeof nodo !== 'object') return
        const rec = nodo as Record<string, unknown>
        if ('valore' in rec && 'fonte' in rec) {
          raccolti.push(rec['fonte'] as { riferimento?: string; verificatoIl?: string })
          return
        }
        for (const v of Object.values(rec)) walk(v)
      }
      walk(getParams(anno))
      expect(raccolti.length).toBeGreaterThan(10)
      for (const fonte of raccolti) {
        expect(fonte.riferimento).toBeTruthy()
        expect(fonte.verificatoIl).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      }
    }
  })

  it('ogni anno supportato ha almeno un golden (contratto di CONTRIBUTING)', () => {
    for (const anno of SUPPORTED_YEARS) {
      expect(GOLDEN_YEARS as readonly number[]).toContain(anno)
    }
  })
})
