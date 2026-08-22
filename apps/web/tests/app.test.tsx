// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { App } from '../src/App'
import { db } from '../src/db'

beforeEach(() => {
  window.history.pushState({}, '', '/')
})
afterEach(cleanup)

describe('App — struttura a pagine', () => {
  it('la landing è il Calcolatore: nessuna domanda, si prova subito', async () => {
    render(<App />)
    expect(await screen.findByRole('heading', { name: /Calcolatore forfettario/i })).toBeTruthy()
    expect(screen.queryByText(/configura la tua P\.IVA/i)).toBeNull()
  })

  it('entrando in «I miei dati» senza profilo → wizard (mai pagina bianca)', async () => {
    render(<App />)
    const nav = await screen.findByRole('navigation')
    fireEvent.click(within(nav).getByText('I miei dati'))
    expect(await screen.findByText(/configura la tua P\.IVA/i)).toBeTruthy()
  })

  it('con profilo salvato, «I miei dati» mostra il registro', async () => {
    await db.profilo.put({ id: 1, annoApertura: 2025, ateco: '62.02.00', coefficiente: 0.67, copertura: 'piena' })
    render(<App />)
    const nav = await screen.findByRole('navigation')
    fireEvent.click(within(nav).getByText('I miei dati'))
    expect(await screen.findByText(/Nuova fattura/i)).toBeTruthy()
  })

  it('la modifica del profilo è una pagina: navigare via la chiude davvero', async () => {
    await db.profilo.put({ id: 1, annoApertura: 2025, ateco: '62.02.00', coefficiente: 0.67, copertura: 'piena' })
    render(<App />)
    fireEvent.click(await screen.findByText('profilo'))
    expect(await screen.findByText(/Modifica profilo/i)).toBeTruthy()
    const nav = await screen.findByRole('navigation')
    fireEvent.click(within(nav).getByText('Bilancio'))
    expect(await screen.findByRole('heading', { name: /Bilancio/i })).toBeTruthy()
    expect(screen.queryByText(/Modifica profilo/i)).toBeNull()
  })
})
