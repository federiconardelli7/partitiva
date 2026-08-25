import {
  computeOrdinario,
  ENTITA_REGIONALI,
  type EntitaRegionale,
  type FigliACarico,
  type GestioneInput,
  type RisultatoAnno,
  type RisultatoOrdinario,
} from '@partitiva/motore-fiscale'
import { useState } from 'react'
import type { Spesa } from '../db'
import { paramsVicini, spesePerAnno } from '../lib/bilancio'
import { formatEuro, formatPercento, parseImportoIt, parsePercentoIt } from '../lib/format'

const campo = 'mt-1 w-full rounded-md border border-bordo-campo bg-sfondo px-3 py-2 sm:mt-0 sm:self-start'

const FIGLI: { valore: FigliACarico; etichetta: string }[] = [
  { valore: 'nessuno', etichetta: 'Nessuno' },
  { valore: 'uno', etichetta: 'Uno' },
  { valore: 'due', etichetta: 'Due' },
  { valore: 'oltreODisabilita', etichetta: 'Più di due, o almeno uno con disabilità' },
]

/** «E se uscissi dal forfettario?» — confronto A REGIME e di competenza con l'ordinario:
 *  stesse regole del motore (computeOrdinario), costi reali = spese registrate + extra. */
export function ConfrontoOrdinario({
  anno,
  incassatoCents,
  copertura,
  gestione,
  spese,
  forfettario,
  regionePredefinita,
  aperto,
  onToggle,
}: {
  anno: number
  incassatoCents: number
  copertura: 'piena' | 'ridotta'
  gestione: GestioneInput | undefined
  spese: Spesa[]
  forfettario: RisultatoAnno
  regionePredefinita: EntitaRegionale | undefined
  aperto: boolean
  onToggle: () => void
}) {
  const [altriCosti, setAltriCosti] = useState('')
  const [oneri, setOneri] = useState('')
  const [figli, setFigli] = useState<FigliACarico>('nessuno')
  // '' = aliquota a mano; altrimenti la struttura ufficiale MEF dell'entità scelta.
  const [regione, setRegione] = useState<EntitaRegionale | ''>(regionePredefinita ?? '')
  const [regionale, setRegionale] = useState('1,23')
  const [comunale, setComunale] = useState('0')
  const [soglia, setSoglia] = useState('')

  const params = paramsVicini(anno)
  const limiti = params.irpef.addizionali.valore
  const speseAnnoCents = spesePerAnno(spese, anno)

  const altriCostiCents = altriCosti.trim() === '' ? 0 : parseImportoIt(altriCosti)
  const oneriCents = oneri.trim() === '' ? 0 : parseImportoIt(oneri)
  const sogliaVuota = soglia.trim() === ''
  const sogliaCents = sogliaVuota ? null : parseImportoIt(soglia)
  const rateRegionale = parsePercentoIt(regionale)
  const rateComunale = comunale.trim() === '' ? 0 : parsePercentoIt(comunale)

  const errori: string[] = []
  if (altriCostiCents === null) errori.push('Altri costi: importo non valido (formato 1.234,56).')
  if (oneriCents === null) errori.push('Oneri detraibili: importo non valido (formato 1.234,56).')
  if (!sogliaVuota && sogliaCents === null) errori.push('Soglia di esenzione: importo non valido.')
  if (regione === '') {
    if (rateRegionale === null) {
      errori.push('Addizionale regionale: percentuale non valida (es. 1,23).')
    } else if (rateRegionale > limiti.regionaleMax) {
      errori.push(`Addizionale regionale oltre il massimo di legge (${formatPercento(limiti.regionaleMax)}).`)
    }
  }
  if (rateComunale === null) {
    errori.push('Addizionale comunale: percentuale non valida (es. 0,80).')
  } else if (rateComunale > limiti.comunaleMax) {
    errori.push(
      `Addizionale comunale oltre il massimo di legge (${formatPercento(limiti.comunaleMax)}, incluso l'extra di Roma Capitale).`,
    )
  }

  // computeOrdinario è aritmetica pura in centesimi: si ricalcola a ogni render, niente memo.
  const risultato: RisultatoOrdinario | null =
    errori.length > 0
      ? null
      : computeOrdinario(
          {
            incassatoCents,
            costiCents: speseAnnoCents + (altriCostiCents ?? 0),
            oneri19Cents: oneriCents ?? 0,
            figli,
            addizionaleRegionale: rateRegionale ?? 0,
            addizionaleComunale: rateComunale ?? 0,
            sogliaEsenzioneComunaleCents: sogliaCents,
            copertura,
            ...(gestione ? { gestione } : {}),
            ...(regione !== '' ? { regione } : {}),
          },
          params,
        )

  const forfettarioCents = forfettario.contributiDovutiCents + forfettario.impostaCents
  const delta = risultato ? risultato.totaleCents - forfettarioCents : 0
  // Il netto che resterebbe passando: incassato − costi − totale (doctrine S17); il duello
  // parla in NETTO (feedback S27: «se non fossi più forfettario, cosa mi resta?»).
  const nettoOrdinarioCents = risultato
    ? incassatoCents - (speseAnnoCents + (altriCostiCents ?? 0)) - risultato.totaleCents
    : 0

  return (
    <section className="rounded-xl border border-sim-bordo bg-superficie">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold"
        aria-expanded={aperto}
      >
        <span>E se uscissi dal forfettario? Confronto con l'ordinario</span>
        <span aria-hidden="true">{aperto ? '▴' : '▾'}</span>
      </button>

      {aperto && (
        <div className="space-y-4 border-t border-bordo-sottile p-4">
          <div className="grid gap-x-3 gap-y-1 sm:grid-cols-2">
            <div className="pb-3 text-sm sm:row-span-3 sm:grid sm:grid-rows-subgrid">
              Costi reali dell'anno
              <div className={`${campo} bg-rail tabular-nums`}>
                {formatEuro(speseAnnoCents)} dal registro spese
              </div>
              <span className="mt-1 block text-xs text-testo-secondario">
                In ordinario i costi si deducono davvero: qui partono dalle spese che registri già.
              </span>
            </div>
            <label className="pb-3 text-sm sm:row-span-3 sm:grid sm:grid-rows-subgrid">
              Altri costi (€/anno)
              <input value={altriCosti} onChange={(e) => setAltriCosti(e.target.value)} placeholder="0" className={campo} />
              <span className="mt-1 block text-xs text-testo-secondario">
                Quello che non registri: ammortamenti, quote, costi che oggi non tracci.
              </span>
            </label>
            <label className="pb-3 text-sm sm:row-span-3 sm:grid sm:grid-rows-subgrid">
              Oneri detraibili al 19% (€/anno)
              <input value={oneri} onChange={(e) => setOneri(e.target.value)} placeholder="0" className={campo} />
              <span className="mt-1 block text-xs text-testo-secondario">
                Esclusi sanitarie e interessi sui mutui: per legge restano fuori da tetto e degressione.
              </span>
            </label>
            <label className="pb-3 text-sm sm:row-span-3 sm:grid sm:grid-rows-subgrid">
              Figli a carico (per il tetto oneri)
              <select value={figli} onChange={(e) => setFigli(e.target.value as FigliACarico)} className={campo}>
                {FIGLI.map((f) => (
                  <option key={f.valore} value={f.valore}>
                    {f.etichetta}
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
              <span className="mt-1 block text-xs text-testo-secondario">
                {regione !== ''
                  ? 'Struttura ufficiale MEF applicata (scaglioni, esenzioni e soglie della tua regione; eventuali detrazioni per figli non considerate).'
                  : 'Scegli la regione per l’addizionale automatica, o inserisci l’aliquota qui sotto.'}
              </span>
            </label>
            {regione === '' && (
              <label className="pb-3 text-sm sm:row-span-3 sm:grid sm:grid-rows-subgrid">
                Addizionale regionale (%)
                <input value={regionale} onChange={(e) => setRegionale(e.target.value)} className={campo} />
                <span className="mt-1 block text-xs text-testo-secondario">Base di legge 1,23: verifica l'aliquota della tua regione.</span>
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
              {risultato.flags.length > 0 && (
                <ul className="space-y-1 rounded-lg border border-avviso-bordo bg-avviso-fondo p-3 text-xs text-avviso-testo">
                  {risultato.flags.map((flag) => (
                    <li key={flag.codice}>⚠️ {flag.messaggio}</li>
                  ))}
                </ul>
              )}
              <div className="grid gap-x-3 gap-y-1 sm:grid-cols-2">
                <div className={`rounded-xl border bg-sfondo p-3 ${delta >= 0 ? 'border-bordo' : 'border-bordo-sottile'}`}>
                  <div className="text-[10px] uppercase tracking-wide text-testo-secondario">
                    Netto col forfettario (oggi)
                  </div>
                  <div className={`mt-0.5 text-[19px] font-bold tracking-tight tabular-nums ${delta >= 0 ? '' : 'text-testo-secondario'}`}>
                    {formatEuro(forfettario.nettoRealeCents)}
                  </div>
                </div>
                <div className={`rounded-xl border bg-sfondo p-3 ${delta < 0 ? 'border-bordo' : 'border-bordo-sottile'}`}>
                  <div className="text-[10px] uppercase tracking-wide text-testo-secondario">
                    Netto se passassi all'ordinario
                  </div>
                  <div className={`mt-0.5 text-[19px] font-bold tracking-tight tabular-nums ${delta < 0 ? '' : 'text-testo-secondario'}`}>
                    {formatEuro(nettoOrdinarioCents)}
                  </div>
                </div>
              </div>
              <p
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                  delta >= 0
                    ? 'border-esito-ok-bordo bg-esito-ok-fondo text-esito-ok-testo'
                    : 'border-avviso-bordo bg-avviso-fondo text-avviso-testo'
                }`}
              >
                {delta > 0 && <>Restare nel forfettario conviene: l'ordinario costerebbe {formatEuro(delta)} in più all'anno.</>}
                {delta < 0 && <>Con questi numeri l'ordinario costerebbe {formatEuro(-delta)} in meno all'anno: parlane col commercialista.</>}
                {delta === 0 && <>Con questi numeri i due regimi si equivalgono.</>}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-rail">
                      <td className="py-1.5">Reddito effettivo (incassato − costi)</td>
                      <td className="py-1.5 text-right tabular-nums">{formatEuro(risultato.redditoCents)}</td>
                    </tr>
                    <tr className="border-b border-rail">
                      <td className="py-1.5">Contributi dovuti (stessa gestione, su base effettiva)</td>
                      <td className="py-1.5 text-right tabular-nums">{formatEuro(risultato.contributiDovutiCents)}</td>
                    </tr>
                    <tr className="border-b border-rail">
                      <td className="py-1.5">
                        IRPEF netta
                        <span className="block text-xs text-testo-secondario">
                          lorda {formatEuro(risultato.irpefLordaCents)} − detrazione lavoro autonomo{' '}
                          {formatEuro(risultato.detrazioneLavoroAutonomoCents)}
                          {risultato.detrazioneOneriCents > 0 && <> − oneri {formatEuro(risultato.detrazioneOneriCents)}</>}
                        </span>
                      </td>
                      <td className="py-1.5 text-right tabular-nums">{formatEuro(risultato.irpefNettaCents)}</td>
                    </tr>
                    <tr className="border-b border-rail">
                      <td className="py-1.5">Addizionali regionale e comunale</td>
                      <td className="py-1.5 text-right tabular-nums">
                        {formatEuro(risultato.addizionaleRegionaleCents + risultato.addizionaleComunaleCents)}
                      </td>
                    </tr>
                    <tr className="font-semibold">
                      <td className="py-1.5">Totale ordinario</td>
                      <td className="py-1.5 text-right tabular-nums">{formatEuro(risultato.totaleCents)}</td>
                    </tr>
                    <tr className="border-t border-rail">
                      <td className="py-1.5">Netto in ordinario (incassato − costi − totale)</td>
                      <td className="py-1.5 text-right tabular-nums">{formatEuro(nettoOrdinarioCents)}</td>
                    </tr>
                    <tr className="text-testo-secondario">
                      <td className="py-1.5">Totale forfettario (contributi + imposta dello scenario)</td>
                      <td className="py-1.5 text-right tabular-nums">{formatEuro(forfettarioCents)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}

          <p className="text-xs text-testo-secondario">
            Confronto <strong>a regime</strong> e di competenza: contributi dovuti come deduzione
            (non i versati per cassa), aliquote delle addizionali del tuo ente in input, IVA
            neutra sui clienti B2B, niente IRAP per le persone fisiche. Le regole e le fonti sono
            in regole-fiscali.md; per la decisione vera c'è il commercialista.
          </p>
        </div>
      )}
    </section>
  )
}
