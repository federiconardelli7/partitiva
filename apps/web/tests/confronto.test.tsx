// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { App } from '../src/App'
import { db } from '../src/db'

// Il confronto con l'ordinario nel Simulatore: numeri del golden «professionista2026»
// (motore-fiscale/tests/golden/caso-ordinario.ts): incassato 60.000, costi 10.000,
// GS piena, add. reg. 1,73% e com. 0,80% → totale ordinario 23.072,41.

async function apriSimulatore() {
  window.history.pushState({}, '', '/simulatore')
  render(<App />)
  await screen.findByText(/Simulatore forfettario/i)
}

describe('Simulatore — confronto con l’ordinario', () => {
  beforeEach(async () => {
    await db.profilo.clear()
    await db.fatture.clear()
    await db.spese.clear()
  })
  afterEach(() => cleanup())

  it('chiuso di default, si apre e calcola il totale ordinario del golden', async () => {
    await apriSimulatore()
    const interruttore = await screen.findByText(/E se uscissi dal forfettario\?/i)
    expect(screen.queryByLabelText(/Altri costi/i)).toBeNull()
    fireEvent.click(interruttore)

    const sezione = screen.getByText(/Costi reali dell'anno/i).closest('section')!
    fireEvent.change(screen.getByLabelText<HTMLInputElement>(/Incassato nell'anno/i), { target: { value: '60.000' } })
    fireEvent.change(within(sezione).getByLabelText(/Altri costi/i), { target: { value: '10.000' } })
    fireEvent.change(within(sezione).getByLabelText(/Addizionale regionale/i), { target: { value: '1,73' } })
    fireEvent.change(within(sezione).getByLabelText(/Addizionale comunale/i), { target: { value: '0,80' } })

    expect(await within(sezione).findByText(/23\.072,41/)).toBeTruthy()
    // il lato forfettario del confronto è il «da accantonare» dello scenario
    expect(within(sezione).getByText(/Totale forfettario/i)).toBeTruthy()
  })

  it('aliquota comunale oltre il limite di legge: errore a video e niente numeri', async () => {
    await apriSimulatore()
    fireEvent.click(await screen.findByText(/E se uscissi dal forfettario\?/i))
    const sezione = screen.getByText(/Costi reali dell'anno/i).closest('section')!
    fireEvent.change(within(sezione).getByLabelText(/Addizionale comunale/i), { target: { value: '1,50' } })
    expect(await within(sezione).findByText(/oltre il massimo di legge/i)).toBeTruthy()
    expect(within(sezione).queryByText(/Totale ordinario/i)).toBeNull()
  })

  it('le spese del registro entrano nei costi (e il footer dichiara le assunzioni)', async () => {
    await db.profilo.put({ id: 1, annoApertura: 2025, ateco: '62.02.00', coefficiente: 0.67, copertura: 'piena' })
    await db.spese.add({ data: '2026-03-10', importoCents: 500_000, descrizione: 'attrezzatura' })
    await apriSimulatore()
    fireEvent.click(await screen.findByText(/E se uscissi dal forfettario\?/i))
    const sezione = screen.getByText(/Costi reali dell'anno/i).closest('section')!
    // 5.000,00 € di spese registrate nell'anno simulato compaiono come base dei costi
    expect(within(sezione).getByText(/dal registro spese/i).textContent).toContain('5.000,00')
    expect(within(sezione).getByText(/a regime/i)).toBeTruthy()
  })

  it('scegliendo la regione l’aliquota manuale sparisce e si applica la struttura ufficiale (Trento)', async () => {
    await apriSimulatore()
    fireEvent.change(screen.getByLabelText<HTMLInputElement>(/Incassato nell'anno/i), { target: { value: '60.000' } })
    fireEvent.click(await screen.findByText(/E se uscissi dal forfettario\?/i))
    const sezione = screen.getByText(/Costi reali dell'anno/i).closest('section')!
    fireEvent.change(within(sezione).getByLabelText(/Altri costi/i), { target: { value: '10.000' } })
    fireEvent.change(within(sezione).getByLabelText(/Addizionale comunale/i), { target: { value: '0,80' } })
    fireEvent.change(within(sezione).getByLabelText(/Regione o provincia autonoma/i), { target: { value: 'trento' } })
    // il campo manuale sparisce; RC 36.965 > 30.000 → 1,23% sull'intero = 454,67
    expect(within(sezione).queryByLabelText(/Addizionale regionale \(%\)/i)).toBeNull()
    expect(await within(sezione).findByText(/22\.887,59/)).toBeTruthy() // totale col dataset Trento
  })

  it('la regione salvata nel profilo pre-seleziona il confronto', async () => {
    await db.profilo.put({
      id: 1,
      annoApertura: 2025,
      ateco: '62.02.00',
      coefficiente: 0.67,
      copertura: 'piena',
      regione: 'trento',
    })
    await apriSimulatore()
    fireEvent.click(await screen.findByText(/E se uscissi dal forfettario\?/i))
    const sezione = screen.getByText(/Costi reali dell'anno/i).closest('section')!
    expect(within(sezione).getByLabelText<HTMLSelectElement>(/Regione o provincia autonoma/i).value).toBe('trento')
  })

  it('il wizard salva la regione (facoltativa) nel profilo', async () => {
    const { GRUPPI_ATECO } = await import('@partitiva/motore-fiscale')
    window.history.pushState({}, '', '/dati')
    render(<App />)
    await screen.findByText(/configura la tua P\.IVA/i)
    fireEvent.change(screen.getByLabelText<HTMLInputElement>(/Anno di apertura/i), { target: { value: '2025' } })
    fireEvent.change(screen.getByLabelText(/Settore di attività/i), {
      target: { value: GRUPPI_ATECO[GRUPPI_ATECO.length - 1]!.settore },
    })
    fireEvent.change(screen.getByLabelText(/Regione o provincia autonoma/i), { target: { value: 'trento' } })
    fireEvent.click(screen.getByRole('button', { name: 'Inizia a tracciare' }))
    await expect.poll(async () => (await db.profilo.get(1))?.regione).toBe('trento')
  })
})
