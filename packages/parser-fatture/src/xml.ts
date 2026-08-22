// Navigazione namespace-agnostic: i file FatturaPA usano prefissi variabili (ns2:, p:, nessuno),
// quindi si cerca SEMPRE per local-name, mai per nome qualificato.

export function discendenti(radice: Element, localName: string): Element[] {
  return Array.from(radice.getElementsByTagName('*')).filter((el) => el.localName === localName)
}

export function primo(radice: Element, localName: string): Element | undefined {
  return discendenti(radice, localName)[0]
}

export function testo(radice: Element, localName: string): string | undefined {
  const valore = primo(radice, localName)?.textContent?.trim()
  return valore === '' ? undefined : valore
}

/** Importo decimale FatturaPA ("4385.00") → centesimi interi. */
export function centesimi(valore: string | undefined, campo: string): number {
  if (valore === undefined) throw new Error(`Campo mancante nella fattura: ${campo}`)
  const numero = Number(valore)
  if (!Number.isFinite(numero)) throw new Error(`Importo non valido in ${campo}: ${valore}`)
  return Math.round(numero * 100)
}
