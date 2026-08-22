import { useState } from 'react'
import { BackupMenu } from '../components/Backup'
import { IntestazionePagina } from '../components/IntestazionePagina'
import { RegistroEntrate } from '../components/RegistroEntrate'
import { Wizard } from '../components/Wizard'
import type { Fattura, Profilo } from '../db'
import { settoreProfilo } from '../lib/bilancio'
import { formatPercento } from '../lib/format'

const card = 'rounded-xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900'

/** L'hub della sorgente: fatture, profilo e backup vivono qui e solo qui. */
export function Dati({ profilo, fatture }: { profilo: Profilo | null; fatture: Fattura[] }) {
  const [modificaProfilo, setModificaProfilo] = useState(false)

  if (!profilo) {
    return (
      <div className="space-y-6">
        <IntestazionePagina titolo="I miei dati">
          Per calcolare imposta, contributi e scadenze servono tre dati. Restano in questo
          browser e si cambiano quando vuoi.
        </IntestazionePagina>
        <Wizard />
      </div>
    )
  }

  const settore = settoreProfilo(profilo)

  return (
    <div className="space-y-8">
      <IntestazionePagina titolo="I miei dati">
        La sorgente di tutto: quello che inserisci qui alimenta da solo la Panoramica e le
        scadenze. Resta in questo browser.
      </IntestazionePagina>

      <section className="space-y-3">
        <h3 className="text-base font-semibold">Fatture</h3>
        <RegistroEntrate fatture={fatture} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Profilo</h3>
          {!modificaProfilo && (
            <button
              type="button"
              onClick={() => setModificaProfilo(true)}
              className="rounded-md border border-emerald-700 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950"
            >
              Modifica
            </button>
          )}
        </div>
        {modificaProfilo ? (
          <Wizard esistente={profilo} onFine={() => setModificaProfilo(false)} />
        ) : (
          <dl className={`grid grid-cols-2 gap-4 sm:grid-cols-4 ${card}`}>
            <div>
              <dt className="text-xs uppercase tracking-wide text-stone-500">Anno di apertura</dt>
              <dd className="mt-0.5 font-semibold tabular-nums">{profilo.annoApertura}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-stone-500">Settore</dt>
              <dd className="mt-0.5 font-semibold">
                {settore ? `${settore} — ${formatPercento(profilo.coefficiente)}` : `settore al ${formatPercento(profilo.coefficiente)}`}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-stone-500">ATECO</dt>
              <dd className="mt-0.5 font-mono font-semibold">{profilo.ateco || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-stone-500">Gestione Separata</dt>
              <dd className="mt-0.5 font-semibold">{profilo.copertura === 'piena' ? 'Piena' : 'Ridotta'}</dd>
            </div>
          </dl>
        )}
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Questi tre dati decidono aliquote e scadenze di tutta l'app: se correggi qui, tutto
          si ricalcola da solo.
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Backup</h3>
          <BackupMenu profilo={profilo} fatture={fatture} />
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Questo browser è l'unica copia dei tuoi dati: esporta un backup ogni tanto.
          L'import sostituisce tutto, previa conferma.
        </p>
      </section>
    </div>
  )
}
