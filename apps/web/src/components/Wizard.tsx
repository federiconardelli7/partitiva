import { zodResolver } from '@hookform/resolvers/zod'
import { coefficientePerAteco, GRUPPI_ATECO } from '@partitiva/motore-fiscale'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { db } from '../db'

import type { Profilo } from '../db'

const ANNO_CORRENTE = new Date().getFullYear()

const schema = z.object({
  annoApertura: z.coerce.number().int().min(2025, 'I parametri partono dal 2025').max(ANNO_CORRENTE),
  ateco: z.string().regex(/^\d{2}(\.\d{2}(\.\d{2})?)?$/, 'Formato atteso: 62.02.00'),
  coefficiente: z.coerce.number().min(0.01).max(1),
  copertura: z.enum(['piena', 'ridotta']),
})

type FormValues = z.input<typeof schema>

export function Wizard({ esistente, onFine }: { esistente?: Profilo; onFine?: () => void }) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: esistente
      ? { annoApertura: esistente.annoApertura, ateco: esistente.ateco, coefficiente: esistente.coefficiente, copertura: esistente.copertura }
      : { annoApertura: ANNO_CORRENTE, ateco: '', copertura: 'piena' },
  })

  const gruppo = coefficientePerAteco(watch('ateco') ?? '')

  const onSubmit = handleSubmit(async (values) => {
    const parsed = schema.parse(values)
    await db.profilo.put({ id: 1, ...parsed })
    onFine?.()
  })

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-lg space-y-5 rounded-xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
      <div>
        <h2 className="text-lg font-semibold">
          {esistente ? 'Modifica profilo' : 'Benvenuto 👋 — configura la tua P.IVA'}
        </h2>
        <p className="text-sm text-stone-500">Tre dati e sei operativo. Tutto resta sul tuo dispositivo.</p>
      </div>

      <label className="block text-sm">
        <span className="font-medium">Anno di apertura della P.IVA</span>
        <input
          type="number"
          {...register('annoApertura')}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 dark:border-stone-700 dark:bg-stone-800"
        />
        {errors.annoApertura && <span className="text-red-600">{errors.annoApertura.message}</span>}
        <span className="mt-1 block text-xs text-stone-500">
          Serve per l’aliquota startup (5% per i primi 5 anni) e il countdown verso il 15%.
        </span>
      </label>

      <label className="block text-sm">
        <span className="font-medium">Codice ATECO</span>
        <input
          type="text"
          placeholder="62.02.00"
          {...register('ateco', {
            onChange: (e) => {
              const g = coefficientePerAteco(String(e.target.value))
              if (g) setValue('coefficiente', g.coefficiente)
            },
          })}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-mono dark:border-stone-700 dark:bg-stone-800"
        />
        {errors.ateco && <span className="text-red-600">{errors.ateco.message}</span>}
        {gruppo && (
          <span className="mt-1 block text-xs text-emerald-700 dark:text-emerald-400">
            {gruppo.settore} → coefficiente {Math.round(gruppo.coefficiente * 100)}%
          </span>
        )}
      </label>

      <label className="block text-sm">
        <span className="font-medium">Coefficiente di redditività</span>
        <select
          {...register('coefficiente')}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 dark:border-stone-700 dark:bg-stone-800"
        >
          <option value="">— scegli il gruppo —</option>
          {GRUPPI_ATECO.map((g) => (
            <option key={g.settore} value={g.coefficiente}>
              {Math.round(g.coefficiente * 100)}% — {g.settore}
            </option>
          ))}
        </select>
        {errors.coefficiente && <span className="text-red-600">Scegli il coefficiente</span>}
      </label>

      <fieldset className="text-sm">
        <legend className="font-medium">Gestione Separata INPS</legend>
        <label className="mt-1 flex items-center gap-2">
          <input type="radio" value="piena" {...register('copertura')} />
          Aliquota piena (26,07%) — nessun’altra copertura previdenziale
        </label>
        <label className="mt-1 flex items-center gap-2">
          <input type="radio" value="ridotta" {...register('copertura')} />
          Aliquota ridotta (24%) — pensionato o altra copertura
        </label>
      </fieldset>

      <button
        type="submit"
        className="w-full rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800"
      >
        Inizia a tracciare
      </button>
    </form>
  )
}
