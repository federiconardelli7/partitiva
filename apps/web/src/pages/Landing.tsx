import { computeAnno } from '@partitiva/motore-fiscale'
import { Link } from 'react-router-dom'
import { Flusso } from '../components/Flusso'
import { annoDi, paramsVicini } from '../lib/bilancio'
import { oggiIso } from '../lib/format'

/** Landing per chi non ha un profilo: mostra COSA fa l'app senza chiedere nulla.
 *  L'esempio è calcolato DAL MOTORE su valori sintetici: mai numeri a mano. */
export function Landing() {
  const anno = annoDi(oggiIso())
  const demo = computeAnno(
    {
      anno,
      incassatoCents: 3_000_000,
      coefficiente: 0.67,
      startup: true,
      copertura: 'piena',
      versatiContributiCents: 0,
    },
    paramsVicini(anno),
  )

  return (
    <div className="space-y-8">
      <div className="mx-auto max-w-2xl pt-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-balance">
          La tua P.IVA forfettaria, spiegata.
        </h2>
        <p className="mt-3 text-stone-500 dark:text-stone-400">
          Dalla fattura all'F24, ogni numero col suo perché. Open source e privacy-first:
          i dati restano nel tuo browser, senza account e senza cloud.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/dati"
            className="rounded-lg bg-emerald-700 px-5 py-2.5 font-medium text-white hover:bg-emerald-800"
          >
            Inizia a tracciare
          </Link>
          <Link
            to="/simulatore"
            className="rounded-lg border-2 border-indigo-500 px-5 py-2 font-medium text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-950"
          >
            Prova il Simulatore
          </Link>
        </div>
      </div>

      <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7 dark:border-stone-800 dark:bg-stone-900">
        <p className="mb-4 text-center">
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600 dark:bg-stone-800 dark:text-stone-300">
            Esempio sintetico · primo anno di attività
          </span>
        </p>
        <Flusso explain={demo.explain} anno={anno} livrea="reale" />
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
          <h3 className="text-sm font-semibold">🔒 Privacy davvero</h3>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Tutto vive in questo browser (IndexedDB). Backup quando vuoi, in un file tuo.
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
          <h3 className="text-sm font-semibold">🧾 Import fatture</h3>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Carica gli XML FatturaPA (anche .p7m): il registro si compila da solo.
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
          <h3 className="text-sm font-semibold">📅 Scadenze spiegate</h3>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            F24 di luglio e novembre composti riga per riga, coi codici tributo.
          </p>
        </div>
      </div>
    </div>
  )
}
