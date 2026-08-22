import { computeTimeline } from '@partitiva/motore-fiscale'
import { useMemo, useState } from 'react'
import type { Fattura, Profilo } from '../db'
import { annoDi, anniResiduiStartup, buildTimelineInputs, paramsVicini } from '../lib/bilancio'
import { formatDataIt, formatEuro, formatPercento, oggiIso } from '../lib/format'
import { Card } from './Card'
import { ExplainTree } from './ExplainTree'

export function Bilancio({ profilo, fatture }: { profilo: Profilo; fatture: Fattura[] }) {
  const annoCorrente = annoDi(oggiIso())
  const annoMassimo = Math.max(
    annoCorrente,
    ...fatture.map((f) => annoDi(f.dataEmissione)),
    ...fatture.filter((f) => f.dataIncasso !== null).map((f) => annoDi(f.dataIncasso!)),
  )
  const [anno, setAnno] = useState(Math.min(annoCorrente, annoMassimo))

  const timeline = useMemo(
    () => computeTimeline(buildTimelineInputs(profilo, fatture, annoMassimo)),
    [profilo, fatture, annoMassimo],
  )
  const anni = Object.keys(timeline.anni).map(Number)
  const risultato = timeline.anni[anno]
  if (!risultato) return null

  const params = paramsVicini(anno)
  const soglia85 = params.soglie.uscitaAnnoSuccessivo.valore
  const soglia100 = params.soglie.uscitaImmediata.valore
  const percentuale = Math.min(100, (risultato.explain[`${anno}:incassato`]!.value / soglia100) * 100)
  const incassato = risultato.explain[`${anno}:incassato`]!.value
  const residuiStartup = anniResiduiStartup(profilo.annoApertura, anno)

  const oggi = oggiIso()
  const f24Futuri = timeline.f24.filter((f) => f.dataScadenza >= oggi).slice(0, 2)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Bilancio {anno}</h2>
        <select
          value={anno}
          onChange={(e) => setAnno(Number(e.target.value))}
          className="rounded-md border border-stone-300 px-3 py-1.5 text-sm dark:border-stone-700 dark:bg-stone-800"
        >
          {anni.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-xs text-stone-500">
          <span>Incassato: {formatEuro(incassato)}</span>
          <span>85.000 € · 100.000 €</span>
        </div>
        <div className="relative h-3 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
          <div
            className={`h-full rounded-full transition-all ${
              incassato > soglia100 ? 'bg-red-600' : incassato > soglia85 ? 'bg-amber-500' : 'bg-emerald-600'
            }`}
            style={{ width: `${percentuale}%` }}
          />
          <div className="absolute inset-y-0 border-l-2 border-dashed border-stone-400" style={{ left: '85%' }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card titolo="Reddito forfettario" valore={formatEuro(risultato.redditoCents)} dettaglio={`coefficiente ${formatPercento(profilo.coefficiente)}`} />
        <Card titolo="Contributi GS dovuti" valore={formatEuro(risultato.contributiDovutiCents)} dettaglio={`versati nell’anno: ${formatEuro(risultato.versatiContributiCents)}`} />
        <Card titolo="Imposta sostitutiva" valore={formatEuro(risultato.impostaCents)} dettaglio={`imponibile ${formatEuro(risultato.imponibileCents)}`} />
        <Card titolo="Netto di competenza" valore={formatEuro(risultato.nettoCompetenzaCents)} />
        <Card titolo="Netto reale" valore={formatEuro(risultato.nettoRealeCents)} dettaglio={`bolli ${formatEuro(risultato.bolliCents)}`} />
        <Card
          titolo="Da accantonare"
          valore={formatPercento(risultato.quotaAccantonamento)}
          dettaglio={residuiStartup > 0 ? `aliquota 5% ancora per ${residuiStartup} anni` : 'aliquota 15%'}
        />
      </div>

      {timeline.flags.length > 0 && (
        <ul className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          {timeline.flags.map((flag) => (
            <li key={flag.codice + flag.messaggio}>⚠️ {flag.messaggio}</li>
          ))}
        </ul>
      )}

      {f24Futuri.length > 0 && (
        <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
          <h3 className="mb-2 text-sm font-semibold">Prossimi F24</h3>
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

      <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <h3 className="mb-2 text-sm font-semibold">Come si arriva a questi numeri</h3>
        <ExplainTree map={timeline.explain} id={`${anno}:nettoReale`} />
      </section>
    </div>
  )
}
