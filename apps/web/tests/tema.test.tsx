// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { App } from '../src/App'
import { applicaTema, prossimoTema, salvaTema, temaEffettivoScuro, temaSalvato } from '../src/lib/tema'

// Hex della direzione «Notturna» (slate-1 nei due temi): combaciano con index.html e tema.ts.
const METAS_INDEX_HTML =
  '<meta name="theme-color" content="#fcfcfd" media="(prefers-color-scheme: light)" />' +
  '<meta name="theme-color" content="#111113" media="(prefers-color-scheme: dark)" />'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
})

describe('tema — regole pure e persistenza', () => {
  it('default «sistema»: senza preferenza salvata o con un valore corrotto', () => {
    expect(temaSalvato()).toBe('sistema')
    localStorage.setItem('partitiva-tema', 'viola')
    expect(temaSalvato()).toBe('sistema')
  })

  it('salva/leggi round-trip; «sistema» pulisce la chiave (niente preferenze fantasma)', () => {
    salvaTema('scuro')
    expect(temaSalvato()).toBe('scuro')
    expect(localStorage.getItem('partitiva-tema')).toBe('scuro')
    salvaTema('sistema')
    expect(localStorage.getItem('partitiva-tema')).toBeNull()
  })

  it('il ciclo del toggle: sistema → chiaro → scuro → sistema', () => {
    expect(prossimoTema('sistema')).toBe('chiaro')
    expect(prossimoTema('chiaro')).toBe('scuro')
    expect(prossimoTema('scuro')).toBe('sistema')
  })

  it('temaEffettivoScuro: l’override vince sempre, «sistema» segue il dispositivo', () => {
    expect(temaEffettivoScuro('scuro', false)).toBe(true)
    expect(temaEffettivoScuro('chiaro', true)).toBe(false)
    expect(temaEffettivoScuro('sistema', true)).toBe(true)
    expect(temaEffettivoScuro('sistema', false)).toBe(false)
  })

  it('applicaTema governa la classe dark e i meta theme-color (barra della PWA coerente)', () => {
    document.head.innerHTML = METAS_INDEX_HTML
    const metas = () =>
      [...document.querySelectorAll('meta[name="theme-color"]')].map((m) => m.getAttribute('content'))

    applicaTema('scuro', false)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(metas()).toEqual(['#111113', '#111113'])

    applicaTema('chiaro', true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(metas()).toEqual(['#fcfcfd', '#fcfcfd'])

    // «sistema»: si torna ai default per-media di index.html
    applicaTema('sistema', true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(metas()).toEqual(['#fcfcfd', '#111113'])
  })
})

describe('tema — il toggle nell’header', () => {
  afterEach(() => cleanup())

  it('cicla sistema → chiaro → scuro → sistema, persiste e applica la classe', async () => {
    window.history.pushState({}, '', '/')
    render(<App />)
    const bottone = await screen.findByRole('button', { name: /tema/i })

    // jsdom non ha matchMedia: «sistema» ricade sul chiaro (guardia nel componente)
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    fireEvent.click(bottone) // → chiaro
    expect(temaSalvato()).toBe('chiaro')
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    fireEvent.click(bottone) // → scuro
    expect(temaSalvato()).toBe('scuro')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    fireEvent.click(bottone) // → sistema
    expect(temaSalvato()).toBe('sistema')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
