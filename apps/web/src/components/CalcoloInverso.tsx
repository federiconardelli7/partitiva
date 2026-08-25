import {
  cents,
  computeAnno,
  computeDipendente,
  computeOrdinario,
  ENTITA_REGIONALI,
  invertiNetto,
  type Cents,
  type DimensioneAzienda,
  type EntitaRegionale,
  type GestioneInput,
} from '@partitiva/motore-fiscale'
import { useMemo, useState } from 'react'
import type { Spesa } from '../db'
import { paramsVicini, spesePerAnno } from '../lib/bilancio'
import { formatEuro, formatEuroIntero, formatPercento, parseImportoIt, parsePercentoIt } from '../lib/format'

const campo =
  'mt-1 w-full rounded-md border border-stone-300 px-3 py-2 dark:border-stone-700 dark:bg-stone-800'

const DIMENSIONI: { valore: '' | DimensioneAzienda; etichetta: string }[] = [
  { valore: '', etichetta: 'Solo IVS 9,19% (come i calcolatori standard)' },
  { valore: 'fino-a-5', etichetta: 'Azienda fino a 5 dipendenti (+FIS)' },
  { valore: 'da-6-a-15', etichetta: 'Azienda 6-15 dipendenti (+FIS)' },
  { valore: 'oltre-15', etichetta: 'Azienda oltre 15 dipendenti (+FIS e CIGS)' },
]

/** Limite di ricerca per ordinario e RAL (2.000.000 €): ben oltre ogni obiettivo sensato,
 *  e ben dentro il range dell'aritmetica intera esatta di mulRate. */
const MASSIMO_RICERCA_CENTS = 200_000_000

/** «Che fatturato per X € netti?» — calcolo inverso sui tre regimi: dal netto annuo
 *  desiderato al lordo necessario (fatturato forfettario, fatturato in ordinario, RAL),
 *  per scansione delle catene forward (invertiNetto, risposta in euro interi). Dove il
 *  netto RICADE sotto l'obiettivo (scalini di legge) espone anche il lordo stabile. */
export function CalcoloInverso({
  anno,
  coefficiente,
  startup,
  copertura,
  gestione,
  versatiCents,
  spese,
  regionePredefinita,
  aperto,
  onToggle,
}: {
  anno: number
  coefficiente: number
  startup: boolean
  copertura: 'piena' | 'ridotta'
  gestione: GestioneInput | undefined
  versatiCents: number
  spese: Spesa[]
  regionePredefinita: EntitaRegionale | undefined
  aperto: boolean
  onToggle: () => void
}) {
  const [netto, setNetto] = useState('')
  const [altriCosti, setAltriCosti] = useState('')
  const [dimensione, setDimensione] = useState<'' | DimensioneAzienda>('')
  const [fonTe, setFonTe] = useState(true)
  const [regione, setRegione] = useState<EntitaRegionale | ''>(regionePredefinita ?? '')
  const [regionale, setRegionale] = useState('1,23')
  const [comunale, setComunale] = useState('0')
  const [soglia, setSoglia] = useState('')

  const limiti = paramsVicini(anno).irpef.addizionali.valore
  const speseAnnoCents = spesePerAnno(spese, anno)

  const targetCents = netto.trim() === '' ? null : parseImportoIt(netto)
  const altriCostiCents = altriCosti.trim() === '' ? 0 : parseImportoIt(altriCosti)
  const sogliaVuota = soglia.trim() === ''
  const sogliaCents = sogliaVuota ? null : parseImportoIt(soglia)
  const rateRegionale = parsePercentoIt(regionale)
  const rateComunale = comunale.trim() === '' ? 0 : parsePercentoIt(comunale)

  const errori: string[] = []
  if (netto.trim() !== '' && targetCents === null) errori.push('Netto desiderato: importo non valido (formato 1.234,56).')
  if (altriCostiCents === null) errori.push('Altri costi: importo non valido (formato 1.234,56).')
  if (!sogliaVuota && sogliaCents === null) errori.push('Soglia di esenzione: importo non valido.')
  if (regione === '') {
    if (rateRegionale === null) errori.push('Addizionale regionale: percentuale non valida (es. 1,23).')
    else if (rateRegionale > limiti.regionaleMax)
      errori.push(`Addizionale regionale oltre il massimo di legge (${formatPercento(limiti.regionaleMax)}).`)
  }
  if (rateComunale === null) errori.push('Addizionale comunale: percentuale non valida (es. 0,80).')
  else if (rateComunale > limiti.comunaleMax)
    errori.push(`Addizionale comunale oltre il massimo di legge (${formatPercento(limiti.comunaleMax)}).`)

  const costiCents = speseAnnoCents + (altriCostiCents ?? 0)
  const pronto = aperto && errori.length === 0 && targetCents !== null && targetCents > 0
  // La gestione arriva come oggetto ricreato a ogni render del Simulatore: la chiave
  // serializzata evita di rifare le tre scansioni (decine di migliaia di computazioni,
  // comunque pochi ms) quando non è cambiato niente.
  const gestioneKey = JSON.stringify(gestione ?? null)

  const inversi = useMemo(() => {
    if (!pronto) return null
    const params = paramsVicini(anno)
    const nettoForfettario = (lordo: Cents): Cents =>
      computeAnno(
        {
          anno,
          incassatoCents: lordo,
          coefficiente,
          startup,
          copertura,
          ...(gestione ? { gestione } : {}),
          versatiContributiCents: versatiCents,
          speseCents: costiCents,
        },
        params,
      ).nettoRealeCents
    const nettoOrdinario = (lordo: Cents): Cents => {
      const r = computeOrdinario(
        {
          incassatoCents: lordo,
          costiCents,
          oneri19Cents: 0,
          figli: 'nessuno',
          addizionaleRegionale: rateRegionale ?? 0,
          addizionaleComunale: rateComunale ?? 0,
          sogliaEsenzioneComunaleCents: sogliaCents,
          copertura,
          ...(gestione ? { gestione } : {}),
          ...(regione !== '' ? { regione } : {}),
        },
        params,
      )
      return cents(lordo - costiCents - r.totaleCents)
    }
    const nettoDipendente = (lordo: Cents): Cents =>
      computeDipendente(
        {
          ralCents: lordo,
          dimensioneAzienda: dimensione === '' ? null : dimensione,
          fondoPensione: fonTe,
          addizionaleRegionale: rateRegionale ?? 0,
          addizionaleComunale: rateComunale ?? 0,
          sogliaEsenzioneComunaleCents: sogliaCents,
          ...(regione !== '' ? { regione } : {}),
        },
        params,
      ).nettoCents

    const massimoForfettario = params.soglie.uscitaAnnoSuccessivo.valore
    return {
      forfettario: invertiNetto(targetCents, nettoForfettario, { massimoCents: massimoForfettario }),
      nettoAlTettoCents: nettoForfettario(cents(massimoForfettario)),
      massimoForfettarioCents: massimoForfettario,
      ordinario: invertiNetto(targetCents, nettoOrdinario, { massimoCents: MASSIMO_RICERCA_CENTS }),
      dipendente: invertiNetto(targetCents, nettoDipendente, { massimoCents: MASSIMO_RICERCA_CENTS }),
    }
  }, [pronto, targetCents, anno, coefficiente, startup, copertura, gestioneKey, versatiCents, costiCents, regione, rateRegionale, rateComunale, sogliaCents, dimensione, fonTe])

  const notaRicaduta = (r: { lordoCents: Cents; lordoStabileCents?: Cents; nettoStabileCents?: Cents }) =>
    r.lordoStabileCents !== undefined &&
    r.nettoStabileCents !== undefined && (
      <span className="mt-1 block text-xs text-amber-700 dark:text-amber-300">
        ⚠️ Tra {formatEuro(r.lordoCents)} e {formatEuro(r.lordoStabileCents)} il netto può ricadere sotto
        l'obiettivo per gli scalini di legge (es. trattamento integrativo); da{' '}
        {formatEuro(r.lordoStabileCents)} torna stabilmente sopra ({formatEuro(r.nettoStabileCents)} verificato).
      </span>
    )

  return (
    <section className="rounded-xl border border-indigo-200/70 bg-white shadow-sm dark:border-indigo-900/70 dark:bg-stone-900">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold"
        aria-expanded={aperto}
      >
        <span>Che fatturato serve per il netto che vuoi? Calcolo inverso</span>
        <span aria-hidden="true">{aperto ? '▴' : '▾'}</span>
      </button>

      {aperto && (
        <div className="space-y-4 border-t border-stone-200 p-4 dark:border-stone-800">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Netto desiderato (€/anno)
              <input value={netto} onChange={(e) => setNetto(e.target.value)} placeholder="es. 30.000" className={campo} />
              <span className="mt-1 block text-xs text-stone-500">
                Quanto vuoi che ti resti in tasca in un anno: qui si va all'indietro, dal netto al lordo.
              </span>
            </label>
            <label className="text-sm">
              Altri costi (€/anno)
              <input value={altriCosti} onChange={(e) => setAltriCosti(e.target.value)} placeholder="0" className={campo} />
              <span className="mt-1 block text-xs text-stone-500">
                Coi {formatEuro(speseAnnoCents)} del registro spese pesano su entrambi i regimi d'impresa: in
                ordinario si deducono, nel forfettario escono comunque dal netto reale.
              </span>
            </label>
            <label className="text-sm">
              Contributi in busta (per la RAL)
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

          {inversi && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-stone-100 dark:border-stone-800/50">
                    <td className="py-1.5">
                      Fatturato necessario nel forfettario
                      {inversi.forfettario ? (
                        <span className="block text-xs text-stone-500">
                          netto reale verificato a quel fatturato: {formatEuro(inversi.forfettario.nettoCents)}
                        </span>
                      ) : (
                        <span className="block text-xs text-stone-500">
                          Non raggiungibile restando nel forfettario: al tetto di permanenza (
                          {formatEuroIntero(inversi.massimoForfettarioCents)}) il netto reale è{' '}
                          {formatEuro(inversi.nettoAlTettoCents)}.
                        </span>
                      )}
                      {inversi.forfettario && notaRicaduta(inversi.forfettario)}
                    </td>
                    <td className="py-1.5 text-right align-top tabular-nums">
                      {inversi.forfettario ? formatEuro(inversi.forfettario.lordoCents) : '—'}
                    </td>
                  </tr>
                  <tr className="border-b border-stone-100 dark:border-stone-800/50">
                    <td className="py-1.5">
                      Fatturato necessario in ordinario
                      {inversi.ordinario ? (
                        <span className="block text-xs text-stone-500">
                          netto verificato (incassato − costi − IRPEF, addizionali e contributi):{' '}
                          {formatEuro(inversi.ordinario.nettoCents)}
                        </span>
                      ) : (
                        <span className="block text-xs text-stone-500">
                          Oltre il limite di ricerca ({formatEuroIntero(MASSIMO_RICERCA_CENTS)}).
                        </span>
                      )}
                      {inversi.ordinario && notaRicaduta(inversi.ordinario)}
                    </td>
                    <td className="py-1.5 text-right align-top tabular-nums">
                      {inversi.ordinario ? formatEuro(inversi.ordinario.lordoCents) : '—'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5">
                      RAL necessaria da dipendente
                      {inversi.dipendente ? (
                        <span className="block text-xs text-stone-500">
                          netto in busta verificato a quella RAL: {formatEuro(inversi.dipendente.nettoCents)} — TFR e
                          Fon.Te maturano a parte
                        </span>
                      ) : (
                        <span className="block text-xs text-stone-500">
                          Oltre il limite di ricerca ({formatEuroIntero(MASSIMO_RICERCA_CENTS)}).
                        </span>
                      )}
                      {inversi.dipendente && notaRicaduta(inversi.dipendente)}
                    </td>
                    <td className="py-1.5 text-right align-top tabular-nums">
                      {inversi.dipendente ? formatEuro(inversi.dipendente.lordoCents) : '—'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <p className="text-xs text-stone-500 dark:text-stone-400">
            Il lordo è cercato all'euro intero sulle stesse catene del Simulatore (griglia da 50 €:
            ricadute più strette possono sfuggire) e il netto mostrato è sempre ricalcolato al lordo
            proposto. Ipotesi dichiarate: contributi deducibili dello scenario forfettario fissi (
            {formatEuro(versatiCents)}, dipendono dall'anno precedente); in ordinario oneri detraibili e
            carichi di famiglia a zero (raffinali in «E se uscissi dal forfettario?»); da dipendente
            valgono le ipotesi di «E se fossi dipendente?». Regole e fonti in regole-fiscali.md.
          </p>
        </div>
      )}
    </section>
  )
}
