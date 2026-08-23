# Roadmap

**Visione**: lo strumento open source e privacy-first con cui un forfettario italiano capisce e
governa la propria P.IVA — dalla fattura all'F24 spiegato — senza che i dati lascino il browser.

## MVP (v0.x) — per sessioni di sviluppo

- ✅ **S1 — Fondazione** (15/08/2026): decisioni fondanti (ADR-0001), regole fiscali documentate con
  fonti, scaffold monorepo, CI, privacy gate, fixture anonimizzata.
- ✅ **S2 — Motore fiscale** (22/08/2026): TDD sui golden (41 test verdi); `params/2025-2026.ts`
  con fonte per ogni valore; catena incassato → reddito → contributi GS → deduzione (versati) →
  imponibile → imposta → netto (competenza e reale); timeline multi-anno con F24 di luglio e
  novembre, crediti esposti, soglie minime acconti (rata unica col 1791), metodo previsionale
  opt-in, fallback params con warning; actuals fino alla singola rata; albero di spiegazione per
  ogni importo; "quanto accantonare" per incasso; regole pure di cassa e bollo.
- ✅ **S3 — Verticale app** (22/08/2026, `apps/web`): React 19 + Vite + Tailwind 4 + Zustand +
  Dexie (+ RHF/zod); wizard (anno apertura dal 2025, ATECO→coefficiente con riconoscimento
  automatico dalla tabella allegato 4, copertura GS); registro entrate con **data di incasso**
  distinta e bollo automatico; bilancio con breakdown `ExplainedValue`, barra soglie
  85.000/100.000 €, countdown del 5%, prossimi F24 con righe e crediti. Deploy su
  partitiva.vercel.app (build locale + `--prebuilt`). Rimandati a sessioni successive: shadcn/ui,
  export/import JSON, Playwright E2E.
- ✅ **S4 — Pagine + Ingestione XML** (22/08/2026): app ristrutturata su richiesta di Federico —
  la landing è il **Calcolatore** (simulatore senza salvataggio), con «I miei dati» e «Bilancio»
  come pagine vere (react-router, deep-link con rewrite SPA su Vercel; il wizard appare solo
  entrando nelle sezioni dati). Parser FatturaPA FPR12: firma XAdES ignorata, buste `.p7m`
  (DER e base64), dedup (anno, numero, P.IVA cedente), warning su regime ≠ RF19 e somma righe vs
  totale, euristica valuta/cambio dalla descrizione; upload multiplo nel registro con bollo da
  `DatiBollo` e segnalazione mismatch con la regola. Rimandati: FPA12 esplicita, import CSV.
- ✅ **S5 — Redesign IA** (22/08/2026): app a tre concetti — **Panoramica** (vista d'insieme
  read-only col **Flusso** year-aware della catena del motore, riga «Adesso», pillole per
  anno; assorbe il Bilancio), **Simulatore** sandbox con livrea dedicata, toggle «primo anno»
  e prefill esplicito, hub **«I miei dati»** (fatture + import XML, profilo, backup). Landing
  di presentazione per chi non ha profilo; redirect dalle rotte vecchie; glossario in
  `CONTEXT.md`.
- ✅ **S6 — Riepiloghi annuali e simulatore concatenato** (22/08/2026): totale annuo senza
  fatture («pregresso», sommato alle fatture dello stesso anno) come nuova voce della
  sorgente, con backup `schemaVersion: 2` retro-compatibile; Simulatore con **anno simulato**
  (da apertura a corrente+1) e modalità **concatenata**: versati deducibili derivati dalla
  catena reale via `computeTimeline`, non più inseriti a mano.
- ✅ **S7 — Spese e bollo** (23/08/2026): registro spese nell'hub («NON si deducono: il
  coefficiente le forfetizza» — pesano solo sul netto reale via `speseCents` del motore);
  override del bollo sulla fattura manuale (vuoto = regola dai params; il confronto con
  `DatiBollo` era già in S4); export **CSV** di fatture e spese (Excel italiano: «;»,
  virgola decimale, BOM). Backup `schemaVersion: 3` con spese; v1/v2 ancora importabili;
  riepiloghi con anni duplicati ora rifiutati.
- ✅ **S8 — Parser PDF** (23/08/2026): euristiche pure sul testo del foglio di stile SdI in
  `parser-fatture` (`estraiCampiPdf`: numero/data/totale/tipologia, best effort);
  estrazione testo con pdf.js nell'app (glue browser-only, caricato al click); **revisione
  obbligatoria per costruzione**: il PDF precompila il form «Nuova fattura», mai Dexie;
  scansioni senza testo → avviso e inserimento manuale; TD ≠ TD01 → mai come ricavo.
- ✅ **S9 — Hardening** (23/08/2026): **PWA installabile** (manifest + icona SVG maskable +
  theme-color; service worker/offline rimandato con motivazione — la base responsive c'era
  già); a11y: titoli del documento per rotta, skip link, banner annunciati (`role=status`),
  barra soglie decorativa, contrasti; **onboarding nel README** («Come si usa», stato reale
  del progetto). Deploy Vercel già attivo dalla S3. **→ MVP completo.**

## Post-MVP

1. **Altre gestioni INPS** — ✅ **artigiani/commercianti** (23/08/2026, S11): gestione
   previdenziale nel profilo (default Gestione Separata, retro-compatibile), parametri
   `previdenzaIvs` 2025/2026 con fonte per valore, contributi fissi sul minimale in 4 rate
   per cassa + eccedenza a scaglioni (fascia del +1 punto, massimali per anzianità) a
   saldo/acconti, riduzioni 35%/50%, golden dedicati (circ. INPS 38/2025, 14/2026, 83/2025).
   Restano le **casse professionali** come parametri custom (sforzo separato).
2. **Regime ordinario/semplificato** — ✅ confronto «quando conviene uscire» (23/08/2026,
   S14-S15): `computeOrdinario` nel Simulatore su fonti primarie (IRPEF 23/33/43,
   detrazione lavoro autonomo, oneri 19% con tetto/degressione/taglio, addizionale
   regionale AUTOMATICA per residenza dal dataset MEF delle 21 entità, comunale in input).
   Resta fuori (dichiarato): F24/acconti multi-anno dell'ordinario, gestione del regime.
3. **Simulatore dipendente** — ✅ confronto «e se fossi dipendente?» (23/08/2026, S16):
   `computeDipendente` da RAL su fonti primarie (detrazioni art. 13, taglio del cuneo
   L. 207/2024, trattamento integrativo, contributi con FIS/CIGS, addizionali dal dataset,
   TFR e Fon.Te 0,55/1,55 come maturato a parte, toggle attivo di default).
4. **Calcolo inverso** — ✅ «che fatturato per X € netti» (23/08/2026, S17): `invertiNetto`
   nel motore (minimo lordo in euro interi con netto ≥ obiettivo, griglia 50 € + scansione
   all'euro; dove le catene non sono monotone espone anche il lordo «stabile» oltre
   l'ultima ricaduta) e sezione del Simulatore sui tre regimi — fatturato forfettario (con
   tetto di permanenza 85.000 dichiarato), fatturato in ordinario (costi identici sui due
   regimi d'impresa), RAL da dipendente — sempre col netto riverificato al lordo proposto.
   Resta la **pianificazione mensile vs soglie**.
5. **Modulo investimenti/PAC** (richiede ADR dedicata sulle fonti dati: default = inserimento
   manuale/CSV; cambi via API BCE/Frankfurter opt-in; capital gain 26%, zainetto minusvalenze,
   scenario PIR). Mai consigli di investimento.
6. **Fatture passive** via XML, promemoria scadenze con export ICS (incluse le scadenze trimestrali
   del bollo virtuale), multi-profilo, i18n (EN).
7. **Parsing AI opzionale** dei PDF (opt-in esplicito, avviso privacy chiarissimo) e
   categorizzazione automatica delle spese.

## Non-obiettivi

- Emissione/invio di fatture allo SdI (non sostituiamo il gestionale di fatturazione).
- Consulenza fiscale personalizzata.
- Account, cloud o sync obbligatori.
