import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from './db'
import { useUi } from './stores/ui'
import { BackupMenu } from './components/Backup'
import { Bilancio } from './components/Bilancio'
import { RegistroEntrate } from './components/RegistroEntrate'
import { Wizard } from './components/Wizard'

// Sentinella per distinguere "Dexie sta caricando" da "riga assente" (get → undefined).
const CARICAMENTO = 'caricamento' as const

export function App() {
  const profilo = useLiveQuery(() => db.profilo.get(1), [], CARICAMENTO)
  const fatture = useLiveQuery(() => db.fatture.orderBy('dataEmissione').reverse().toArray(), [], CARICAMENTO)
  const { vista, setVista } = useUi()
  const [modificaProfilo, setModificaProfilo] = useState(false)

  if (profilo === CARICAMENTO || fatture === CARICAMENTO) return null
  const mostraWizard = profilo === undefined || modificaProfilo

  return (
    <div className="min-h-dvh bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <header className="border-b border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <h1 className="text-xl font-bold tracking-tight">
            Partitiva <span className="font-normal text-emerald-700 dark:text-emerald-400">· forfettario</span>
          </h1>
          {!mostraWizard && (
            <div className="flex items-center gap-3">
              <nav className="flex gap-1 rounded-lg bg-stone-100 p-1 dark:bg-stone-800">
                {(['registro', 'bilancio'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setVista(v)}
                    className={`rounded-md px-3 py-1 text-sm font-medium capitalize transition ${
                      vista === v
                        ? 'bg-white shadow dark:bg-stone-700'
                        : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </nav>
              <BackupMenu profilo={profilo ?? null} fatture={fatture} />
              <button
                onClick={() => setModificaProfilo(true)}
                className="text-xs text-stone-500 underline hover:text-stone-800 dark:hover:text-stone-200"
                title="Modifica ATECO, coefficiente o copertura"
              >
                profilo
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        {mostraWizard ? (
          <Wizard esistente={profilo} onFine={() => setModificaProfilo(false)} />
        ) : vista === 'registro' ? (
          <RegistroEntrate fatture={fatture} />
        ) : (
          <Bilancio profilo={profilo} fatture={fatture} />
        )}
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
