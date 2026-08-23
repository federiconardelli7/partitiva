// Tema chiaro/scuro/sistema: preferenza per-dispositivo in localStorage (NON nei backup:
// non è un dato fiscale), classe `dark` su <html> per la variante Tailwind, meta
// theme-color allineati (barra della PWA). Lo script inline in index.html replica la
// lettura PRIMA del primo paint (anti-flash): se cambi chiave o colori, aggiorna anche lì.

export type Tema = 'chiaro' | 'scuro' | 'sistema'

const CHIAVE = 'partitiva-tema'
// Devono combaciare coi due <meta name="theme-color"> di index.html.
const COLORE_CHIARO = '#ffffff'
const COLORE_SCURO = '#1c1917'

/** Preferenza salvata; «sistema» per default, per chiavi assenti/corrotte o storage negato. */
export function temaSalvato(): Tema {
  try {
    const valore = localStorage.getItem(CHIAVE)
    return valore === 'chiaro' || valore === 'scuro' ? valore : 'sistema'
  } catch {
    return 'sistema'
  }
}

/** Persiste la scelta; «sistema» RIMUOVE la chiave (si torna a seguire il dispositivo). */
export function salvaTema(tema: Tema): void {
  try {
    if (tema === 'sistema') localStorage.removeItem(CHIAVE)
    else localStorage.setItem(CHIAVE, tema)
  } catch {
    // storage negato (es. navigazione privata): il tema vale solo per la sessione
  }
}

/** Il ciclo del toggle: sistema → chiaro → scuro → sistema. */
export function prossimoTema(tema: Tema): Tema {
  if (tema === 'sistema') return 'chiaro'
  if (tema === 'chiaro') return 'scuro'
  return 'sistema'
}

/** L'override vince sempre; «sistema» segue il dispositivo. */
export function temaEffettivoScuro(tema: Tema, sistemaScuro: boolean): boolean {
  return tema === 'scuro' || (tema === 'sistema' && sistemaScuro)
}

/** Applica il tema al documento: classe `dark` su <html> e meta theme-color coerenti
 *  (con «sistema» i due meta tornano ai default per-media di index.html). */
export function applicaTema(tema: Tema, sistemaScuro: boolean): void {
  document.documentElement.classList.toggle('dark', temaEffettivoScuro(tema, sistemaScuro))
  for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
    const metaPerScuro = (meta.getAttribute('media') ?? '').includes('dark')
    const colore =
      tema === 'sistema'
        ? metaPerScuro
          ? COLORE_SCURO
          : COLORE_CHIARO
        : tema === 'scuro'
          ? COLORE_SCURO
          : COLORE_CHIARO
    meta.setAttribute('content', colore)
  }
}
