// Regime ordinario/semplificato, per il confronto «quando conviene uscire»: IRPEF a
// scaglioni sul reddito effettivo (incassato − costi reali), detrazione da lavoro
// autonomo/impresa minore, oneri 19% coi loro meccanismi, addizionali parametriche.
// Confronto «a regime»: i contributi DOVUTI dell'anno fanno da deduzione (nel regime
// vero si deducono i versati per cassa) — semplificazione dichiarata in regole-fiscali.md.
import { calcolaAddizionaleRegionale } from './addizionali'
import {
  contributiEccedenzaIvs,
  contributiFissiIvs,
  type Copertura,
  type Flag,
  type GestioneInput,
} from './compute-anno'
import { cents, mulRate, roundEuroToCents, type Cents } from './money'
import { strutturaAddizionaleRegionale, type EntitaRegionale } from './params/addizionali-regionali'
import type { FiscalParams } from './params/types'
import { impostaPerScaglioni } from './scaglioni'

export type FigliACarico = 'nessuno' | 'uno' | 'due' | 'oltreODisabilita'

export interface OrdinarioInput {
  incassatoCents: number
  /** Costi reali dell'anno (per cassa): registro spese + eventuali altri costi. */
  costiCents: number
  /** Oneri detraibili al 19% SOGGETTI a tetto/degressione/taglio (sanitarie e mutui, esclusi
   *  per legge da quei meccanismi, restano fuori da questo input: v. regole-fiscali.md). */
  oneri19Cents: number
  figli: FigliACarico
  /** Aliquote del proprio ente (input utente, max 4 decimali: es. 0,0173 = 1,73%). */
  addizionaleRegionale: number
  addizionaleComunale: number
  /** Soglia di esenzione comunale, a scalino: sotto o uguale non si paga nulla. */
  sogliaEsenzioneComunaleCents: number | null
  copertura: Copertura
  /** Gestione previdenziale: assente = Gestione Separata con la `copertura`. */
  gestione?: GestioneInput
  /** Regione/provincia autonoma di residenza: se presente, la regionale usa la struttura
   *  ufficiale MEF dell'anno (scaglioni/esenzioni compresi) e ignora `addizionaleRegionale`. */
  regione?: EntitaRegionale
}

export interface RisultatoOrdinario {
  redditoCents: Cents
  contributiDovutiCents: Cents
  /** Reddito complessivo IRPEF (reddito − contributi dovuti), arrotondato all'euro. */
  imponibileIrpefCents: Cents
  irpefLordaCents: Cents
  detrazioneLavoroAutonomoCents: Cents
  detrazioneOneriCents: Cents
  irpefNettaCents: Cents
  addizionaleRegionaleCents: Cents
  addizionaleComunaleCents: Cents
  /** IRPEF netta + addizionali + contributi: il costo di competenza dell'ordinario. */
  totaleCents: Cents
  flags: Flag[]
}

/** Rapporto assunto «nelle prime quattro cifre decimali» (art. 13, c. 6 TUIR: troncamento).
 *  Aritmetica intera: il quoziente float di interi < 2^53 non può sbagliare il floor. */
const rapportoTroncato4 = (numeratore: number, denominatore: number): number =>
  Math.floor((numeratore * 10_000) / denominatore) / 10_000

/** importo × numeratore/denominatore con arrotondamento half-up al centesimo (per la
 *  degressione art. 15, c. 3-bis, che non fissa un troncamento: scelta dichiarata). */
const quotaLineare = (importo: Cents, numeratore: number, denominatore: number): Cents => {
  const scaled = importo * numeratore
  const intPart = Math.floor(scaled / denominatore)
  const resto = scaled - intPart * denominatore
  return cents(resto * 2 >= denominatore ? intPart + 1 : intPart)
}


const detrazioneLavoroAutonomo = (
  rc: Cents,
  p: FiscalParams['irpef']['detrazioneLavoroAutonomo']['valore'],
): Cents => {
  if (rc > p.alta.finoACents) return cents(0)
  let base: number
  if (rc <= p.bassa.finoACents) {
    base = p.bassa.importoCents
  } else if (rc <= p.media.finoACents) {
    base = p.media.baseCents + mulRate(cents(p.media.extraCents), rapportoTroncato4(p.media.finoACents - rc, p.media.divisoreCents))
  } else {
    base = mulRate(cents(p.alta.baseCents), rapportoTroncato4(p.alta.finoACents - rc, p.alta.divisoreCents))
  }
  const bonus = rc > p.bonus.oltreCents && rc <= p.bonus.finoACents ? p.bonus.importoCents : 0
  return cents(base + bonus)
}

const detrazioneOneri = (
  rc: Cents,
  oneri: Cents,
  figli: FigliACarico,
  p: FiscalParams['irpef']['oneriDetraibili']['valore'],
): Cents => {
  if (oneri <= 0) return cents(0)
  // Tetto 16-ter: massimale sulle SPESE (non sulla detrazione), oltre 75.000 di RC.
  let spese = oneri
  if (rc > p.tetto.daCents) {
    const importoBase =
      rc <= p.tetto.sogliaBase100kCents ? p.tetto.importoBaseCents.fino100k : p.tetto.importoBaseCents.oltre100k
    spese = cents(Math.min(spese, mulRate(cents(importoBase), p.tetto.coefficientiFigli[figli])))
  }
  let detrazione = mulRate(spese, p.aliquota)
  // Degressione art. 15, c. 3-bis: piena fino a 120.000, lineare fino a zero a 240.000.
  if (rc >= p.degressione.aCents) detrazione = cents(0)
  else if (rc > p.degressione.daCents) {
    detrazione = quotaLineare(detrazione, p.degressione.aCents - rc, p.degressione.aCents - p.degressione.daCents)
  }
  // Taglio oltre 200.000 (dal 2026), sul monte oneri qui modellato: clamp a zero.
  if (p.taglioAltiRedditi && rc > p.taglioAltiRedditi.sogliaCents) {
    detrazione = cents(Math.max(0, detrazione - p.taglioAltiRedditi.importoCents))
  }
  return detrazione
}

export function computeOrdinario(input: OrdinarioInput, params: FiscalParams): RisultatoOrdinario {
  if (input.incassatoCents < 0 || input.costiCents < 0 || input.oneri19Cents < 0) {
    throw new Error('Importi negativi non validi per il confronto ordinario')
  }
  const flags: Flag[] = []
  const redditoLordo = input.incassatoCents - input.costiCents
  if (redditoLordo < 0) {
    flags.push({
      codice: 'ordinario-perdita',
      messaggio: 'Costi oltre l’incassato: reddito a zero per il confronto (le perdite non sono modellate).',
    })
  }
  const reddito = cents(Math.max(0, redditoLordo))

  const gestione: GestioneInput = input.gestione ?? { tipo: 'gestione-separata', copertura: input.copertura }
  let contributi: Cents
  if (gestione.tipo === 'gestione-separata') {
    const aliquota =
      gestione.copertura === 'piena' ? params.previdenza.aliquotaPiena : params.previdenza.aliquotaRidotta
    const massimale = params.previdenza.massimale.valore
    if (reddito > massimale) {
      flags.push({
        codice: 'massimale-gs',
        messaggio: 'Reddito oltre il massimale Gestione Separata: i contributi si calcolano sul massimale.',
      })
    }
    contributi = mulRate(cents(Math.min(reddito, massimale)), aliquota.valore)
  } else {
    const massimaleIvs = gestione.anzianitaAl1995
      ? params.previdenzaIvs.massimaleAnzianita1995.valore
      : params.previdenzaIvs.massimalePost1995.valore
    if (reddito > massimaleIvs) {
      flags.push({
        codice: 'massimale-ivs',
        messaggio: 'Reddito oltre il massimale IVS: i contributi si calcolano fino al massimale della tua fascia.',
      })
    }
    contributi = cents(contributiFissiIvs(gestione, params) + contributiEccedenzaIvs(reddito, gestione, params))
  }

  const imponibileIrpef = roundEuroToCents(cents(Math.max(0, reddito - contributi)))
  const lorda = impostaPerScaglioni(imponibileIrpef, params.irpef.scaglioni.valore)
  const detrazioneLA = detrazioneLavoroAutonomo(imponibileIrpef, params.irpef.detrazioneLavoroAutonomo.valore)
  const detrazioneOneri19 = detrazioneOneri(
    imponibileIrpef,
    cents(input.oneri19Cents),
    input.figli,
    params.irpef.oneriDetraibili.valore,
  )
  const netta = cents(Math.max(0, lorda - detrazioneLA - detrazioneOneri19))

  // Addizionali: dovute solo se l'IRPEF netta risulta dovuta — operativamente, se supera
  // 10 € (AdE, Allegato C circolare di liquidazione: parametro nei params).
  const dovute = netta > params.irpef.addizionali.valore.minimoIrpefDovutaCents
  const regionale = dovute
    ? input.regione
      ? calcolaAddizionaleRegionale(imponibileIrpef, strutturaAddizionaleRegionale(input.regione, params.anno))
      : mulRate(imponibileIrpef, input.addizionaleRegionale)
    : cents(0)
  const sopraSoglia =
    input.sogliaEsenzioneComunaleCents === null || imponibileIrpef > input.sogliaEsenzioneComunaleCents
  const comunale = dovute && sopraSoglia ? mulRate(imponibileIrpef, input.addizionaleComunale) : cents(0)

  return {
    redditoCents: reddito,
    contributiDovutiCents: contributi,
    imponibileIrpefCents: imponibileIrpef,
    irpefLordaCents: lorda,
    detrazioneLavoroAutonomoCents: detrazioneLA,
    detrazioneOneriCents: detrazioneOneri19,
    irpefNettaCents: netta,
    addizionaleRegionaleCents: regionale,
    addizionaleComunaleCents: comunale,
    totaleCents: cents(contributi + netta + regionale + comunale),
    flags,
  }
}
