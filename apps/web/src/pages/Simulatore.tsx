import { computeAnno, computeTimeline, GRUPPI_ATECO, type Flag, type RisultatoAnno } from '@partitiva/motore-fiscale'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../components/Card'
import { Flusso } from '../components/Flusso'
import { IntestazionePagina } from '../components/IntestazionePagina'
import type { Fattura, Profilo, RiepilogoAnnuale, Spesa } from '../db'
import {
  annoDi,
  annoParamsVicini,
  annoUltimoStartup,
  buildTimelineInputs,
  numeroAnnoAttivita,
  paramsVicini,
} from '../lib/bilancio'
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
export function Simulatore({
  profilo,
  fatture,
  riepiloghi,
  spese,
}: {
  profilo: Profilo | null
  fatture: Fattura[]
  riepiloghi: RiepilogoAnnuale[]
  spese: Spesa[]
}) {
  const annoCorrente = annoDi(oggiIso())
  const [annoSimulato, setAnnoSimulato] = useState(annoCorrente)
  const [concatena, setConcatena] = useState(false)
  const [incassato, setIncassato] = useState('30.000')
  const [coefficiente, setCoefficiente] = useState(0.67)
  const [startup, setStartup] = useState(true)
  const [copertura, setCopertura] = useState<'piena' | 'ridotta'>('piena')
  const [versati, setVersati] = useState('')
  const [primoAnno, setPrimoAnno] = useState(false)

  // Anni simulabili: da apertura a corrente+1 (il pregresso si registra, il futuro si simula).
  const anni = profilo
    ? Array.from({ length: annoCorrente + 2 - profilo.annoApertura }, (_, i) => profilo.annoApertura + i)
    : [annoCorrente]
  const concatenabile = profilo !== null && annoSimulato > profilo.annoApertura
  const concatenaAttiva = concatenabile && concatena

  const incassatoCents = parseImportoIt(incassato)
  const versatiCents = primoAnno || versati.trim() === '' ? 0 : (parseImportoIt(versati) ?? 0)

  const { risultato, avvisi } = useMemo((): { risultato: RisultatoAnno | null; avvisi: Flag[] } => {
    if (incassatoCents === null) return { risultato: null, avvisi: [] }
    const scenario = { anno: annoSimulato, incassatoCents, coefficiente, startup, copertura }
    if (concatenaAttiva && profilo) {
      // Catena vera: anni reali (fatture + riepiloghi) fino a Y−1, poi lo scenario Y.
      const reali = buildTimelineInputs(profilo, fatture, riepiloghi, spese, annoSimulato - 1)
      const timeline = computeTimeline([...reali, { ...scenario, bolliCents: 0 }])
      return { risultato: timeline.anni[annoSimulato] ?? null, avvisi: timeline.flags }
    }
    // Nel ramo manuale paramsVicini ripiega in silenzio: l'avviso va detto qui.
    const annoParams = annoParamsVicini(annoSimulato)
    const avvisiManuali: Flag[] =
      annoParams !== annoSimulato
        ? [
            {
              codice: 'params-fallback',
              messaggio: `Parametri ${annoSimulato} non ancora disponibili: uso quelli del ${annoParams} (da riverificare a inizio anno).`,
            },
          ]
        : []
    return {
      risultato: computeAnno({ ...scenario, versatiContributiCents: versatiCents }, paramsVicini(annoSimulato)),
      avvisi: avvisiManuali,
    }
  }, [annoSimulato, incassatoCents, coefficiente, startup, copertura, versatiCents, concatenaAttiva, profilo, fatture, riepiloghi, spese])

  const cambiaAnno = (nuovo: number) => {
    setAnnoSimulato(nuovo)
    if (profilo) setStartup(nuovo <= annoUltimoStartup(profilo.annoApertura))
  }

  const partiDaiTuoiDati = () => {
    if (!profilo) return
    const reale = computeTimeline(buildTimelineInputs(profilo, fatture, riepiloghi, spese, annoCorrente)).anni[annoCorrente]
    if (!reale) return
    setAnnoSimulato(annoCorrente)
    setConcatena(numeroAnnoAttivita(profilo.annoApertura, annoCorrente) > 1)
    setIncassato(centsInInput(reale.explain[`${annoCorrente}:incassato`]!.value))
    setCoefficiente(profilo.coefficiente)
    setCopertura(profilo.copertura)
    setStartup(annoCorrente <= annoUltimoStartup(profilo.annoApertura))
    setPrimoAnno(numeroAnnoAttivita(profilo.annoApertura, annoCorrente) === 1)
    setVersati('')
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-center text-sm font-semibold text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300">
        ⏈ Simulazione — qui non si salva niente: i tuoi dati veri non vengono toccati
      </div>

      <IntestazionePagina
        titolo={`Simulatore forfettario ${annoSimulato}`}
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
        {profilo && (
          <label className="text-sm">
            Anno simulato
            <select value={annoSimulato} onChange={(e) => cambiaAnno(Number(e.target.value))} className={campo}>
              {anni.map((a) => (
                <option key={a} value={a}>
                  {a}
                  {a === annoCorrente ? ' (in corso)' : a > annoCorrente ? ' (futuro)' : ''}
                </option>
              ))}
            </select>
          </label>
        )}
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
        {concatenaAttiva ? (
          <div className="text-sm">
            Contributi versati nell'anno (derivati)
            <div className={`${campo} bg-stone-100 tabular-nums dark:bg-stone-800`}>
              {risultato ? formatEuro(risultato.versatiContributiCents) : '—'}
            </div>
            <span className="mt-1 block text-xs text-stone-500">
              Saldi e acconti che pagheresti davvero, dalla catena reale fino al {annoSimulato - 1}.
            </span>
          </div>
        ) : (
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
        )}
        <div className="flex flex-col justify-center gap-2 text-sm">
          {concatenabile && (
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={concatena} onChange={(e) => setConcatena(e.target.checked)} />
              Concatena i miei dati fino al {annoSimulato - 1}
            </label>
          )}
          {concatenaAttiva && annoSimulato === annoCorrente + 1 && (
            <span className="text-xs text-stone-500">
              La catena usa il {annoCorrente} così com'è oggi (anno in corso).
            </span>
          )}
          {!concatenaAttiva && (
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={primoAnno} onChange={(e) => setPrimoAnno(e.target.checked)} />
              Primo anno di attività (nulla da dedurre)
            </label>
          )}
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

      {avvisi.length > 0 && (
        <ul className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          {avvisi.map((avviso) => (
            <li key={avviso.codice + avviso.messaggio}>⚠️ {avviso.messaggio}</li>
          ))}
        </ul>
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
            <Flusso explain={risultato.explain} anno={annoSimulato} livrea="sim" />
          </section>
        </>
      )}

      <p className="text-xs text-stone-500 dark:text-stone-400">
        Chiudi o ricarica la pagina e lo scenario svanisce: niente di questa pagina finisce nei tuoi dati.
      </p>
    </div>
  )
}
