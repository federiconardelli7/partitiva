#!/usr/bin/env node
/**
 * Privacy gate: blocca dati personali reali nel repo (che è pubblico).
 *
 * Due livelli di controllo sui file testuali tracciati (o pronti al commit):
 * 1. Strutturale: pattern di Codice Fiscale e Partita IVA italiani, con
 *    allowlist dei soli valori fittizi ufficiali usati nelle fixtures.
 * 2. Blocklist esatta di valori reali, MAI committata: letta da
 *    $PRIVACY_BLOCKLIST (CI, GitHub Secret, valori separati da virgola o newline)
 *    oppure dal file locale $PRIVACY_BLOCKLIST_FILE
 *    (default: ~/.config/partitiva/privacy-blocklist, una voce per riga).
 *
 * Le violazioni sono riportate mascherate per non riprodurre il dato nei log.
 */
import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

// Unici valori ammessi nelle fixtures (documentati in CONTRIBUTING.md)
const FAKE_CF = 'RSSMRA80A01H501U'
const FAKE_PIVA_DIGITS = '01234567890'

const STRUCTURAL_PATTERNS = [
  {
    name: 'codice fiscale',
    regex: /\b[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]\b/g,
    extract: (match) => match[0],
    allowed: new Set([FAKE_CF]),
  },
  {
    name: 'partita IVA (prefisso IT)',
    regex: /\bIT\d{11}\b/g,
    extract: (match) => match[0],
    allowed: new Set([`IT${FAKE_PIVA_DIGITS}`]),
  },
  {
    // nel formato FatturaPA la P.IVA è un IdCodice a 11 cifre SENZA prefisso IT
    name: 'partita IVA (IdCodice XML)',
    regex: /<IdCodice>(\d{11})<\/IdCodice>/g,
    extract: (match) => match[1],
    allowed: new Set([FAKE_PIVA_DIGITS]),
  },
]

const TEXT_EXTENSIONS = new Set([
  'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'json', 'md', 'yml', 'yaml',
  'xml', 'html', 'css', 'txt', 'sh', 'csv', 'svg',
])

const mask = (value) =>
  value.length <= 5 ? '*'.repeat(value.length) : `${value.slice(0, 3)}${'*'.repeat(value.length - 5)}${value.slice(-2)}`

const loadBlocklist = () => {
  const entries = []
  const fromEnv = process.env.PRIVACY_BLOCKLIST
  if (fromEnv) entries.push(...fromEnv.split(/[\n,]/))
  const filePath = process.env.PRIVACY_BLOCKLIST_FILE ?? join(homedir(), '.config', 'partitiva', 'privacy-blocklist')
  if (existsSync(filePath)) entries.push(...readFileSync(filePath, 'utf8').split('\n'))
  return entries.map((entry) => entry.trim()).filter((entry) => entry.length > 0 && !entry.startsWith('#'))
}

const listFiles = () => {
  const output = execSync('git ls-files -z --cached --others --exclude-standard', { encoding: 'utf8' })
  return output
    .split('\0')
    .filter((file) => file.length > 0)
    .filter((file) => TEXT_EXTENSIONS.has(file.split('.').pop()?.toLowerCase() ?? ''))
    .filter((file) => existsSync(file))
}

const blocklist = loadBlocklist()
const violations = []

for (const file of listFiles()) {
  const content = readFileSync(file, 'utf8')
  for (const { name, regex, extract, allowed } of STRUCTURAL_PATTERNS) {
    for (const match of content.matchAll(regex)) {
      const value = extract(match)
      if (value !== undefined && !allowed.has(value)) {
        violations.push({ file, kind: `pattern ${name}`, value: mask(value) })
      }
    }
  }
  for (const entry of blocklist) {
    if (content.includes(entry)) {
      violations.push({ file, kind: 'blocklist', value: mask(entry) })
    }
  }
}

if (violations.length > 0) {
  console.error('✖ Privacy gate: possibili dati personali reali trovati:')
  for (const { file, kind, value } of violations) {
    console.error(`  - ${file} → ${kind}: ${value}`)
  }
  console.error('Sostituisci con i valori fittizi documentati in CONTRIBUTING.md (fixtures anonimizzate).')
  process.exit(1)
}

console.log(`✔ Privacy gate: nessun dato personale rilevato (blocklist: ${blocklist.length} voci).`)
