// Calcolo inverso del Simulatore («che fatturato per X € netti»): il più piccolo lordo
// il cui netto raggiunge un obiettivo, cercato per scansione sulla catena forward.
// Niente formula chiusa: le catene hanno arrotondamenti e scalini (trattamento
// integrativo, fasce della somma integrativa, gate dei 10 € delle addizionali, esenzioni
// regionali, tetto/taglio oneri), quindi il netto può anche RICADERE sotto l'obiettivo
// oltre il primo incrocio; in quel caso il risultato espone pure il lordo «stabile».
// Il lordo è in EURO INTERI: al centesimo gli arrotondamenti della catena
// micro-oscillano (plateau dell'euro dell'imponibile, troncamenti a 4 decimali) e il
// minimo esatto sarebbe falsa precisione; all'euro il risultato è stabile e verificabile.
import { cents, type Cents } from './money'

export interface RisultatoInverso {
  /** Il più piccolo lordo in euro interi il cui netto raggiunge l'obiettivo. */
  lordoCents: Cents
  /** Netto ricalcolato sulla catena forward a `lordoCents` (≥ obiettivo). */
  nettoCents: Cents
  /** Presenti solo se oltre `lordoCents` il netto ricade sotto l'obiettivo: il primo
   *  euro oltre l'ultima ricaduta vista sulla griglia (da qui in su il netto resta
   *  ≥ obiettivo su tutta la griglia; ricadute più strette del passo possono sfuggire). */
  lordoStabileCents?: Cents
  nettoStabileCents?: Cents
}

/**
 * Inverte una catena netto-dal-lordo: griglia 0..massimo a passi di `passoCents`
 * (default 50 €), poi scansione all'euro dentro la cella del primo incrocio.
 * Restituisce null se al massimo di ricerca l'obiettivo non è (stabilmente) raggiunto.
 */
export function invertiNetto(
  obiettivoCents: number,
  nettoDiLordo: (lordoCents: Cents) => Cents,
  opts: { massimoCents: number; passoCents?: number },
): RisultatoInverso | null {
  const passo = opts.passoCents ?? 5_000
  const massimo = opts.massimoCents
  if (!Number.isInteger(obiettivoCents)) {
    throw new Error(`Obiettivo non intero in centesimi: ${obiettivoCents}`)
  }
  if (!Number.isInteger(massimo) || massimo <= 0 || massimo % 100 !== 0) {
    throw new Error(`Massimo di ricerca non valido (serve un multiplo positivo di 100 centesimi): ${massimo}`)
  }
  if (!Number.isInteger(passo) || passo < 100 || passo % 100 !== 0) {
    throw new Error(`Passo di ricerca non valido (serve un multiplo di 100 centesimi): ${passo}`)
  }

  // Griglia 0, passo, 2·passo, …, massimo (il massimo entra anche se non è un multiplo).
  const griglia: number[] = []
  for (let lordo = 0; lordo < massimo; lordo += passo) griglia.push(lordo)
  griglia.push(massimo)

  let primoSopra = -1
  let ultimoSotto = -1
  for (const [i, lordo] of griglia.entries()) {
    if (nettoDiLordo(cents(lordo)) >= obiettivoCents) {
      if (primoSopra === -1) primoSopra = i
    } else {
      ultimoSotto = i
    }
  }
  // Al massimo di ricerca il netto è sotto l'obiettivo: mai raggiunto, o non stabile.
  if (ultimoSotto === griglia.length - 1) return null

  // Primo euro intero con netto ≥ obiettivo dentro la cella (da, a]: esiste sempre,
  // perché `a` sta sulla griglia con netto ≥ obiettivo ed è un multiplo di 100.
  const primoEuroSopra = (da: number, a: number): Cents => {
    for (let lordo = da + 100; lordo < a; lordo += 100) {
      if (nettoDiLordo(cents(lordo)) >= obiettivoCents) return cents(lordo)
    }
    return cents(a)
  }

  const lordo = primoSopra === 0 ? cents(0) : primoEuroSopra(griglia[primoSopra - 1]!, griglia[primoSopra]!)
  if (ultimoSotto > primoSopra) {
    const lordoStabile = primoEuroSopra(griglia[ultimoSotto]!, griglia[ultimoSotto + 1]!)
    return {
      lordoCents: lordo,
      nettoCents: nettoDiLordo(lordo),
      lordoStabileCents: lordoStabile,
      nettoStabileCents: nettoDiLordo(lordoStabile),
    }
  }
  return { lordoCents: lordo, nettoCents: nettoDiLordo(lordo) }
}
