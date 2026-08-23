# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/it-IT/1.1.0/); versioning:
[SemVer](https://semver.org/lang/it/).

## [Unreleased]

### Added

- **Spese, override bollo ed export CSV (S7)**: registro **spese** in «I miei dati» —
  dichiarate NON deducibili (il coefficiente le forfetizza), pesano solo sul netto reale;
  campo **Bollo (€)** sulla fattura manuale (vuoto = regola dai params, pieno = override);
  **export CSV** di fatture e spese per i fogli di calcolo italiani. Backup
  `schemaVersion: 3` con spese (v1/v2 ancora importabili); backup con riepiloghi ad anni
  duplicati ora rifiutati.

- **Riepiloghi annuali e simulatore concatenato (S6)**: in «I miei dati» si inserisce il
  **totale incassato di un anno senza ricostruirlo fattura per fattura** («pregresso», si
  somma alle fatture dello stesso anno; bolli facoltativi); la Panoramica lo dichiara con
  «include pregresso». Il **Simulatore** guadagna l'anno simulato (da apertura a corrente+1)
  e la modalità **«Concatena i miei dati»**: i contributi deducibili dello scenario sono
  derivati dalla catena reale (saldi + acconti da `computeTimeline`), non più a mano.
  Backup `schemaVersion: 2` (con riepiloghi); i backup v1 si importano ancora.

- **Redesign IA (S5)**: `/` è la **Panoramica** — vista d'insieme read-only che si aggiorna
  da «I miei dati», col nuovo componente **Flusso** (la catena del motore come diagramma
  year-aware: primo anno senza deduzione, poi ramo «F24 → contributi deducibili»; nodi
  cliccabili con ExplainTree come drill-down), riga «Adesso» e pillole per anno (assorbe il
  Bilancio). **Simulatore** sandbox su `/simulatore` (livrea indaco, «qui non si salva
  niente», toggle «primo anno», prefill esplicito «Parti dai tuoi dati») e hub **«I miei
  dati»** su `/dati` (fatture, profilo, backup). Landing di presentazione per chi non ha
  profilo; glossario dei termini in `CONTEXT.md`.

- **Pagine e calcolatore (S4)**: landing «Calcolatore» (simulatore senza salvataggio), pagine
  «I miei dati» e «Bilancio» con URL propri; **parser FatturaPA** (XML FPR12 con firma XAdES,
  buste `.p7m` anche base64, euristica valuta/cambio, dedup e warning) e **import multiplo** nel
  registro con bollo da `DatiBollo`.

- **App web (S3)**: wizard di onboarding (ATECO→coefficiente automatico dalla tabella
  allegato 4, copertura GS), registro entrate per **data di incasso** con bollo automatico,
  bilancio per anno con breakdown `ExplainedValue`, barra soglie 85k/100k, countdown del 5% e
  prossimi F24; dati solo in IndexedDB (Dexie). Dataset ATECO→coefficiente nel motore
  (`params/ateco.ts`) con fonte e test.

- **Motore fiscale (S2)**: `computeAnno` e `computeTimeline` (F24 luglio/novembre per righe con
  codici tributo e causali, crediti espliciti, soglie minime acconti con rata unica, metodo
  previsionale opt-in, fallback parametri con warning), actuals fino alla singola rata F24, albero
  di spiegazione `ExplainedValue` per ogni importo, `aggregaIncassato` e `bolloPerFattura`;
  parametri 2025/2026 come dati con fonte per ogni valore (validati con zod al load);
  41 test tra golden del caso campione, unit e edge case.

- Struttura monorepo pnpm: `packages/motore-fiscale` e `packages/parser-fatture` (stub) con
  lint, typecheck e test in CI.
- Privacy gate anti-leak (`scripts/check-privacy.mjs`): pattern strutturali CF/P.IVA (incluso il
  formato `IdCodice` di FatturaPA) con allowlist dei valori fittizi + blocklist esterna al repo
  (secret `PRIVACY_BLOCKLIST` in CI, file locale per l'hook pre-commit).
- Fixture FatturaPA FPR12 anonimizzata con firma XAdES di esempio.
- Governance: README, ROADMAP, CONTRIBUTING (con procedura di aggiornamento fiscale annuale),
  SECURITY, TESTING, CLAUDE.md, template issue/PR, dependabot.
- Documentazione: `docs/regole-fiscali.md` (ogni parametro con fonte e data di verifica),
  `docs/fonti.md`, `docs/ADR/0001-scelte-fondanti.md`, `docs/architettura.md`,
  `docs/parsing-fatture.md`, `docs/BRAINSTORM.md`.
- `docs/tracker-oracle.md`: logica del tracker di riferimento estratta e verificata
  (limiti noti da correggere nel motore).

### Changed

- Il «Calcolatore» in landing e la pagina «Bilancio» sono sostituiti da **Simulatore** e
  **Panoramica**; le rotte `/registro`, `/profilo` e `/bilancio` reindirizzano alle nuove.
- Golden test, fixture e documentazione usano il **caso campione sintetico «Mario Rossi»**:
  nessun importo reale nel repo (i valori reali restano nelle verifiche locali).
