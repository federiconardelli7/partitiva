import { useEffect, useState, type ReactNode } from 'react'
import { formatEuro } from '../lib/format'

/** La sheet mobile dei risultati (spec §4): il bordo inferiore è suo (la nav sta nel
 *  drawer). Peek col solo netto sempre visibile; espansa a tap mostra il Quadro intero.
 *  Il drag verrà come miglioria: il tap copre tutto ed è tastiera-accessibile. */
export function SheetRisultati({ nettoCents, children }: { nettoCents: number | null; children: ReactNode }) {
  const [espansa, setEspansa] = useState(false)

  useEffect(() => {
    document.body.classList.toggle('sheet-aperta', espansa)
    return () => document.body.classList.remove('sheet-aperta')
  }, [espansa])

  return (
    <>
      {espansa && (
        <button
          type="button"
          aria-label="Chiudi i risultati"
          onClick={() => setEspansa(false)}
          className="fixed inset-0 z-40 bg-black/50"
        />
      )}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border border-b-0 border-bordo-sottile bg-superficie ${
          espansa ? 'max-h-[75dvh] overflow-y-auto pb-6' : ''
        }`}
      >
        <button
          type="button"
          onClick={() => setEspansa((e) => !e)}
          aria-expanded={espansa}
          className="flex w-full flex-col items-center gap-1.5 px-4 pb-3 pt-2"
        >
          <span aria-hidden="true" className="h-1 w-9 rounded-full bg-bordo" />
          <span className="flex w-full items-baseline justify-between gap-3">
            <span className="text-[10px] uppercase tracking-wide text-testo-secondario">
              Netto reale simulato
            </span>
            <b className="text-sm tabular-nums">{nettoCents !== null ? formatEuro(nettoCents) : '—'}</b>
          </span>
        </button>
        {espansa && <div className="px-4">{children}</div>}
      </div>
    </>
  )
}
