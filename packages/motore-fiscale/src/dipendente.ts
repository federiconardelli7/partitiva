// Lavoro dipendente, per il confronto «e se fossi dipendente?»: dal RAL al netto annuo.
// Ipotesi dichiarate (regole-fiscali.md): impiegato privato a tempo indeterminato, anno
// intero (nessuna proratizzazione a giorni), nessun carico di famiglia né altri redditi,
// niente arrotondamento all'euro (il conguaglio del sostituto lavora in centesimi),
// mensilità aggiuntive = parte della RAL (l'IRPEF è annuale, le ritenute mensili sono timing).
import { calcolaAddizionaleRegionale } from './addizionali'
import { cents, mulRate, type Cents } from './money'
import { quotaLineare, rapportoTroncato4 } from './ordinario'
import { strutturaAddizionaleRegionale, type EntitaRegionale } from './params/addizionali-regionali'
import type { FiscalParams } from './params/types'
import { impostaPerScaglioni } from './scaglioni'

export type DimensioneAzienda = 'fino-a-5' | 'da-6-a-15' | 'oltre-15'

export interface DipendenteInput {
  ralCents: number
  /** null = solo IVS 9,19% (default, confrontabile coi calcolatori standard); la dimensione
   *  aggiunge il terzo del FIS (0,50/0,80%) e la CIGS 0,30% sopra i 15 dipendenti. */
  dimensioneAzienda: DimensioneAzienda | null
  /** Fon.Te (CCNL Commercio): 0,55% del lavoratore dedotto, 1,55% del datore, TFR al fondo. */
  fondoPensione: boolean
  addizionaleRegionale: number
  addizionaleComunale: number
  sogliaEsenzioneComunaleCents: number | null
  /** Se presente, la regionale usa la struttura ufficiale MEF (come nel confronto ordinario). */
  regione?: EntitaRegionale
}

export interface RisultatoDipendente {
  contributiCents: Cents
  contributoFondoLavoratoreCents: Cents
  imponibileIrpefCents: Cents
  irpefLordaCents: Cents
  detrazioneLavoroCents: Cents
  ulterioreDetrazioneCents: Cents
  irpefNettaCents: Cents
  /** Somme ESENTI che si aggiungono al netto (cuneo c. 4 e trattamento integrativo). */
  sommaIntegrativaCents: Cents
  trattamentoIntegrativoCents: Cents
  addizionaleRegionaleCents: Cents
  addizionaleComunaleCents: Cents
  nettoCents: Cents
  /** Accantonamento TFR lordo dell'anno (differito: fuori dal netto). */
  tfrCents: Cents
  /** Contributo del datore al fondo pensione (vantaggio fuori busta, se aderente). */
  contributoFondoDatoreCents: Cents
}

const detrazioneLavoroDipendente = (
  rc: Cents,
  p: FiscalParams['dipendente']['detrazione']['valore'],
): Cents => {
  if (rc > p.alta.finoACents) return cents(0)
  let base: number
  if (rc <= p.bassa.finoACents) {
    base = Math.max(p.bassa.importoCents, p.bassa.minimoCents)
  } else if (rc <= p.media.finoACents) {
    base = p.media.baseCents + mulRate(cents(p.media.extraCents), rapportoTroncato4(p.media.finoACents - rc, p.media.divisoreCents))
  } else {
    base = mulRate(cents(p.alta.baseCents), rapportoTroncato4(p.alta.finoACents - rc, p.alta.divisoreCents))
  }
  const bonus = rc > p.bonus.oltreCents && rc <= p.bonus.finoACents ? p.bonus.importoCents : 0
  return cents(base + bonus)
}

export function computeDipendente(input: DipendenteInput, params: FiscalParams): RisultatoDipendente {
  if (input.ralCents < 0) throw new Error('RAL negativa non valida')
  const d = params.dipendente
  const ral = cents(input.ralCents)

  // Contributi a carico del lavoratore: le voci pensionistiche (IVS e +1%) fino al
  // massimale post-1995; FIS e CIGS sull'intera retribuzione (non pensionistiche).
  const pensionabile = cents(Math.min(ral, params.previdenza.massimale.valore))
  const ivs = mulRate(pensionabile, d.contributi.valore.ivs)
  const fascia = params.previdenzaIvs.fasciaPiuUno.valore
  const aggiuntiva =
    pensionabile > fascia
      ? mulRate(cents(pensionabile - fascia), d.contributi.valore.aliquotaAggiuntivaOltreFascia)
      : cents(0)
  let fis: Cents = cents(0)
  let cigs: Cents = cents(0)
  if (input.dimensioneAzienda !== null) {
    const aliquotaFis =
      input.dimensioneAzienda === 'fino-a-5' ? d.contributi.valore.fisTotale.finoA5 : d.contributi.valore.fisTotale.oltre5
    const quota = d.contributi.valore.quotaFisLavoratore
    fis = quotaLineare(mulRate(ral, aliquotaFis), quota.numeratore, quota.denominatore)
    if (input.dimensioneAzienda === 'oltre-15') cigs = mulRate(ral, d.contributi.valore.cigsLavoratore)
  }
  const contributi = cents(ivs + aggiuntiva + fis + cigs)

  // Fon.Te: il contributo del lavoratore è dedotto (art. 51, c. 2, lett. h → art. 10),
  // entro il plafond; quello del datore arriva fuori busta (stesso plafond, capiente qui).
  const fondo = d.fondoPensione.valore
  const contributoFondoLavoratore = input.fondoPensione
    ? cents(Math.min(mulRate(ral, fondo.lavoratore), fondo.plafondCents))
    : cents(0)
  const contributoFondoDatore = input.fondoPensione ? mulRate(ral, fondo.datore) : cents(0)

  const rc = cents(Math.max(0, ral - contributi - contributoFondoLavoratore))
  const lorda = impostaPerScaglioni(rc, params.irpef.scaglioni.valore)
  const detrazione = detrazioneLavoroDipendente(rc, d.detrazione.valore)

  // Cuneo L. 207/2024: somma esente (RC ≤ 20.000) OPPURE ulteriore detrazione (fino a 40.000).
  let sommaIntegrativa: Cents = cents(0)
  let ulteriore: Cents = cents(0)
  const si = d.sommaIntegrativa.valore
  if (rc <= si.sogliaRedditoCents) {
    const fasciaRld = si.fasce.find((f) => f.finoACents === null || rc <= f.finoACents)
    if (fasciaRld) sommaIntegrativa = mulRate(rc, fasciaRld.percentuale)
  } else {
    const u = d.ulterioreDetrazione.valore
    if (rc <= u.pienaFinoACents) ulteriore = cents(u.importoCents)
    else if (rc < u.aCents) ulteriore = quotaLineare(cents(u.importoCents), u.aCents - rc, u.aCents - u.pienaFinoACents)
    // Capienza (circ. 4/E/2025, p. 16): spetta entro il limite dell'imposta lorda residua.
    ulteriore = cents(Math.min(ulteriore, Math.max(0, lorda - detrazione)))
  }

  // Trattamento integrativo (somma esente): RC ≤ 15.000 e lorda > detrazione c. 1 − 75.
  const ti = d.trattamentoIntegrativo.valore
  const trattamento =
    rc <= ti.sogliaRedditoCents && lorda > detrazione - ti.correttivoCents ? cents(ti.importoCents) : cents(0)

  const netta = cents(Math.max(0, lorda - detrazione - ulteriore))

  // Addizionali: stesse regole del confronto ordinario (dovute se IRPEF netta > 10 €).
  const dovute = netta > params.irpef.addizionali.valore.minimoIrpefDovutaCents
  const regionale = dovute
    ? input.regione
      ? calcolaAddizionaleRegionale(rc, strutturaAddizionaleRegionale(input.regione, params.anno))
      : mulRate(rc, input.addizionaleRegionale)
    : cents(0)
  const sopraSoglia =
    input.sogliaEsenzioneComunaleCents === null || rc > input.sogliaEsenzioneComunaleCents
  const comunale = dovute && sopraSoglia ? mulRate(rc, input.addizionaleComunale) : cents(0)

  // TFR: retribuzione/13,5 meno lo 0,50% detratto dalla quota (L. 297/82) — differito.
  const tfrLordo = quotaLineare(ral, d.tfr.valore.frazione.numeratore, d.tfr.valore.frazione.denominatore)
  const tfr = cents(Math.max(0, tfrLordo - mulRate(ral, d.tfr.valore.contributoDetratto)))

  const netto = cents(
    ral - contributi - contributoFondoLavoratore - netta - regionale - comunale + sommaIntegrativa + trattamento,
  )

  return {
    contributiCents: contributi,
    contributoFondoLavoratoreCents: contributoFondoLavoratore,
    imponibileIrpefCents: rc,
    irpefLordaCents: lorda,
    detrazioneLavoroCents: detrazione,
    ulterioreDetrazioneCents: ulteriore,
    irpefNettaCents: netta,
    sommaIntegrativaCents: sommaIntegrativa,
    trattamentoIntegrativoCents: trattamento,
    addizionaleRegionaleCents: regionale,
    addizionaleComunaleCents: comunale,
    nettoCents: netto,
    tfrCents: tfr,
    contributoFondoDatoreCents: contributoFondoDatore,
  }
}
