// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from '../src/App'
import { db } from '../src/db'

describe('App — percorso del nuovo utente', () => {
  it('DB vuoto → il wizard è visibile (mai pagina bianca)', async () => {
    render(<App />)
    expect(await screen.findByText(/configura la tua P\.IVA/i)).toBeTruthy()
  })

  it('con profilo salvato → si vede il registro', async () => {
    await db.profilo.put({ id: 1, annoApertura: 2025, ateco: '62.02.00', coefficiente: 0.67, copertura: 'piena' })
    render(<App />)
    expect(await screen.findByText(/Nuova fattura/i)).toBeTruthy()
  })
})
