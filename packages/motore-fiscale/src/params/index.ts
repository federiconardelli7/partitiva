import { params2025 } from './2025'
import { params2026 } from './2026'
import type { FiscalParams } from './types'

const REGISTRY: Record<number, FiscalParams> = {
  2025: params2025,
  2026: params2026,
}

export const SUPPORTED_YEARS: readonly number[] = Object.keys(REGISTRY)
  .map(Number)
  .sort((a, b) => a - b)

export function getParams(anno: number): FiscalParams {
  const params = REGISTRY[anno]
  if (!params) {
    throw new Error(
      `Parametri fiscali non disponibili per il ${anno}. Anni supportati: ${SUPPORTED_YEARS.join(', ')}. ` +
        'Per aggiungere un anno: vedi CONTRIBUTING.md (procedura di aggiornamento fiscale annuale).',
    )
  }
  return params
}

export type { FiscalParams, Fonte, ParamAnnuale, Rate } from './types'
export { defineParams } from './types'
