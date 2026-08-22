import { computeAnno, GRUPPI_ATECO } from '@partitiva/motore-fiscale'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../components/Card'
import { ExplainTree } from '../components/ExplainTree'
import { annoDi, paramsVicini } from '../lib/bilancio'
import { formatEuro, formatPercento, oggiIso, parseImportoIt } from '../lib/format'

/** Simulatore libero: nessun dato viene salvato. Il tracciamento vero è in «I miei dati». */
export function Calcolatore() {
  const anno = annoDi(oggiIso())
  const [incassato, setIncassato] = useState('30.000')
  const [coefficiente, setCoefficiente] = useState(0.67)
  const [startup, setStartup] = useState(true)
  const [copertura, setCopertura] = useState<'piena' | 'ridotta'>('piena')
  const [versati, setVersati] = useState('')

  const incassatoCents = parseImportoIt(incassato)
  const versatiCents = versati.trim() === '' ? 0 : (parseImportoIt(versati) ?? 0)

  const risultato = useMemo(() => {
    if (incassatoCents === null) return null
    return computeAnno(
      { anno, incassatoCents, coefficiente, startup, copertura, versatiContributiCents: versatiCents },
      paramsVicini(anno),
    )
  }, [anno, incassatoCents, coefficiente, startup, copertura, versatiCents])

  const campo =
    'mt-1 w-full rounded-md border border-stone-300 px-3 py-2 dark:border-stone-700 dark:bg-stone-800'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Calcolatore forfettario {anno}</h2>
        <p className="text-sm text-stone-500">
          Prova subito, senza inserire nulla di tuo: qui non si salva niente. Quando vuoi tracciare
          le fatture vere, vai su <Link className="underline" to="/registro">I miei dati</Link>.
        </p>
      </div>

      <div className="grid gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:grid-cols-2 dark:border-stone-800 dark:bg-stone-900">
        <label className="text-sm">
          Incassato nell’anno (€)
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
          Contributi che verserai nell’anno (€, facoltativo)
          <input
            value={versati}
            onChange={(e) => setVersati(e.target.value)}
            placeholder="0"
            className={campo}
          />
          <span className="mt-1 block text-xs text-stone-500">
            Vuoto = scenario da primo anno (imponibile pieno): è il più prudente.
          </span>
        </label>
        <div className="flex flex-col justify-center gap-2 text-sm">
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
            Pensionato / altra copertura (GS 24% invece di 26,07%)
          </label>
        </div>
      </div>

      {incassatoCents === null && (
        <p className="text-sm text-red-600">Importo non valido: usa il formato 1.234,56</p>
      )}

      {risultato && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Card titolo="Reddito forfettario" valore={formatEuro(risultato.redditoCents)} dettaglio={`coefficiente ${formatPercento(coefficiente)}`} />
            <Card titolo="Contributi GS dovuti" valore={formatEuro(risultato.contributiDovutiCents)} />
            <Card titolo="Imposta sostitutiva" valore={formatEuro(risultato.impostaCents)} dettaglio={`imponibile ${formatEuro(risultato.imponibileCents)}`} />
            <Card titolo="Netto di competenza" valore={formatEuro(risultato.nettoCompetenzaCents)} />
            <Card titolo="Pressione totale" valore={formatPercento(risultato.quotaAccantonamento)} dettaglio="imposta + contributi sull’incassato" />
            <Card titolo="Da accantonare" valore={formatEuro(risultato.contributiDovutiCents + risultato.impostaCents)} dettaglio="per saldi e acconti futuri" />
          </div>

          <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
            <h3 className="mb-2 text-sm font-semibold">Come si arriva a questi numeri</h3>
            <ExplainTree map={risultato.explain} id={`${anno}:nettoReale`} />
          </section>
        </>
      )}
    </div>
  )
}
