import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const inWeb = (percorso: string) => fileURLToPath(new URL(`../${percorso}`, import.meta.url))

describe('PWA installabile: manifest, icona e metadati', () => {
  it('index.html collega manifest, icona e theme-color, in italiano', () => {
    const html = readFileSync(inWeb('index.html'), 'utf8')
    expect(html).toContain('lang="it"')
    expect(html).toContain('rel="manifest"')
    expect(html).toContain('manifest.webmanifest')
    expect(html).toContain('rel="icon"')
    expect(html).toContain('theme-color')
  })

  it('il manifest ha i campi minimi per l’installazione', () => {
    const manifest = JSON.parse(readFileSync(inWeb('public/manifest.webmanifest'), 'utf8')) as {
      name: string
      display: string
      start_url: string
      lang: string
      icons: { src: string; purpose?: string }[]
    }
    expect(manifest.name).toBe('Partitiva')
    expect(manifest.display).toBe('standalone')
    expect(manifest.start_url).toBe('/')
    expect(manifest.lang).toBe('it')
    expect(manifest.icons.length).toBeGreaterThan(0)
    expect(manifest.icons.some((icona) => icona.purpose?.includes('maskable'))).toBe(true)
  })

  it('l’icona è un SVG vero', () => {
    expect(readFileSync(inWeb('public/icona.svg'), 'utf8')).toContain('<svg')
  })
})
