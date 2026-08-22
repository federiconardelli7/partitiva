// @vitest-environment jsdom
import { computeAnno, getParams } from '@partitiva/motore-fiscale'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Flusso } from '../src/components/Flusso'

afterEach(cleanup)

const anno = 2026
const base = { anno, coefficiente: 0.67, startup: true, copertura: 'piena' as const }
const params = getParams(anno)

describe('Flusso — proiezione year-aware dell’ExplainMap', () => {
  it('senza versati (primo anno): imponibile pieno, nessun ramo di deduzione', () => {
    const r = computeAnno({ ...base, incassatoCents: 3_000_000, versatiContributiCents: 0 }, params)
    render(<Flusso explain={r.explain} anno={anno} livrea="reale" />)
    expect(screen.getByText(/nulla da dedurre/i)).toBeTruthy()
    expect(screen.queryByText(/deducibili/i)).toBeNull()
  })

  it('con versati: nodo dei versati deducibili e box F24 se fornito', () => {
    const r = computeAnno({ ...base, incassatoCents: 4_500_000, versatiContributiCents: 524_007 }, params)
    render(
      <Flusso
        explain={r.explain}
        anno={anno}
        livrea="reale"
        f24={{ totaleCents: 624_507, dettaglio: 'saldi di luglio' }}
      />,
    )
    expect(screen.getByText(/versati nell/i)).toBeTruthy()
    expect(screen.getByText(/F24 pagati nel 2026/i)).toBeTruthy()
    expect(screen.queryByText(/nulla da dedurre/i)).toBeNull()
  })

  it('un nodo cliccato chiama onNodo col suo id', () => {
    const r = computeAnno({ ...base, incassatoCents: 3_000_000, versatiContributiCents: 0 }, params)
    const onNodo = vi.fn()
    render(<Flusso explain={r.explain} anno={anno} livrea="reale" onNodo={onNodo} />)
    fireEvent.click(screen.getByRole('button', { name: /Reddito forfettario/i }))
    expect(onNodo).toHaveBeenCalledWith('2026:reddito')
  })

  it('senza onNodo i nodi non sono interattivi: niente bottoni che promettono azioni', () => {
    const r = computeAnno({ ...base, incassatoCents: 3_000_000, versatiContributiCents: 0 }, params)
    render(<Flusso explain={r.explain} anno={anno} livrea="reale" />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('il netto dice quanto resta in mano, in percentuale', () => {
    const r = computeAnno({ ...base, incassatoCents: 3_000_000, versatiContributiCents: 0 }, params)
    render(<Flusso explain={r.explain} anno={anno} livrea="reale" />)
    expect(screen.getByText(/ti resta il 79,2%/i)).toBeTruthy()
  })
})
