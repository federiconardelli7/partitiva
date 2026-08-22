import { describe, expect, it } from 'vitest'
import { coefficientePerAteco, GRUPPI_ATECO } from '../src/params/ateco'

describe('tabella ATECO → coefficiente di redditività (allegato 4, L. 190/2014)', () => {
  it('contiene i 9 gruppi ufficiali', () => {
    expect(GRUPPI_ATECO).toHaveLength(9)
    for (const gruppo of GRUPPI_ATECO) {
      expect(gruppo.fonte.riferimento).toContain('190/2014')
      expect(gruppo.prefissi.length).toBeGreaterThan(0)
    }
  })

  it('software e consulenza informatica (62.02.00 e la ricodifica ATECO 2025 62.20.10) → 67%', () => {
    expect(coefficientePerAteco('62.02.00')?.coefficiente).toBe(0.67)
    expect(coefficientePerAteco('62.20.10')?.coefficiente).toBe(0.67)
  })

  it('il prefisso più specifico vince: 46.1 intermediari 62%, 46.2+ commercio 40%', () => {
    expect(coefficientePerAteco('46.19.02')?.coefficiente).toBe(0.62)
    expect(coefficientePerAteco('46.21.00')?.coefficiente).toBe(0.4)
  })

  it('ambulanti: alimentari 47.81 → 40%, altri prodotti 47.82–47.89 → 54%', () => {
    expect(coefficientePerAteco('47.81.01')?.coefficiente).toBe(0.4)
    expect(coefficientePerAteco('47.82.01')?.coefficiente).toBe(0.54)
  })

  it('professionali/sanità/finanza (64–66, 69–75, 85–88) → 78%; costruzioni e immobiliari → 86%', () => {
    expect(coefficientePerAteco('70.22.09')?.coefficiente).toBe(0.78)
    expect(coefficientePerAteco('86.90.29')?.coefficiente).toBe(0.78)
    expect(coefficientePerAteco('41.20.00')?.coefficiente).toBe(0.86)
    expect(coefficientePerAteco('68.20.01')?.coefficiente).toBe(0.86)
  })

  it('alloggio e ristorazione (55–56) e alimentari (10–11) → 40%', () => {
    expect(coefficientePerAteco('56.10.11')?.coefficiente).toBe(0.4)
    expect(coefficientePerAteco('10.71.10')?.coefficiente).toBe(0.4)
  })

  it('divisione inesistente o non assegnata → undefined (scelta manuale nel wizard)', () => {
    expect(coefficientePerAteco('44.00.00')).toBeUndefined()
    expect(coefficientePerAteco('')).toBeUndefined()
    expect(coefficientePerAteco('abc')).toBeUndefined()
  })
})
