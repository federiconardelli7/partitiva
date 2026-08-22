export function Card({ titolo, valore, dettaglio }: { titolo: string; valore: string; dettaglio?: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
      <div className="text-xs uppercase tracking-wide text-stone-500">{titolo}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{valore}</div>
      {dettaglio && <div className="mt-1 text-xs text-stone-500">{dettaglio}</div>}
    </div>
  )
}
