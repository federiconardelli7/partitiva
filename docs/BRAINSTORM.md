# Brainstorm Fase 0 — 15/08/2026

Verbale della sessione di fondazione: opzioni valutate e razionali. Le decisioni formali sono in
`ADR/0001-scelte-fondanti.md`.

## 1. Nome del progetto

| Candidato | Pro | Contro | Check preliminare |
|---|---|---|---|
| **Partitiva** ✅ | crasi di "Partita IVA", corto, suona italiano | pun da spiegare agli anglofoni | nessuna collisione trovata; `partitiva.it` AVAILABLE (whois nic.it); handle GitHub libero |
| Forfetto | simpatico, dal regime | prossimità con l'app commerciale **ForfettApp** | rischio confusione di brand |
| PerCassa | il principio di cassa è il differenziale | meno immediato come "app P.IVA" | nessuna collisione nota |
| Quadra | "far quadrare i conti" | parola comune, handle contesi | non verificato a fondo |
| Accantona | il valore d'uso ("quanto accantonare") | lungo, imperativo | non verificato |
| OpenPIVA | esplicito su OSS+dominio | generico; esiste OpenPIV (velocimetria) | collisione parziale |
| FiscoChiaro | trasparenza (principio 4) | suona da CAF | non verificato |

**Scelto: Partitiva** (decisione di Federico).

## 2. Architettura: client-side puro vs local-first con backend opzionale

- **Client-side puro** ✅ — privacy by construction (principio 1), zero infrastruttura/costi,
  deploy statico, contributor-friendly. Limiti e mitigazioni: multi-dispositivo → export/import
  JSON (e seam `StorageAdapter` per un sync futuro); persistenza IndexedDB →
  `navigator.storage.persist()` + promemoria backup; dati di mercato futuri → fetch opt-in dal
  client (cambi: API BCE/Frankfurter, CORS-friendly) o micro-proxy opzionale senza dati fiscali
  (ADR dedicata in roadmap).
- Local-first + backend opzionale — sync nativo subito ma account, GDPR, costi e superficie
  d'attacco: contro il principio 1 come default, MVP più lento. **Respinta** (riconsiderabile
  post-MVP come modulo davvero opzionale).

## 3. Storage locale

- **IndexedDB via Dexie** ✅ — schema versionato con migrazioni, query decenti, testabile con
  `fake-indexeddb`. localStorage respinto (limiti di dimensione/struttura); file-based come
  primario respinto (UX mobile peggiore) ma l'export/import JSON copre il backup manuale.

## 4. Librerie parsing nel browser

| Compito | Scelta | Alternative respinte |
|---|---|---|
| XML FatturaPA | `DOMParser` nativo, navigazione per local-name | fast-xml-parser (dipendenza in più, comunque namespace da gestire a mano) |
| p7m/CAdES | estrattore custom del payload XML (DER e base64) | asn1js/pkijs subito (pesanti; niente verifica firma richiesta) — restano come fallback |
| PDF | `pdfjs-dist` lazy-loaded + euristiche + form di revisione umana obbligatorio | parsing AI di default (viola privacy-first; resterà opt-in in roadmap) |
| Export | CSV nel MVP | exceljs/xlsx subito (YAGNI); SheetJS (licenza/distribuzione) |
| Validazione/date | zod, date-fns | — |

## 5. Struttura repo

- **Monorepo leggero pnpm workspaces** ✅: `apps/web` + `packages/motore-fiscale` (TS puro,
  zero UI) + `packages/parser-fatture`. Niente turbo/nx: 3 package non li giustificano.
- Repo singolo respinto: il motore deve essere testabile e riusabile fuori dalla UI (principio del
  progetto), e il confine a package lo garantisce meccanicamente.

## 6. Lingua

- Identificatori nel codice e commit: **inglese**; UI, docs, messaggi d'errore: **italiano**.
  Confermato senza obiezioni; i termini di dominio intraducibili (imposta sostitutiva, acconti,
  incassato) restano italiani anche negli identificatori dove la traduzione perderebbe precisione.

## 7. Riuso da easypiva (MIT)

- Riusiamo: idee/UX (calcolatore, calcolo inverso, pianificazione mensile vs soglie), cross-check
  dei valori (`src/lib/fiscal-data.ts`, sempre riverificati su fonte primaria), attribution nel
  README. Stack sovrapponibile (React 19, Vite, Tailwind+shadcn, Zustand, RHF+Zod, Recharts) →
  familiarità per chi contribuisce a entrambi.
- NON riusiamo: copia strutturale del codice (architettura diversa: multi-anno, storage, engine a
  package), preventivi/jsPDF (fuori scope MVP).
- Differenziale confermato dall'analisi del repo: easypiva non ha ingestione fatture, storico
  pluriennale, principio di cassa né spese.

## Ordine MVP

Scelto **"motore prima"**: S2 motore (TDD golden) → S3 verticale app → S4 XML/p7m → S5 spese+bollo
+export → S6 PDF → S7 hardening. Alternative respinte: parser-first (troppo a lungo senza UI),
UI-first (golden test tardivi, contro la spina TDD).

## Segnalazioni emerse (incoerenze nel prompt di avvio, risolte)

1. Il check CI anti-leak coi valori reali in chiaro li avrebbe pubblicati → gate a due livelli
   (pattern strutturali + blocklist via secret/file esterno).
2. La maggiorazione del differimento non è fissa: 0,40% ordinaria ma **0,80% nel 2026** → parametro
   per-anno.
3. Anche il **committente** va anonimizzato nelle fixtures (il prompt citava solo i dati del
   cedente).
4. I F24 reali implicano basi di dichiarazione arrotondate → il motore supporta gli **actuals**.
5. Massimale GS mai vincolante per un forfettario → warning informativo, non ramo di calcolo.
6. Due frasi troncate nel prompt (principio 3, TESTING.md) interpretate e confermate col piano.
