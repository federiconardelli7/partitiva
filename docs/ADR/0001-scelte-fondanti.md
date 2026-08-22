# ADR 0001 — Scelte fondanti

- **Data**: 2026-08-15
- **Stato**: accettata (piano di Fase 0 approvato da Federico)
- **Contesto generale**: trasformare un tracker Excel collaudato (regime forfettario, Gestione
  Separata, cliente estero art. 7-ter) in un'app open source per i forfettari italiani, con
  privacy assoluta e ogni numero fiscale tracciabile a una fonte. Opzioni e razionali estesi in
  `../BRAINSTORM.md`.

## Decisioni

1. **Nome: Partitiva** — crasi di "Partita IVA"; `partitiva.it` risultava AVAILABLE e l'handle
   GitHub libero al 15/08/2026.
2. **Architettura: client-side puro** — build statica su Vercel, nessun server/account; i dati
   fiscali non lasciano il dispositivo. Sync multi-dispositivo = export/import JSON; un eventuale
   backend resterà un modulo **opzionale** futuro dietro `StorageAdapter` (solo interfaccia, oggi).
3. **Storage: IndexedDB via Dexie** — schema versionato e migrazioni; export JSON con
   `schemaVersion`; `navigator.storage.persist()`; test con `fake-indexeddb`.
4. **Monorepo pnpm workspaces** — `apps/web`, `packages/motore-fiscale` (TypeScript puro, zero
   dipendenze UI/storage), `packages/parser-fatture`. Niente turbo/nx (YAGNI).
5. **Lingue** — identificatori e commit in inglese (Conventional Commits); UI, docs e messaggi in
   italiano; termini di dominio italiani ammessi negli identificatori dove la traduzione perde
   precisione.
6. **Parametri fiscali = dati versionati per anno** — `params/ANNO.ts` con
   `ParamAnnuale<T> = { valore, fonte: { riferimento, url?, verificatoIl } }`, schema zod,
   `getParams(anno)` esaustivo; aggiornamento annuale con PR di soli dati + golden test +
   CHANGELOG (procedura in CONTRIBUTING.md). Nessun numero senza fonte in
   `docs/regole-fiscali.md`.
7. **Motore fiscale** — importi in centesimi interi; catena per-anno + timeline multi-anno
   (acconti/saldi/crediti); **actuals override** fino alle singole rate F24 (i valori reali
   sostituiscono i teorici nella catena, il teorico resta visibile); output distinti
   `nettoCompetenza` e `nettoReale`; crediti esposti e mai compensati in automatico; ogni importo
   espone un nodo `ExplainedValue` (mappa piatta) per il breakdown in UI; le regole pure di cassa
   (aggregazione per data di incasso) e bollo vivono nel motore; golden test come contratto
   (tolleranze ±2 € dichiarazione / ±0,01 € F24 con actuals).
8. **Parsing** — XML: `DOMParser` per local-name, firma XAdES ignorata; p7m: estrattore custom del
   payload (fallback asn1js); PDF: `pdfjs-dist` + euristiche + **form di revisione umana
   obbligatorio**; parsing AI mai di default (futuro opt-in con avviso privacy).
9. **Privacy gate a due livelli** — pattern strutturali CF/P.IVA (incluso `IdCodice` FatturaPA) con
   allowlist dei valori fittizi; blocklist reale SOLO fuori dal repo (secret CI
   `PRIVACY_BLOCKLIST` + file locale) usata da CI e hook pre-commit. Mai valori reali nel repo,
   nemmeno nei check.
10. **Riuso da easypiva (MIT)** — idee e cross-check parametri con attribution; nessuna copia
    strutturale di codice.
11. **Workflow git: main diretto** — repo in solo; commit manuali GPG di Federico (staging e
    comando preparati dall'agente); Conventional Commits inglesi; mai lockfile in staging
    automatico.

## Conseguenze

- Il motore è testabile e riusabile fuori dal browser (CLI futura, altri progetti).
- L'aggiornamento fiscale annuale è una PR di dati che un contributor può fare senza toccare la
  logica — e la CI la respinge senza fonti o senza golden test.
- Nessun costo ricorrente di infrastruttura; il progetto resta deployabile come statico ovunque.
- Il multi-dispositivo richiede export/import manuale finché non esisterà un sync opzionale.
- La correttezza dipende dalla manutenzione annuale dei params: mitigata da procedura, template di
  issue dedicato e golden test per anno.
