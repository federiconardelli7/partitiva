import { computeAnno, computeTimeline, GRUPPI_ATECO } from '@partitiva/motore-fiscale'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../components/Card'
import { Flusso } from '../components/Flusso'
import { IntestazionePagina } from '../components/IntestazionePagina'
import type { Fattura, Profilo } from '../db'
import { annoDi, annoUltimoStartup, buildTimelineInputs, numeroAnnoAttivita, paramsVicini } from '../lib/bilancio'
import { formatEuro, formatPercento, oggiIso, parseImportoIt } from '../lib/format'

const campo =
  'mt-1 w-full rounded-md border border-stone-300 px-3 py-2 dark:border-stone-700 dark:bg-stone-800'

/** Da centesimi a testo per gli input (1.234,56): il percorso inverso è parseImportoIt. */
const centsInInput = (cents: number): string =>
  (cents / 100).toLocaleString('it-IT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: 'always',
  })

/** Sandbox: uno scenario alla volta, mai scritture su Dexie. */
export function Simulatore({ profilo, fatture }: { profilo: Profilo | null; fatture: Fattura[] }) {
  const anno = annoDi(oggiIso())
  const [incassato, setIncassato] = useState('30.000')
  const [coefficiente, setCoefficiente] = useState(0.67)
  const [startup, setStartup] = useState(true)
  const [copertura, setCopertura] = useState<'piena' | 'ridotta'>('piena')
  const [versati, setVersati] = useState('')
  const [primoAnno, setPrimoAnno] = useState(false)

  const incassatoCents = parseImportoIt(incassato)
  const versatiCents = primoAnno || versati.trim() === '' ? 0 : (parseImportoIt(versati) ?? 0)

  const risultato = useMemo(() => {
    if (incassatoCents === null) return null
    return computeAnno(
      { anno, incassatoCents, coefficiente, startup, copertura, versatiContributiCents: versatiCents },
      paramsVicini(anno),
    )
  }, [anno, incassatoCents, coefficiente, startup, copertura, versatiCents])

  const partiDaiTuoiDati = () => {
    if (!profilo) return
    const reale = computeTimeline(buildTimelineInputs(profilo, fatture, anno)).anni[anno]
    if (!reale) return
    setIncassato(centsInInput(reale.explain[`${anno}:incassato`]!.value))
    setCoefficiente(profilo.coefficiente)
    setCopertura(profilo.copertura)
    setStartup(anno <= annoUltimoStartup(profilo.annoApertura))
    setPrimoAnno(numeroAnnoAttivita(profilo.annoApertura, anno) === 1)
    setVersati(reale.versatiContributiCents > 0 ? centsInInput(reale.versatiContributiCents) : '')
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-center text-sm font-semibold text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300">
        ⏈ Simulazione — qui non si salva niente: i tuoi dati veri non vengono toccati
      </div>

      <IntestazionePagina
        titolo={`Simulatore forfettario ${anno}`}
        extra={
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            ⏈ Sandbox
          </span>
        }
      >
        Uno scenario alla volta, senza toccare il tuo registro.{' '}
        {profilo ? (
          <>
            I numeri veri sono nella{' '}
            <Link className="underline underline-offset-2" to="/">
              Panoramica
            </Link>
            .
          </>
        ) : (
          <>
            Quando vuoi tracciare le fatture vere:{' '}
            <Link className="underline underline-offset-2" to="/dati">
              inizia da I miei dati
            </Link>
            .
          </>
        )}
      </IntestazionePagina>

      <div className="grid gap-3 rounded-xl border border-indigo-200/70 bg-white p-4 shadow-sm sm:grid-cols-2 dark:border-indigo-900/70 dark:bg-stone-900">
        <label className="text-sm">
          Incassato nell'anno (€)
          <input value={incassato} onChange={(e) => setIncassato(e.target.value)} className={campo} />
        </label>
        <label className="text-sm">
          Settore (coefficiente di redditività)
          <select
            value={coefficiente}
            onChange={(e) => setCoefficiente(Number(e.target.value))}
            className={campo}
          >
            {GRUPPI_ATECO.map((g) => (
              <option key={g.settore} value={g.coefficiente}>
                {g.settore} — {Math.round(g.coefficiente * 100)}%
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Contributi versati nell'anno (€, facoltativo)
          <input
            value={primoAnno ? '' : versati}
            onChange={(e) => setVersati(e.target.value)}
            placeholder="0"
            disabled={primoAnno}
            className={`${campo} disabled:opacity-50`}
          />
          <span className="mt-1 block text-xs text-stone-500">
            Vuoto = niente da dedurre: è lo scenario più prudente.
          </span>
        </label>
        <div className="flex flex-col justify-center gap-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={primoAnno} onChange={(e) => setPrimoAnno(e.target.checked)} />
            Primo anno di attività (nulla da dedurre)
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={startup} onChange={(e) => setStartup(e.target.checked)} />
            Aliquota startup 5% (primi 5 anni; altrimenti 15%)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={copertura === 'ridotta'}
              onChange={(e) => setCopertura(e.target.checked ? 'ridotta' : 'piena')}
            />
            Pensionato / altra copertura (GS ridotta)
          </label>
          {profilo && (
            <button
              type="button"
              onClick={partiDaiTuoiDati}
              className="mt-1 self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              ↺ Parti dai tuoi dati
            </button>
          )}
        </div>
      </div>

      {incassatoCents === null && (
        <p className="text-sm text-red-600">Importo non valido: usa il formato 1.234,56</p>
      )}

      {risultato && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Card titolo="Netto reale simulato" valore={formatEuro(risultato.nettoRealeCents)} />
            <Card
              titolo="Da accantonare"
              valore={formatEuro(risultato.contributiDovutiCents + risultato.impostaCents)}
              dettaglio={`contributi ${formatEuro(risultato.contributiDovutiCents)} + imposta ${formatEuro(risultato.impostaCents)}`}
            />
            <Card
              titolo="Pressione totale"
              valore={formatPercento(risultato.quotaAccantonamento)}
              dettaglio="sull'incassato simulato"
            />
          </div>

          <section className="rounded-xl border border-indigo-200/70 bg-white p-5 shadow-sm sm:p-7 dark:border-indigo-900/70 dark:bg-stone-900">
            <p className="mb-4 text-center">
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                Flusso dello scenario — non è il tuo registro
              </span>
            </p>
            <Flusso explain={risultato.explain} anno={anno} livrea="sim" />
          </section>
        </>
      )}

      <p className="text-xs text-stone-500 dark:text-stone-400">
        Chiudi o ricarica la pagina e lo scenario svanisce: niente di questa pagina finisce nei tuoi dati.
      </p>
    </div>
  )
}
