// Albero di spiegazione: ogni importo del motore è un nodo con formula, input e origine,
// così la UI può rendere "l'F24 spiegato" senza numeri magici (principio 4 del progetto).
import { cents, type Cents } from './money'
import type { Fonte } from './params/types'

export type NodeId = string
export type Origine = 'calcolato' | 'reale' | 'parametro'

export interface ExplainedValue {
  id: NodeId
  label: string
  formula: string
  inputs: NodeId[]
  value: Cents
  origine: Origine
  /** Presente quando un actual ha sovrascritto il calcolo: conserva il teorico per mostrare il delta. */
  valoreCalcolato?: Cents
  fonte?: Fonte
}

export type ExplainMap = Record<NodeId, ExplainedValue>

/** Valori reali forniti dall'utente (dichiarazioni, F24), per nodo — fino alla singola rata. */
export type Actuals = Record<NodeId, number>

export interface Explain {
  readonly map: ExplainMap
  nodo(
    id: NodeId,
    label: string,
    formula: string,
    inputs: NodeId[],
    calcolato: Cents,
    opts?: { fonte?: Fonte },
  ): Cents
  /** Chiavi di actuals che non corrispondono a nessun nodo creato (refusi o rami mai eseguiti). */
  chiaviActualsNonUsate(): NodeId[]
}

/** Fallisce ad alta voce se qualche actual non ha trovato il suo nodo: mai scartare in silenzio. */
export function assertActualsUsati(explain: Explain): void {
  const nonUsate = explain.chiaviActualsNonUsate()
  if (nonUsate.length > 0) {
    throw new Error(
      `Actuals con chiavi sconosciute (nessun nodo corrispondente nel calcolo): ${nonUsate.join(', ')}`,
    )
  }
}

export function createExplain(actuals: Actuals = {}): Explain {
  const map: ExplainMap = {}
  return {
    map,
    chiaviActualsNonUsate() {
      return Object.keys(actuals).filter((chiave) => map[chiave] === undefined)
    },
    nodo(id, label, formula, inputs, calcolato, opts) {
      const actual = actuals[id]
      const overridden = actual !== undefined
      const value = overridden ? cents(actual) : calcolato
      map[id] = {
        id,
        label,
        formula,
        inputs,
        value,
        origine: overridden ? 'reale' : 'calcolato',
        ...(overridden ? { valoreCalcolato: calcolato } : {}),
        ...(opts?.fonte ? { fonte: opts.fonte } : {}),
      }
      return value
    },
  }
}
