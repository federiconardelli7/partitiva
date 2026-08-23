import { zodResolver } from '@hookform/resolvers/zod'
import { coefficientePerAteco, ENTITA_REGIONALI, GRUPPI_ATECO } from '@partitiva/motore-fiscale'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { db, type Profilo } from '../db'
import { settoreProfilo } from '../lib/bilancio'
import { profiloFormSchema } from '../lib/schemi'

const ANNO_CORRENTE = new Date().getFullYear()

type FormValues = z.input<typeof profiloFormSchema>

export function Wizard({ esistente, onFine }: { esistente?: Profilo; onFine?: () => void }) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(profiloFormSchema),
    defaultValues: esistente
      ? {
          annoApertura: esistente.annoApertura,
          ateco: esistente.ateco,
          // SEMPRE via settoreProfilo (valida nome e coerenza): i profili al 40% senza
          // nome certo richiedono una scelta esplicita, mai pre-selezionare il primo.
          settore: settoreProfilo(esistente) ?? '',
          copertura: esistente.copertura,
          gestione: esistente.gestione ?? 'gestione-separata',
          anzianitaAl1995: esistente.anzianitaAl1995 ?? false,
          riduzioneIvs: esistente.riduzioneIvs ?? 'nessuna',
          regione: esistente.regione ?? '',
        }
      : {
          annoApertura: ANNO_CORRENTE,
          ateco: '',
          settore: '',
          copertura: 'piena',
          gestione: 'gestione-separata',
          anzianitaAl1995: false,
          riduzioneIvs: 'nessuna',
          regione: '',
        },
  })

  const gruppo = coefficientePerAteco(watch('ateco') ?? '')

  const onSubmit = handleSubmit(async (values) => {
    const parsed = profiloFormSchema.parse(values)
    await db.profilo.put({ id: 1, ...parsed })
    onFine?.()
  })

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-lg space-y-5 rounded-xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900"
    >
      <div>
        <h2 className="text-lg font-semibold">
          {esistente ? 'Modifica profilo' : 'Benvenuto 👋 — configura la tua P.IVA'}
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Questi tre dati servono solo a calcolare imposta, contributi e scadenze — senza, il
          bilancio non saprebbe che aliquote usare. Restano sul tuo dispositivo e puoi cambiarli
          quando vuoi dal pulsante «profilo».
        </p>
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
        <span className="font-medium">Settore di attività (coefficiente di redditività)</span>
        <select
          {...register('settore')}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 dark:border-stone-700 dark:bg-stone-800"
        >
          <option value="">— scegli il settore —</option>
          {GRUPPI_ATECO.map((g) => (
            <option key={g.settore} value={g.settore}>
              {g.settore} — {Math.round(g.coefficiente * 100)}%
            </option>
          ))}
        </select>
        {errors.settore && <span className="text-red-600">{errors.settore.message}</span>}
        <span className="mt-1 block text-xs text-stone-500">
          Sono i 9 gruppi ufficiali dell’allegato 4, L. 190/2014: scegli quello che descrive la tua
          attività.
        </span>
      </label>

      <label className="block text-sm">
        <span className="font-medium">Codice ATECO (facoltativo, se lo conosci)</span>
        <input
          type="text"
          placeholder="62.02.00"
          {...register('ateco', {
            onChange: (e) => {
              const g = coefficientePerAteco(String(e.target.value))
              if (g) setValue('settore', g.settore)
            },
          })}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-mono dark:border-stone-700 dark:bg-stone-800"
        />
        {errors.ateco && <span className="text-red-600">{errors.ateco.message}</span>}
        {gruppo ? (
          <span className="mt-1 block text-xs text-emerald-700 dark:text-emerald-400">
            ✓ Riconosciuto: {gruppo.settore} → coefficiente {Math.round(gruppo.coefficiente * 100)}%
            (selezionato sopra)
          </span>
        ) : (
          <span className="mt-1 block text-xs text-stone-500">
            Se lo scrivi, seleziono io il settore giusto. Lo trovi su una tua fattura o nel
            cassetto fiscale — se non lo ricordi, basta il settore qui sopra.
          </span>
        )}
      </label>

      <fieldset className="text-sm">
        <legend className="font-medium">Previdenza INPS</legend>
        <label className="mt-1 flex items-center gap-2">
          <input type="radio" value="gestione-separata" {...register('gestione')} />
          Gestione Separata — professionisti senza cassa né albo
        </label>
        <label className="mt-1 flex items-center gap-2">
          <input type="radio" value="artigiani" {...register('gestione')} />
          Artigiani — iscritti alla gestione IVS artigiani
        </label>
        <label className="mt-1 flex items-center gap-2">
          <input type="radio" value="commercianti" {...register('gestione')} />
          Commercianti — iscritti alla gestione IVS commercianti
        </label>
        <p className="mt-1 text-xs text-stone-500">
          Cambia tutto: la GS paga in percentuale sul reddito; artigiani e commercianti
          pagano contributi fissi sul minimale in 4 rate, più l’eccedenza sul reddito.
        </p>
      </fieldset>

      {watch('gestione') === 'gestione-separata' ? (
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
      ) : (
        <div className="space-y-3 text-sm">
          <label className="block">
            <span className="font-medium">Riduzione contributiva</span>
            <select
              {...register('riduzioneIvs')}
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 dark:border-stone-700 dark:bg-stone-800"
            >
              <option value="nessuna">Nessuna — contribuzione piena</option>
              <option value="riduzione35">Riduzione 35% (forfettari, richiesta all’INPS)</option>
              <option value="riduzione50">Riduzione 50% (prima iscrizione nel 2025, 36 mesi)</option>
            </select>
            <span className="mt-1 block text-xs text-stone-500">
              Vale solo se l’hai chiesta all’INPS. Entrambe riducono anche i mesi accreditati
              per la pensione quando resti al minimale.
            </span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('anzianitaAl1995')} />
            Avevo contributi già prima del 1996 (massimale più basso — caso raro)
          </label>
        </div>
      )}

      <label className="block text-sm">
        <span className="font-medium">Regione o provincia autonoma di residenza (facoltativa)</span>
        <select
          {...register('regione')}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 dark:border-stone-700 dark:bg-stone-800"
        >
          <option value="">— non indicata —</option>
          {ENTITA_REGIONALI.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nome}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-stone-500">
          Serve solo al confronto con l’ordinario: applica da sola l’addizionale regionale
          ufficiale (scaglioni ed esenzioni della tua regione). Resta sul dispositivo.
        </span>
      </label>

      <button
        type="submit"
        className="w-full rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800"
      >
        {esistente ? 'Salva modifiche' : 'Inizia a tracciare'}
      </button>
    </form>
  )
}
