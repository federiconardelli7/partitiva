import { describe, expect, it } from 'vitest'
import { computeOrdinario } from '../src/index'
import { getParams } from '../src/params'
import {
  artigianoOrdinario2026,
  fasciaMedia2026,
  perditaArtigiano2026,
  professionista2025,
  professionista2026,
  redditiAlti2026,
} from './golden/caso-ordinario'

// Golden del regime ordinario (per il confronto «quando conviene uscire»):
// valori sintetici quadrati a mano contro i testi vigenti (v. caso-ordinario.ts).

describe('golden ordinario — computeOrdinario', () => {
  it('professionista GS 2026: scaglioni 23/33, detrazione LA troncata a 4 decimali, addizionali', () => {
    const r = computeOrdinario(professionista2026.input, getParams(2026))
    expect(r.redditoCents).toBe(professionista2026.atteso.redditoCents)
    expect(r.contributiDovutiCents).toBe(professionista2026.atteso.contributiDovutiCents)
    expect(r.imponibileIrpefCents).toBe(professionista2026.atteso.imponibileIrpefCents)
    expect(r.irpefLordaCents).toBe(professionista2026.atteso.irpefLordaCents)
    expect(r.detrazioneLavoroAutonomoCents).toBe(professionista2026.atteso.detrazioneLavoroAutonomoCents)
    expect(r.detrazioneOneriCents).toBe(professionista2026.atteso.detrazioneOneriCents)
    expect(r.irpefNettaCents).toBe(professionista2026.atteso.irpefNettaCents)
    expect(r.addizionaleRegionaleCents).toBe(professionista2026.atteso.addizionaleRegionaleCents)
    expect(r.addizionaleComunaleCents).toBe(professionista2026.atteso.addizionaleComunaleCents)
    expect(r.totaleCents).toBe(professionista2026.atteso.totaleCents)
  })

  it('stesso caso nel 2025: cambia solo il 35% dello scaglione centrale', () => {
    const r = computeOrdinario(professionista2026.input, getParams(2025))
    expect(r.irpefLordaCents).toBe(professionista2025.atteso.irpefLordaCents)
    expect(r.irpefNettaCents).toBe(professionista2025.atteso.irpefNettaCents)
  })

  it('redditi alti 2026: massimale GS, tetto oneri coi figli, degressione e taglio −440 con clamp a zero', () => {
    const r = computeOrdinario(redditiAlti2026.input, getParams(2026))
    expect(r.contributiDovutiCents).toBe(redditiAlti2026.atteso.contributiDovutiCents)
    expect(r.imponibileIrpefCents).toBe(redditiAlti2026.atteso.imponibileIrpefCents)
    expect(r.irpefLordaCents).toBe(redditiAlti2026.atteso.irpefLordaCents)
    expect(r.detrazioneOneriCents).toBe(redditiAlti2026.atteso.detrazioneOneriCents)
    expect(r.irpefNettaCents).toBe(redditiAlti2026.atteso.irpefNettaCents)
    expect(r.totaleCents).toBe(redditiAlti2026.atteso.totaleCents)
  })

  it('nel 2025 il taglio −440 non esiste: la stessa detrazione oneri sopravvive alla sola degressione', () => {
    // Stesso input di C ma anno 2025: RC cambia di poco (35% non incide: stessi contributi),
    // il taglio è null → detrazione oneri > 0 (69,29 € circa, ricalcolata dal motore).
    const r = computeOrdinario(redditiAlti2026.input, getParams(2025))
    expect(r.detrazioneOneriCents).toBeGreaterThan(0)
  })

  it('artigiano IVS 2026: fissi + eccedenza sul reddito effettivo, non sul forfait', () => {
    const r = computeOrdinario(artigianoOrdinario2026.input, getParams(2026))
    expect(r.contributiDovutiCents).toBe(artigianoOrdinario2026.atteso.contributiDovutiCents)
    expect(r.imponibileIrpefCents).toBe(artigianoOrdinario2026.atteso.imponibileIrpefCents)
    expect(r.irpefLordaCents).toBe(artigianoOrdinario2026.atteso.irpefLordaCents)
    expect(r.detrazioneLavoroAutonomoCents).toBe(artigianoOrdinario2026.atteso.detrazioneLavoroAutonomoCents)
    expect(r.irpefNettaCents).toBe(artigianoOrdinario2026.atteso.irpefNettaCents)
    expect(r.totaleCents).toBe(artigianoOrdinario2026.atteso.totaleCents)
  })

  it('perdita: reddito clampato a zero col flag, ma i fissi IVS restano dovuti', () => {
    const r = computeOrdinario(perditaArtigiano2026.input, getParams(2026))
    expect(r.redditoCents).toBe(perditaArtigiano2026.atteso.redditoCents)
    expect(r.contributiDovutiCents).toBe(perditaArtigiano2026.atteso.contributiDovutiCents)
    expect(r.irpefNettaCents).toBe(perditaArtigiano2026.atteso.irpefNettaCents)
    expect(r.totaleCents).toBe(perditaArtigiano2026.atteso.totaleCents)
    expect(r.flags.some((f) => f.codice === 'ordinario-perdita')).toBe(true)
  })

  it('fascia media 2026: bonus +50 tra 11k e 17k; soglia comunale a scalino (sotto = zero)', () => {
    const r = computeOrdinario(fasciaMedia2026.input, getParams(2026))
    expect(r.imponibileIrpefCents).toBe(fasciaMedia2026.atteso.imponibileIrpefCents)
    expect(r.irpefLordaCents).toBe(fasciaMedia2026.atteso.irpefLordaCents)
    expect(r.detrazioneLavoroAutonomoCents).toBe(fasciaMedia2026.atteso.detrazioneLavoroAutonomoCents)
    expect(r.irpefNettaCents).toBe(fasciaMedia2026.atteso.irpefNettaCents)
    expect(r.addizionaleRegionaleCents).toBe(fasciaMedia2026.atteso.addizionaleRegionaleCents)
    expect(r.addizionaleComunaleCents).toBe(fasciaMedia2026.atteso.addizionaleComunaleCents)
    const senzaSoglia = computeOrdinario(
      { ...fasciaMedia2026.input, sogliaEsenzioneComunaleCents: null },
      getParams(2026),
    )
    expect(senzaSoglia.addizionaleComunaleCents).toBe(fasciaMedia2026.comunaleSenzaSogliaCents)
  })

  it('le addizionali non sono dovute se l’IRPEF netta è zero (detrazioni ≥ lorda)', () => {
    // RC bassissimo: lorda < detrazione LA (1.265) → netta 0 → addizionali 0 per legge.
    const r = computeOrdinario(
      { ...fasciaMedia2026.input, incassatoCents: 600_000, costiCents: 100_000, sogliaEsenzioneComunaleCents: null },
      getParams(2026),
    )
    expect(r.irpefNettaCents).toBe(0)
    expect(r.addizionaleRegionaleCents).toBe(0)
    expect(r.addizionaleComunaleCents).toBe(0)
  })
})
