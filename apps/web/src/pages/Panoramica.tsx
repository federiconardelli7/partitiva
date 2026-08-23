import { computeTimeline, type NodeId } from '@partitiva/motore-fiscale'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExplainTree } from '../components/ExplainTree'
import { Flusso } from '../components/Flusso'
import { IntestazionePagina } from '../components/IntestazionePagina'
import type { Fattura, Profilo, RiepilogoAnnuale, Spesa } from '../db'
import {
  annoDi,
  annoUltimoStartup,
  buildTimelineInputs,
  daIncassare,
  giorniA,
  numeroAnnoAttivita,
  paramsVicini,
  prossimoF24,
  riepilogoDi,
} from '../lib/bilancio'
import { formatDataIt, formatEuro, formatEuroIntero, oggiIso } from '../lib/format'

const chip = 'rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600 dark:bg-stone-800 dark:text-stone-300'
const card = 'rounded-xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900'

/** La vista d'insieme: SOLO dati derivati dalla sorgente, niente input. */
export function Panoramica({
  profilo,
  fatture,
  riepiloghi,
  spese,
}: {
  profilo: Profilo
  fatture: Fattura[]
  riepiloghi: RiepilogoAnnuale[]
  spese: Spesa[]
}) {
  const oggi = oggiIso()
  const annoCorrente = annoDi(oggi)
  const annoMassimo = Math.max(
    annoCorrente,
    ...fatture.map((f) => annoDi(f.dataEmissione)),
    ...fatture.filter((f) => f.dataIncasso !== null).map((f) => annoDi(f.dataIncasso!)),
    ...riepiloghi.map((r) => r.anno),
  )
  const [anno, setAnno] = useState(annoCorrente)
  const [nodoAttivo, setNodoAttivo] = useState<NodeId | null>(null)
  const timeline = useMemo(
    () => computeTimeline(buildTimelineInputs(profilo, fatture, riepiloghi, spese, annoMassimo)),
    [profilo, fatture, riepiloghi, spese, annoMassimo],
  )
  const risultato = timeline.anni[anno]
  if (!risultato) return null

  const cambiaAnno = (nuovo: number) => {
    setAnno(nuovo)
    setNodoAttivo(null)
  }

  const anni = Object.keys(timeline.anni).map(Number)
  const params = paramsVicini(anno)
  const soglia85 = params.soglie.uscitaAnnoSuccessivo.valore
  const soglia100 = params.soglie.uscitaImmediata.valore
  const incassato = risultato.explain[`${anno}:incassato`]!.value
  const percentualeSoglia = Math.min(100, (incassato / soglia100) * 100)

  const aperte = daIncassare(fatture)
  const prossimo = prossimoF24(timeline.f24, oggi)
  const f24Anno = timeline.f24.filter((f) => f.anno === anno)
  const boxF24 =
    risultato.versatiContributiCents > 0 && f24Anno.length > 0
      ? {
          totaleCents: f24Anno.reduce((somma, f) => somma + f.totaleCents, 0),
          dettaglio: `F24 di ${f24Anno.map((f) => f.scadenza).join(' e ')}: solo le righe INPS si deducono`,
        }
      : undefined

  const ultimoStartup = annoUltimoStartup(profilo.annoApertura)
  const f24Futuri = timeline.f24.filter((f) => f.dataScadenza >= oggi).slice(0, 2)
  const radice = nodoAttivo ?? `${anno}:nettoReale`

  return (
    <div className="space-y-6">
      <IntestazionePagina
        titolo={`Il tuo ${anno}`}
        extra={
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            ● Dati reali
          </span>
        }
      >
        Questa pagina si aggiorna da sola da{' '}
        <Link className="underline underline-offset-2" to="/dati">
          I miei dati
        </Link>
        : qui non si inserisce niente.
      </IntestazionePagina>

      <div className="flex flex-wrap gap-2">
        <span className={chip}>{numeroAnnoAttivita(profilo.annoApertura, anno)}º anno di attività</span>
        <span className={chip}>
          {anno <= ultimoStartup ? `aliquota 5% startup · fino al ${ultimoStartup}` : 'aliquota 15%'}
        </span>
        <span className={chip}>{profilo.copertura === 'piena' ? 'Gestione Separata piena' : 'GS ridotta (altra copertura)'}</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className={card}>
          <h3 className="text-xs uppercase tracking-wide text-stone-500">Da incassare</h3>
          <div className="mt-1 text-xl font-semibold tabular-nums">{formatEuro(aperte.importoCents)}</div>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            {aperte.conteggio === 0
              ? 'tutte le fatture emesse sono incassate'
              : aperte.conteggio === 1
                ? '1 fattura emessa e non incassata'
                : `${aperte.conteggio} fatture emesse e non incassate`}
          </p>
          {aperte.conteggio > 0 && (
            <Link
              to="/dati"
              className="mt-2 inline-block rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300"
            >
              Segna gli incassi →
            </Link>
          )}
        </div>

        <div className={card}>
          <h3 className="text-xs uppercase tracking-wide text-stone-500">Prossimo F24</h3>
          <div className="mt-1 text-xl font-semibold tabular-nums">
            {prossimo ? formatDataIt(prossimo.dataScadenza) : '—'}
          </div>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            {prossimo
              ? `${prossimo.scadenza} · tra ${giorniA(prossimo.dataScadenza, oggi)} giorni · ${formatEuro(prossimo.totaleCents)}`
              : 'nessuna scadenza calcolata'}
          </p>
        </div>

        <div className={card}>
          <h3 className="text-xs uppercase tracking-wide text-stone-500">Verso gli {formatEuroIntero(soglia85)}</h3>
          <div className="mt-1 text-xl font-semibold tabular-nums">{formatEuro(incassato)}</div>
          <div className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
            <div
              className={`h-full rounded-full transition-all ${
                incassato > soglia100 ? 'bg-red-600' : incassato > soglia85 ? 'bg-amber-500' : 'bg-emerald-600'
              }`}
              style={{ width: `${percentualeSoglia}%` }}
            />
            <div
              className="absolute inset-y-0 border-l-2 border-dashed border-stone-400"
              style={{ left: `${(soglia85 / soglia100) * 100}%` }}
            />
          </div>
          <p className="mt-1 flex justify-between text-xs text-stone-500 dark:text-stone-400">
            <span>incassato nell'anno</span>
            <span>
              {formatEuroIntero(soglia85)} · {formatEuroIntero(soglia100)}
            </span>
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7 dark:border-stone-800 dark:bg-stone-900">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">Il flusso del tuo anno</h3>
            {riepilogoDi(riepiloghi, anno) && (
              <span className={chip}>
                include pregresso {formatEuro(riepilogoDi(riepiloghi, anno)!.incassatoCents)}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {anni.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => cambiaAnno(a)}
                className={`rounded-full border px-3.5 py-1 text-sm tabular-nums transition ${
                  a === anno
                    ? 'border-emerald-600 bg-emerald-50 font-semibold text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'border-stone-200 text-stone-500 hover:text-stone-800 dark:border-stone-700 dark:hover:text-stone-200'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
        <Flusso
          explain={timeline.explain}
          anno={anno}
          livrea="reale"
          f24={boxF24}
          nodoAttivo={nodoAttivo ?? undefined}
          onNodo={setNodoAttivo}
        />
        <p className="mt-4 text-xs text-stone-500 dark:text-stone-400">
          Tocca un riquadro: il suo perché si apre qui sotto, fino all'ultima rata.
        </p>
      </section>

      {timeline.flags.length > 0 && (
        <ul className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          {timeline.flags.map((flag) => (
            <li key={flag.codice + flag.messaggio}>⚠️ {flag.messaggio}</li>
          ))}
        </ul>
      )}

      {f24Futuri.length > 0 && (
        <section className={card}>
          <h3 className="mb-2 text-sm font-semibold">Prossimi F24, riga per riga</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {f24Futuri.map((f) => (
              <div key={`${f.anno}-${f.scadenza}`} className="rounded-lg border border-stone-100 p-3 dark:border-stone-800">
                <div className="flex justify-between text-sm font-medium">
                  <span>{formatDataIt(f.dataScadenza)}</span>
                  <span className="tabular-nums">{formatEuro(f.totaleCents)}</span>
                </div>
                <table className="mt-2 w-full text-xs text-stone-600 dark:text-stone-400">
                  <tbody>
                    {f.righe.map((r) => (
                      <tr key={r.nodeId}>
                        <td className="py-0.5 font-mono">{r.codice}</td>
                        <td className="py-0.5">{r.descrizione}</td>
                        <td className="py-0.5 text-right tabular-nums">{formatEuro(r.importoCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {f.creditiCents > 0 && (
                  <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
                    Crediti emersi: {formatEuro(f.creditiCents)} (da compensare col commercialista)
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className={card}>
        <h3 className="mb-2 text-sm font-semibold">Ogni numero col suo perché</h3>
        <ExplainTree key={radice} map={timeline.explain} id={radice} />
      </section>
    </div>
  )
}
