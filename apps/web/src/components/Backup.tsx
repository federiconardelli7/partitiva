import { useRef } from 'react'
import { db, type Fattura, type Profilo } from '../db'
import { deserializzaBackup, serializzaBackup } from '../lib/backup'
import { oggiIso } from '../lib/format'

export function BackupMenu({ profilo, fatture }: { profilo: Profilo | null; fatture: Fattura[] }) {
  const fileInput = useRef<HTMLInputElement>(null)

  const esporta = () => {
    const blob = new Blob([serializzaBackup(profilo, fatture, oggiIso())], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `partitiva-backup-${oggiIso()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const importa = async (file: File) => {
    try {
      const backup = deserializzaBackup(await file.text())
      const ok = window.confirm(
        `Importare il backup del ${backup.esportatoIl} (${backup.fatture.length} fatture)? Sostituisce i dati attuali.`,
      )
      if (!ok) return
      await db.transaction('rw', db.profilo, db.fatture, async () => {
        await db.profilo.clear()
        await db.fatture.clear()
        if (backup.profilo) await db.profilo.put(backup.profilo)
        await db.fatture.bulkPut(backup.fatture)
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
