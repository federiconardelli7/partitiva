# Architettura

Decisioni formali in `ADR/0001-scelte-fondanti.md`; qui il quadro tecnico operativo.

## Quadro

**Client-side puro**: build statica (Vercel), nessun server, nessun account. Tutti i dati vivono
nel browser dell'utente (IndexedDB). Qualsiasi comunicazione esterna futura è opt-in esplicito.

```
apps/web  (S3+)                     packages/motore-fiscale        packages/parser-fatture
┌──────────────────────────┐        ┌───────────────────────┐      ┌─────────────────────┐
│ React 19 + Vite + TS     │ input  │ TypeScript puro       │      │ DOMParser (XML)     │
│ Tailwind + shadcn/ui     │───────▶│ params/ANNO.ts (dati) │      │ unwrap p7m custom   │
│ Zustand + RHF + Zod      │        │ computeAnno           │      │ pdfjs-dist (PDF)    │
│ Dexie (IndexedDB)        │◀───────│ computeTimeline       │      │ euristiche + form   │
│ Recharts                 │ output │ ExplainedValue tree   │      │ di revisione umana  │
└──────────────────────────┘        └───────────────────────┘      └─────────────────────┘
```

- I **package non conoscono UI né storage**: input semplici → output semplici. Riusabili da una
  futura CLI o da altri progetti.
- L'app estrae i dati da Dexie e li mappa in forme semplici; le **regole fiscali di aggregazione
  restano nel motore** come funzioni pure — `aggregaIncassato(pagamenti, anno)` (principio di
  cassa sulla data di incasso) e la regola del bollo per fattura — così i golden di cassa e bollo
  testano il package, non l'app. Il motore non legge mai da Dexie.

## Motore fiscale (`packages/motore-fiscale`)

- **Money**: interi in centesimi (tipo branded `Cents`); mai float nei calcoli. Esattamente **due
  funzioni di arrotondamento**, mai nascoste negli helper: `roundCents` dopo ogni moltiplicazione
  per aliquota e `roundEuro` su imponibile e totali da dichiarazione — l'euro-rounding è un passo
  della catena, non una formattazione (caso campione: 50.250 − 7.543,69 = 42.706,31 → 42.706 →
  ×5% = 2.135,30); ognuna è un nodo visibile della spiegazione. Formattazione it-IT solo in UI.
- **Parametri per anno**: `src/params/2025.ts`, `2026.ts`… — soli dati, schema zod, ogni valore
  con `fonte { riferimento, url?, verificatoIl }`; `getParams(anno)` esaustivo. Tabella
  ATECO→coefficiente in `src/params/ateco.ts` (doppia chiave per la ricodifica ATECO 2025).
- **API** (funzioni pure):
  - `computeAnno(input, params)`: incassato → reddito → contributi GS dovuti (warning massimale) →
    deduzione (= `versatiContributi`, input esplicito: 0 nel primo anno, derivato dagli F24 nella
    timeline) → imponibile → imposta 5/15% → **nettoCompetenza** (incassato − dovuti − imposta, il
    "59.764,52" del caso campione) e **nettoReale** (− bolli − spese: coincidono solo a
    bolli/spese zero);
    flag soglie 85k/100k. L'input `copertura: 'piena' | 'ridotta'` guida insieme l'aliquota GS
    (26,07% / 24%) e la causale F24 (PXX / P10) — un solo flag, mai due costanti scollegate.
  - `computeTimeline(anni[], opts)`: fold multi-anno — saldo(N) = dovuto(N−1) − acconti versati in
    N−1; un saldo negativo è esposto come **credito**, mai compensato in automatico (la
    compensazione è una scelta dell'utente che entra come actual); acconti(N) = 100%/80% delle basi
    N−1 in rate 50/50 con soglie minime; compone gli F24 del 20/7 e del 30/11 (codici tributo
    inclusi); il versato di N alimenta la deduzione di N — con l'invariante deduzione(N) = somma
    delle righe INPS degli F24 pagati in N. Primo anno senza versati; metodo previsionale opt-in
    con warning sanzioni.
  - **Actuals override**: ogni nodo calcolato è sostituibile con il valore effettivo — fino alle
    **singole rate F24** (fenomeno osservato su F24 reali e riprodotto nel caso campione: rate
    1.676,35/1.676,34 da base implicita 4.190,86, che non coincide né col teorico né col
    dichiarato). Il ricalcolo a valle usa l'override; il teorico resta in `valoreCalcolato` così
    la UI mostra il delta (es. −1,06 € da arrotondamento di dichiarazione nel caso campione).
  - **`ExplainedValue`** `{ id, label, formula, inputs: NodeId[], value, origine, valoreCalcolato?,
    fonte? }` in una **mappa piatta** `Record<NodeId, ExplainedValue>`: `inputs` sono riferimenti,
    non nodi annidati (un nodo può alimentare più consumatori, es. i contributi dovuti alimentano
    saldo E acconto); `origine: 'calcolato' | 'reale' | 'parametro'`. La UI rende "l'F24 spiegato"
    senza numeri magici.
- **Seam futuri** (senza astrazioni premature): `gestionePrevidenziale` come union discriminata
  (MVP: solo Gestione Separata; artigiani/commercianti aggiungeranno contributi fissi sul
  minimale); `StorageAdapter` lato app per un eventuale sync opzionale.

## Storage (app, S3)

Dexie con `version()` e migrazioni. Bozza tabelle (si consolida in S3): `profilo` (anno apertura,
ATECO, aliquota, gestione), `fatture` (dati documento + `dataIncasso` + stato emessa/incassata +
bollo + metadati valuta), `spese`, `versamenti` (gli F24 effettivi dell'utente = actuals),
`impostazioni`.
Backup: export/import JSON completo con `schemaVersion`; `navigator.storage.persist()`;
promemoria di backup in UI. Numeri e date in formato italiano in UI, ISO negli storage.

## Qualità

- Vitest per unit + golden test (contratto del motore, vedi TESTING.md); Playwright dall'S3.
- CI: lint (ESLint flat, max-warnings 0), typecheck strict, test, **privacy gate**.
- TDD obbligatorio sul motore; parametri fiscali modificabili solo con fonte + golden + CHANGELOG.
