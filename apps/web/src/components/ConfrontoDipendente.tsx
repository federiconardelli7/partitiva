import {
  computeDipendente,
  ENTITA_REGIONALI,
  type DimensioneAzienda,
  type EntitaRegionale,
  type RisultatoDipendente,
} from '@partitiva/motore-fiscale'
import { useState } from 'react'
import { paramsVicini } from '../lib/bilancio'
import { formatEuro, formatPercento, parseImportoIt, parsePercentoIt } from '../lib/format'

const campo =
  'mt-1 w-full rounded-md border border-stone-300 px-3 py-2 dark:border-stone-700 dark:bg-stone-800'

const DIMENSIONI: { valore: '' | DimensioneAzienda; etichetta: string }[] = [
  { valore: '', etichetta: 'Solo IVS 9,19% (come i calcolatori standard)' },
  { valore: 'fino-a-5', etichetta: 'Azienda fino a 5 dipendenti (+FIS)' },
  { valore: 'da-6-a-15', etichetta: 'Azienda 6-15 dipendenti (+FIS)' },
  { valore: 'oltre-15', etichetta: 'Azienda oltre 15 dipendenti (+FIS e CIGS)' },
]

/** «E se fossi dipendente?» — netto annuo da una RAL digitata (scenario offerta),
 *  con le regole vigenti: detrazioni art. 13, cuneo L. 207/2024, trattamento
 *  integrativo, contributi, addizionali; TFR e Fon.Te esposti come maturato a parte. */
export function ConfrontoDipendente({
  anno,
  nettoRealeForfettarioCents,
  regionePredefinita,
}: {
  anno: number
  nettoRealeForfettarioCents: number
  regionePredefinita: EntitaRegionale | undefined
}) {
  const [aperto, setAperto] = useState(false)
  const [ral, setRal] = useState('')
  const [dimensione, setDimensione] = useState<'' | DimensioneAzienda>('')
  const [fonTe, setFonTe] = useState(true)
  const [regione, setRegione] = useState<EntitaRegionale | ''>(regionePredefinita ?? '')
  const [regionale, setRegionale] = useState('1,23')
  const [comunale, setComunale] = useState('0')
  const [soglia, setSoglia] = useState('')

  const params = paramsVicini(anno)
  const limiti = params.irpef.addizionali.valore

  const ralCents = ral.trim() === '' ? null : parseImportoIt(ral)
  const sogliaVuota = soglia.trim() === ''
  const sogliaCents = sogliaVuota ? null : parseImportoIt(soglia)
  const rateRegionale = parsePercentoIt(regionale)
  const rateComunale = comunale.trim() === '' ? 0 : parsePercentoIt(comunale)

  const errori: string[] = []
  if (ral.trim() !== '' && ralCents === null) errori.push('RAL: importo non valido (formato 1.234,56).')
  if (!sogliaVuota && sogliaCents === null) errori.push('Soglia di esenzione: importo non valido.')
  if (regione === '') {
    if (rateRegionale === null) errori.push('Addizionale regionale: percentuale non valida (es. 1,23).')
    else if (rateRegionale > limiti.regionaleMax)
      errori.push(`Addizionale regionale oltre il massimo di legge (${formatPercento(limiti.regionaleMax)}).`)
  }
  if (rateComunale === null) errori.push('Addizionale comunale: percentuale non valida (es. 0,80).')
  else if (rateComunale > limiti.comunaleMax)
    errori.push(`Addizionale comunale oltre il massimo di legge (${formatPercento(limiti.comunaleMax)}).`)

  const risultato: RisultatoDipendente | null =
    errori.length > 0 || ralCents === null
      ? null
      : computeDipendente(
          {
            ralCents,
            dimensioneAzienda: dimensione === '' ? null : dimensione,
            fondoPensione: fonTe,
            addizionaleRegionale: rateRegionale ?? 0,
            addizionaleComunale: rateComunale ?? 0,
            sogliaEsenzioneComunaleCents: sogliaCents,
            ...(regione !== '' ? { regione } : {}),
          },
          params,
        )

  const esenti = risultato ? risultato.sommaIntegrativaCents + risultato.trattamentoIntegrativoCents : 0
  const delta = risultato ? risultato.nettoCents - nettoRealeForfettarioCents : 0

  return (
    <section className="rounded-xl border border-indigo-200/70 bg-white shadow-sm dark:border-indigo-900/70 dark:bg-stone-900">
      <button
        type="button"
        onClick={() => setAperto((a) => !a)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold"
        aria-expanded={aperto}
      >
        <span>E se fossi dipendente? Netto da una RAL</span>
        <span aria-hidden="true">{aperto ? '▴' : '▾'}</span>
      </button>

      {aperto && (
        <div className="space-y-4 border-t border-stone-200 p-4 dark:border-stone-800">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              RAL — retribuzione annua lorda (€)
              <input value={ral} onChange={(e) => setRal(e.target.value)} placeholder="es. 35.000" className={campo} />
              <span className="mt-1 block text-xs text-stone-500">
                Lo scenario vero: la RAL di un'offerta. Il fatturato non è una RAL.
              </span>
            </label>
            <label className="text-sm">
              Contributi in busta
              <select
                value={dimensione}
                onChange={(e) => setDimensione(DIMENSIONI.find((d) => d.valore === e.target.value)?.valore ?? '')}
                className={campo}
              >
                {DIMENSIONI.map((d) => (
                  <option key={d.valore} value={d.valore}>
                    {d.etichetta}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Regione o provincia autonoma (residenza al 1º gennaio)
              <select
                value={regione}
                onChange={(e) => setRegione(ENTITA_REGIONALI.find((x) => x.id === e.target.value)?.id ?? '')}
                className={campo}
              >
                <option value="">— inserisco l'aliquota a mano —</option>
                {ENTITA_REGIONALI.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nome}
                  </option>
                ))}
              </select>
            </label>
            {regione === '' && (
              <label className="text-sm">
                Addizionale regionale (%)
                <input value={regionale} onChange={(e) => setRegionale(e.target.value)} className={campo} />
              </label>
            )}
            <label className="text-sm">
              Addizionale comunale (%)
              <input value={comunale} onChange={(e) => setComunale(e.target.value)} className={campo} />
            </label>
            <label className="text-sm">
              Soglia di esenzione comunale (€, se il comune la prevede)
              <input value={soglia} onChange={(e) => setSoglia(e.target.value)} placeholder="nessuna" className={campo} />
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" checked={fonTe} onChange={(e) => setFonTe(e.target.checked)} />
              Aderisco a Fon.Te (CCNL Commercio): 0,55% dedotto, 1,55% dal datore, TFR al fondo
            </label>
          </div>

          {errori.length > 0 && (
            <ul className="space-y-1 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {errori.map((errore) => (
                <li key={errore}>{errore}</li>
              ))}
            </ul>
          )}

          {risultato && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-stone-100 dark:border-stone-800/50">
                      <td className="py-1.5">Contributi INPS in busta{risultato.contributoFondoLavoratoreCents > 0 && <> + Fon.Te {formatEuro(risultato.contributoFondoLavoratoreCents)}</>}</td>
                      <td className="py-1.5 text-right tabular-nums">
                        {formatEuro(risultato.contributiCents + risultato.contributoFondoLavoratoreCents)}
                      </td>
                    </tr>
                    <tr className="border-b border-stone-100 dark:border-stone-800/50">
                      <td className="py-1.5">
                        IRPEF netta
                        <span className="block text-xs text-stone-500">
                          lorda {formatEuro(risultato.irpefLordaCents)} − detrazione lavoro {formatEuro(risultato.detrazioneLavoroCents)}
                          {risultato.ulterioreDetrazioneCents > 0 && <> − taglio del cuneo {formatEuro(risultato.ulterioreDetrazioneCents)}</>}
                        </span>
                      </td>
                      <td className="py-1.5 text-right tabular-nums">{formatEuro(risultato.irpefNettaCents)}</td>
                    </tr>
                    {esenti > 0 && (
                      <tr className="border-b border-stone-100 dark:border-stone-800/50">
                        <td className="py-1.5">
                          Somme esenti in busta
                          <span className="block text-xs text-stone-500">
                            {risultato.sommaIntegrativaCents > 0 && <>cuneo {formatEuro(risultato.sommaIntegrativaCents)}</>}
                            {risultato.sommaIntegrativaCents > 0 && risultato.trattamentoIntegrativoCents > 0 && ' + '}
                            {risultato.trattamentoIntegrativoCents > 0 && <>trattamento integrativo {formatEuro(risultato.trattamentoIntegrativoCents)}</>}
                          </span>
                        </td>
                        <td className="py-1.5 text-right tabular-nums">+{formatEuro(esenti)}</td>
                      </tr>
                    )}
                    <tr className="border-b border-stone-100 dark:border-stone-800/50">
                      <td className="py-1.5">Addizionali regionale e comunale</td>
                      <td className="py-1.5 text-right tabular-nums">
                        {formatEuro(risultato.addizionaleRegionaleCents + risultato.addizionaleComunaleCents)}
                      </td>
                    </tr>
                    <tr className="font-semibold">
                      <td className="py-1.5">Netto annuo da dipendente</td>
                      <td className="py-1.5 text-right tabular-nums">{formatEuro(risultato.nettoCents)}</td>
                    </tr>
                    <tr className="text-stone-500">
                      <td className="py-1.5">
                        Matura a parte: TFR {formatEuro(risultato.tfrCents)}
                        {risultato.contributoFondoDatoreCents > 0 && <> {fonTe ? '(al fondo)' : ''} + Fon.Te del datore {formatEuro(risultato.contributoFondoDatoreCents)}</>}
                      </td>
                      <td className="py-1.5 text-right tabular-nums">
                        +{formatEuro(risultato.tfrCents + risultato.contributoFondoDatoreCents)}
                      </td>
                    </tr>
                    <tr className="text-stone-500">
                      <td className="py-1.5">Netto reale del tuo scenario forfettario</td>
                      <td className="py-1.5 text-right tabular-nums">{formatEuro(nettoRealeForfettarioCents)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  delta <= 0
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                    : 'bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                }`}
              >
                {delta < 0 && (
                  <>Con questa RAL, in busta ti resterebbero {formatEuro(-delta)} in meno all'anno del tuo forfettario — ma TFR e fondo pensione maturano a parte, e ferie/malattia/NASpI non hanno prezzo qui.</>
                )}
                {delta > 0 && (
                  <>Con questa RAL, in busta ti resterebbero {formatEuro(delta)} in più all'anno del tuo forfettario — più TFR e fondo pensione che maturano a parte.</>
                )}
                {delta === 0 && <>Con questa RAL, il netto in busta pareggia il tuo forfettario — e TFR e fondo maturano a parte.</>}
              </p>
            </>
          )}

          <p className="text-xs text-stone-500 dark:text-stone-400">
            Ipotesi dichiarate: impiegato privato a tempo indeterminato, anno intero, nessun
            carico di famiglia; tredicesima/quattordicesima dentro la RAL (l'IRPEF è annuale);
            TFR e Fon.Te sono retribuzione differita, non in busta; le detassazioni 2026 su
            straordinari/premi non sono modellate. Regole e fonti in regole-fiscali.md.
          </p>
        </div>
      )}
    </section>
  )
}
