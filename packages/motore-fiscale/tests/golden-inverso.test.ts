import { describe, expect, it } from 'vitest'
import { computeAnno, computeDipendente, computeOrdinario, invertiNetto } from '../src/index'
import { cents, type Cents } from '../src/money'
import { getParams } from '../src/params'
import {
  inversoDipendente,
  inversoDipendenteTrappola,
  inversoForfettario,
  inversoForfettarioIrraggiungibile,
  inversoOrdinario,
} from './golden/caso-inverso'

// Golden del calcolo inverso («che fatturato per X € netti»): lordi in euro interi
// quadrati a mano rifacendo la catena forward (v. caso-inverso.ts). Ogni caso verifica
// anche la postcondizione: al lordo atteso il netto raggiunge l'obiettivo, all'euro
// precedente no.

const params = getParams(2026)

const nettoForfettario =
  (scenario: typeof inversoForfettario.scenario | typeof inversoForfettarioIrraggiungibile.scenario) =>
  (lordoCents: Cents): Cents =>
    computeAnno({ ...scenario, incassatoCents: lordoCents }, params).nettoRealeCents

const nettoDipendente =
  (input: typeof inversoDipendente.input) =>
  (lordoCents: Cents): Cents =>
    computeDipendente({ ...input, ralCents: lordoCents }, params).nettoCents

const nettoOrdinario =
  (input: typeof inversoOrdinario.input) =>
  (lordoCents: Cents): Cents => {
    const r = computeOrdinario({ ...input, incassatoCents: lordoCents }, params)
    return cents(lordoCents - input.costiCents - r.totaleCents)
  }

describe('golden inverso — invertiNetto sulle tre catene', () => {
  it('forfettario 78% startup: netto 30.000 → fatturato 39.596,00 (netto verificato 30.000,06)', () => {
    const netto = nettoForfettario(inversoForfettario.scenario)
    const r = invertiNetto(inversoForfettario.targetCents, netto, {
      massimoCents: params.soglie.uscitaAnnoSuccessivo.valore,
    })
    expect(r).toEqual({
      lordoCents: inversoForfettario.atteso.lordoCents,
      nettoCents: inversoForfettario.atteso.nettoCents,
    })
    // Postcondizione: l'euro precedente non basta.
    expect(netto(cents(inversoForfettario.atteso.lordoCents - 100))).toBeLessThan(inversoForfettario.targetCents)
  })

  it('forfettario 40% al 15%: netto 72.000 non raggiungibile entro il tetto di permanenza', () => {
    const netto = nettoForfettario(inversoForfettarioIrraggiungibile.scenario)
    const massimo = params.soglie.uscitaAnnoSuccessivo.valore
    expect(invertiNetto(inversoForfettarioIrraggiungibile.targetCents, netto, { massimoCents: massimo })).toBeNull()
    // Al tetto (85.000) il netto reale è 71.036,20: è il numero che la UI dichiara.
    expect(netto(cents(massimo))).toBe(inversoForfettarioIrraggiungibile.nettoAlTettoCents)
  })

  it('dipendente: per il netto del golden A (24.021,37) serve ESATTAMENTE RAL 30.000,00', () => {
    const netto = nettoDipendente(inversoDipendente.input)
    const r = invertiNetto(inversoDipendente.targetCents, netto, { massimoCents: 200_000_000 })
    expect(r).toEqual({
      lordoCents: inversoDipendente.atteso.lordoCents,
      nettoCents: inversoDipendente.atteso.nettoCents,
    })
    expect(netto(cents(inversoDipendente.atteso.lordoCents - 100))).toBeLessThan(inversoDipendente.targetCents)
  })

  it('dipendente, trappola del trattamento integrativo: RAL minima 16.452 E stabile 16.640', () => {
    const netto = nettoDipendente(inversoDipendenteTrappola.input)
    const r = invertiNetto(inversoDipendenteTrappola.targetCents, netto, { massimoCents: 200_000_000 })
    expect(r).toEqual(inversoDipendenteTrappola.atteso)
    // La trappola è reale: 98 € di RAL in più della minima, 59,65 € di netto in meno.
    expect(netto(cents(inversoDipendenteTrappola.nellaTrappola.ralCents))).toBe(
      inversoDipendenteTrappola.nellaTrappola.nettoCents,
    )
    expect(netto(cents(inversoDipendenteTrappola.atteso.lordoCents - 100))).toBeLessThan(
      inversoDipendenteTrappola.targetCents,
    )
    expect(netto(cents(inversoDipendenteTrappola.atteso.lordoStabileCents - 100))).toBeLessThan(
      inversoDipendenteTrappola.targetCents,
    )
  })

  it('ordinario con regionale a mano 1,23%: netto 25.000 → incassato 44.870,00', () => {
    const netto = nettoOrdinario(inversoOrdinario.input)
    const r = invertiNetto(inversoOrdinario.targetCents, netto, { massimoCents: 200_000_000 })
    expect(r).toEqual({
      lordoCents: inversoOrdinario.atteso.lordoCents,
      nettoCents: inversoOrdinario.atteso.nettoCents,
    })
    expect(netto(cents(inversoOrdinario.atteso.lordoCents - 100))).toBeLessThan(inversoOrdinario.targetCents)
  })
})
