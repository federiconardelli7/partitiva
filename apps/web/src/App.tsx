import { useLiveQuery } from 'dexie-react-hooks'
import { BrowserRouter, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import { db, type Fattura, type Profilo } from './db'
import { BackupMenu } from './components/Backup'
import { Bilancio } from './components/Bilancio'
import { RegistroEntrate } from './components/RegistroEntrate'
import { Wizard } from './components/Wizard'
import { Calcolatore } from './pages/Calcolatore'

// Sentinella per distinguere "Dexie sta caricando" da "riga assente" (get → undefined).
const CARICAMENTO = 'caricamento' as const

export function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  )
}

function Shell() {
  const profilo = useLiveQuery(() => db.profilo.get(1), [], CARICAMENTO)
  const fatture = useLiveQuery(() => db.fatture.orderBy('dataEmissione').reverse().toArray(), [], CARICAMENTO)
  const navigate = useNavigate()

  if (profilo === CARICAMENTO || fatture === CARICAMENTO) return null

  const conProfilo = (contenuto: (profilo: Profilo, fatture: Fattura[]) => React.ReactNode) =>
    profilo ? contenuto(profilo, fatture) : <Wizard />

  const stileLink = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-3 py-1 text-sm font-medium transition ${
      isActive ? 'bg-white shadow dark:bg-stone-700' : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
    }`

  return (
    <div className="min-h-dvh bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <header className="border-b border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <h1 className="text-xl font-bold tracking-tight">
            Partitiva <span className="font-normal text-emerald-700 dark:text-emerald-400">· forfettario</span>
          </h1>
          <div className="flex items-center gap-3">
            <nav className="flex gap-1 rounded-lg bg-stone-100 p-1 dark:bg-stone-800">
              <NavLink to="/" end className={stileLink}>
                Calcolatore
              </NavLink>
              <NavLink to="/registro" className={stileLink}>
                I miei dati
              </NavLink>
              <NavLink to="/bilancio" className={stileLink}>
                Bilancio
              </NavLink>
            </nav>
            {profilo && (
              <>
                <BackupMenu profilo={profilo} fatture={fatture} />
                <NavLink
                  to="/profilo"
                  className="text-xs text-stone-500 underline hover:text-stone-800 dark:hover:text-stone-200"
                  title="Modifica ATECO, coefficiente o copertura"
                >
                  profilo
                </NavLink>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <Routes>
          <Route path="/" element={<Calcolatore />} />
          <Route path="/registro" element={conProfilo((_p, f) => <RegistroEntrate fatture={f} />)} />
          <Route path="/bilancio" element={conProfilo((p, f) => <Bilancio profilo={p} fatture={f} />)} />
          <Route
            path="/profilo"
            element={
              profilo ? (
                <Wizard esistente={profilo} onFine={() => navigate('/registro')} />
              ) : (
                <Wizard onFine={() => navigate('/registro')} />
              )
            }
          />
          <Route path="*" element={<Calcolatore />} />
        </Routes>
      </main>

      <footer className="mx-auto max-w-4xl px-4 pb-8 pt-4 text-xs text-stone-500">
        I dati restano solo in questo browser (IndexedDB): usa <strong>Esporta</strong> per i
        backup. Partitiva è uno strumento di tracciamento e comprensione, non consulenza fiscale:
        per le decisioni c’è il commercialista.{' '}
        <a className="underline" href="https://github.com/federiconardelli7/partitiva">Open source (MIT)</a>.
      </footer>
    </div>
  )
}
