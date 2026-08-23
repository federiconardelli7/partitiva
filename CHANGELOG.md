# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/it-IT/1.1.0/); versioning:
[SemVer](https://semver.org/lang/it/).

## [Unreleased]

### Added

- **Gestioni IVS artigiani e commercianti (S11)**: nel profilo si sceglie la gestione
  previdenziale (default: Gestione Separata — i profili e i backup esistenti restano
  validi senza toccare nulla), con anzianità al 31/12/1995 (massimale) e riduzione
  contributiva (35% forfettari a domanda / 50% nuovi iscritti 2025, finestra di 36 mesi
  gestita ad anni interi). Il motore calcola i **contributi fissi sul minimale** in 4 rate
  per cassa (16/05, 20/08, 16/11, 16/02 con slittamento sab/dom → lunedì; causali AF/CF) e
  l'**eccedenza a scaglioni** (fascia del +1 punto, massimale per anzianità; maternità
  7,44 € mai ridotta; con la 50% anche la 0,48 dei commercianti resta piena) a saldo e
  acconti nei F24 di luglio/novembre (causali AP/CP), con spiegazione e actuals fino alla
  singola rata. Panoramica coi prossimi F24 ordinati per scadenza; Simulatore
  gestione-aware. Parametri 2025/2026 con fonte per valore (circ. INPS 38/2025, 14/2026,
  83/2025; tabella causali AdE) e 10 nuovi golden test; un punto resta dichiarato da
  verificare in `docs/regole-fiscali.md` (0,48 sotto la riduzione 35%); la quota acconti
  dell'eccedenza è stata poi verificata su fonte primaria e corretta (v. Fixed).

### Fixed

- **Acconti IVS sull'eccedenza ricalcolati come da istruzioni del quadro RR**: la verifica
  su fonte primaria (istruzioni Redditi PF 2026, Fascicolo 2, Appendice «INPS - Modalità
  di calcolo degli acconti»; le circolari INPS vi rinviano) conferma quota 100% e due rate
  di pari importo ma smentisce la base modellata in S11 — l'acconto non fotografa il
  dovuto dell'anno prima: ricalcola l'eccedenza del **reddito dell'anno precedente** con
  **minimale, massimale, aliquote e agevolazioni dell'anno corrente**. Golden ricalcolati
  a mano; per la Gestione Separata l'equivalenza col modello esistente è dichiarata in
  `docs/regole-fiscali.md`.
- **La data di incasso non è più «oggi» a scatola chiusa**: «segna incasso» apre un
  editor con data proposta (oggi solo per le fatture del mese corrente, altrimenti la
  data della fattura) e la data salvata si corregge o si toglie dalla tabella — prima una
  fattura 2025 importata da XML finiva incassata «oggi», nell'anno fiscale sbagliato.
- **Il parser PDF legge anche le stampe da browser del foglio di stile**
  (fatturapa.gov.it): data in formato ISO e importi nel formato grezzo dell'XML
  (es. «1234.56») ora riconosciuti, con l'italiano prioritario (1.500,00 resta 1.500 €).
  E le **copie di cortesia** (il PDF scaricabile all'invio, in alternativa all'XML):
  «Numero:» senza la parola «documento», data coi punti e senza etichetta (cercata solo
  nel blocco del numero, mai tra le date-esca), totale sulla riga «TOTALE … (EUR)» /
  «Netto a pagare» con le voci del riepilogo IVA escluse; niente TDxx in questi PDF →
  resta l'avviso di verificare che sia una fattura. Verificati end-to-end su PDF reali,
  fuori dal repo.

- **Il settore si sceglie (e si ricorda) per nome**: quattro gruppi dell'allegato 4
  condividono il coefficiente 40% e la scelta scivolava sul primo, in Wizard e Simulatore;
  ora il profilo salva il **nome del gruppo** e l'hub lo mostra esattamente.
- Il prefill da PDF chiede conferma prima di sostituire un form «Nuova fattura» già
  compilato; con più «Totale documento» nel PDF vince l'ultimo (il riepilogo finale).
- L'errore d'import del backup nomina l'`annoApertura` fuori range invece del messaggio
  generico; il countdown F24 non dice più «tra 0 giorni» (oggi/domani); lo skip link ora
  porta il focus davvero sul contenuto (`tabindex` sul main).

## [0.1.0] - 2026-08-23

Prima release: l'MVP completo della roadmap (S1–S9) — motore fiscale golden-tested,
app in produzione su https://partitiva.vercel.app, installabile come PWA.

### Added

- **PWA, accessibilità e onboarding (S9)**: l'app è **installabile** (manifest + icona,
  senza service worker: scelta documentata); titolo del documento per pagina, skip link,
  banner annunciati agli screen reader, contrasti ritoccati; README con lo stato reale e
  la guida «Come si usa». Con S9 l'MVP della roadmap è completo.

- **Import da PDF con revisione obbligatoria (S8)**: le fatture in PDF (foglio di stile
  SdI) si importano dal registro — le euristiche del parser estraggono numero, data e
  totale e **precompilano il form**, che l'utente rivede e salva (un PDF non scrive mai
  nulla da solo). Le scansioni senza testo degradano a inserimento manuale con avviso;
  le note di credito (TD ≠ TD01) non vengono mai proposte come ricavo.

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
