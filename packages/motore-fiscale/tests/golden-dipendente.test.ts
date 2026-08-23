import { describe, expect, it } from 'vitest'
import { computeDipendente } from '../src/index'
import { getParams } from '../src/params'
import {
  impiegato130k,
  impiegato15k,
  impiegato18k,
  impiegato30k,
  impiegato30kAziendaGrande,
  impiegato30kConFonTe,
  impiegato40k,
} from './golden/caso-dipendente'

// Golden del lavoro dipendente (confronto «e se fossi dipendente?»): valori sintetici
// quadrati a mano contro i testi vigenti (v. caso-dipendente.ts e regole-fiscali.md).

describe('golden dipendente — computeDipendente', () => {
  it('RAL 30.000, 2026: detrazione troncata a 4 decimali, +65, ulteriore detrazione piena', () => {
    const r = computeDipendente(impiegato30k.input, getParams(2026))
    expect(r.contributiCents).toBe(impiegato30k.atteso2026.contributiCents)
    expect(r.imponibileIrpefCents).toBe(impiegato30k.atteso2026.imponibileIrpefCents)
    expect(r.irpefLordaCents).toBe(impiegato30k.atteso2026.irpefLordaCents)
    expect(r.detrazioneLavoroCents).toBe(impiegato30k.atteso2026.detrazioneLavoroCents)
    expect(r.ulterioreDetrazioneCents).toBe(impiegato30k.atteso2026.ulterioreDetrazioneCents)
    expect(r.irpefNettaCents).toBe(impiegato30k.atteso2026.irpefNettaCents)
    expect(r.sommaIntegrativaCents).toBe(impiegato30k.atteso2026.sommaIntegrativaCents)
    expect(r.trattamentoIntegrativoCents).toBe(impiegato30k.atteso2026.trattamentoIntegrativoCents)
    expect(r.nettoCents).toBe(impiegato30k.atteso2026.nettoCents)
    expect(r.tfrCents).toBe(impiegato30k.atteso2026.tfrCents)
  })

  it('sotto i 28.000 di imponibile il 2025 e il 2026 coincidono (il 33% non morde)', () => {
    const r2025 = computeDipendente(impiegato30k.input, getParams(2025))
    expect(r2025.nettoCents).toBe(impiegato30k.atteso2026.nettoCents)
  })

  it('RAL 40.000: il taglio 35→33% vale 166,48 € di IRPEF netta', () => {
    const r2026 = computeDipendente(impiegato40k.input, getParams(2026))
    const r2025 = computeDipendente(impiegato40k.input, getParams(2025))
    expect(r2026.irpefLordaCents).toBe(impiegato40k.atteso2026.irpefLordaCents)
    expect(r2026.irpefNettaCents).toBe(impiegato40k.atteso2026.irpefNettaCents)
    expect(r2026.nettoCents).toBe(impiegato40k.atteso2026.nettoCents)
    expect(r2025.irpefNettaCents).toBe(impiegato40k.atteso2025.irpefNettaCents)
  })

  it('RAL 18.000: somma integrativa (4,8% esente) e niente ulteriore detrazione', () => {
    const r = computeDipendente(impiegato18k.input, getParams(2026))
    expect(r.sommaIntegrativaCents).toBe(impiegato18k.atteso2026.sommaIntegrativaCents)
    expect(r.ulterioreDetrazioneCents).toBe(impiegato18k.atteso2026.ulterioreDetrazioneCents)
    expect(r.irpefNettaCents).toBe(impiegato18k.atteso2026.irpefNettaCents)
    expect(r.nettoCents).toBe(impiegato18k.atteso2026.nettoCents)
  })

  it('RAL 15.000: trattamento integrativo 1.200 E somma integrativa 5,3% cumulati', () => {
    const r = computeDipendente(impiegato15k.input, getParams(2026))
    expect(r.trattamentoIntegrativoCents).toBe(impiegato15k.atteso2026.trattamentoIntegrativoCents)
    expect(r.sommaIntegrativaCents).toBe(impiegato15k.atteso2026.sommaIntegrativaCents)
    expect(r.irpefNettaCents).toBe(impiegato15k.atteso2026.irpefNettaCents)
    expect(r.nettoCents).toBe(impiegato15k.atteso2026.nettoCents)
  })

  it('oltre 15 dipendenti: FIS (un terzo di 0,80%) e CIGS 0,30 in busta', () => {
    const r = computeDipendente(impiegato30kAziendaGrande.input, getParams(2026))
    expect(r.contributiCents).toBe(impiegato30kAziendaGrande.atteso2026.contributiCents)
    expect(r.irpefNettaCents).toBe(impiegato30kAziendaGrande.atteso2026.irpefNettaCents)
    expect(r.nettoCents).toBe(impiegato30kAziendaGrande.atteso2026.nettoCents)
  })

  it('con Fon.Te: 0,55% dedotto dall’imponibile, 1,55% del datore e TFR esposti a parte', () => {
    const r = computeDipendente(impiegato30kConFonTe.input, getParams(2026))
    expect(r.contributoFondoLavoratoreCents).toBe(impiegato30kConFonTe.atteso2026.contributoFondoLavoratoreCents)
    expect(r.contributoFondoDatoreCents).toBe(impiegato30kConFonTe.atteso2026.contributoFondoDatoreCents)
    expect(r.irpefNettaCents).toBe(impiegato30kConFonTe.atteso2026.irpefNettaCents)
    expect(r.nettoCents).toBe(impiegato30kConFonTe.atteso2026.nettoCents)
    expect(r.tfrCents).toBe(impiegato30kConFonTe.atteso2026.tfrCents)
  })

  it('RAL 130.000: massimale post-1995 sui contributi pensionistici e aliquota aggiuntiva 1%', () => {
    const r = computeDipendente(impiegato130k.input, getParams(2026))
    expect(r.contributiCents).toBe(impiegato130k.atteso2026.contributiCents)
    expect(r.imponibileIrpefCents).toBe(impiegato130k.atteso2026.imponibileIrpefCents)
    expect(r.irpefLordaCents).toBe(impiegato130k.atteso2026.irpefLordaCents)
    expect(r.irpefNettaCents).toBe(impiegato130k.atteso2026.irpefNettaCents)
    expect(r.nettoCents).toBe(impiegato130k.atteso2026.nettoCents)
    expect(r.tfrCents).toBe(impiegato130k.atteso2026.tfrCents)
  })

  it('le addizionali si applicano sull’imponibile IRPEF e riducono il netto (regione dal dataset)', () => {
    const r = computeDipendente({ ...impiegato30k.input, regione: 'trento' }, getParams(2026))
    // RC 27.243 ≤ 30.000 → deduzione trentina: addizionale regionale ZERO anche da dipendente
    expect(r.addizionaleRegionaleCents).toBe(0)
    const rAliquota = computeDipendente({ ...impiegato30k.input, addizionaleRegionale: 0.0123 }, getParams(2026))
    expect(rAliquota.addizionaleRegionaleCents).toBe(33_509) // 1,23% × 27.243 = 335,09
    expect(rAliquota.nettoCents).toBe(impiegato30k.atteso2026.nettoCents - 33_509)
  })
})
