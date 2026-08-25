import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Drawer } from './components/Drawer'
import { ShellNav, type VoceNav } from './components/ShellNav'
import { TemaToggle } from './components/TemaToggle'
import { db, type Profilo } from './db'
import { useDesktop } from './lib/use-desktop'
import { Dati } from './pages/Dati'
import { Landing } from './pages/Landing'
import { Panoramica } from './pages/Panoramica'
import { Simulatore } from './pages/Simulatore'

// Sentinella per distinguere "Dexie sta caricando" da "riga assente" (get → undefined).
const CARICAMENTO = 'caricamento' as const

const TITOLI_ROTTE: Record<string, string> = {
  '/simulatore': 'Simulatore',
  '/dati': 'I miei dati',
}

export function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  )
}

function Shell() {
  const profiloQuery = useLiveQuery(() => db.profilo.get(1), [], CARICAMENTO)
  const fatture = useLiveQuery(() => db.fatture.orderBy('dataEmissione').reverse().toArray(), [], CARICAMENTO)
  const riepiloghi = useLiveQuery(() => db.riepiloghi.orderBy('anno').toArray(), [], CARICAMENTO)
  const spese = useLiveQuery(() => db.spese.orderBy('data').reverse().toArray(), [], CARICAMENTO)
  const location = useLocation()
  const desktop = useDesktop()
  const [menuAperto, setMenuAperto] = useState(false)

  // Orientamento: il titolo del documento segue la pagina (prima dell'early return: regola hooks).
  useEffect(() => {
    if (profiloQuery === CARICAMENTO) return
    const nome = TITOLI_ROTTE[location.pathname] ?? (profiloQuery ? 'Panoramica' : null)
    document.title = nome ? `${nome} · Partitiva` : 'Partitiva — la tua P.IVA forfettaria, spiegata'
  }, [location.pathname, profiloQuery])

  // Cambio pagina = drawer chiuso (anche da back/forward del browser).
  useEffect(() => setMenuAperto(false), [location.pathname])

  if (profiloQuery === CARICAMENTO || fatture === CARICAMENTO || riepiloghi === CARICAMENTO || spese === CARICAMENTO)
    return null
  const profilo: Profilo | null = profiloQuery ?? null

  // Nav profile-aware: senza profilo l'app invita (Simulatore / Inizia), col profilo orienta.
  const voci: VoceNav[] = profilo
    ? [
        { to: '/', label: 'Panoramica', end: true, sim: false },
        { to: '/simulatore', label: 'Simulatore', end: false, sim: true },
        { to: '/dati', label: 'I miei dati', end: false, sim: false },
      ]
    : [
        { to: '/simulatore', label: 'Simulatore', end: false, sim: true },
        { to: '/dati', label: 'Inizia a tracciare', end: false, sim: false },
      ]

  const contenuto = (
    <>
      <main id="contenuto" tabIndex={-1} className="mx-auto w-full max-w-[1100px] px-4 py-6 focus:outline-none lg:px-8">
        <Routes>
          <Route
            path="/"
            element={
              profilo ? (
                <Panoramica profilo={profilo} fatture={fatture} riepiloghi={riepiloghi} spese={spese} />
              ) : (
                <Landing />
              )
            }
          />
          <Route
            path="/simulatore"
            element={<Simulatore profilo={profilo} fatture={fatture} riepiloghi={riepiloghi} spese={spese} />}
          />
          <Route
            path="/dati"
            element={<Dati profilo={profilo} fatture={fatture} riepiloghi={riepiloghi} spese={spese} />}
          />
          <Route path="/registro" element={<Navigate to="/dati" replace />} />
          <Route path="/profilo" element={<Navigate to="/dati" replace />} />
          <Route path="/bilancio" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="mx-auto w-full max-w-[1100px] px-4 pb-8 pt-4 text-xs text-testo-secondario lg:px-8">
        I dati restano solo in questo browser (IndexedDB): usa <strong>Esporta</strong> in I miei
        dati per i backup. Partitiva è uno strumento di tracciamento e comprensione, non consulenza
        fiscale: per le decisioni c'è il commercialista.{' '}
        <a className="underline" href="https://github.com/federiconardelli7/partitiva">Open source (MIT)</a>.
      </footer>
    </>
  )

  return (
    <div className="min-h-dvh bg-sfondo text-testo">
      <a
        href="#contenuto"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-testo focus:px-3 focus:py-2 focus:text-sfondo"
      >
        Salta al contenuto
      </a>

      {desktop ? (
        <div className="flex">
          <aside className="sticky top-0 h-dvh w-[232px] flex-none border-r border-bordo-sottile bg-superficie">
            <ShellNav voci={voci} />
          </aside>
          <div className="min-w-0 flex-1">{contenuto}</div>
        </div>
      ) : (
        <>
          <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-bordo-sottile bg-superficie px-4 py-3">
            <button
              type="button"
              onClick={() => setMenuAperto(true)}
              aria-label="Apri il menu"
              className="rounded-lg p-1.5 text-testo-secondario hover:text-testo"
            >
              <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
            <h1 className="flex-1 text-[15px] font-bold tracking-tight">
              Partitiva <span className="font-medium text-reale">· forfettario</span>
            </h1>
            <TemaToggle />
          </header>
          <Drawer aperto={menuAperto} onChiudi={() => setMenuAperto(false)} etichetta="Menu principale">
            <ShellNav voci={voci} conTema={false} onNaviga={() => setMenuAperto(false)} />
          </Drawer>
          {contenuto}
        </>
      )}
    </div>
  )
}
