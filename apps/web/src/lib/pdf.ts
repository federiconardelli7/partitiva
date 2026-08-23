// Estrazione del testo da un PDF (foglio di stile SdI) con pdf.js. SOLO browser:
// glue sottile e senza logica — le euristiche stanno in @partitiva/parser-fatture,
// e nei test questo modulo si mocka (vi.mock). Caricato con import() dinamico al click.
import * as pdfjs from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

/** Righe di testo in ordine di lettura: item raggruppati per Y (riga) e ordinati per X. */
export async function estraiRighePdf(bytes: Uint8Array): Promise<string[]> {
  const caricamento = pdfjs.getDocument({ data: bytes })
  const righe: string[] = []
  try {
    // Dentro il try: se il PDF è illeggibile, il finally deve comunque spegnere il worker.
    const documento = await caricamento.promise
    for (let numeroPagina = 1; numeroPagina <= documento.numPages; numeroPagina++) {
      const pagina = await documento.getPage(numeroPagina)
      const contenuto = await pagina.getTextContent()
      const perRiga = new Map<number, { x: number; testo: string }[]>()
      for (const item of contenuto.items) {
        if (!('str' in item) || item.str.trim() === '') continue
        const y = Math.round(item.transform[5])
        perRiga.set(y, [...(perRiga.get(y) ?? []), { x: item.transform[4], testo: item.str }])
      }
      const dallAltoInBasso = [...perRiga.entries()].sort((a, b) => b[0] - a[0])
      for (const [, frammenti] of dallAltoInBasso) {
        righe.push(
          [...frammenti]
            .sort((a, b) => a.x - b.x)
            .map((f) => f.testo)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim(),
        )
      }
    }
  } finally {
    await caricamento.destroy()
  }
  return righe
}
