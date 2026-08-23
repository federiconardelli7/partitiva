import { useRef } from 'react'
import { db, type Fattura, type Profilo, type RiepilogoAnnuale, type Spesa } from '../db'
import { deserializzaBackup, serializzaBackup } from '../lib/backup'
import { oggiIso } from '../lib/format'
import { scaricaFile } from '../lib/scarica'

export function BackupMenu({
  profilo,
  fatture,
  riepiloghi,
  spese,
}: {
  profilo: Profilo | null
  fatture: Fattura[]
  riepiloghi: RiepilogoAnnuale[]
  spese: Spesa[]
}) {
  const fileInput = useRef<HTMLInputElement>(null)

  const esporta = () => {
    scaricaFile(
      `partitiva-backup-${oggiIso()}.json`,
      serializzaBackup(profilo, fatture, riepiloghi, spese, oggiIso()),
      'application/json',
    )
  }

  const importa = async (file: File) => {
    try {
      const backup = deserializzaBackup(await file.text())
      const ok = window.confirm(
        `Importare il backup del ${backup.esportatoIl} (${backup.fatture.length} fatture, ${backup.riepiloghi.length} riepiloghi, ${backup.spese.length} spese)? Sostituisce i dati attuali.`,
      )
      if (!ok) return
      await db.transaction('rw', db.profilo, db.fatture, db.riepiloghi, db.spese, async () => {
        await db.profilo.clear()
        await db.fatture.clear()
        await db.riepiloghi.clear()
        await db.spese.clear()
        if (backup.profilo) await db.profilo.put(backup.profilo)
        await db.fatture.bulkPut(backup.fatture)
        await db.riepiloghi.bulkPut(backup.riepiloghi)
        await db.spese.bulkPut(backup.spese)
      })
    } catch (errore) {
      window.alert(errore instanceof Error ? errore.message : 'Import fallito')
    }
  }

  return (
    <div className="flex gap-2 text-xs">
      <button onClick={esporta} className="rounded-md border border-stone-300 px-2 py-1 hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800" title="Scarica un backup JSON di tutti i dati">
        Esporta
      </button>
      <button onClick={() => fileInput.current?.click()} className="rounded-md border border-stone-300 px-2 py-1 hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800" title="Ripristina da un backup JSON">
        Importa
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void importa(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
