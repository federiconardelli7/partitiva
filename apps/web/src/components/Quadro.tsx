import { computeDipendente, computeOrdinario, type GestioneInput, type RisultatoAnno } from '@partitiva/motore-fiscale'
import type { Spesa } from '../db'
import { paramsVicini, spesePerAnno } from '../lib/bilancio'
import { formatEuro, formatEuroIntero, formatPercento } from '../lib/format'

export type SezioneConfronto = 'ordinario' | 'dipendente' | 'inverso'

/** Il Quadro (glossario): il pannello dei risultati del Simulatore. Sticky a destra su
 *  desktop, dentro la SheetRisultati su mobile. Con risultato null resta montato coi
 *  valori a «—» (spec §4: niente salti di layout). */
export function Quadro({
  anno,
  incassatoCents,
  risultato,
  copertura,
  gestione,
  spese,
  ralCents,
  onApriSezione,
}: {
  anno: number
  incassatoCents: number | null
  risultato: RisultatoAnno | null
  copertura: 'piena' | 'ridotta'
  gestione: GestioneInput | undefined
  spese: Spesa[]
  /** RAL liftata dalla sezione dipendente (null = non impostata: la voce resta una CTA). */
  ralCents: number | null
  onApriSezione: (sezione: SezioneConfronto) => void
}) {
  const soglie = paramsVicini(anno).soglie
  const soglia85 = soglie.uscitaAnnoSuccessivo.valore
  const soglia100 = soglie.uscitaImmediata.valore

  // Il verdetto ordinario usa i DEFAULT della sezione (costi dal registro, aliquota base
  // 1,23%, comunale 0, oneri e figli a zero): stesso numero che si vede aprendola.
  const ordinario =
    risultato && incassatoCents !== null
      ? computeOrdinario(
          {
            incassatoCents,
            costiCents: spesePerAnno(spese, anno),
            oneri19Cents: 0,
            figli: 'nessuno',
            addizionaleRegionale: 0.0123,
            addizionaleComunale: 0,
            sogliaEsenzioneComunaleCents: null,
            copertura,
            ...(gestione ? { gestione } : {}),
          },
          paramsVicini(anno),
        )
      : null
  const forfettarioCents = risultato ? risultato.contributiDovutiCents + risultato.impostaCents : 0
  // In chiave NETTO (feedback S27): «se passassi all'ordinario, quanto ti resterebbe?»
  const deltaOrdinario =
    ordinario && risultato && incassatoCents !== null
      ? incassatoCents - spesePerAnno(spese, anno) - ordinario.totaleCents - risultato.nettoRealeCents
      : null

  // Come per l'ordinario: coi default della sezione (solo IVS, Fon.Te attivo, 1,23%/0).
  const dipendente =
    risultato && ralCents !== null && ralCents > 0
      ? computeDipendente(
          {
            ralCents,
            dimensioneAzienda: null,
            fondoPensione: true,
            addizionaleRegionale: 0.0123,
            addizionaleComunale: 0,
            sogliaEsenzioneComunaleCents: null,
          },
          paramsVicini(anno),
        )
      : null
  const deltaDipendente = dipendente && risultato ? dipendente.nettoCents - risultato.nettoRealeCents : null

  const pctIncassato =
    incassatoCents !== null && risultato ? Math.min((incassatoCents / soglia100) * 100, 100) : 0
  const pctSoglia85 = (soglia85 / soglia100) * 100

  const voceVerdetto = (
    sezione: SezioneConfronto,
    label: string,
    sub: string,
    valore?: string,
  ) => (
    <button
      type="button"
      onClick={() => onApriSezione(sezione)}
      className="flex w-full items-center gap-2 border-t border-rail py-2 text-left first:border-t-0"
    >
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-xs text-testo-secondario">{sub}</span>
      </span>
      {valore && <b className="text-sm tabular-nums">{valore}</b>}
      <span aria-hidden="true" className="text-testo-secondario">
        ›
      </span>
    </button>
  )

  return (
    <aside
      aria-label="Quadro dello scenario"
      className="rounded-2xl border border-sim-bordo bg-superficie p-4"
    >
      <h3 className="text-xs uppercase tracking-wide text-testo-secondario">Netto reale simulato</h3>
      <p className="mt-1 text-[26px] font-bold leading-tight tracking-tight tabular-nums">
        {risultato ? formatEuro(risultato.nettoRealeCents) : '—'}
      </p>

      <div className="mt-3 flex items-baseline justify-between gap-3 text-sm">
        <span>Da accantonare</span>
        <b className="tabular-nums">{risultato ? formatEuro(forfettarioCents) : '—'}</b>
      </div>
      {risultato && (
        <p className="mt-0.5 text-xs text-testo-secondario tabular-nums">
          contributi {formatEuro(risultato.contributiDovutiCents)} + imposta {formatEuro(risultato.impostaCents)}
        </p>
      )}
      <div className="mt-2 flex items-baseline justify-between gap-3 text-sm">
        <span>Pressione totale</span>
        <b className="tabular-nums">{risultato ? formatPercento(risultato.quotaAccantonamento) : '—'}</b>
      </div>
      {!risultato && <p className="mt-1 text-xs text-testo-secondario">In attesa di un importo valido.</p>}

      <hr className="my-4 border-bordo-sottile" />

      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-xs uppercase tracking-wide text-testo-secondario">Verso le soglie</h3>
        <b className="text-sm tabular-nums">{risultato && incassatoCents !== null ? formatEuro(incassatoCents) : '—'}</b>
      </div>
      <svg width="100%" height="20" aria-hidden="true" className="mt-1 block overflow-visible">
        <rect y="5" width="100%" height="10" rx="5" className="fill-rail" />
        <rect y="5" width={`${pctIncassato}%`} height="10" rx="5" className="fill-sim-solido" />
        <rect x={`${pctIncassato}%`} y="4" width="2" height="12" className="fill-superficie" />
        <line x1={`${pctSoglia85}%`} x2={`${pctSoglia85}%`} y1="0" y2="20" strokeWidth="2" className="stroke-errore-solido" />
        <line x1="99.9%" x2="99.9%" y1="0" y2="20" strokeWidth="2" className="stroke-errore-solido" />
      </svg>
      <div aria-hidden="true" className="relative h-4 text-[10px] text-testo-secondario">
        <span className="absolute -translate-x-full pr-1 tabular-nums" style={{ left: `${pctSoglia85}%` }}>
          {formatEuroIntero(soglia85)}
        </span>
        <span className="absolute right-0 tabular-nums">{formatEuroIntero(soglia100)}</span>
      </div>
      <p className="sr-only">
        {risultato && incassatoCents !== null
          ? `Verso le soglie: ${formatEuro(incassatoCents)}, su una scala che arriva a ${formatEuroIntero(soglia100)}.`
          : 'Verso le soglie: in attesa di un importo valido.'}
      </p>

      <hr className="my-4 border-bordo-sottile" />

      <h3 className="text-xs uppercase tracking-wide text-testo-secondario">Verdetti in miniatura</h3>
      <div className="mt-1">
        {deltaOrdinario !== null ? (
          voceVerdetto(
            'ordinario',
            'Ordinario',
            deltaOrdinario <= 0 ? 'di netto in meno se passassi' : 'di netto in più se passassi',
            `${deltaOrdinario > 0 ? '+' : '−'}${formatEuro(Math.abs(deltaOrdinario))}`,
          )
        ) : (
          voceVerdetto('ordinario', 'Ordinario', 'in attesa di un importo valido')
        )}
        {deltaDipendente !== null && ralCents !== null
          ? voceVerdetto(
              'dipendente',
              'Dipendente',
              `a RAL ${formatEuroIntero(ralCents)}, in busta`,
              `${deltaDipendente >= 0 ? '+' : '−'}${formatEuro(Math.abs(deltaDipendente))}`,
            )
          : voceVerdetto('dipendente', 'Dipendente', 'dal netto di una RAL')}
        {voceVerdetto('inverso', 'Calcolo inverso', 'dal netto che vuoi')}
      </div>
    </aside>
  )
}
