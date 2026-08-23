// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { bolloPerFattura, cents, computeTimeline } from '@partitiva/motore-fiscale'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../src/App'
import { db } from '../src/db'
import { estraiRighePdf } from '../src/lib/pdf'

// L'estrazione pdf.js è glue browser-only: qui si mocka, il contratto UI è ciò che conta.
vi.mock('../src/lib/pdf', () => ({ estraiRighePdf: vi.fn() }))
import { buildTimelineInputs, paramsVicini } from '../src/lib/bilancio'
import { formatEuro, formatEuroIntero, oggiIso, parseImportoIt } from '../src/lib/format'

const PROFILO = { id: 1, annoApertura: 2025, ateco: '62.02.00', coefficiente: 0.67, copertura: 'piena' as const }
const ANNO = Number(oggiIso().slice(0, 4))

beforeEach(async () => {
  await db.profilo.clear()
  await db.fatture.clear()
  await db.riepiloghi.clear()
  await db.spese.clear()
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

  it('la card delle soglie prende i valori dai params, mai hardcoded', async () => {
    await db.profilo.put(PROFILO)
    render(<App />)
    const soglie = paramsVicini(ANNO).soglie
    const s85 = formatEuroIntero(soglie.uscitaAnnoSuccessivo.valore)
    const s100 = formatEuroIntero(soglie.uscitaImmediata.valore)
    // matcher a funzione: il testo è spezzato in più text node ({valore} in JSX)
    const conTestoEsatto = (atteso: string) => (_: string, elemento: Element | null) =>
      elemento !== null && elemento.children.length === 0 && elemento.textContent === atteso
    expect(await screen.findByText(conTestoEsatto(`Verso gli ${s85}`))).toBeTruthy()
    expect(screen.getByText(conTestoEsatto(`${s85} · ${s100}`))).toBeTruthy()
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

describe('App — riepiloghi annuali (pregresso)', () => {
  it('col totale 2025 senza fatture, la Panoramica del 2025 dichiara il pregresso', async () => {
    await db.profilo.put(PROFILO)
    await db.riepiloghi.put({ anno: 2025, incassatoCents: 1_000_000, bolliCents: 0 })
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: '2025' }))
    expect(await screen.findByText(/include pregresso/i)).toBeTruthy()
  })

  it('da «I miei dati» salvo un riepilogo annuale senza toccare le fatture', async () => {
    await db.profilo.put(PROFILO)
    window.history.pushState({}, '', '/dati')
    render(<App />)
    const incassato = (await screen.findByLabelText(/Totale incassato/i)) as HTMLInputElement
    fireEvent.change(incassato, { target: { value: '12.000,00' } })
    fireEvent.click(screen.getByRole('button', { name: /Salva riepilogo/i }))
    await expect.poll(async () => (await db.riepiloghi.toArray()).length).toBe(1)
    expect((await db.riepiloghi.get(2025))?.incassatoCents).toBe(1_200_000)
    expect(await db.fatture.count()).toBe(0)
  })
})

describe('App — spese (non deducibili: solo netto reale)', () => {
  it('da «I miei dati» salvo una spesa; il copy dice che NON si deduce', async () => {
    await db.profilo.put(PROFILO)
    window.history.pushState({}, '', '/dati')
    render(<App />)
    const importo = (await screen.findByLabelText(/Importo della spesa/i)) as HTMLInputElement
    fireEvent.change(importo, { target: { value: '100,00' } })
    fireEvent.click(screen.getByRole('button', { name: /Aggiungi spesa/i }))
    await expect.poll(async () => db.spese.count()).toBe(1)
    expect((await db.spese.toArray())[0]?.importoCents).toBe(10_000)
    expect(screen.getByText(/NON si deducono/i)).toBeTruthy()
  })

  it('il netto reale della Panoramica scende esattamente della spesa', async () => {
    await db.profilo.put(PROFILO)
    await db.fatture.add({ numero: '1', dataEmissione: `${ANNO}-02-01`, dataIncasso: `${ANNO}-02-10`, importoCents: 250_000, bolloCents: 0, descrizione: '' })
    await db.spese.add({ data: `${ANNO}-03-01`, importoCents: 10_000, descrizione: 'hosting' })
    render(<App />)
    await screen.findByRole('heading', { name: new RegExp(`Il tuo ${ANNO}`) })
    const atteso = computeTimeline(
      buildTimelineInputs(PROFILO, await db.fatture.toArray(), [], await db.spese.toArray(), ANNO),
    ).anni[ANNO]!.nettoRealeCents
    const valore = formatEuro(atteso)
    const trovati = screen.getAllByText((_, el) => el !== null && el.children.length === 0 && el.textContent === valore)
    expect(trovati.length).toBeGreaterThan(0)
  })

  it('il bollo della fattura manuale si può forzare; vuoto = regola', async () => {
    await db.profilo.put(PROFILO)
    window.history.pushState({}, '', '/dati')
    render(<App />)
    fireEvent.change(await screen.findByLabelText(/^Numero/i), { target: { value: '9' } })
    fireEvent.change(screen.getByLabelText(/Importo \(€\)/i), { target: { value: '500,00' } })
    fireEvent.change(screen.getByLabelText(/Bollo \(€\)/i), { target: { value: '3,00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Aggiungi' }))
    await expect.poll(async () => db.fatture.count()).toBe(1)
    expect((await db.fatture.toArray())[0]?.bolloCents).toBe(300)
    // ramo di default (quello di ogni fattura normale): campo vuoto → regola dai params
    fireEvent.change(screen.getByLabelText(/^Numero/i), { target: { value: '10' } })
    fireEvent.change(screen.getByLabelText(/Importo \(€\)/i), { target: { value: '500,00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Aggiungi' }))
    await expect.poll(async () => db.fatture.count()).toBe(2)
    const dieci = (await db.fatture.toArray()).find((f) => f.numero === '10')
    expect(dieci?.bolloCents).toBe(bolloPerFattura(cents(50_000), paramsVicini(ANNO)))
  })

  it('il bottone CSV scarica il registro fatture con l’intestazione giusta', async () => {
    await db.profilo.put(PROFILO)
    await db.fatture.add({ numero: '1', dataEmissione: `${ANNO}-02-01`, dataIncasso: null, importoCents: 100_000, bolloCents: 200, descrizione: '' })
    let blobCatturato: Blob | null = null
    // jsdom non ha createObjectURL: si aggiungono SOLO i metodi, mai sostituire il costruttore URL
    const originali = { crea: URL.createObjectURL, revoca: URL.revokeObjectURL }
    URL.createObjectURL = ((blob: Blob) => {
      blobCatturato = blob
      return 'blob:finto'
    }) as typeof URL.createObjectURL
    URL.revokeObjectURL = (() => {}) as typeof URL.revokeObjectURL
    try {
      window.history.pushState({}, '', '/dati')
      render(<App />)
      fireEvent.click(await screen.findByRole('button', { name: /CSV delle fatture/i }))
      expect(blobCatturato).not.toBeNull()
      // il BOM è il motivo per cui esiste esportaCsv (Excel italiano + UTF-8), ma
      // Blob.text() lo decodifica via: va verificato sui byte grezzi (EF BB BF)
      const bytes = new Uint8Array(await (blobCatturato as unknown as Blob).arrayBuffer())
      expect([bytes[0], bytes[1], bytes[2]]).toEqual([0xef, 0xbb, 0xbf])
      const testo = await (blobCatturato as unknown as Blob).text()
      expect(testo).toContain('Numero;Emessa;Incassata;Importo;Bollo;Descrizione')
    } finally {
      URL.createObjectURL = originali.crea
      URL.revokeObjectURL = originali.revoca
    }
  })
})

describe('App — import PDF con revisione obbligatoria', () => {
  const caricaPdf = async () => {
    window.history.pushState({}, '', '/dati')
    render(<App />)
    await screen.findByText(/Nuova fattura/i)
    const input = document.querySelector('input[type="file"][accept=".pdf"]')
    if (!(input instanceof HTMLInputElement)) throw new Error('input PDF non trovato')
    fireEvent.change(input, {
      target: { files: [new File(['finto'], 'fattura.pdf', { type: 'application/pdf' })] },
    })
  }

  it('PDF leggibile → form precompilato, banner di revisione, NIENTE salvataggio automatico', async () => {
    await db.profilo.put(PROFILO)
    vi.mocked(estraiRighePdf).mockResolvedValue([
      'Tipologia documento Art. 73 Numero documento Data documento Codice destinatario',
      'TD01 (fattura) 7 15-07-2026 0000000',
      'Totale documento 4.385,00',
    ])
    await caricaPdf()
    expect(await screen.findByText(/controllali prima di salvare/i)).toBeTruthy()
    expect((screen.getByLabelText(/^Numero/i) as HTMLInputElement).value).toBe('7')
    expect((screen.getByLabelText(/Data emissione/i) as HTMLInputElement).value).toBe('2026-07-15')
    expect((screen.getByLabelText(/Importo \(€\)/i) as HTMLInputElement).value).toBe('4.385,00')
    expect((screen.getByLabelText(/Già incassata/i) as HTMLInputElement).checked).toBe(false)
    expect(await db.fatture.count()).toBe(0) // la revisione è OBBLIGATORIA
    fireEvent.click(screen.getByRole('button', { name: 'Aggiungi' }))
    await expect.poll(async () => db.fatture.count()).toBe(1)
    const salvata = (await db.fatture.toArray())[0]!
    expect(salvata.numero).toBe('7')
    expect(salvata.importoCents).toBe(438_500)
    expect(salvata.dataIncasso).toBeNull()
  })

  it('scansione senza testo → banner di degradazione e form vuoto', async () => {
    await db.profilo.put(PROFILO)
    vi.mocked(estraiRighePdf).mockResolvedValue([])
    await caricaPdf()
    expect(await screen.findByText(/scansione/i)).toBeTruthy()
    expect((screen.getByLabelText(/^Numero/i) as HTMLInputElement).value).toBe('')
    expect(await db.fatture.count()).toBe(0)
  })

  it('PDF illeggibile (pdfjs lancia) → banner di degradazione e niente scritture', async () => {
    await db.profilo.put(PROFILO)
    vi.mocked(estraiRighePdf).mockRejectedValue(new Error('PDF corrotto'))
    await caricaPdf()
    expect(await screen.findByText(/non leggibile/i)).toBeTruthy()
    expect(await db.fatture.count()).toBe(0)
  })

  it('TD04 → avviso e nessun prefill: mai una nota di credito come ricavo', async () => {
    await db.profilo.put(PROFILO)
    vi.mocked(estraiRighePdf).mockResolvedValue([
      'Tipologia documento Numero documento Data documento',
      'TD04 (nota di credito) 3 01-06-2026',
      'Totale documento 500,00',
    ])
    await caricaPdf()
    expect(await screen.findByText(/non importata/i)).toBeTruthy()
    expect(screen.getByText(/TD04/)).toBeTruthy()
    expect((screen.getByLabelText(/^Numero/i) as HTMLInputElement).value).toBe('')
    expect(await db.fatture.count()).toBe(0)
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

  it('concatena: i versati escono dalla catena reale, senza campo manuale', async () => {
    await db.profilo.put(PROFILO)
    const riepilogo = { anno: 2025, incassatoCents: 3_000_000, bolliCents: 0 }
    await db.riepiloghi.put(riepilogo)
    window.history.pushState({}, '', '/simulatore')
    render(<App />)
    const anno = (await screen.findByLabelText(/Anno simulato/i)) as HTMLSelectElement
    fireEvent.change(anno, { target: { value: String(ANNO) } })
    fireEvent.click(screen.getByLabelText(/Concatena i miei dati/i))
    // il valore atteso lo dice il motore, non un numero a mano
    const attesi = computeTimeline([
      ...buildTimelineInputs(PROFILO, [], [riepilogo], [], ANNO - 1),
      {
        anno: ANNO,
        incassatoCents: parseImportoIt('30.000')!,
        coefficiente: 0.67,
        startup: true,
        copertura: 'piena',
        bolliCents: 0,
      },
    ]).anni[ANNO]!.versatiContributiCents
    expect(attesi).toBeGreaterThan(0)
    const valore = formatEuro(attesi)
    const conValore = (await screen.findAllByText(
      (_, el) => el !== null && el.children.length === 0 && el.textContent === valore,
    )) as HTMLElement[]
    expect(conValore.length).toBeGreaterThan(0)
    expect(screen.getByText(/deducibili/i)).toBeTruthy()
    expect(screen.queryByLabelText(/Contributi versati nell/i)).toBeNull()
    expect(screen.queryByLabelText(/Primo anno/i)).toBeNull()
  })

  it('l’anno simulato arriva a corrente+1 e la catena avvisa che usa l’anno in corso', async () => {
    await db.profilo.put(PROFILO)
    window.history.pushState({}, '', '/simulatore')
    render(<App />)
    const anno = (await screen.findByLabelText(/Anno simulato/i)) as HTMLSelectElement
    expect(Array.from(anno.options).map((o) => o.value)).toContain(String(ANNO + 1))
    fireEvent.change(anno, { target: { value: String(ANNO + 1) } })
    fireEvent.click(screen.getByLabelText(/Concatena i miei dati/i))
    expect(await screen.findByText(new RegExp(`usa il ${ANNO} così com'è oggi`, 'i'))).toBeTruthy()
  })

  it('un anno senza params dichiara il ripiego, in catena E in manuale', async () => {
    await db.profilo.put(PROFILO)
    window.history.pushState({}, '', '/simulatore')
    render(<App />)
    const anno = (await screen.findByLabelText(/Anno simulato/i)) as HTMLSelectElement
    fireEvent.change(anno, { target: { value: String(ANNO + 1) } })
    // ramo manuale (concatena spenta): l'avviso deve esserci comunque
    expect((await screen.findAllByText(/non ancora disponibili/i)).length).toBeGreaterThan(0)
    // ramo concatenato: i flag arrivano dal motore e non vanno buttati
    // (possono essere più d'uno: la timeline compone anche l'F24 dell'anno dopo)
    fireEvent.click(screen.getByLabelText(/Concatena i miei dati/i))
    expect((await screen.findAllByText(/non ancora disponibili/i)).length).toBeGreaterThan(0)
    // manuale sull'anno corrente: nessun avviso fantasma
    fireEvent.click(screen.getByLabelText(/Concatena i miei dati/i))
    fireEvent.change(screen.getByLabelText(/Anno simulato/i), { target: { value: String(ANNO) } })
    expect(screen.queryAllByText(/non ancora disponibili/i)).toHaveLength(0)
  })

  it('senza profilo niente anno simulato né concatena', async () => {
    window.history.pushState({}, '', '/simulatore')
    render(<App />)
    await screen.findByText(/qui non si salva niente/i)
    expect(screen.queryByLabelText(/Anno simulato/i)).toBeNull()
    expect(screen.queryByLabelText(/Concatena/i)).toBeNull()
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
