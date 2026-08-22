import type { ExplainMap, NodeId } from '@partitiva/motore-fiscale'
import { formatEuro } from '../lib/format'

/**
 * Il Flusso: proiezione grafica year-aware della catena del motore (ExplainMap).
 * Nessuna logica fiscale qui: legge nodi già calcolati e li dispone come nel
 * diagramma di riferimento. Con versati = 0 la corsia è unica («nulla da dedurre»);
 * con versati > 0 compare il ramo F24 → contributi deducibili → imponibile.
 */

type Livrea = 'reale' | 'sim'
type Tono = 'neutro' | 'prelievo' | 'deduzione' | 'netto'

interface FlussoProps {
  explain: ExplainMap
  anno: number
  livrea: Livrea
  /** Riquadro «F24 pagati nell'anno» sopra il nodo dei deducibili (solo dati reali). */
  f24?: { totaleCents: number; dettaglio: string }
  nodoAttivo?: NodeId
  onNodo?: (id: NodeId) => void
}

const TONI: Record<Tono, string> = {
  neutro: 'border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900',
  prelievo: 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40',
  deduzione: 'border-teal-200 bg-teal-50 dark:border-teal-900 dark:bg-teal-950/40',
  netto: 'border-green-300 bg-green-50 dark:border-green-900 dark:bg-green-950/40',
}

const TESTO_TONI: Record<Tono, string> = {
  neutro: 'text-stone-900 dark:text-stone-100',
  prelievo: 'text-red-800 dark:text-red-300',
  deduzione: 'text-teal-800 dark:text-teal-300',
  netto: 'text-green-800 dark:text-green-300',
}

function FrecciaGiu({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 28" aria-hidden="true" className={`h-7 w-5 text-stone-400 dark:text-stone-600 ${className}`}>
      <path d="M12 2v21m0 0l-5.5-5.5M12 23l5.5-5.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FrecciaSinistra() {
  return (
    <svg viewBox="0 0 28 24" aria-hidden="true" className="h-5 w-7 shrink-0 text-teal-500 dark:text-teal-600">
      <path d="M26 12H3m0 0l5.5-5.5M3 12l5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Connettore verticale lungo (dal nodo contributi fino al netto, solo desktop). */
function ConnettoreLungo() {
  return (
    <div aria-hidden="true" className="hidden flex-col items-center sm:flex sm:[grid-area:lungo]">
      <div className="w-px flex-1 bg-stone-300 dark:bg-stone-600" />
      <svg viewBox="0 0 24 10" className="h-2.5 w-5 text-stone-400 dark:text-stone-600">
        <path d="M12 9L6.5 1M12 9l5.5-8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    </div>
  )
}

function Nodo({
  nodo,
  tono,
  sottotitolo,
  grande = false,
  area = '',
  attivo = false,
  livrea,
  onNodo,
}: {
  nodo: { id: NodeId; label: string; value: number; formula: string } | undefined
  tono: Tono
  sottotitolo?: string
  grande?: boolean
  area?: string
  attivo?: boolean
  livrea: Livrea
  onNodo?: (id: NodeId) => void
}) {
  if (!nodo) return null
  const anello = livrea === 'sim' ? 'ring-indigo-500 dark:ring-indigo-400' : 'ring-emerald-600 dark:ring-emerald-400'
  const classi = `w-full rounded-xl border px-4 py-3 text-center transition ${TONI[tono]} ${area} ${
    attivo ? `ring-2 ring-offset-1 ring-offset-stone-50 dark:ring-offset-stone-950 ${anello}` : ''
  }`
  const contenuto = (
    <>
      <span className={`block text-xs font-semibold ${TESTO_TONI[tono]}`}>{nodo.label}</span>
      <span className={`block tabular-nums font-bold ${grande ? 'text-2xl' : 'text-lg'} ${TESTO_TONI[tono]}`}>
        {formatEuro(nodo.value)}
      </span>
      <span className="mt-0.5 block text-xs text-stone-500 dark:text-stone-400">{sottotitolo ?? nodo.formula}</span>
    </>
  )
  // Senza drill-down (Landing, Simulatore) il nodo è un elemento statico: un bottone
  // che non fa niente sarebbe una promessa non mantenuta, tastiera e screen reader inclusi.
  if (!onNodo) return <div className={classi}>{contenuto}</div>
  return (
    <button
      type="button"
      onClick={() => onNodo(nodo.id)}
      aria-pressed={attivo}
      title="Apri il perché di questo numero"
      className={`${classi} cursor-pointer hover:shadow-sm`}
    >
      {contenuto}
    </button>
  )
}

export function Flusso({ explain, anno, livrea, f24, nodoAttivo, onNodo }: FlussoProps) {
  const nodo = (campo: string) => explain[`${anno}:${campo}`]
  const incassato = nodo('incassato')
  const versati = nodo('versatiContributi')
  const nettoReale = nodo('nettoReale')
  if (!incassato || !nettoReale) return null

  const conDeduzione = (versati?.value ?? 0) > 0
  const percentuale =
    incassato.value > 0
      ? ((nettoReale.value / incassato.value) * 100).toLocaleString('it-IT', { maximumFractionDigits: 1 })
      : null

  const griglia = conDeduzione
    ? "sm:[grid-template-areas:'incassato_incassato_ramo'_'f1_f1_ramo'_'reddito_reddito_ramo'_'f2_f3_ramo'_'contributi_imponibile_ramo'_'lungo_f4_.'_'lungo_imposta_.'_'lungo_f6_.'_'netto_netto_.'] sm:grid-cols-[1fr_1fr_1fr]"
    : "sm:[grid-template-areas:'incassato_incassato'_'f1_f1'_'reddito_reddito'_'f2_f3'_'contributi_imponibile'_'lungo_f4'_'lungo_imposta'_'lungo_f6'_'netto_netto'] sm:grid-cols-[1fr_1fr]"

  const freccia = (area: string, soloDesktop = false) => (
    <div aria-hidden="true" className={`${soloDesktop ? 'hidden sm:flex' : 'flex'} justify-center ${area}`}>
      <FrecciaGiu />
    </div>
  )

  const attivo = (id: NodeId | undefined) => id !== undefined && id === nodoAttivo

  return (
    <div className={`flex flex-col gap-0 sm:grid sm:items-center sm:gap-x-5 ${griglia}`}>
      <Nodo nodo={incassato} tono="neutro" area="sm:[grid-area:incassato] sm:justify-self-center sm:min-w-72" livrea={livrea} onNodo={onNodo} attivo={attivo(incassato?.id)} />
      {freccia('sm:[grid-area:f1]')}
      <Nodo nodo={nodo('reddito')} tono="neutro" area="sm:[grid-area:reddito] sm:justify-self-center sm:min-w-72" livrea={livrea} onNodo={onNodo} attivo={attivo(nodo('reddito')?.id)} />

      {freccia('sm:[grid-area:f2]', true)}
      {freccia('sm:[grid-area:f3]', true)}

      {conDeduzione && (
        <div className="flex flex-col items-center sm:[grid-area:ramo] sm:self-center">
          {f24 && (
            <div className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center dark:border-red-900 dark:bg-red-950/40">
              <span className="block text-xs font-semibold text-red-800 dark:text-red-300">F24 pagati nel {anno}</span>
              <span className="block tabular-nums text-lg font-bold text-red-800 dark:text-red-300">{formatEuro(f24.totaleCents)}</span>
              <span className="mt-0.5 block text-xs text-stone-500 dark:text-stone-400">{f24.dettaglio}</span>
            </div>
          )}
          {f24 && <FrecciaGiu />}
          <div className="flex w-full items-center">
            <div className="hidden sm:block">
              <FrecciaSinistra />
            </div>
            <Nodo nodo={versati} tono="deduzione" livrea={livrea} onNodo={onNodo} attivo={attivo(versati?.id)} />
          </div>
          <div className="sm:hidden">
            <FrecciaGiu />
          </div>
        </div>
      )}

      <Nodo
        nodo={nodo('imponibile')}
        tono="neutro"
        sottotitolo={conDeduzione ? undefined : 'imponibile pieno: nulla da dedurre'}
        area="sm:[grid-area:imponibile]"
        livrea={livrea}
        onNodo={onNodo}
        attivo={attivo(nodo('imponibile')?.id)}
      />
      {freccia('sm:[grid-area:f4]')}
      <Nodo nodo={nodo('imposta')} tono="prelievo" area="sm:[grid-area:imposta]" livrea={livrea} onNodo={onNodo} attivo={attivo(nodo('imposta')?.id)} />

      {freccia('sm:hidden')}
      <Nodo nodo={nodo('contributiDovuti')} tono="prelievo" area="sm:[grid-area:contributi] sm:self-start" livrea={livrea} onNodo={onNodo} attivo={attivo(nodo('contributiDovuti')?.id)} />
      <ConnettoreLungo />

      {freccia('sm:[grid-area:f6]')}
      <Nodo
        nodo={nettoReale}
        tono="netto"
        grande
        sottotitolo={percentuale ? `${nettoReale.formula} — ti resta il ${percentuale}%` : nettoReale.formula}
        area="sm:[grid-area:netto] sm:justify-self-center sm:min-w-80"
        livrea={livrea}
        onNodo={onNodo}
        attivo={attivo(nettoReale?.id)}
      />
    </div>
  )
}
