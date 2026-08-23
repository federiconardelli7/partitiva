import { zodResolver } from '@hookform/resolvers/zod'
import { bolloPerFattura, cents } from '@partitiva/motore-fiscale'
import { estraiCampiPdf, parseFatturaFile } from '@partitiva/parser-fatture'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { db, type Fattura } from '../db'
import { annoDi, paramsVicini } from '../lib/bilancio'
import { centsInInput, formatDataIt, formatEuro, oggiIso, parseImportoIt } from '../lib/format'

import { fatturaFormSchema } from '../lib/schemi'

type FormValues = z.input<typeof fatturaFormSchema>

export function RegistroEntrate({ fatture }: { fatture: Fattura[] }) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(fatturaFormSchema),
    defaultValues: {
      numero: '',
      dataEmissione: oggiIso(),
      importo: '',
      bollo: '',
      descrizione: '',
      incassata: true,
      dataIncasso: oggiIso(),
    },
  })

  const incassata = watch('incassata')
  const importoCents = parseImportoIt(watch('importo') ?? '')
  const anteprimaBollo =
    importoCents !== null
      ? bolloPerFattura(cents(importoCents), paramsVicini(annoDi(watch('dataEmissione') ?? oggiIso())))
      : 0

  const onSubmit = handleSubmit(async (values) => {
    const parsed = fatturaFormSchema.parse(values)
    const importo = parseImportoIt(parsed.importo)
    if (importo === null) return
    const bolloRegola = bolloPerFattura(cents(importo), paramsVicini(annoDi(parsed.dataEmissione)))
    const bolloCents = parsed.bollo.trim() === '' ? bolloRegola : (parseImportoIt(parsed.bollo) ?? bolloRegola)
    await db.fatture.add({
      numero: parsed.numero,
      dataEmissione: parsed.dataEmissione,
      dataIncasso: parsed.incassata ? parsed.dataIncasso : null,
      importoCents: importo,
      bolloCents,
      descrizione: parsed.descrizione,
    })
    reset({ ...values, numero: '', importo: '', bollo: '', descrizione: '' })
    setAvvisoPdf(null)
  })

  const segnaIncassata = (fattura: Fattura) => db.fatture.update(fattura.id!, { dataIncasso: oggiIso() })
  const elimina = (fattura: Fattura) => {
    if (window.confirm(`Eliminare la fattura n. ${fattura.numero}?`)) void db.fatture.delete(fattura.id!)
  }

  const inputFile = useRef<HTMLInputElement>(null)
  const inputPdf = useRef<HTMLInputElement>(null)
  const [avvisoPdf, setAvvisoPdf] = useState<{ titolo: string; avvisi: string[] } | null>(null)

  // Il PDF non salva MAI da solo: precompila il form e l'utente rivede prima di «Aggiungi».
  const importaPdf = async (file: File) => {
    try {
      const { estraiRighePdf } = await import('../lib/pdf')
      const righe = await estraiRighePdf(new Uint8Array(await file.arrayBuffer()))
      const estratto = estraiCampiPdf(righe)
      if (estratto.tipoDocumento && estratto.tipoDocumento !== 'TD01') {
        setAvvisoPdf({ titolo: `${file.name}: non importata`, avvisi: estratto.avvisi })
        return
      }
      reset({
        numero: estratto.numero ?? '',
        dataEmissione: estratto.data ?? oggiIso(),
        importo: estratto.importoTotaleCents !== null ? centsInInput(estratto.importoTotaleCents) : '',
        bollo: '',
        descrizione: '',
        incassata: false,
        dataIncasso: oggiIso(),
      })
      setAvvisoPdf({
        titolo: estratto.affidabile
          ? `${file.name}: campi estratti — controllali prima di salvare`
          : `${file.name}: estrazione parziale — completa i campi e controllali prima di salvare`,
        avvisi: estratto.avvisi,
      })
    } catch {
      setAvvisoPdf({
        titolo: `${file.name}: PDF non leggibile — inserisci i dati a mano`,
        avvisi: ['Il file non è un PDF valido o non contiene testo estraibile.'],
      })
    }
  }

  const importaFile = async (files: FileList) => {
    const esiti: string[] = []
    const esistenti = new Set(fatture.map((f) => `${annoDi(f.dataEmissione)}:${f.numero}`))
    for (const file of Array.from(files)) {
      try {
        const bytes = new Uint8Array(await file.arrayBuffer())
        const { fatture: parsate, warnings: warningsFile } = parseFatturaFile(file.name, bytes)
        for (const fattura of parsate) {
          if (fattura.tipoDocumento !== 'TD01') {
            esiti.push(
              `↷ ${file.name}: n. ${fattura.numero} è ${fattura.tipoDocumento || 'di tipo ignoto'} (non TD01): gestiscila manualmente`,
            )
            continue
          }
          const chiave = `${annoDi(fattura.data)}:${fattura.numero}`
          if (esistenti.has(chiave)) {
            esiti.push(`↷ ${file.name}: n. ${fattura.numero}/${annoDi(fattura.data)} già presente, saltata`)
            continue
          }
          const bolloRegola = bolloPerFattura(cents(fattura.importoTotaleCents), paramsVicini(annoDi(fattura.data)))
          const bolloCents = fattura.bollo?.importoCents ?? bolloRegola
          const warningsFattura =
            fattura.bollo && fattura.bollo.importoCents !== bolloRegola
              ? [...warningsFile, `bollo dichiarato ${formatEuro(fattura.bollo.importoCents)} ≠ regola ${formatEuro(bolloRegola)}`]
              : warningsFile
          await db.fatture.add({
            numero: fattura.numero,
            dataEmissione: fattura.data,
            dataIncasso: null,
            importoCents: fattura.importoTotaleCents,
            bolloCents,
            descrizione: fattura.righe[0]?.descrizione ?? '',
          })
          esistenti.add(chiave)
          esiti.push(
            `✓ ${file.name}: n. ${fattura.numero} del ${formatDataIt(fattura.data)}, ${formatEuro(fattura.importoTotaleCents)}${warningsFattura.length > 0 ? ` — ⚠ ${warningsFattura.join('; ')}` : ''}`,
          )
        }
      } catch (errore) {
        esiti.push(`✗ ${file.name}: ${errore instanceof Error ? errore.message : 'errore di lettura'}`)
      }
    }
    window.alert(`Import completato:\n\n${esiti.join('\n')}\n\nLe fatture importate sono "emesse": segna l'incasso quando arriva.`)
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={onSubmit}
        className="grid gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:grid-cols-2 dark:border-stone-800 dark:bg-stone-900"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 sm:col-span-2">
          <h2 className="text-sm font-semibold">Nuova fattura</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputPdf.current?.click()}
              className="rounded-md border border-stone-300 px-3 py-1 text-xs font-medium text-stone-600 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
              title="Estrae numero, data e totale dal PDF: tu controlli e salvi"
            >
              ⬆ Importa PDF (con revisione)
            </button>
            <button
              type="button"
              onClick={() => inputFile.current?.click()}
              className="rounded-md border border-emerald-700 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950"
              title="Carica fatture elettroniche XML FatturaPA, anche in busta .p7m"
            >
              ⬆ Importa XML / p7m
            </button>
          </div>
          <input
            ref={inputFile}
            type="file"
            multiple
            accept=".xml,.p7m"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) void importaFile(e.target.files)
              e.target.value = ''
            }}
          />
          <input
            ref={inputPdf}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void importaPdf(file)
              e.target.value = ''
            }}
          />
          {avvisoPdf && (
            <div
              role="status"
              className="w-full rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
            >
              <p className="font-semibold">📄 {avvisoPdf.titolo}</p>
              {avvisoPdf.avvisi.length > 0 && (
                <ul className="mt-1 list-inside list-disc">
                  {avvisoPdf.avvisi.map((avviso) => (
                    <li key={avviso}>{avviso}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <label className="text-sm">
          Numero
          <input {...register('numero')} className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 dark:border-stone-700 dark:bg-stone-800" />
          {errors.numero && <span className="text-red-600">{errors.numero.message}</span>}
        </label>
        <label className="text-sm">
          Data emissione
          <input type="date" {...register('dataEmissione')} className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 dark:border-stone-700 dark:bg-stone-800" />
        </label>
        <label className="text-sm">
          Importo (€)
          <input placeholder="1.234,56" {...register('importo')} className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 dark:border-stone-700 dark:bg-stone-800" />
          {errors.importo && <span className="text-red-600">{errors.importo.message}</span>}
        </label>
        <label className="text-sm">
          Bollo (€)
          <input placeholder="automatico" {...register('bollo')} className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 dark:border-stone-700 dark:bg-stone-800" />
          {errors.bollo && <span className="text-red-600">{errors.bollo.message}</span>}
          <span className="mt-1 block text-xs text-stone-500">
            Vuoto = regola: {formatEuro(anteprimaBollo)} per questo importo. Scrivilo solo per forzarlo.
          </span>
        </label>
        <label className="text-sm">
          Descrizione
          <input {...register('descrizione')} className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 dark:border-stone-700 dark:bg-stone-800" />
        </label>
        <div className="flex items-end gap-3 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('incassata')} /> Già incassata
          </label>
          {incassata && (
            <label>
              il
              <input type="date" {...register('dataIncasso')} className="ml-2 rounded-md border border-stone-300 px-2 py-1 dark:border-stone-700 dark:bg-stone-800" />
              {errors.dataIncasso && (
                <span className="block text-red-600">{errors.dataIncasso.message}</span>
              )}
            </label>
          )}
        </div>
        <button type="submit" className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 sm:justify-self-end">
          Aggiungi
        </button>
        <p className="text-xs text-stone-500 sm:col-span-2">
          Nel forfettario conta la <strong>data di incasso</strong>: una fattura di dicembre
          incassata a gennaio appartiene all’anno dopo.
        </p>
      </form>

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <table className="w-full text-sm">
          <thead className="border-b border-stone-200 text-left text-xs uppercase text-stone-500 dark:border-stone-800">
            <tr>
              <th className="px-3 py-2">N.</th>
              <th className="px-3 py-2">Emessa</th>
              <th className="px-3 py-2">Incassata</th>
              <th className="px-3 py-2 text-right">Importo</th>
              <th className="px-3 py-2 text-right">Bollo</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {fatture.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-stone-500">
                  Nessuna fattura: aggiungi la prima qui sopra.
                </td>
              </tr>
            )}
            {fatture.map((f) => (
              <tr key={f.id} className="border-b border-stone-100 last:border-0 dark:border-stone-800/50">
                <td className="px-3 py-2 font-mono">{f.numero}</td>
                <td className="px-3 py-2">{formatDataIt(f.dataEmissione)}</td>
                <td className="px-3 py-2">
                  {f.dataIncasso ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                      {formatDataIt(f.dataIncasso)}
                    </span>
                  ) : (
                    <button
                      onClick={() => void segnaIncassata(f)}
                      className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-200"
                    >
                      emessa — incassa oggi
                    </button>
                  )}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{formatEuro(f.importoCents)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-stone-500">
                  {f.bolloCents > 0 ? formatEuro(f.bolloCents) : '—'}
                </td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => elimina(f)} className="text-xs text-stone-500 hover:text-red-600">
                    elimina
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
