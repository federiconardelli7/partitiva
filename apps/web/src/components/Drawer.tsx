import { useEffect, useRef, type ReactNode } from 'react'

/** Drawer di navigazione mobile su <dialog> nativo (spec redesign §3, «a mano»):
 *  focus trap, Esc e ritorno del focus all'invocatore li dà il browser; qui restano
 *  solo apertura/chiusura e il click sul backdrop. */
export function Drawer({
  aperto,
  onChiudi,
  etichetta,
  children,
}: {
  aperto: boolean
  onChiudi: () => void
  etichetta: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    // jsdom può non implementare showModal: il drawer è solo-mobile e i test girano desktop.
    if (aperto && !dialog.open && typeof dialog.showModal === 'function') dialog.showModal()
    if (!aperto && dialog.open) dialog.close()
  }, [aperto])

  return (
    <dialog
      ref={ref}
      aria-label={etichetta}
      onClose={onChiudi}
      onClick={(evento) => {
        // Solo il backdrop ha come target il dialog stesso: i click sul contenuto no.
        if (evento.target === evento.currentTarget) onChiudi()
      }}
      className="m-0 h-dvh max-h-none w-72 max-w-[80vw] bg-superficie p-0 text-testo shadow-xl"
    >
      {children}
    </dialog>
  )
}
