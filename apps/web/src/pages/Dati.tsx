import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { BackupMenu } from '../components/Backup'
import { IntestazionePagina } from '../components/IntestazionePagina'
import { RegistroEntrate } from '../components/RegistroEntrate'
import { Wizard } from '../components/Wizard'
import { db, type Fattura, type Profilo, type RiepilogoAnnuale } from '../db'
import { settoreProfilo } from '../lib/bilancio'
import { formatEuro, formatPercento, parseImportoIt } from '../lib/format'
import { riepilogoFormSchema } from '../lib/schemi'

const card = 'rounded-xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900'

/** L'hub della sorgente: fatture, riepiloghi, profilo e backup vivono qui e solo qui. */
export function Dati({
  profilo,
  fatture,
  riepiloghi,
}: {
  profilo: Profilo | null
  fatture: Fattura[]
  riepiloghi: RiepilogoAnnuale[]
}) {
  const [modificaProfilo, setModificaProfilo] = useState(false)

  if (!profilo) {
    return (
      <div className="space-y-6">
        <IntestazionePagina titolo="I miei dati">
          Per calcolare imposta, contributi e scadenze servono tre dati. Restano in questo
          browser e si cambiano quando vuoi.
        </IntestazionePagina>
        <Wizard />
      </div>
    )
  }

  const settore = settoreProfilo(profilo)

  return (
    <div className="space-y-8">
      <IntestazionePagina titolo="I miei dati">
        La sorgente di tutto: quello che inserisci qui alimenta da solo la Panoramica e le
        scadenze. Resta in questo browser.
      </IntestazionePagina>

      <section className="space-y-3">
        <h3 className="text-base font-semibold">Fatture</h3>
        <RegistroEntrate fatture={fatture} />
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-semibold">Riepiloghi annuali</h3>
        <FormRiepilogo annoApertura={profilo.annoApertura} />
        {riepiloghi.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900">
            <table className="w-full text-sm">
              <thead className="border-b border-stone-200 text-left text-xs uppercase text-stone-500 dark:border-stone-800">
                <tr>
                  <th className="px-3 py-2">Anno</th>
                  <th className="px-3 py-2 text-right">Incassato (pregresso)</th>
                  <th className="px-3 py-2 text-right">Bolli</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {riepiloghi.map((r) => (
                  <tr key={r.anno} className="border-b border-stone-100 last:border-0 dark:border-stone-800/50">
                    <td className="px-3 py-2 font-mono">
                      {r.anno}
                      {r.anno < profilo.annoApertura && (
                        <span className="ml-2 text-xs text-red-600">precede l'apertura: ignorato dalla catena</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatEuro(r.incassatoCents)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-stone-500">
                      {r.bolliCents > 0 ? formatEuro(r.bolliCents) : '—'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Eliminare il riepilogo del ${r.anno}?`)) void db.riepiloghi.delete(r.anno)
                        }}
                        className="text-xs text-stone-400 hover:text-red-600"
                      >
                        elimina
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Non vuoi ricostruire un anno fattura per fattura? Inserisci il totale incassato:
          si <strong>somma</strong> alle fatture di quell'anno e alimenta da solo Panoramica,
          scadenze e Simulatore. Salvare lo stesso anno sostituisce il riepilogo precedente.
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Profilo</h3>
          {!modificaProfilo && (
            <button
              type="button"
              onClick={() => setModificaProfilo(true)}
              className="rounded-md border border-emerald-700 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950"
            >
              Modifica
            </button>
          )}
        </div>
        {modificaProfilo ? (
          <Wizard esistente={profilo} onFine={() => setModificaProfilo(false)} />
        ) : (
          <dl className={`grid grid-cols-2 gap-4 sm:grid-cols-4 ${card}`}>
            <div>
              <dt className="text-xs uppercase tracking-wide text-stone-500">Anno di apertura</dt>
              <dd className="mt-0.5 font-semibold tabular-nums">{profilo.annoApertura}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-stone-500">Settore</dt>
              <dd className="mt-0.5 font-semibold">
                {settore ? `${settore} — ${formatPercento(profilo.coefficiente)}` : `settore al ${formatPercento(profilo.coefficiente)}`}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-stone-500">ATECO</dt>
              <dd className="mt-0.5 font-mono font-semibold">{profilo.ateco || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-stone-500">Gestione Separata</dt>
              <dd className="mt-0.5 font-semibold">{profilo.copertura === 'piena' ? 'Piena' : 'Ridotta'}</dd>
            </div>
          </dl>
        )}
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Questi tre dati decidono aliquote e scadenze di tutta l'app: se correggi qui, tutto
          si ricalcola da solo.
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Backup</h3>
          <BackupMenu profilo={profilo} fatture={fatture} riepiloghi={riepiloghi} />
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Questo browser è l'unica copia dei tuoi dati: esporta un backup ogni tanto.
          L'import sostituisce tutto, previa conferma.
        </p>
      </section>
    </div>
  )
}

type RiepilogoFormValues = z.input<typeof riepilogoFormSchema>

function FormRiepilogo({ annoApertura }: { annoApertura: number }) {
  const annoCorrente = new Date().getFullYear()
  const anni = Array.from({ length: annoCorrente - annoApertura + 1 }, (_, i) => annoApertura + i)
  const campo = 'mt-1 w-full rounded-md border border-stone-300 px-3 py-2 dark:border-stone-700 dark:bg-stone-800'
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RiepilogoFormValues>({
    resolver: zodResolver(riepilogoFormSchema),
    defaultValues: { anno: Math.max(annoApertura, annoCorrente - 1), incassato: '', bolli: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    const parsed = riepilogoFormSchema.parse(values)
    const incassatoCents = parseImportoIt(parsed.incassato)
    if (incassatoCents === null) return
    const bolliCents = parsed.bolli.trim() === '' ? 0 : (parseImportoIt(parsed.bolli) ?? 0)
    await db.riepiloghi.put({ anno: parsed.anno, incassatoCents, bolliCents })
    reset({ ...values, incassato: '', bolli: '' })
  })

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:grid-cols-4 dark:border-stone-800 dark:bg-stone-900"
    >
      <label className="text-sm">
        Anno
        <select {...register('anno')} className={campo}>
          {anni.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        Totale incassato nell'anno (€)
        <input placeholder="12.000,00" {...register('incassato')} className={campo} />
        {errors.incassato && <span className="text-red-600">{errors.incassato.message}</span>}
      </label>
      <label className="text-sm">
        Bolli dell'anno (€, facoltativo)
        <input placeholder="0" {...register('bolli')} className={campo} />
        {errors.bolli && <span className="text-red-600">{errors.bolli.message}</span>}
      </label>
      <button
        type="submit"
        className="self-end rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
      >
        Salva riepilogo
      </button>
    </form>
  )
}
