// Imposta di bollo sulle fatture senza IVA: 2,00 € sopra 77,47 € (DPR 642/1972, tariffa art. 13).
import { cents, type Cents } from './money'
import type { FiscalParams } from './params/types'

export function bolloPerFattura(importoFattura: Cents, params: FiscalParams): Cents {
  return importoFattura > params.bollo.soglia.valore ? params.bollo.importo.valore : cents(0)
}
