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
- **S3 — Verticale app** (`apps/web`): React 19 + Vite + Tailwind/shadcn + Zustand + Dexie;
  wizard iniziale (anno apertura P.IVA, ATECO→coefficiente con ricerca, aliquota 5/15,
  Gestione Separata); registro entrate manuale con **data di incasso** distinta dalla data fattura;
  bilancio con breakdown, alert soglie 85.000/100.000 €, countdown del 5%.
- **S4 — Ingestione XML**: parser FatturaPA FPR12 (tolleranza FPA12), firma XAdES ignorata,
  buste `.p7m` (unwrap del payload), upload multiplo e import storico, dedup
  (anno, numero, P.IVA cedente), validazioni e warning (somma righe vs totale, regime ≠ RF19),
  euristica importo in valuta + tasso di cambio dalla descrizione.
- **S5 — Spese e bollo**: registro spese (non deducibili nel forfettario: il tool lo dice
  chiaramente); bollo automatico 2,00 € sopra 77,47 € con override e confronto con `DatiBollo`;
  export/import JSON completo (backup) e export CSV dei registri.
- **S6 — Parser PDF**: estrazione testo (pdf.js) + euristiche per layout "foglio di stile SdI" +
  **form di revisione obbligatorio** prima di ogni salvataggio; degradazione a inserimento manuale
  per scansioni.
- **S7 — Hardening**: mobile/a11y, PWA installabile, deploy Vercel, onboarding documentato.

## Post-MVP

1. **Altre gestioni INPS**: artigiani/commercianti (contributi fissi sul minimale 18.808 €,
   aliquote 24%/24,48%, +1 punto oltre 56.224 €, riduzione 35% per forfettari su domanda, 4 rate
   fisse + eccedenza — circ. INPS 14/2026); casse professionali come parametri custom.
2. **Regime ordinario/semplificato** e confronto automatico "quando conviene uscire"
   (IRPEF 2026: 23/33/43, detrazioni, addizionali parametriche).
3. **Simulatore dipendente**: IRPEF, detrazioni, taglio del cuneo, fondo pensione con quota datore
   da CCNL (Commercio/Fon.Te: 0,55% → 1,55%; 14 mensilità), TFR.
4. **Calcolo inverso** ("che fatturato per X € netti") e pianificazione mensile vs soglie.
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
