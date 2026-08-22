# Diario di bordo

> Una voce per sessione: fatto, decisioni, next steps, blocchi. Le ultime 2 voci si leggono
> all'inizio di ogni sessione (vedi CLAUDE.md).

## 2026-08-22 — S4 Pagine, calcolatore e parser XML

**Fatto**
- **Ristrutturazione a pagine** (feedback di Federico: "non è bello che chieda subito"): la
  landing è il **Calcolatore** — simulatore libero che non salva nulla (incassato, settore,
  startup, copertura, versati opzionali → catena spiegata) — e il tracciamento vive in
  «I miei dati»/«Bilancio» (react-router con URL veri + rewrite SPA in vercel.json; il wizard
  appare solo entrando nelle sezioni dati). Card estratta, zustand rimosso (sostituito dal router).
- **Parser FatturaPA in TDD** (`packages/parser-fatture`): DOMParser per local-name (prefissi
  variabili), firma XAdES ignorata, `sbustaP7m` per buste DER e base64, euristica valuta/cambio
  ("USD $5,000.00 … al cambio 0,877"), `chiaveDedup` (anno:numero:P.IVA), warning su regime ≠
  RF19 e somma righe ≠ totale; errori espliciti su file non-FatturaPA. 97 test totali nel repo.
- **Upload nel registro**: import multiplo .xml/.p7m con dedup contro le fatture esistenti,
  bollo da `DatiBollo` (mismatch con la regola segnalato), fatture importate come "emesse"
  (l'incasso si segna quando arriva), riepilogo import con esiti per file.
- Il calcolatore è forfettario-only: il confronto con l'ordinario resta il modulo post-MVP.

- **Review interna (code-reviewer): 6 blocchi + 3 note, tutti verificati e corretti** con test
  (106 totali): sbustamento p7m ora localizza gli offset in latin1 ma **ridecodifica il payload
  in UTF-8** (gli accenti sopravvivono al percorso più comune, i file firmati SdI); i **lotti
  multi-body** producono una fattura per body invece di scartare le successive in silenzio;
  l'import è coperto da test end-to-end (nuovo/duplicato/file rotto/TD04); la **modifica profilo
  è una rotta** (/profilo) così la navigazione la chiude davvero; `chiaveDedup` morta rimossa
  (dedup (anno, numero) documentata: P.IVA cedente col multi-profilo); niente mutazione dei
  warnings. Dalle note: **TipoDocumento esposto e TD04 saltate** con spiegazione, importi totali
  negativi rifiutati, encoding ISO-8859-1 dichiarato rispettato.

**Next steps (S5)**: spese + export CSV; poi S6 parser PDF con form di revisione. Backlog:
ricerca ATECO per descrizione (ISTAT), FPA12, import CSV storico, shadcn/ui, Playwright.

**Blocchi/aperture**: invariati (GU DL 89/2026, soglie GS, mapping ATECO 2025, quadro RR).

## 2026-08-22 — S3 Verticale app

**Fatto**
- **Dataset ATECO→coefficiente nel motore** (`params/ateco.ts`): i 9 gruppi dell'allegato 4
  L. 190/2014 verificati su fonte tabellare (i gruppi restano su ATECO 2007 anche dopo la
  riclassificazione 2025, `daVerificare` sul mapping ufficiale); match per prefisso più specifico
  (46.1 vs 46.2, gruppi di terza cifra) — 7 test.
- **`apps/web` in produzione**: wizard profilo (ATECO con riconoscimento automatico del gruppo,
  copertura GS, anni dal 2025 perché i params partono da lì), registro entrate con data di
  incasso distinta e bollo automatico dai params, bilancio per anno con carte, barra soglie,
  countdown 5%, prossimi F24 con righe/crediti e **breakdown ricorsivo `ExplainedValue`**.
  Stack come da ADR (React 19, Vite, Tailwind 4, Dexie, Zustand, RHF+zod); logica pura dell'app
  (`lib/bilancio.ts`) testata (66 test totali nel repo). Nota: Intl it-IT non raggruppa sotto le
  5 cifre (CLDR `minimumGroupingDigits=2`) → `useGrouping: 'always'`.
- **Deploy**: build locale + `vercel deploy --prebuilt` da `apps/web` (il monorepo non va nel
  cloud) → https://partitiva.vercel.app. Ripulita la confusione deployment (i 404 erano i vecchi
  tentativi vuoti; i deploy si lanciano SOLO da apps/web e con scope esplicito — il default CLI
  è il team enterprise!).
- Dependabot: PR #4 chiusa (riproponeva TypeScript 7, incompatibile con typescript-eslint) +
  `ignore` per `typescript >=7` in dependabot.yml.

- **Review interna (code-reviewer): 5 blocchi, tutti verificati e corretti** con test dedicati
  (76 totali, ora anche jsdom + fake-indexeddb per montare l'App): (1) `useLiveQuery` confondeva
  caricamento e profilo assente → pagina bianca per ogni utente nuovo e Wizard irraggiungibile
  (fix: sentinella + test di mount su DB vuoto); (2) `oggiIso` era in UTC → a mezzanotte italiana
  scriveva l'incasso nell'anno fiscale precedente (fix: data locale); (3) `1.500` parsato come
  1,50 € (fix: punto+3cifre = migliaia); (4) incassata-senza-data salvata in silenzio come mai
  incassata (fix: superRefine + errore a video); (5) mancavano `navigator.storage.persist()` ed
  **export/import JSON** promessi dall'architettura (fix: BackupMenu con schemaVersion).
  Bonus: pulsante "profilo" per modificare il wizard (prima un coefficiente sbagliato era per sempre).

- **Feedback di Federico sul wizard, applicato**: l'ATECO ora è **facoltativo** (o scrivi il
  codice e il settore si seleziona da solo, o scegli il settore dai 9 gruppi ufficiali — le
  etichette spiegano dove trovare il codice); copy iniziale che spiega PERCHÉ servono i tre dati;
  schema `profiloFormSchema` in lib con test either/or. Ricerca ATECO per descrizione puntuale
  (lista ISTAT completa) → backlog.
- **Lezione Vercel**: cancellare i deployment dal dashboard lascia l'alias di produzione senza
  bersaglio → 404; gli URL per-deployment sono protetti da login (302). L'unico link da usare e
  condividere è https://partitiva.vercel.app.

**Next steps (S4)**: parser XML FatturaPA/p7m in TDD sulla fixture + upload/import nel registro;
valutare shadcn/ui e Playwright E2E (i test componente ora hanno l'ambiente jsdom); ricerca ATECO
per descrizione (dataset ISTAT) in backlog.

**Blocchi/aperture**: mapping ufficiale ATECO 2025 (`daVerificare`); wizard limitato ad aperture
≥ 2025 finché non esistono params per gli anni precedenti (serve anche il chiarimento
deduzione-parziale per chi entra a metà carriera).

## 2026-08-22 — S2 Motore fiscale

**Fatto**
- **Motore fiscale completo in TDD** (RED verificato → GREEN): 41 test verdi, `pnpm verify` pulito.
  Catena per anno (`computeAnno`) e timeline multi-anno (`computeTimeline`) con: F24 di luglio e
  novembre composti per righe (codici 1790/1791/1792, causali PXX/P10), crediti esposti e mai
  compensati in automatico, soglie minime acconti (nessun acconto ≤ 51,65 €; rata unica a novembre
  col 1791 sotto 257,52 €), metodo previsionale opt-in con warning, fallback params con warning,
  actuals fino alla **singola rata**, albero di spiegazione per ogni importo, quota di
  accantonamento; regole pure `aggregaIncassato` (cassa) e `bolloPerFattura`.
- **Params 2025/2026 come dati con fonte per valore** (zod al load): circ. INPS 27/2025 e 8/2026,
  L. 190/2014, art. 58 DL 124/2019, DL 89/2026 (`daVerificare` in attesa di GU), soglie acconti.
  Aritmetica in centesimi interi (per-diecimila): niente float nei calcoli.
- Fonti chiuse in S2: causali **PXX/P10** (PXX professionisti; P10 pensionati/altra copertura) e
  codici tributo confermati (il 1791 copre anche l'unica soluzione); minimale GS chiarito
  (18.808 € di reddito ⇒ 4.903,25 € di contributo); valori 2025 (massimale 120.607, minimale 18.555).
- Merge delle 3 PR dependabot (bump actions) e pull; placeholder `apps/web/index.html` pronto.
- **Review interna (agente code-reviewer): 7 rilievi bloccanti, tutti verificati e corretti** con
  test dedicati (51 totali): previsionale ora sull'imponibile previsto (reddito − versamenti
  previsti) e attivo anche sull'anno di conguaglio; actuals con chiavi sconosciute → errore
  esplicito, mai scarto silenzioso; anni duplicati/non consecutivi e incassato negativo → errore;
  saldi con nodo di spiegazione proprio (`saldoImposta`/`saldoContributi`, sovrascrivibili e
  referenziati dalle righe F24); `roundEuroToCents` corretto sui negativi; ripartizione rate e
  soglie-sui-contributi ora letti DAI PARAMS (con seam `opts.getParams` per iniettarli).

**Next steps (S3)**: verticale app (`apps/web` con Vite/React/Dexie), wizard con tabella
ATECO→coefficiente (fonte ufficiale da chiudere), registro entrate con data di incasso, bilancio
col breakdown `ExplainedValue`.

**Blocchi**: deploy Vercel in attesa di `npx vercel login` (MCP 403 anche su preview: pare esistere
un progetto "partitiva" fuori dal team hobby, da chiarire); GU DL 89/2026 e soglie GS restano
`daVerificare` nei params.

## 2026-08-22 — S1.1 Pubblicazione e caso campione sintetico

**Fatto**
- Repo pubblicato: creato `federiconardelli7/partitiva` su GitHub (remote `origin`) con secret
  `PRIVACY_BLOCKLIST` impostato per la CI.
- **Decisione privacy (maintainer)**: nel repo non vivono importi reali — golden, fixture e docs
  usano il **caso campione sintetico «Mario Rossi»** (dataset pluriennale coerente con le regole;
  la coerenza con documentazione reale si verifica solo in locale). Sostituiti tutti gli importi;
  `docs/tracker-oracle.md` ridotto a sola logica, senza valori.
- Decisione: **nessun dominio a pagamento** — se si condivide, si userà il sottodominio Vercel.

**Next steps**: primo push (fatto il refresh dello scope `workflow` del token), CI verde su
Actions, poi S2 come da voce precedente.

## 2026-08-15 — S1 Fondazione

**Fatto**
- Fase 0 completata: nome **Partitiva** (partitiva.it risultava AVAILABLE al whois, handle GitHub
  libero), architettura **client-side puro**, workflow git **main diretto**, ordine MVP
  **motore prima**. Le 7 domande aperte del prompt hanno risposta in `docs/BRAINSTORM.md` e le
  decisioni sono formalizzate in `docs/ADR/0001-scelte-fondanti.md`.
- Double-check fiscale preliminare via web (dettagli e fonti in `docs/regole-fiscali.md`):
  circ. INPS 8/2026 confermata (26,07%, massimale 122.295 €); 20 luglio strutturale confermato;
  **scoperto che la maggiorazione 2026 per il differimento è 0,80%** (art. 6 DL 89/2026), non lo
  0,40% ordinario indicato nel prompt di avvio.
- Scaffold monorepo pnpm (`motore-fiscale`, `parser-fatture` come stub con test placeholder),
  CI GitHub Actions, privacy gate a 3 pattern + blocklist esterna al repo, fixture FPR12
  anonimizzata (anche il committente), governance completa (README, ROADMAP, CONTRIBUTING,
  SECURITY, TESTING, CHANGELOG, CLAUDE).
- Letto in profondità il tracker xlsx (formule + valori estratti con openpyxl): **catena
  verificata in locale contro i casi reali** e logica documentata in `docs/tracker-oracle.md`,
  inclusi i bug del tracker da correggere nel motore (deduzione negativa a fatturato zero →
  imposta fantasma; F24 negativi senza modello di credito; manca il check 100k nel Riepilogo;
  plafond 5.164,57 obsoleto nel foglio Ordinario) e la conferma empirica degli actuals (contributi
  dichiarati sovrascritti a mano sul teorico).

**Decisioni chiave**: vedi ADR-0001. In particolare: parametri fiscali = dati per anno con fonte
obbligatoria; il motore deve supportare gli "actuals" (i F24 reali implicano basi di dichiarazione
arrotondate che divergono di centesimi dai teorici).

**Next steps (S2)**: motore fiscale in TDD sui golden test di `TESTING.md`; `params/2025.ts` e
`params/2026.ts` con fonti; rilettura delle fonti primarie (testo L. 190/2014 su normattiva,
PDF circ. INPS 8/2026) prima di fissare i valori nei params.

- Design review dell'agente architect ricevuta e integrata nei docs: 6 rilievi verificati e
  accolti (actuals fino alle singole rate F24 — le rate effettive divergono di centesimi da
  qualunque base teorica o dichiarata; doppio netto competenza/reale; `ExplainedValue` a mappa
  piatta con `origine`/`valoreCalcolato`; flag `copertura` che guida aliquota E causale; regole
  pure di cassa/bollo nel motore così i golden testano il package; `url?` opzionale nelle fonti).

**Blocchi / aperture**
- Applicabilità delle soglie minime acconto (51,65 / 257,52 €) anche ai contributi GS: da chiarire.
- Causali INPS (PXX / P10) da confermare su fonte primaria in S2.
- Origine dello scarto di centesimi tra le rate INPS effettive e le basi teoriche/dichiarate
  (arrotondamenti del quadro RR?): da chiarire col commercialista prima di S2.
- Import dal tracker xlsx: rimandato (per ora mapping manuale documentato in roadmap).
