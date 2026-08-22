// Importi in centesimi interi (mai float nei calcoli) e arrotondamenti espliciti.
// Vedi docs/architettura.md: esattamente due funzioni di arrotondamento, mai nascoste.

export type Cents = number & { readonly __brand: 'Cents' }

export function cents(value: number): Cents {
  if (!Number.isInteger(value)) {
    throw new Error(`Importo non intero in centesimi: ${value}`)
  }
  return value as Cents
}

export function euro(value: number): Cents {
  return cents(Math.round(value * 100))
}

/**
 * Moltiplica un importo per un'aliquota con arrotondamento half-up al centesimo.
 * L'aliquota deve avere al massimo 4 decimali (es. 0,2607): viene portata a
 * "punti per diecimila" interi così il prodotto resta aritmetica intera esatta.
 */
export function mulRate(amount: Cents, rate: number): Cents {
  const perDiecimila = Math.round(rate * 10_000)
  if (Math.abs(perDiecimila - rate * 10_000) > 1e-6) {
    throw new Error(`Aliquota con più di 4 decimali non supportata: ${rate}`)
  }
  const scaled = amount * perDiecimila
  if (!Number.isSafeInteger(scaled)) {
    throw new Error(`Importo fuori range per il calcolo esatto: ${amount}`)
  }
  const intPart = Math.floor(scaled / 10_000)
  const remainder = scaled - intPart * 10_000
  return cents(remainder * 2 >= 10_000 ? intPart + 1 : intPart)
}

/**
 * Arrotonda all'euro intero più vicino (half away from zero), restituendo centesimi:
 * 42.706,31 → 42.706,00; −67,67 → −68,00 (simmetrico rispetto al segno).
 */
export function roundEuroToCents(amount: Cents): Cents {
  const segno = amount < 0 ? -1 : 1
  const assoluto = Math.abs(amount)
  const resto = assoluto % 100
  const arrotondato = resto * 2 >= 100 ? assoluto - resto + 100 : assoluto - resto
  return cents(segno * arrotondato)
}

/**
 * Divide un totale nelle rate previste dalla ripartizione (parametro fiscale, es. [0,5, 0,5]
 * ex art. 58 DL 124/2019): la prima rata è arrotondata half-up, la seconda è il resto —
 * così l'eventuale centesimo dispari va alla prima rata.
 */
export function splitInRate(totale: Cents, ripartizione: [number, number] = [0.5, 0.5]): [Cents, Cents] {
  const [quota1, quota2] = ripartizione
  if (Math.abs(quota1 + quota2 - 1) > 1e-9) {
    throw new Error(`Ripartizione rate non valida (la somma deve fare 1): ${quota1} + ${quota2}`)
  }
  const rata1 = mulRate(totale, quota1)
  return [rata1, cents(totale - rata1)]
}
