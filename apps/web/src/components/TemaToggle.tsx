import { useEffect, useState } from 'react'
import { applicaTema, prossimoTema, salvaTema, temaSalvato, type Tema } from '../lib/tema'

const ETICHETTE: Record<Tema, string> = {
  sistema: 'Tema: come il dispositivo',
  chiaro: 'Tema: chiaro',
  scuro: 'Tema: scuro',
}

const SIMBOLI: Record<Tema, string> = { sistema: '◐', chiaro: '☀', scuro: '☾' }

export function TemaToggle() {
  const [tema, setTema] = useState<Tema>(() => temaSalvato())

  useEffect(() => {
    // jsdom non implementa matchMedia: senza, «sistema» ricade sul chiaro.
    const media =
      typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)') : null
    const applica = () => applicaTema(tema, media?.matches ?? false)
    applica()
    media?.addEventListener('change', applica)
    return () => media?.removeEventListener('change', applica)
  }, [tema])

  const cambia = () => {
    const nuovo = prossimoTema(tema)
    salvaTema(nuovo)
    setTema(nuovo)
  }

  return (
    <button
      type="button"
      onClick={cambia}
      title={ETICHETTE[tema]}
      aria-label={`${ETICHETTE[tema]} — clicca per cambiare`}
      className="rounded-lg bg-stone-100 px-2.5 py-1.5 text-sm leading-none text-stone-500 hover:text-stone-800 dark:bg-stone-800 dark:hover:text-stone-200"
    >
      <span aria-hidden="true">{SIMBOLI[tema]}</span>
    </button>
  )
}
