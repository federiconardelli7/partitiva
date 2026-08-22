import { describe, expect, it } from 'vitest'
import { backupSchema, fatturaFormSchema } from '../src/lib/schemi'

const base = {
  numero: '7',
  dataEmissione: '2026-07-15',
  importo: '4.385,00',
  descrizione: '',
}

describe('schema del form fattura', () => {
  it('incassata spuntata SENZA data → errore sul campo, mai salvataggio silenzioso', () => {
    const esito = fatturaFormSchema.safeParse({ ...base, incassata: true, dataIncasso: '' })
    expect(esito.success).toBe(false)
    if (!esito.success) {
      expect(esito.error.issues.some((i) => i.path.includes('dataIncasso'))).toBe(true)
    }
  })

  it('incassata con data valida → ok; non incassata senza data → ok', () => {
    expect(fatturaFormSchema.safeParse({ ...base, incassata: true, dataIncasso: '2026-07-20' }).success).toBe(true)
    expect(fatturaFormSchema.safeParse({ ...base, incassata: false, dataIncasso: '' }).success).toBe(true)
  })
})

describe('schema del backup JSON', () => {
  it('accetta un backup valido con schemaVersion 1', () => {
    const esito = backupSchema.safeParse({
      schemaVersion: 1,
      esportatoIl: '2026-08-22',
      profilo: { id: 1, annoApertura: 2025, ateco: '62.02.00', coefficiente: 0.67, copertura: 'piena' },
      fatture: [
        { numero: '1', dataEmissione: '2026-07-15', dataIncasso: null, importoCents: 438_500, bolloCents: 200, descrizione: '' },
      ],
    })
    expect(esito.success).toBe(true)
  })

  it('rifiuta schemaVersion sconosciute e strutture arbitrarie', () => {
    expect(backupSchema.safeParse({ schemaVersion: 2, fatture: [] }).success).toBe(false)
    expect(backupSchema.safeParse({ qualcosa: 'altro' }).success).toBe(false)
  })
})
