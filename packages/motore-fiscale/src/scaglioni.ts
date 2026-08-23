// Imposta per scaglioni progressivi (come l'IRPEF): usata dall'IRPEF del confronto
// ordinario e dalle addizionali regionali con aliquote differenziate.
import { cents, mulRate, type Cents } from './money'

export function impostaPerScaglioni(
  imponibile: Cents,
  scaglioni: { finoACents: number | null; aliquota: number }[],
): Cents {
  let totale = 0
  let precedente = 0
  for (const scaglione of scaglioni) {
    const tetto = scaglione.finoACents ?? imponibile
    const quota = Math.min(imponibile, tetto) - precedente
    if (quota > 0) totale += mulRate(cents(quota), scaglione.aliquota)
    precedente = tetto
    if (imponibile <= precedente) break
  }
  return cents(totale)
}
