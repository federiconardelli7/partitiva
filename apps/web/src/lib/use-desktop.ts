import { useEffect, useState } from 'react'

/** true dai 1024 px in su (breakpoint della shell, spec §3). Senza matchMedia (jsdom)
 *  resta desktop: è il ramo coperto dai test. Un solo albero per volta: mai lo stesso
 *  contenuto duplicato nascosto via CSS (le query dei test non vedono gli stili). */
export function useDesktop(): boolean {
  const [desktop, setDesktop] = useState(() =>
    typeof window.matchMedia === 'function' ? window.matchMedia('(min-width: 1024px)').matches : true,
  )
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const media = window.matchMedia('(min-width: 1024px)')
    const applica = () => setDesktop(media.matches)
    media.addEventListener('change', applica)
    return () => media.removeEventListener('change', applica)
  }, [])
  return desktop
}
