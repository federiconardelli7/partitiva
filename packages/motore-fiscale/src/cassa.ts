// Principio di cassa (L. 190/2014, co. 64): conta l'anno solare della DATA DI INCASSO,
// non la data della fattura. Regola pura nel motore, così i golden la coprono.
import { cents, type Cents } from './money'

export interface Pagamento {
  importoCents: Cents
  /** Data di incasso in formato ISO (yyyy-mm-dd). */
  dataIncasso: string
}

const ISO_DATE = /^(\d{4})-\d{2}-\d{2}$/

export function aggregaIncassato(pagamenti: readonly Pagamento[], anno: number): Cents {
  const totale = pagamenti.reduce((somma, pagamento) => {
    const match = ISO_DATE.exec(pagamento.dataIncasso)
    if (!match) {
      throw new Error(`Data di incasso non ISO (yyyy-mm-dd): ${pagamento.dataIncasso}`)
    }
    return Number(match[1]) === anno ? somma + pagamento.importoCents : somma
  }, 0)
  return cents(totale)
}
