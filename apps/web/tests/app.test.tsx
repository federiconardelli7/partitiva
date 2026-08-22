// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { App } from '../src/App'
import { db } from '../src/db'
import { oggiIso } from '../src/lib/format'

const PROFILO = { id: 1, annoApertura: 2025, ateco: '62.02.00', coefficiente: 0.67, copertura: 'piena' as const }
const ANNO = Number(oggiIso().slice(0, 4))

beforeEach(async () => {
  await db.profilo.clear()
  await db.fatture.clear()
  window.history.pushState({}, '', '/')
})
afterEach(cleanup)

describe('App — landing condizionale su /', () => {
  it('senza profilo: landing di presentazione, nessuna domanda a freddo', async () => {
    render(<App />)
    expect(await screen.findByRole('heading', { name: /La tua P\.IVA forfettaria, spiegata/i })).toBeTruthy()
    expect(screen.queryByText(/configura la tua P\.IVA/i)).toBeNull()
    const nav = screen.getByRole('navigation')
    expect(within(nav).getByText('Inizia a tracciare')).toBeTruthy()
    expect(within(nav).getByText('Simulatore')).toBeTruthy()
    expect(within(nav).queryByText('Panoramica')).toBeNull()
  })

  it('con profilo: / è la Panoramica coi dati veri, che si spiega da sola', async () => {
    await db.profilo.put(PROFILO)
    render(<App />)
    expect(await screen.findByRole('heading', { name: new RegExp(`Il tuo ${ANNO}`) })).toBeTruthy()
    expect(screen.getByText(/si aggiorna da sola/i)).toBeTruthy()
    expect(screen.getByText(/Dati reali/i)).toBeTruthy()
  })

  it('la Panoramica ha le pillole per anno: cliccando il 2025 si vede quell’anno', async () => {
    await db.profilo.put(PROFILO)
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: '2025' }))
    expect(await screen.findByRole('heading', { name: /Il tuo 2025/ })).toBeTruthy()
  })

  it('le fatture non incassate finiscono nella card «Da incassare»', async () => {
    await db.profilo.put(PROFILO)
    await db.fatture.add({ numero: '9', dataEmissione: `${ANNO}-06-01`, dataIncasso: null, importoCents: 100_000, bolloCents: 200, descrizione: '' })
    render(<App />)
    expect(await screen.findByText(/1 fattura emessa e non incassata/i)).toBeTruthy()
  })
})

describe('App — I miei dati come hub della sorgente', () => {
  it('senza profilo, /dati mostra il wizard (mai pagina bianca)', async () => {
    window.history.pushState({}, '', '/dati')
    render(<App />)
    expect(await screen.findByText(/configura la tua P\.IVA/i)).toBeTruthy()
  })

  it('con profilo: sezioni Fatture, Profilo e Backup in un posto solo', async () => {
    await db.profilo.put(PROFILO)
    window.history.pushState({}, '', '/dati')
    render(<App />)
    expect(await screen.findByText(/Nuova fattura/i)).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Profilo' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Backup' })).toBeTruthy()
  })

  it('la modifica del profilo si apre nel hub e si chiude navigando via', async () => {
    await db.profilo.put(PROFILO)
    window.history.pushState({}, '', '/dati')
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: /Modifica/i }))
    expect(await screen.findByText(/Modifica profilo/i)).toBeTruthy()
    const nav = screen.getByRole('navigation')
    fireEvent.click(within(nav).getByText('Panoramica'))
    expect(await screen.findByRole('heading', { name: new RegExp(`Il tuo ${ANNO}`) })).toBeTruthy()
    expect(screen.queryByText(/Modifica profilo/i)).toBeNull()
  })
})

describe('App — redirect delle rotte vecchie', () => {
  it('/registro → hub I miei dati', async () => {
    await db.profilo.put(PROFILO)
    window.history.pushState({}, '', '/registro')
    render(<App />)
    expect(await screen.findByText(/Nuova fattura/i)).toBeTruthy()
  })

  it('/profilo → hub I miei dati', async () => {
    await db.profilo.put(PROFILO)
    window.history.pushState({}, '', '/profilo')
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'Profilo' })).toBeTruthy()
  })

  it('/bilancio → Panoramica', async () => {
    await db.profilo.put(PROFILO)
    window.history.pushState({}, '', '/bilancio')
    render(<App />)
    expect(await screen.findByRole('heading', { name: new RegExp(`Il tuo ${ANNO}`) })).toBeTruthy()
  })
})

describe('App — Simulatore sandbox', () => {
  it('dichiara che non salva niente; senza profilo niente prefill', async () => {
    window.history.pushState({}, '', '/simulatore')
    render(<App />)
    expect(await screen.findByText(/qui non si salva niente/i)).toBeTruthy()
    expect(screen.queryByText(/Parti dai tuoi dati/i)).toBeNull()
  })

  it('il toggle «primo anno» azzera i versati e mostra «nulla da dedurre»', async () => {
    window.history.pushState({}, '', '/simulatore')
    render(<App />)
    const versati = (await screen.findByLabelText(/Contributi versati/i)) as HTMLInputElement
    fireEvent.change(versati, { target: { value: '1.000' } })
    expect(await screen.findByText(/deducibili/i)).toBeTruthy()
    fireEvent.click(screen.getByLabelText(/Primo anno/i))
    expect(await screen.findByText(/imponibile pieno: nulla da dedurre/i)).toBeTruthy()
    expect((screen.getByLabelText(/Contributi versati/i) as HTMLInputElement).disabled).toBe(true)
  })

  it('«Parti dai tuoi dati» precompila dall’anno corrente reale, esplicitamente', async () => {
    await db.profilo.put(PROFILO)
    await db.fatture.add({ numero: '1', dataEmissione: `${ANNO}-02-01`, dataIncasso: `${ANNO}-02-10`, importoCents: 250_000, bolloCents: 200, descrizione: '' })
    window.history.pushState({}, '', '/simulatore')
    render(<App />)
    fireEvent.click(await screen.findByText(/Parti dai tuoi dati/i))
    expect((screen.getByLabelText(/Incassato nell/i) as HTMLInputElement).value).toBe('2.500,00')
  })

  it('il Simulatore non scrive mai su Dexie', async () => {
    await db.profilo.put(PROFILO)
    window.history.pushState({}, '', '/simulatore')
    render(<App />)
    const incassato = (await screen.findByLabelText(/Incassato nell/i)) as HTMLInputElement
    fireEvent.change(incassato, { target: { value: '99.000' } })
    fireEvent.click(screen.getByText(/Parti dai tuoi dati/i))
    expect(await db.profilo.count()).toBe(1)
    expect((await db.profilo.get(1))?.coefficiente).toBe(0.67)
    expect(await db.fatture.count()).toBe(0)
  })
})
