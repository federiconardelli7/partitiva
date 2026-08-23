/** Scarica un file generato client-side: unico punto per il giro blob → link → click. */
export function scaricaFile(nome: string, contenuto: string, tipo: string): void {
  const blob = new Blob([contenuto], { type: tipo })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nome
  link.click()
  URL.revokeObjectURL(url)
}
