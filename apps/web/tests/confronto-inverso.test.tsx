// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { App } from '../src/App'
import { db } from '../src/db'

// «Calcolo inverso» nel Simulatore: numeri dei golden di caso-inverso.ts.

async function apriInverso() {
  window.history.pushState({}, '', '/simulatore')
  render(<App />)
  await screen.findByText(/Simulatore forfettario/i)
  // Titolo completo + role: dal B3 anche il Quadro ha una voce «Calcolo inverso».
  fireEvent.click(await screen.findByRole('button', { name: /Che fatturato serve per il netto che vuoi/i }))
  const sezione = screen.getByText(/Netto desiderato/i).closest('section')!
  // i golden assumono addizionali a zero: si azzera il default 1,23
  fireEvent.change(within(sezione).getByLabelText(/Addizionale regionale/i), { target: { value: '0' } })
  return sezione
}

const riga = (sezione: HTMLElement, etichetta: RegExp) =>
  within(sezione).getByText(etichetta).closest('tr')!

describe('Simulatore — calcolo inverso', () => {
  beforeEach(async () => {
    await db.profilo.clear()
  })
  afterEach(() => cleanup())

  it('dipendente: RAL minima 16.452 e RAL stabile 16.640 (trappola del trattamento integrativo)', async () => {
    const sezione = await apriInverso()
    fireEvent.click(within(sezione).getByLabelText(/Aderisco a Fon\.Te/i)) // OFF (default ON)
    fireEvent.change(within(sezione).getByLabelText(/Netto desiderato/i), { target: { value: '15.450' } })
    const rigaRal = riga(sezione, /RAL necessaria/i)
    expect((await within(rigaRal).findAllByText(/16\.452,00/)).length).toBeGreaterThan(0)
    // La nota della ricaduta dichiara il lordo stabile e il suo netto verificato.
    expect(within(rigaRal).getAllByText(/16\.640,00/).length).toBeGreaterThan(0)
    expect(within(rigaRal).getAllByText(/ricadere/i).length).toBeGreaterThan(0)
  })

  it('forfettario 78% startup: netto 30.000 → fatturato necessario 39.596,00', async () => {
    const sezione = await apriInverso()
    fireEvent.change(screen.getByLabelText(/Settore/i), {
      target: {
        value:
          'Attività professionali, scientifiche, tecniche, sanitarie, di istruzione, servizi finanziari e assicurativi',
      },
    })
    fireEvent.change(within(sezione).getByLabelText(/Netto desiderato/i), { target: { value: '30.000' } })
    const rigaForfettario = riga(sezione, /Fatturato necessario nel forfettario/i)
    expect((await within(rigaForfettario).findAllByText(/39\.596,00/)).length).toBeGreaterThan(0)
  })

  it('sopra il tetto di permanenza dichiara il netto massimo del forfettario (71.036,20)', async () => {
    const sezione = await apriInverso()
    fireEvent.change(screen.getByLabelText(/Settore/i), {
      target: { value: 'Commercio all’ingrosso e al dettaglio' },
    })
    fireEvent.click(screen.getByLabelText(/Aliquota startup/i)) // OFF (default ON)
    fireEvent.change(within(sezione).getByLabelText(/Netto desiderato/i), { target: { value: '72.000' } })
    const rigaForfettario = riga(sezione, /Fatturato necessario nel forfettario/i)
    expect((await within(rigaForfettario).findAllByText(/71\.036,20/)).length).toBeGreaterThan(0)
    expect(within(rigaForfettario).getAllByText(/85\.000/).length).toBeGreaterThan(0)
  })
})
