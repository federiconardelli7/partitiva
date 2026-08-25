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

const campo = 'mt-1 w-full rounded-md border border-bordo-campo bg-sfondo px-3 py-2 sm:mt-0 sm:self-start'

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
  aperto,
  onToggle,
  ral,
  onRalChange,
}: {
  anno: number
  nettoRealeForfettarioCents: number
  regionePredefinita: EntitaRegionale | undefined
  aperto: boolean
  onToggle: () => void
  /** La RAL vive nel Simulatore (spec §4): alimenta anche il verdetto del Quadro. */
  ral: string
  onRalChange: (valore: string) => void
}) {
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
    <section className="rounded-xl border border-sim-bordo bg-superficie">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold"
        aria-expanded={aperto}
      >
        <span>E se fossi dipendente? Netto da una RAL</span>
        <span aria-hidden="true">{aperto ? '▴' : '▾'}</span>
      </button>

      {aperto && (
        <div className="space-y-4 border-t border-bordo-sottile p-4">
          <div className="grid gap-x-3 gap-y-1 sm:grid-cols-2">
            <label className="pb-3 text-sm sm:row-span-3 sm:grid sm:grid-rows-subgrid">
              RAL — retribuzione annua lorda (€)
              <input value={ral} onChange={(e) => onRalChange(e.target.value)} placeholder="es. 35.000" className={campo} />
              <span className="mt-1 block text-xs text-testo-secondario">
                Lo scenario vero: la RAL di un'offerta. Il fatturato non è una RAL.
              </span>
            </label>
            <label className="pb-3 text-sm sm:row-span-3 sm:grid sm:grid-rows-subgrid">
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
            <label className="pb-3 text-sm sm:row-span-3 sm:grid sm:grid-rows-subgrid">
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
              <label className="pb-3 text-sm sm:row-span-3 sm:grid sm:grid-rows-subgrid">
                Addizionale regionale (%)
                <input value={regionale} onChange={(e) => setRegionale(e.target.value)} className={campo} />
              </label>
            )}
            <label className="pb-3 text-sm sm:row-span-3 sm:grid sm:grid-rows-subgrid">
              Addizionale comunale (%)
              <input value={comunale} onChange={(e) => setComunale(e.target.value)} className={campo} />
            </label>
            <label className="pb-3 text-sm sm:row-span-3 sm:grid sm:grid-rows-subgrid">
              Soglia di esenzione comunale (€, se il comune la prevede)
              <input value={soglia} onChange={(e) => setSoglia(e.target.value)} placeholder="nessuna" className={campo} />
            </label>
            <label className="flex items-center gap-2 pb-3 text-sm sm:col-span-2">
              <input type="checkbox" checked={fonTe} onChange={(e) => setFonTe(e.target.checked)} />
              Aderisco a Fon.Te (CCNL Commercio): 0,55% dedotto, 1,55% dal datore, TFR al fondo
            </label>
          </div>

          {errori.length > 0 && (
            <ul className="space-y-1 rounded-lg border border-errore-solido p-3 text-sm text-errore">
              {errori.map((errore) => (
                <li key={errore}>{errore}</li>
              ))}
            </ul>
          )}

          {risultato && (
            <>
              <div className="grid gap-x-3 gap-y-1 sm:grid-cols-2">
                <div className={`rounded-xl border bg-sfondo p-3 ${delta > 0 ? 'border-bordo' : 'border-bordo-sottile'}`}>
                  <div className="text-[10px] uppercase tracking-wide text-testo-secondario">Netto annuo da dipendente</div>
                  <div className={`mt-0.5 text-[19px] font-bold tracking-tight tabular-nums ${delta > 0 ? '' : 'text-testo-secondario'}`}>
                    {formatEuro(risultato.nettoCents)}
                  </div>
                </div>
                <div className={`rounded-xl border bg-sfondo p-3 ${delta <= 0 ? 'border-bordo' : 'border-bordo-sottile'}`}>
                  <div className="text-[10px] uppercase tracking-wide text-testo-secondario">
                    Netto reale del tuo forfettario
                  </div>
                  <div className={`mt-0.5 text-[19px] font-bold tracking-tight tabular-nums ${delta <= 0 ? '' : 'text-testo-secondario'}`}>
                    {formatEuro(nettoRealeForfettarioCents)}
                  </div>
                </div>
              </div>
              <p
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                  delta <= 0
                    ? 'border-esito-ok-bordo bg-esito-ok-fondo text-esito-ok-testo'
                    : 'border-avviso-bordo bg-avviso-fondo text-avviso-testo'
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
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-rail">
                      <td className="py-1.5">Contributi INPS in busta{risultato.contributoFondoLavoratoreCents > 0 && <> + Fon.Te {formatEuro(risultato.contributoFondoLavoratoreCents)}</>}</td>
                      <td className="py-1.5 text-right tabular-nums">
                        {formatEuro(risultato.contributiCents + risultato.contributoFondoLavoratoreCents)}
                      </td>
                    </tr>
                    <tr className="border-b border-rail">
                      <td className="py-1.5">
                        IRPEF netta
                        <span className="block text-xs text-testo-secondario">
                          lorda {formatEuro(risultato.irpefLordaCents)} − detrazione lavoro {formatEuro(risultato.detrazioneLavoroCents)}
                          {risultato.ulterioreDetrazioneCents > 0 && <> − taglio del cuneo {formatEuro(risultato.ulterioreDetrazioneCents)}</>}
                        </span>
                      </td>
                      <td className="py-1.5 text-right tabular-nums">{formatEuro(risultato.irpefNettaCents)}</td>
                    </tr>
                    {esenti > 0 && (
                      <tr className="border-b border-rail">
                        <td className="py-1.5">
                          Somme esenti in busta
                          <span className="block text-xs text-testo-secondario">
                            {risultato.sommaIntegrativaCents > 0 && <>cuneo {formatEuro(risultato.sommaIntegrativaCents)}</>}
                            {risultato.sommaIntegrativaCents > 0 && risultato.trattamentoIntegrativoCents > 0 && ' + '}
                            {risultato.trattamentoIntegrativoCents > 0 && <>trattamento integrativo {formatEuro(risultato.trattamentoIntegrativoCents)}</>}
                          </span>
                        </td>
                        <td className="py-1.5 text-right tabular-nums">+{formatEuro(esenti)}</td>
                      </tr>
                    )}
                    <tr className="border-b border-rail">
                      <td className="py-1.5">Addizionali regionale e comunale</td>
                      <td className="py-1.5 text-right tabular-nums">
                        {formatEuro(risultato.addizionaleRegionaleCents + risultato.addizionaleComunaleCents)}
                      </td>
                    </tr>
                    <tr className="font-semibold">
                      <td className="py-1.5">Netto annuo da dipendente</td>
                      <td className="py-1.5 text-right tabular-nums">{formatEuro(risultato.nettoCents)}</td>
                    </tr>
                    <tr className="text-testo-secondario">
                      <td className="py-1.5">
                        Matura a parte: TFR {formatEuro(risultato.tfrCents)}
                        {risultato.contributoFondoDatoreCents > 0 && <> {fonTe ? '(al fondo)' : ''} + Fon.Te del datore {formatEuro(risultato.contributoFondoDatoreCents)}</>}
                      </td>
                      <td className="py-1.5 text-right tabular-nums">
                        +{formatEuro(risultato.tfrCents + risultato.contributoFondoDatoreCents)}
                      </td>
                    </tr>
                    <tr className="text-testo-secondario">
                      <td className="py-1.5">Netto reale del tuo scenario forfettario</td>
                      <td className="py-1.5 text-right tabular-nums">{formatEuro(nettoRealeForfettarioCents)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}

          <p className="text-xs text-testo-secondario">
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
