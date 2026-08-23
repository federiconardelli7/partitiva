// Export CSV dei registri, pensato per Excel/Numbers italiani: separatore «;»,
// decimali con la virgola, date gg/mm/aaaa. Funzioni pure: il download sta in scarica.ts.
import type { Fattura, Spesa } from '../db'
import { formatDataIt } from './format'

// Neutralizza la CSV injection: Excel valuta = + - @ come formula ANCHE tra virgolette,
// e le descrizioni arrivano pure da XML di terzi. L'apice iniziale le rende testo.
const campo = (valore: string): string => {
  const sicuro = /^[=+\-@\t\r]/.test(valore) ? `'${valore}` : valore
  return /[";\n\r]/.test(sicuro) ? `"${sicuro.replaceAll('"', '""')}"` : sicuro
}

const importo = (cents: number): string => (cents / 100).toFixed(2).replace('.', ',')

export function csvFatture(fatture: readonly Fattura[]): string {
  const righe = fatture.map((f) =>
    [
      f.numero,
      formatDataIt(f.dataEmissione),
      f.dataIncasso ? formatDataIt(f.dataIncasso) : '',
      importo(f.importoCents),
      importo(f.bolloCents),
      f.descrizione,
    ]
      .map(campo)
      .join(';'),
  )
  return ['Numero;Emessa;Incassata;Importo;Bollo;Descrizione', ...righe].join('\r\n')
}

export function csvSpese(spese: readonly Spesa[]): string {
  const righe = spese.map((s) => [formatDataIt(s.data), importo(s.importoCents), s.descrizione].map(campo).join(';'))
  return ['Data;Importo;Descrizione', ...righe].join('\r\n')
}
