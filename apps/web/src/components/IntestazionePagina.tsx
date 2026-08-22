import type { ReactNode } from 'react'

/** Pattern fisso di orientamento: ogni pagina apre con titolo + riga che dice
 *  da dove vengono i dati e cosa la pagina NON fa. */
export function IntestazionePagina({
  titolo,
  extra,
  children,
}: {
  titolo: string
  extra?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="max-w-2xl">
        <h2 className="text-xl font-semibold tracking-tight">{titolo}</h2>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{children}</p>
      </div>
      {extra}
    </div>
  )
}
