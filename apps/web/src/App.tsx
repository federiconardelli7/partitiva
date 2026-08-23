import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect } from 'react'
import { BrowserRouter, Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { db, type Profilo } from './db'
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

  // Orientamento: il titolo del documento segue la pagina (prima dell'early return: regola hooks).
  useEffect(() => {
    if (profiloQuery === CARICAMENTO) return
    const nome = TITOLI_ROTTE[location.pathname] ?? (profiloQuery ? 'Panoramica' : null)
    document.title = nome ? `${nome} · Partitiva` : 'Partitiva — la tua P.IVA forfettaria, spiegata'
  }, [location.pathname, profiloQuery])

  if (profiloQuery === CARICAMENTO || fatture === CARICAMENTO || riepiloghi === CARICAMENTO || spese === CARICAMENTO)
    return null
  const profilo: Profilo | null = profiloQuery ?? null

  // Nav profile-aware: senza profilo l'app invita (Simulatore / Inizia), col profilo orienta.
  const voci = profilo
    ? [
        { to: '/', label: 'Panoramica', end: true, sim: false },
        { to: '/simulatore', label: 'Simulatore', end: false, sim: true },
        { to: '/dati', label: 'I miei dati', end: false, sim: false },
      ]
    : [
        { to: '/simulatore', label: 'Simulatore', end: false, sim: true },
        { to: '/dati', label: 'Inizia a tracciare', end: false, sim: false },
      ]

  const stileLink = (attivo: boolean, sim: boolean) =>
    `rounded-md px-3 py-1 text-sm font-medium transition ${
      attivo
        ? `bg-white shadow dark:bg-stone-700 ${sim ? 'text-indigo-700 dark:text-indigo-300' : ''}`
        : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
    }`

  return (
    <div className="min-h-dvh bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <a
        href="#contenuto"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-emerald-700 focus:px-3 focus:py-2 focus:text-white"
      >
        Salta al contenuto
      </a>
      <header className="border-b border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <h1 className="text-xl font-bold tracking-tight">
            <Link to="/">
              Partitiva <span className="font-normal text-emerald-700 dark:text-emerald-400">· forfettario</span>
            </Link>
          </h1>
          <nav className="flex gap-1 rounded-lg bg-stone-100 p-1 dark:bg-stone-800">
            {voci.map((voce) => (
              <NavLink
                key={voce.to}
                to={voce.to}
                end={voce.end}
                className={({ isActive }) => stileLink(isActive, voce.sim)}
              >
                {voce.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main id="contenuto" className="mx-auto max-w-4xl px-4 py-6">
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

      <footer className="mx-auto max-w-4xl px-4 pb-8 pt-4 text-xs text-stone-500">
        I dati restano solo in questo browser (IndexedDB): usa <strong>Esporta</strong> in I miei
        dati per i backup. Partitiva è uno strumento di tracciamento e comprensione, non consulenza
        fiscale: per le decisioni c'è il commercialista.{' '}
        <a className="underline" href="https://github.com/federiconardelli7/partitiva">Open source (MIT)</a>.
      </footer>
    </div>
  )
}
