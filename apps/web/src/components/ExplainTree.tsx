import type { ExplainMap, NodeId } from '@partitiva/motore-fiscale'
import { formatEuro } from '../lib/format'

/** Rende ricorsivamente l'albero di spiegazione del motore: ogni numero col suo perché. */
export function ExplainTree({ map, id, depth = 0 }: { map: ExplainMap; id: NodeId; depth?: number }) {
  const nodo = map[id]
  if (!nodo) return null
  return (
    <details open={depth === 0} className={depth > 0 ? 'ml-4 border-l border-stone-200 pl-3 dark:border-stone-700' : ''}>
      <summary className="cursor-pointer py-1 text-sm">
        <span className="font-medium">{nodo.label}</span>{' '}
        <span className="tabular-nums">{formatEuro(nodo.value)}</span>
        {nodo.origine === 'reale' && (
          <span className="ml-2 rounded bg-sky-100 px-1.5 py-0.5 text-xs text-sky-800 dark:bg-sky-900 dark:text-sky-200">
            reale{nodo.valoreCalcolato !== undefined ? ` · teorico ${formatEuro(nodo.valoreCalcolato)}` : ''}
          </span>
        )}
      </summary>
      <p className="pb-1 text-xs text-stone-500">{nodo.formula}</p>
      {nodo.inputs.map((inputId) => (
        <ExplainTree key={inputId} map={map} id={inputId} depth={depth + 1} />
      ))}
    </details>
  )
}
