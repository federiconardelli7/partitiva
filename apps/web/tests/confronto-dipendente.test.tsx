// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { App } from '../src/App'
import { db } from '../src/db'

// «E se fossi dipendente?» nel Simulatore: numeri dei golden di caso-dipendente.ts.

async function apriDipendente() {
  window.history.pushState({}, '', '/simulatore')
  render(<App />)
  await screen.findByText(/Simulatore forfettario/i)
  fireEvent.click(await screen.findByText(/E se fossi dipendente\?/i))
  const sezione = screen.getByText(/RAL — retribuzione annua lorda/i).closest('section')!
  // i golden assumono addizionali a zero: si azzera il default 1,23
  fireEvent.change(within(sezione).getByLabelText(/Addizionale regionale/i), { target: { value: '0' } })
  return sezione
}

describe('Simulatore — confronto dipendente', () => {
  beforeEach(async () => {
    await db.profilo.clear()
  })
  afterEach(() => cleanup())

  it('RAL 30.000 senza Fon.Te: netto del golden (24.021,37) e TFR maturato a parte', async () => {
    const sezione = await apriDipendente()
    fireEvent.click(within(sezione).getByLabelText(/Aderisco a Fon\.Te/i)) // OFF (default ON)
    fireEvent.change(within(sezione).getByLabelText(/RAL/i), { target: { value: '30.000' } })
    // due occorrenze per design B4: tile del duello + riga della tabella
    expect(await within(sezione).findAllByText(/24\.021,37/)).toHaveLength(2)
    expect(within(sezione).getByText(/Matura a parte/i).textContent).toContain('2.072,22')
  })

  it('Fon.Te acceso di default: 0,55% dedotto e 1,55% del datore in vista (golden 23.909,43)', async () => {
    const sezione = await apriDipendente()
    fireEvent.change(within(sezione).getByLabelText(/RAL/i), { target: { value: '30.000' } })
    expect(await within(sezione).findAllByText(/23\.909,43/)).toHaveLength(2) // duello + tabella
    expect(within(sezione).getByText(/Matura a parte/i).textContent).toContain('465,00')
  })

  it('la dimensione azienda aggiunge FIS e CIGS (golden 23.906,06)', async () => {
    const sezione = await apriDipendente()
    fireEvent.click(within(sezione).getByLabelText(/Aderisco a Fon\.Te/i))
    fireEvent.change(within(sezione).getByLabelText(/RAL/i), { target: { value: '30.000' } })
    fireEvent.change(within(sezione).getByLabelText(/Contributi in busta/i), { target: { value: 'oltre-15' } })
    expect(await within(sezione).findAllByText(/23\.906,06/)).toHaveLength(2) // duello + tabella
  })
})
