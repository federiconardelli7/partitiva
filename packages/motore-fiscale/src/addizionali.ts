// Calcolo dell'addizionale regionale da una struttura ufficiale (params/addizionali-regionali):
// regimi condizionali (aliquota sull'intero importo o scaglioni progressivi), esenzione a
// scalino, detrazioni fissa/a fascia. Le detrazioni non generano mai credito (clamp a zero).
import { cents, mulRate, type Cents } from './money'
import type { StrutturaAddizionaleRegionale } from './params/addizionali-regionali'
import { impostaPerScaglioni } from './scaglioni'

export function calcolaAddizionaleRegionale(
  imponibileCents: Cents,
  struttura: StrutturaAddizionaleRegionale,
): Cents {
  if (imponibileCents <= 0) return cents(0)
  if (struttura.esenzioneCents !== undefined && imponibileCents <= struttura.esenzioneCents) return cents(0)

  const regime = struttura.regimi.find(
    (r) => r.seImponibileFinoACents === null || imponibileCents <= r.seImponibileFinoACents,
  )
  if (!regime) throw new Error('Struttura addizionale regionale senza regime applicabile')

  let imposta: number =
    regime.calcolo.tipo === 'unica'
      ? mulRate(imponibileCents, regime.calcolo.aliquota)
      : impostaPerScaglioni(imponibileCents, regime.calcolo.scaglioni)

  const fissa = struttura.detrazioneFissa
  if (fissa && imponibileCents <= fissa.seImponibileFinoACents) imposta -= fissa.importoCents
  const fascia = struttura.detrazioneAFascia
  if (fascia && imponibileCents > fascia.oltreCents && imponibileCents <= fascia.finoACents) {
    imposta -= fascia.importoCents
  }
  return cents(Math.max(0, imposta))
}
