import { describe, expect, it } from 'vitest'
import {
  backupSchema,
  fatturaFormSchema,
  profiloFormSchema,
  riepilogoFormSchema,
  riepilogoRecordSchema,
  spesaFormSchema,
  spesaRecordSchema,
} from '../src/lib/schemi'

describe('schema del profilo (wizard) — ATECO facoltativo, settore obbligatorio', () => {
  const base = { annoApertura: '2025', copertura: 'piena' }

  it('basta il settore/coefficiente, senza codice ATECO', () => {
    expect(profiloFormSchema.safeParse({ ...base, ateco: '', coefficiente: '0.67' }).success).toBe(true)
  })

  it('con ATECO valido ok; formato sbagliato → errore', () => {
    expect(profiloFormSchema.safeParse({ ...base, ateco: '62.02.00', coefficiente: '0.67' }).success).toBe(true)
    expect(profiloFormSchema.safeParse({ ...base, ateco: 'x62', coefficiente: '0.67' }).success).toBe(false)
  })

  it('senza coefficiente → errore (o ATECO riconosciuto o settore scelto)', () => {
    expect(profiloFormSchema.safeParse({ ...base, ateco: '', coefficiente: '' }).success).toBe(false)
  })

  it('anno di apertura prima del 2025 → errore (i parametri partono da lì)', () => {
    expect(profiloFormSchema.safeParse({ annoApertura: '2019', ateco: '', coefficiente: '0.67', copertura: 'piena' }).success).toBe(false)
  })
})

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

  it('rifiuta schemaVersion sconosciute, v2 malformate e strutture arbitrarie', () => {
    expect(backupSchema.safeParse({ schemaVersion: 3, fatture: [] }).success).toBe(false)
    expect(backupSchema.safeParse({ schemaVersion: 2, fatture: [] }).success).toBe(false)
    expect(backupSchema.safeParse({ qualcosa: 'altro' }).success).toBe(false)
  })
})

describe('schema dei riepiloghi annuali (pregresso)', () => {
  const ANNO_CORRENTE = new Date().getFullYear()

  it('riepilogo valido: anno coperto dai params e importi non negativi', () => {
    expect(riepilogoRecordSchema.safeParse({ anno: 2025, incassatoCents: 1_000_000, bolliCents: 400 }).success).toBe(true)
  })

  it('anno futuro o pre-params → errore (il futuro si simula, non si registra)', () => {
    expect(riepilogoRecordSchema.safeParse({ anno: ANNO_CORRENTE + 1, incassatoCents: 0, bolliCents: 0 }).success).toBe(false)
    expect(riepilogoRecordSchema.safeParse({ anno: 2019, incassatoCents: 0, bolliCents: 0 }).success).toBe(false)
  })

  it('importi negativi rifiutati; il form accetta importi italiani e bolli facoltativi', () => {
    expect(riepilogoRecordSchema.safeParse({ anno: 2025, incassatoCents: -1, bolliCents: 0 }).success).toBe(false)
    expect(riepilogoFormSchema.safeParse({ anno: '2025', incassato: '10.000,00', bolli: '' }).success).toBe(true)
    expect(riepilogoFormSchema.safeParse({ anno: '2025', incassato: 'abc', bolli: '' }).success).toBe(false)
  })

  it('un backup v1 importato diventa v3 con riepiloghi e spese vuoti', () => {
    const esito = backupSchema.safeParse({ schemaVersion: 1, esportatoIl: '2026-08-22', profilo: null, fatture: [] })
    expect(esito.success).toBe(true)
    if (esito.success) {
      expect(esito.data.schemaVersion).toBe(3)
      expect(esito.data.riepiloghi).toEqual([])
      expect(esito.data.spese).toEqual([])
    }
  })

  it('un backup v2 diventa v3: riepiloghi conservati, spese vuote', () => {
    const esito = backupSchema.safeParse({
      schemaVersion: 2,
      esportatoIl: '2026-08-22',
      profilo: null,
      fatture: [],
      riepiloghi: [{ anno: 2025, incassatoCents: 1_000_000, bolliCents: 0 }],
    })
    expect(esito.success).toBe(true)
    if (esito.success) {
      expect(esito.data.schemaVersion).toBe(3)
      expect(esito.data.riepiloghi).toHaveLength(1)
      expect(esito.data.spese).toEqual([])
    }
  })

  it('riepiloghi con lo stesso anno due volte → backup rifiutato (v2 e v3)', () => {
    const doppi = [
      { anno: 2025, incassatoCents: 100, bolliCents: 0 },
      { anno: 2025, incassatoCents: 200, bolliCents: 0 },
    ]
    expect(
      backupSchema.safeParse({ schemaVersion: 3, esportatoIl: 'x', profilo: null, fatture: [], spese: [], riepiloghi: doppi }).success,
    ).toBe(false)
    expect(
      backupSchema.safeParse({ schemaVersion: 2, esportatoIl: 'x', profilo: null, fatture: [], riepiloghi: doppi }).success,
    ).toBe(false)
  })
})

describe('schema delle spese (non deducibili: solo netto reale)', () => {
  it('spesa valida; negativi e date non ISO rifiutati', () => {
    expect(spesaRecordSchema.safeParse({ data: '2026-03-10', importoCents: 5_000, descrizione: 'hosting' }).success).toBe(true)
    expect(spesaRecordSchema.safeParse({ data: '2026-03-10', importoCents: -1, descrizione: '' }).success).toBe(false)
    expect(spesaRecordSchema.safeParse({ data: '10/03/2026', importoCents: 100, descrizione: '' }).success).toBe(false)
  })

  it('il form spese accetta importi italiani e rifiuta il resto', () => {
    expect(spesaFormSchema.safeParse({ data: '2026-03-10', importo: '1.234,56', descrizione: 'router' }).success).toBe(true)
    expect(spesaFormSchema.safeParse({ data: '2026-03-10', importo: 'abc', descrizione: '' }).success).toBe(false)
  })
})
