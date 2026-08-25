# Diario di bordo

> Una voce per sessione: fatto, decisioni, next steps, blocchi. Le ultime 2 voci si leggono
> all'inizio di ogni sessione (vedi CLAUDE.md).

## 2026-08-25 — S18 Redesign: artefatto delle tre direzioni e scelta della B (ticket 03)

**Fatto**
- Mappa wayfinder `.scratch/redesign-app/`: ticket 03 claimato, lavorato e risolto.
  Costruito l'artefatto con le TRE direzioni affiancate (palette coi ruoli, tipografia
  con numeri tabulari, mockup statici di testata Simulatore + card risultato + mini-chart
  soglie, in chiaro E scuro): `prototipi/03-tre-direzioni.html` (596 KB, font Plex e
  Inter INCORPORATI in data URI: zero richieste di rete, LG München rispettata),
  pubblicato come artefatto per la scelta. `src/` non toccato (plan-don't-do).
- Rigore: hex letti da `@radix-ui/colors@3.0.0` (npm pack); font scaricati e verificati
  al byte contro la research (352.240 / 20.984 / 21.960 / 22.260 B); contrasti WCAG
  ricalcolati con formula validata sui valori della research (9/9 riprodotti); dati
  campione = caso golden «Mario Rossi» 2026 (75.000 → 13.100,18 + 2.135,30 → netto
  59.764,52, pressione 20,31%). Trovate e rimediate 4 coppie sotto soglia: reale-11
  small su step 2 in A/C → step 12; chart scura B violet-9 su binario 2,95 → gap 2 px
  di superficie (3,26) o violet-10 `#7d66d9` (3,62, decisione al 05).
- **Scelta di Federico: direzione B «Notturna»** (slate/cyan dark-first, reale=grass,
  sim=violet, Inter variable self-host). Il plum/rosa di A bocciato; pivot economico
  violet→purple (C) annotato nel ticket. Ticket 03 → resolved con token definitivi
  (chiaro+scuro) e regole AA; riga in Decisions-so-far della mappa.
- Emerso e incardinato (create-then-wire): Federico vuole il redesign dell'INTERO
  display («probably on the left-side menu… not just the color palette»): nuovo ticket
  08 (shell con menu laterale), 07 aggiornato (Panoramica/Dati/Wizard: layout completo,
  non più solo-token; blocked-by +08), nota di convivenza nel 04, fog aggiornato.

**Decisioni**: direzione B coi token del ## Answer del ticket 03; «un colore, un
significato» preservata (reale=grass, sim=violet); step 9 unici nei due temi; build
sempre fuori mappa (parte dalla spec del 07).

**Next steps**: frontiera = 08 (shell) e 04 (pannello Simulatore), parallelizzabili in
chat separate; poi 05 (chart) e 06 (Landing); il 07 consolida spec e piano delle
sessioni di build.

**Blocchi/aperture**: nessuno nuovo. Il tnum su Segoe/Roboto resta non verificato ma è
irrilevante con Inter self-host (tornava in gioco solo col system stack della C).

## 2026-08-23 — S17 Calcolo inverso «che fatturato per X € netti» (post-MVP §4, prima metà)

**Fatto**
- **Nessuna ricerca fonti** (primo effort post-MVP senza `research/`): zero parametri
  nuovi, si invertono le tre catene esistenti già golden-testate (computeAnno,
  computeOrdinario, computeDipendente). Reuse-check: tutto riusato, un solo modulo nuovo.
- **Motore in TDD** (RED 12 → GREEN al primo colpo, 108 test nel package):
  `invertiNetto(obiettivo, nettoDiLordo, {massimo, passo})` in `inverso.ts` — griglia
  0..massimo a passi di 50 € poi scansione all'euro nella cella del primo incrocio;
  risposta in **euro interi** (al centesimo gli arrotondamenti micro-oscillano: plateau
  dell'euro dell'imponibile −5/−15/−34 cent, troncamenti 4 decimali ±12 — verificato a
  mano prima di scegliere la semantica); le catene NON sono monotone → dove il netto
  ricade sotto l'obiettivo il risultato espone anche `lordoStabile`/`nettoStabile`
  (primo euro oltre l'ultima ricaduta sulla griglia); null se al massimo non è
  (stabilmente) raggiunto. 7 test di meccanica su chiusure sintetiche + **5 golden
  quadrati a mano** in `tests/golden/caso-inverso.ts`: forfettario 78% startup
  (30.000 → 39.596,00, flip al centesimo 39.595,92 verificato), tetto 85k non
  raggiungibile (72.000 → null, al tetto 71.036,20), dipendente che ritrova il golden A
  (24.021,37 → RAL esattamente 30.000,00), **trappola del trattamento integrativo**
  (15.450 → RAL 16.452,00 MA a 16.550 si netta 15.391,02; stabile da 16.640,00 —
  −1.200 di TI e −75 di somma persi insieme a RC 15.000), ordinario con regionale a
  mano (25.000 → 44.870,00). Postcondizione testata: all'euro precedente il netto
  non basta.
- **UI**: sezione richiudibile «Che fatturato serve per il netto che vuoi? Calcolo
  inverso» nel Simulatore (`CalcoloInverso.tsx`): netto desiderato, costi (registro +
  altri, **identici sui due regimi d'impresa**: doctrine S7 — in ordinario dedotti, nel
  forfettario fuori dal netto reale via `speseCents`), dimensione azienda + Fon.Te per
  la RAL, regione dal dataset o aliquota a mano; tabella coi tre lordi necessari e il
  **netto riverificato** al lordo proposto, nota ambra sulla ricaduta con lordo stabile,
  messaggio dedicato quando il tetto di permanenza non basta; scansioni in useMemo con
  chiave serializzata della gestione (decine di migliaia di computazioni pure, pochi ms).
  3 mount test sui golden. Forfettario dello scenario: coefficiente/startup/gestione
  correnti e versati FISSI (`risultato.versatiContributiCents`: in concatenata sono i
  derivati; dipendono dall'anno precedente, quindi costanti nella scansione).
- **Docs**: sezione «Calcolo inverso» in regole-fiscali.md (semantica, non-monotonie,
  ipotesi dichiarate); ROADMAP **§4 prima metà** spuntata (resta la pianificazione
  mensile vs soglie); CHANGELOG.
- `pnpm verify` verde: **271 test** (15 nuovi: 12 motore + 3 mount).

**Decisioni**: risposta all'euro intero, mai al centesimo (falsa precisione, golden
fragili); ricadute rilevate sulla griglia da 50 € (finestre più strette possono sfuggire:
dichiarato in UI e in regole-fiscali); tetto forfettario = soglia di permanenza 85.000
(param `uscitaAnnoSuccessivo`), massimo di ricerca ordinario/RAL = 2.000.000 € (costante
UI, dentro il safe-integer di mulRate); in ordinario oneri 19% e figli a zero (si
raffinano nella sezione «E se uscissi»); netto ordinario = incassato − costi − totale.

**Next steps**: collaudo di Federico (caso reale: il suo netto target con Trento nel
select); §4 seconda metà (pianificazione mensile vs soglie) o Fase 2 comunali (dataset
MEF ~7.900 comuni) o §1b casse professionali; housekeeping tag v0.2.0 (Unreleased ormai
enorme: S10-S17).

**Blocchi/aperture**: invariati (nessuna apertura nuova: nessun parametro toccato).

## 2026-08-23 — S16 «E se fossi dipendente?» (post-MVP §3)

**Fatto**
- **Ricerca su fonti primarie** (subagent; il messaggio di sintesi si è perso ma il
  findings file era completo: `.scratch/simulatore-dipendente/research/`
  `dipendente-2025-2026.md`, 331 righe): TUIR artt. 7/11/13/19/51, L. 207/2024 c. 2-9,
  DL 3/2020, L. 199/2025, art. 2120 c.c., L. 297/82, L. 335/95, DL 384/92, D.Lgs.
  148/2015, D.Lgs. 252/2005, circ. AdE 4/E/2025 in PDF, CCNL Terziario artt. 107/221.
  Chiavi: cuneo = somma esente **7,1/5,3/4,8%** (RC ≤ 20k) o ulteriore detrazione 1.000
  con degressione a 40k e CAPIENZA; trattamento integrativo 1.200 vivo (test con −75),
  CUMULABILE con la somma; contributi 9,19% + **terzo del FIS** (le tabelle sintetiche
  lo omettono: fanno fede le circ. INPS 176/2016 e 18/2022) + CIGS 0,30 sopra i 15
  dipendenti (dal 2022 anche commercio: la vulgata «9,49 oltre 50» è pre-riforma) + 1%
  oltre la prima fascia (la stessa dell'IVS) col massimale post-95 (lo stesso c. 18);
  TFR 6,91% netto; 13ª/14ª = timing (IRPEF annuale + conguaglio); Fon.Te 0,55/1,55
  invariato dal rinnovo 2024, plafond 5.164,57/5.300 (TFR conferito escluso);
  Bilancio 2026 tocca solo il 33%. Esempi svolti → golden.
- **Design gate con Federico**: RAL digitata (niente conversioni dal fatturato);
  default contributivo 9,19% puro + selettore dimensione azienda; **Fon.Te col toggle
  ATTIVO di default** (sua scelta: «è uno dei vantaggi»).
- **Motore in TDD** (RED → GREEN, 96 test nel package): gruppo `dipendente` nei params
  2025/2026 (detrazione art. 13 lavoro dipendente, somma integrativa, ulteriore
  detrazione, trattamento integrativo, contributi con FIS a frazione esatta ⅓ via
  `quotaLineare`, TFR 2/27, Fon.Te; massimale e prima fascia RIUSATI da
  previdenza.massimale e previdenzaIvs.fasciaPiuUno — stessi valori di legge);
  `computeDipendente` in `dipendente.ts` (niente arrotondamento all'euro: conguaglio
  del sostituto in centesimi, dichiarato); **9 golden quadrati a mano** in
  `tests/golden/caso-dipendente.ts` (RAL 30k → netto 24.021,37 identico 2025/2026;
  40k → il 33% vale 166,48 di netta; 18k somma 4,8%; 15k cumulo trattamento+somma —
  qui ho corretto in scrittura un mio errore di sottrazione a mano, RC 13.621,50 non
  13.611,50; FIS/CIGS 2.927,00 esatto come l'esempio della ricerca; Fon.Te; massimale
  130k; Trento a zero sotto i 30k anche da dipendente).
- **UI**: sezione richiudibile «E se fossi dipendente?» nel Simulatore
  (`ConfrontoDipendente.tsx`): RAL, contributi in busta (solo IVS default), regione
  dal dataset (pre-selezionata dal profilo) o aliquota a mano, comunale + soglia,
  toggle Fon.Te acceso; tabella con IRPEF spiegata, somme esenti, «Netto annuo da
  dipendente», riga «Matura a parte» (TFR + Fon.Te datore) e confronto col netto
  reale dello scenario forfettario; footer con le ipotesi. 3 mount test sui golden.
- **Docs**: sezione «Lavoro dipendente» in regole-fiscali.md (tabella completa con
  fonti); ROADMAP: spuntati **§2 (S14-S15)** e **§3 (S16)**; CHANGELOG.
- `pnpm verify` verde: **256 test** (12 nuovi: 9 golden motore + 3 mount).

**Decisioni**: RAL come input (mai derivata dal fatturato); Fon.Te ON di default;
default contributivo confrontabile (9,19%) col selettore per il numero vero; TFR e
fondo mai nel netto (retribuzione differita, riga «matura a parte»); detassazioni
2026 fuori perimetro con nota; anno intero/nessun carico di famiglia dichiarati.

**Next steps**: collaudo di Federico; eventuale Fase 2 addizionali comunali (dataset
MEF); §4 calcolo inverso o §1b casse professionali; refresh annuale params (ora anche
gruppo dipendente e dataset regionale).

**Blocchi/aperture**: invariati + buchi dichiarati della ricerca (circolari INPS
26/2025 e 6/2026 confermate solo via mirror concordanti; art. 13 TUIR ha una modifica
già pubblicata con effetto 2027, da riverificare se si modellerà il 2027).

## 2026-08-23 — S15 Addizionale regionale automatica per residenza (Fase 1)

**Fatto**
- **Ricerca su fonti primarie** (subagent, findings in
  `.scratch/confronto-ordinario/research/addizionali-regionali.md`): TUTTE le 21 entità
  (19 regioni + Trento/Bolzano) per 2025 E 2026 dal portale MEF (canale legale ex art. 50
  c. 3 D.Lgs. 446/1997, 42 pagine lette), cross-check integrale AdE Allegato C 730/2026
  sul 2025, leggi provinciali per TN/BZ. Sorprese chiave: 11 enti sulla griglia
  previgente 15k/28k/50k (lecita 2025-2028), FVG/Lazio/Umbria con aliquote condizionali
  sull'INTERO importo, fallback legale = carry-over dell'anno prima (c. 728, NON 1,23%),
  debenza solo se IRPEF netta > 10 € (Allegato C).
- **Motore in TDD** (RED 9 → GREEN, 87 test nel package): dataset
  `params/addizionali-regionali.ts` (21 entità × 2 anni, fonte per entità) con 4 forme —
  unica, scaglioni a confini arbitrari (`impostaPerScaglioni` estratta in `scaglioni.ts`
  e riusata dall'IRPEF), regimi condizionali, esenzione a scalino + detrazioni
  fissa/a fascia; `calcolaAddizionaleRegionale` in `addizionali.ts`;
  `computeOrdinario` accetta `regione` (ignora l'aliquota manuale) e applica il gate
  dei 10 € (nuovo param `minimoIrpefDovutaCents` con fonte). **Equivalenze dimostrate e
  dichiarate**: Trento deduzione-30k-cliff ≡ esenzione a scalino (algoritmo AdE);
  Bolzano rampa min(125, …) ≡ scaglione 1,23 fino a 75k (verificato su ogni fascia,
  golden 60k: 615+173−50−430,50 = 307,50 ✓). Golden a mano anche su FVG (369 a 30k,
  esempio AdE testuale), Lazio 2025 vs 2026 (fascia 35k→30k), VdA, Piemonte 2026,
  Calabria, carry-over 2027/2024, gate a netta 9,27 €.
- **App**: select «Regione o provincia autonoma» nel confronto (pre-selezionata dal
  profilo; scegliendola sparisce l'aliquota manuale, hint sulla struttura applicata);
  campo facoltativo nel Wizard (`Profilo.regione`, additivo: niente bump Dexie, backup
  invariati, transform che spoglia il vuoto); dd «Regione» nell'hub. 6 test confronto
  (select Trento → totale 22.887,59 dal dataset; pre-selezione; wizard persiste) +
  gotcha: il bottone «Inizia a tracciare» collide col link della nav → getByRole.
- **Docs**: righe dataset + debenza 10 € nella sezione «Regime ordinario» di
  regole-fiscali.md, equivalenze TN/BZ e figli-non-modellati nelle semplificazioni
  dichiarate; CHANGELOG.
- `pnpm verify` verde: **244 test** (12 nuovi: 9 motore + 3 app).

**Decisioni**: detrazioni regionali per figli/disabilità (9 enti) NON modellate — senza
carichi il calcolo è esatto, con carichi l'addizionale reale può solo scendere
(dichiarato); comunale resta input manuale (Fase 2 eventuale: dataset MEF dei ~7.900
comuni); fallback anni fuori dataset = carry-over (regola legale, non l'1,23%).

**Next steps**: collaudo di Federico (il suo caso: Trento, sotto i 30k di imponibile
l'addizionale sparisce); refresh annuale del dataset dentro la procedura di manutenzione
(5 enti cambiati nel 2026: ER, Piemonte, Puglia, Lazio, Liguria); poi §1b casse
professionali o §3 simulatore dipendente.

**Blocchi/aperture**: invariati + i caveat della ricerca: 2026 a fonte singola MEF
(il 730/2027 non esiste ancora); le regioni commissariate possono rideterminare
infra-anno (ricontrollare il MEF a inizio stagione dichiarativa).

## 2026-08-23 — S14 Confronto con l'ordinario (post-MVP §2)

**Fatto**
- **Ricerca su fonti primarie COMPLETA** (2 subagent, findings in
  `.scratch/confronto-ordinario/research/irpef-2026.md`, 9 sezioni con citazioni verbatim):
  testi vigenti su Normattiva (TUIR artt. 11, 13, 15, 16-ter, 54, 66; L. 199/2025;
  L. 207/2024; D.Lgs. 68/2011; D.Lgs. 360/1998; DPR 600/1973), circ. AdE 6/E/2025 e
  ris. 93/E/2019 in PDF. Zero smentite del documentato; UNA correzione allo scoping
  (detrazione LA vigente 1.265/500+formule, non il 1.104 ante-2022). Trovato anche:
  50/50 degli acconti vale per l'ex-forfettario (ris. 93/E: basta l'ISA approvato),
  IRAP mai per le persone fisiche, −440 solo sul monte oneri 19%/partiti/calamità.
- **Design gate con Federico** (2 domande): costi reali = **registro spese + campo
  «altri costi»**; oneri 19% **SÌ, campo aggregato** (⇒ input figli a carico per il
  coefficiente del tetto 16-ter).
- **Motore in TDD** (RED verificato: 8 failure attese → GREEN): `computeOrdinario` in
  `src/ordinario.ts` — reddito effettivo (clamp a zero con flag `ordinario-perdita`),
  contributi GS/IVS su base effettiva (riuso `contributiFissiIvs`/`contributiEccedenzaIvs`
  coi massimali e relativi flag), IRPEF a scaglioni dai params, detrazione LA con
  troncamento a 4 decimali (art. 13 c. 6: `rapportoTroncato4`, aritmetica intera),
  oneri 19% (tetto sulle spese × coefficiente figli → 19% → degressione con
  `quotaLineare` half-up dichiarato → −440 con clamp), addizionali dovute solo con
  IRPEF netta > 0 e soglia comunale a scalino. Nuovo blocco `irpef` nei params
  2025/2026 (zod + fonte per valore, incluso il 35% del 2025 e taglio −440 null nel
  2025). **8 golden quadrati a mano** in `tests/golden/caso-ordinario.ts` (checkpoint
  13.700/14.140 a 50k dalla scheda AdE; clamp del −440 esercitato; bonus +50; cliff
  comunale; perdita con fissi IVS dovuti; 2025 vs 2026).
- **UI nel Simulatore**: sezione richiudibile «E se uscissi dal forfettario?»
  (`ConfrontoOrdinario.tsx`) — costi dal registro spese dell'anno + altri costi, oneri
  19% (copy: sanitarie e mutui esclusi per legge), figli a carico, addizionali in %
  con validazione sui massimi di legge (`parsePercentoIt`, 2 decimali di percento per
  l'aritmetica del motore), soglia esenzione; tabella di confronto col «Totale
  ordinario» vs forfettario (contributi+imposta) e verdetto col delta annuo; footer con
  le assunzioni («a regime», competenza). 3 mount test + unit sul parse.
- **Docs**: nuova sezione «Regime ordinario» in regole-fiscali.md (tabella completa con
  fonti primarie + semplificazioni dichiarate); righe roadmap IRPEF/plafond promosse a
  primarie (23/08); CHANGELOG.
- `pnpm verify` verde: **232 test** (78 nel motore; 12 nuovi: 8 golden ordinario, 1 unit
  su `parsePercentoIt`, 3 mount del confronto).

**Decisioni**: confronto **a regime e di competenza** (contributi dovuti come deduzione,
niente acconti/cassa nel confronto: alla lettera il primo anno d'ordinario nascerebbe
senza acconti IRPEF — documentato, non modellato); input oneri = solo quelli soggetti ai
meccanismi; aliquote addizionali come input unico (articolazione regionale per scaglioni
= semplificazione dichiarata); perdite non modellate (clamp+flag).

**Next steps**: collaudo di Federico sul confronto in produzione; poi §1b casse
professionali o §3 simulatore dipendente; backlog invariato (offline PWA,
apple-touch-icon, superRefine riepiloghi).

**Blocchi/aperture**: invariati (GU DL 89/2026, soglie GS, mapping ATECO 2025, quadro RR
arrotondamenti, daVerificare 0,48). Nuovo, informativo: nessuna circolare AdE «primi
chiarimenti» sulla L. 199/2025 ancora agganciata (la scheda AdE 13/01/2026 fa da
riscontro); clamp a zero del −440 = interpretazione dichiarata.

## 2026-08-23 — S13 Tema chiaro/scuro, pulizia Vercel e kickoff §2

**Fatto**
- **Tema chiaro/scuro/sistema in TDD** (6 test nuovi, RED→GREEN): variante Tailwind
  `dark:` passata dal media query alla CLASSE (`@custom-variant dark` in index.css +
  classe su `<html>`); script inline anti-flash in index.html (replica la lettura di
  `lib/tema.ts`: stessa chiave `partitiva-tema`); `lib/tema.ts` con persistenza
  localStorage **per-dispositivo** («sistema» rimuove la chiave; MAI nei backup: non è
  un dato fiscale); `TemaToggle` nell'header (ciclo sistema→chiaro→scuro, aria-label
  parlante, simboli ◐/☀/☾); meta theme-color pilotati dal tema effettivo (barra
  browser/PWA coerente, con «sistema» tornano per-media); `color-scheme` segue la
  classe. jsdom senza matchMedia → guardia nel componente (fallback chiaro nei test).
- **Progetti fantasma partitiva-calc/partitiva-stats** (segnalazione S10): risultano già
  assenti da TUTTI gli scope raggiungibili (team personale ed enterprise, verificato con
  `vercel project ls` + `teams ls`): nulla da rimuovere, segnalazione chiusa.
- **Kickoff §2 «Confronto con l'ordinario»** (mandato di Federico: «continue with the
  full roadmap»): effort wayfinder `.scratch/confronto-ordinario/` (mappa) e **ricerca
  fonti primarie lanciata** via subagent — art. 11/13 TUIR vigenti su Normattiva
  (scaglioni IRPEF 2026 e detrazioni lavoro autonomo, oggi documentati solo su fonti
  secondarie), taglio detrazioni >200k (Bilancio 2026), tetti L. 207/2024 c. 10,
  addizionali regionale/comunale, acconti IRPEF; findings attesi in
  `research/irpef-2026.md`. Design e implementazione partono SOLO dai findings.
- `pnpm verify` verde: **220 test** (214 + 6 tema).

**Decisioni**: tema = preferenza per-dispositivo in localStorage, esclusa dai backup;
ciclo a tre stati con default «come il dispositivo»; theme-color aggiornati da
`applicaTema` (i default per-media restano in index.html).

**Next steps**: findings ricerca §2 → brainstorm con Federico sull'input «costi reali»
(voce unica? percentuale?) → design motore ordinario (params IRPEF con fonte per valore,
catena parallela, UI confronto nel Simulatore) → TDD.

**Blocchi/aperture**: invariati (GU DL 89/2026, soglie GS, mapping ATECO 2025, quadro RR
arrotondamenti, daVerificare 0,48 commercianti).

## 2026-08-23 — S12 Quota acconti IVS su fonte primaria + fix dal collaudo di Federico

**Fatto**
- **daVerificare «quota acconti eccedenza» CHIUSO** (ricerca subagent, findings in
  `.scratch/gestioni-inps/research/quota-acconti-eccedenza.md`): istruzioni **Redditi PF
  2026 Fascicolo 2** (agg. 13/05/2026, Appendice «INPS - Modalità di calcolo degli
  acconti», pag. 62) lette sul PDF AdE + **circ. INPS 62/2026** (rinvia al Fascicolo 2 per
  il calcolo) + art. 18 c. 4 D.Lgs. 241/1997 (RGS). Verdetto PARZIALE: quota 100% ✓ e due
  rate di pari importo ✓ (regola propria delle istruzioni RR, NON art. 58 DL 124/2019, che
  riguarda le imposte); **base di calcolo SMENTITA** — l'acconto è l'eccedenza del reddito
  N−1 ricalcolata con minimale/massimale/aliquote/**agevolazioni dell'anno N**, non il
  dovuto N−1 fotografato.
- **Fix motore in TDD** (golden rosso prima): `contributiEccedenzaIvs` estratta pura in
  compute-anno e usata dagli acconti della timeline coi params dell'anno corrente; golden
  artigiano 2026 ricalcolato a mano (acconti 2.722,08 = 1.361,04 × 2 col minimale 18.808;
  versati 10.011,06; imposta 1.509,45); nuovo test: le agevolazioni seguono l'ANNO
  CORRENTE (50% nel 2025 → acconti 2026 pieni, saldo 2025 ancora ridotto). **GS invariata**
  (80% del dovuto N−1, actuals-aware): equivale alla lettera AdE finché aliquote/massimale
  non incidono — equivalenza dichiarata in regole-fiscali.md, il golden «dichiarato» di
  Mario Rossi resta il contratto. Fonti aggiornate nei params (via `daVerificare`; anche
  la quotaContributi GS ora cita la primaria).
- **Fix registro (bug dal collaudo)**: «incassa oggi» scriveva SEMPRE oggi — una fattura
  2025 importata da XML finiva incassata nel 2026, anno fiscale sbagliato, senza modo di
  correggere. Ora «segna incasso» apre un editor inline con data proposta
  (`propostaDataIncasso`: oggi solo per fatture del mese corrente, altrimenti data
  fattura), la pillola della data si clicca per correggere o togliere l'incasso; il
  prefill PDF propone la data della fattura.
- **Fix parser PDF (bug dal collaudo)**: le stampe da browser del foglio di stile
  (fatturapa.gov.it) portano la data in ISO («2026-07-27 (27 Luglio 2026)») e gli importi
  nel formato grezzo dell'XML (punto decimale): le euristiche vedevano solo gg/mm/aaaa e
  1.234,56 → «data/totale non trovati». Ora `trovaData` accetta entrambe (calendario
  sempre validato) e `ultimoImporto` ha il fallback XML con l'it-IT prioritario (1.500,00
  resta migliaia); fixture sintetica del layout con le esche vere (date di stampa nel nome
  file, importi EN nella descrizione). **Verifica end-to-end sul PDF reale** (fuori repo,
  riproduzione locale con lo stesso pdfjs dell'app): tutti i campi estratti, 0 avvisi.
  Secondo giro dal retest di Federico: le **copie di cortesia** (il PDF che si scarica
  all'invio) sono un TERZO layout — «Numero:» senza «documento», data coi PUNTI senza
  etichetta (fusa con l'indirizzo del committente: si cerca solo nel blocco del numero),
  totale su riga «TOTALE … (EUR)» con esche «Totale imposta/imponibile» e bollo «Importo
  2,00» da escludere, nessun TDxx (avviso mantenuto, la revisione obbligatoria è il
  cancello). Fixture sintetica dedicata + e2e su ENTRAMBI i PDF reali. Diagnosi fatta
  riproducendo il flusso in un browser headless pulito contro la produzione: il primo
  retest fallito era il layout nuovo, non il deploy (bundle verificato per marker).
- **Auto-deploy dal push RIPRISTINATO** (richiesta di Federico): la causa del distacco di
  S5 era il progetto Vercel con Root Directory «.» e framework «Other» → build vuote in 1s
  che rubavano l'alias. Ora la build del monorepo è dichiarata nel `vercel.json` di RADICE
  (install pnpm del workspace, `pnpm --filter @partitiva/web build`, output
  `apps/web/dist`, rewrite SPA) e Git è ricollegato (`vercel git connect`); pipeline
  collaudata con una **preview cloud** (READY, SPA ok, bundle coi marker correnti) PRIMA
  del primo push. Se una build fallisce l'alias non si muove; il prebuilt manuale da
  `apps/web` resta il fallback (il suo `vercel.json` locale è invariato). In `.gitignore`:
  `.vercel` (link di radice) e `IT*_*.pdf` (le copie di cortesia reali, es.
  `ITxxx…_yyy.pdf`, non devono mai poter entrare nel repo pubblico).
- TDD: **210 test verdi** (9 nuovi/aggiornati, RED verificato prima del GREEN). Nota: un
  flake una-tantum sul titolo in app.test.tsx (ordine dei file), non riproducibile in 3 run.

**Decisioni**: base acconti IVS = ricalcolo coi params dell'anno corrente (lettera AdE);
GS resta sul dovuto N−1 (cambiarla romperebbe la propagazione actuals del caso campione a
beneficio zero con aliquote stabili); anno di conguaglio: agevolazioni assunte pari
all'ultimo anno di dati (dichiarato in regole-fiscali.md); niente soglie minime sugli
acconti IVS (le fonti non ne enunciano; coerente col default del motore).

**Next steps**: retest di Federico su import PDF e incassi in produzione; resta l'ultimo
daVerificare (0,48 commercianti sotto la 35%: solo con una tariffazione INPS reale); poi
§2 confronto con l'ordinario o §1b casse professionali.

**Blocchi/aperture**: invariati (GU DL 89/2026, soglie GS, mapping ATECO 2025, quadro RR
arrotondamenti) — chiuso il daVerificare sulla quota acconti; resta quello sulla 0,48.

## 2026-08-23 — S11 Gestioni IVS: artigiani e commercianti (post-MVP §1)

**Fatto**
- **Effort wayfinder** `.scratch/gestioni-inps/` (mappa + 6 ticket, tutti chiusi): 3
  ricerche su fonti primarie lette integralmente (circ. INPS 38/2025 e 14/2026 per valori
  e scadenze, 83/2025 per la riduzione 50%, 35/2016, L. 190/2014 c. 77–84 e L. 207/2024
  c. 186 su Normattiva, tabella causali AdE + circ. 87/2002); scope approvato: solo IVS
  (casse professionali = sforzo separato); design in delega (`design.md`).
- **Motore** (modifiche sanzionate per questo sforzo): `gestione?: GestioneInput` su
  `AnnoInput` (assente = Gestione Separata → retrocompatibilità totale, i 183 test
  preesistenti sono invariati); blocco `previdenzaIvs` nei params 2025/2026 con fonte per
  valore (minimale, aliquote 24/24,48, maternità 7,44 mai ridotta, fascia +1%, massimali
  per anzianità, scadenze rate con slittamento sab/dom→lunedì, causali AF/CF/AP/CP,
  riduzioni 35%/50% — con la 50% la 0,48 resta piena); `contributiFissiIvs` + eccedenza a
  scaglioni fino al massimale; 4 rate fisse per CASSA (nodi `rataFissa:1..4`, actuals per
  singola rata; la rata 4 cade a febbraio dell'anno dopo) ed eccedenza a saldo+acconti nei
  F24 di luglio/novembre; flag `massimale-ivs`, `sotto-minimale-ivs`, `accredito-ridotto`.
- **App**: `Profilo` += `gestione`/`anzianitaAl1995`/`riduzioneIvs` (additivi: nessun bump
  Dexie, backup v3 invariato, default GS per i profili esistenti); fieldset «Previdenza
  INPS» nel Wizard; Simulatore gestione-aware (`gestioneDelProfilo`, finestra 36 mesi
  della 50% ad anni interi, prudente); dd «Previdenza» in Dati; Panoramica coi F24 futuri
  ordinati per scadenza.
- **Docs**: sezione «Artigiani e commercianti (gestioni IVS)» in `docs/regole-fiscali.md`
  (ogni importo quadrato al centesimo contro le circolari), ROADMAP §1 ✓, CHANGELOG.
- TDD: 202 test verdi (19 nuovi, di cui 10 golden IVS calcolati a mano in
  `tests/golden/caso-artigiano.ts` e 4 dalla review).

- **Review (code-reviewer): 3 blocchi, tutti con repro, corretti in TDD**: (1) il flag
  `sotto-minimale-ivs` non scattava a reddito ZERO — proprio il primo giorno di ogni
  nuovo artigiano, con 4.521,36 € di rate emesse senza una riga di spiegazione (via la
  guardia `reddito > 0`, clonata dalla GS dove invece ha senso); (2) tornando su
  «Gestione Separata» nel Wizard, RHF conserva i campi IVS smontati e l'hub dichiarava
  «riduzione 35%» a un profilo GS — ora `profiloFormSchema` azzera gli stati IVS per la
  GS e l'hub li mostra solo per artigiani/commercianti (copre anche i backup scombinati,
  lezione S10); (3) su timeline a gestione MISTA (GS→IVS o viceversa) gli acconti
  prendevano base e quota dal regime dell'anno prima con causale/etichetta dell'anno
  corrente (F24 incoerente): non raggiungibile dall'app, ma `computeTimeline` è API
  pubblica → errore esplicito al cambio di `tipo` tra anni consecutivi (semplificazione
  dichiarata in regole-fiscali.md); la finestra della 50% (stesso tipo, riduzione diversa
  per anno) resta valida. 3 note non bloccanti a backlog: memo di `gestioneDelProfilo`
  instabile nel Simulatore, flag `previsionale-sanzioni` emesso anche dove l'IVS ignora
  il previsionale, copy Panoramica «2 F24 dell'anno» meno parlante per la GS.

**Decisioni**: massimale default post-1995 con toggle anzianità; riduzioni a 3 stati con
avvisi; niente maggiorazioni da differimento nell'MVP (conflitto 0,40/0,80 DL 89/2026);
due **daVerificare** dichiarati — quota acconti dell'eccedenza (le circolari rinviano alle
istruzioni Redditi PF) e 0,48 commercianti sotto la riduzione 35% (lettura letterale, da
confermare su una tariffazione reale).

**Next steps**: casse professionali come parametri custom (§1b) o confronto con
l'ordinario (§2); backlog residuo: offline PWA (vite-plugin-pwa), apple-touch-icon PNG,
messaggio del superRefine riepiloghi che non riaffiora nell'import.

**Blocchi/aperture**: invariati (GU DL 89/2026, soglie GS, mapping ATECO 2025, quadro RR)
più i due daVerificare IVS qui sopra.

## 2026-08-23 — S10 Rifiniture dal backlog (post-v0.1.0)

**Fatto**
- **Settore per NOME** (il bug più vecchio del backlog): quattro gruppi dell'allegato 4
  condividono il 40% e i `<select>` con value=coefficiente perdevano la scelta (il DOM
  torna alla prima opzione col valore duplicato). Ora: `Profilo.settore?` (campo non
  indicizzato, niente bump Dexie; backup v3 invariato, additivo), `profiloFormSchema` con
  campo `settore` validato sull'allegato 4 e `transform` che deriva il coefficiente,
  Wizard e Simulatore con option value=nome, `settoreProfilo` che dà precedenza al nome
  salvato. I profili pre-S10 al 40% richiedono una scelta esplicita in modifica (mai
  pre-selezionare il primo). Pin-test sul DOM del Simulatore.
- **Guardia sul prefill PDF**: se «Nuova fattura» ha numero o importo non salvati, il
  prefill chiede conferma (annulla = form intatto). Testato con confirm mockato nei due rami.
- **Micro-fix dalle note dei reviewer**: errore d'import backup che NOMINA l'annoApertura
  fuori range; `descriviGiorni` (oggi/domani/«tra n giorni») per il countdown F24;
  ultima riga «Totale documento» nei PDF multi-pagina (con fallback alle precedenti);
  `tabindex=-1` sul main per lo skip link.
- TDD: 183 test verdi (5 nuovi netti; contando le riscritture si sbagliava — corretto in
  review). Verificata anche la **PR #5 di Dependabot** (vitest
  4.1.10→4.1.11, patch-only, CI verde, niente TS7): mergiabile, decisione a Federico.
- **Segnalazione infra**: i progetti Vercel `partitiva-calc` e `partitiva-stats` sono
  ancora collegati al repo e deployano a ogni push sui loro URL (probabili fantasmi di
  S3). Non toccano partitiva.vercel.app; disconnessione/eliminazione a discrezione di
  Federico (comandi consegnati in sessione).

- **Review (code-reviewer): 4 blocchi, corretti**: il nome salvato ora passa SEMPRE da
  `settoreProfilo` (Wizard e Simulatore non lo leggono più direttamente) e l'helper
  verifica anche la **coerenza col coefficiente** (un backup può portare un nome
  scombinato: meglio tacere che nominare il gruppo sbagliato); conteggio test in PROGRESS
  corretto (5 nuovi, non 8); CHANGELOG completato col fix dello skip link.

**Next steps**: post-MVP dalla roadmap (altre gestioni INPS, confronto ordinario) o
backlog residuo: offline PWA (vite-plugin-pwa), apple-touch-icon PNG, messaggio del
superRefine riepiloghi che non riaffiora nell'import.

**Blocchi/aperture**: invariati (GU DL 89/2026, soglie GS, mapping ATECO 2025, quadro RR).

## 2026-08-23 — S9 Hardening: PWA, a11y, onboarding — MVP COMPLETO

**Fatto**
- **PWA installabile**: `manifest.webmanifest` (standalone, lang it, theme emerald) +
  `icona.svg` (P a tracciato, niente font: any+maskable) + favicon e doppio `theme-color`
  (light/dark) in index.html. **Scelta dichiarata: niente service worker** — l'installabilità
  moderna non lo richiede più e un SW mal invecchiato è la trappola-404 in salsa cache;
  l'offline completo (vite-plugin-pwa) va in backlog come decisione, non dimenticanza.
  Pin-test su file statici (`tests/pwa.test.ts`).
- **Orientamento e a11y**: `document.title` per rotta (Panoramica/Simulatore/I miei dati ·
  Partitiva; titolo di presentazione senza profilo) con l'effect PRIMA dell'early return
  (regola hooks); skip link «Salta al contenuto» → `main#contenuto`; banner PDF con
  `role="status"`; barra soglie `aria-hidden` (l'informazione è nel testo); contrasto dei
  bottoni «elimina» (stone-400→500). La base mobile c'era già (Flusso che impila, tabelle
  in overflow, form a colonna).
- **Onboarding nel README**: via il blocco «pre-alpha» di S1 → stato reale (MVP in
  produzione), sezione «Come si usa» (le tre pagine, riepiloghi, spese, import XML/PDF,
  backup e CSV, installazione), struttura del monorepo corretta.
- TDD: 178 test verdi (5 nuovi). **Con questa sessione l'MVP della roadmap è completo.**

**Decisioni**: PWA senza SW (sopra); apple-touch-icon PNG in backlog (iOS installa comunque,
con icona di ripiego).

**Next steps**: post-MVP dalla roadmap (altre gestioni INPS, confronto ordinario, calcolo
inverso…) o rifiniture dal backlog: select settori al 40%, prefill PDF che sovrascrive senza
avviso, offline/vite-plugin-pwa, messaggio import backup con l'anno, «tra 0 giorni».
Valutare il tag v0.1.0 (CHANGELOG «Unreleased» → release).

**Blocchi/aperture**: invariati (GU DL 89/2026, soglie GS, mapping ATECO 2025, quadro RR).
NOTA: il push di S8 (`a27e243`) non risulta su origin (main ahead 1 anche dopo fetch).

## 2026-08-23 — S8 Parser PDF con revisione obbligatoria

**Fatto**
- **Euristiche pure nel package** (`parser-fatture/src/pdf-testo.ts`, `estraiCampiPdf`):
  dal testo del foglio di stile SdI a numero/data ISO/totale/tipologia — riga-intestazione
  («Numero documento»+«Data documento») → riga valori (numero = ultimo token utile prima
  della data), variante «etichetta: valore», totale come ultimo importo it sulla riga (o
  successiva), TDxx dal primo match. Best effort, mai throw; 7 test su fixture sintetiche,
  incluse la data-esca e la scansione vuota.
- **Deviazione dichiarata da docs/architettura.md**: pdfjs-dist NON sta nel package ma in
  `apps/web` (`lib/pdf.ts`, glue browser-only con worker via `?url`, caricato con `import()`
  dinamico al click → code-splitting): il package resta puro e testabile in Node, il glue
  (25 righe senza logica) si mocka nei mount test e si verifica in produzione.
- **Revisione obbligatoria per costruzione**: «⬆ Importa PDF (con revisione)» precompila il
  form «Nuova fattura» (`reset()` RHF: numero, data, importo; incassata deselezionata) con
  banner ambra e avvisi; il salvataggio resta solo il click su «Aggiungi». Scansione senza
  testo → banner degradazione e form vuoto; **TD ≠ TD01 → nessun prefill** («non importata»).
  Nuova dipendenza `pdfjs-dist` (prevista dall'architettura): lockfile aggiornato.
- `centsInInput` promosso in `lib/format` (terzo uso). TDD: 170 test verdi (10 nuovi).

- **Review (code-reviewer): 4 blocchi, tutti con repro, corretti in TDD**: (1) `dataIso`
  ora valida il calendario (round-trip `Date.UTC`) — un 07/15/2026 US o un 31-02-2026 non
  arrivano più a Dexie, scatta l'avviso; (2) intestazione con data sulla STESSA riga
  (colonne fuse) → ramo inline ancorato alle etichette, mai pescare le date-esca dalle
  righe dopo; (3) coperto con test il catch «PDF non leggibile»; (4) `await promise` del
  loading task dentro il try: sul PDF illeggibile il finally spegne il worker (prima
  restava vivo). Nota applicata: il banner si azzera dopo «Aggiungi». Il reviewer ha anche
  verificato `vite build` (worker come asset, chunk pdf separato dal dynamic import).

**Decisioni**: un PDF per volta (la revisione è per-file, l'import multiplo resta all'XML);
niente estrazione della descrizione dal PDF (troppo rumorosa: la scrive l'utente).
Backlog nuovo dalla review: prefill che sovrascrive un form già compilato senza avviso;
prima riga «Totale documento» (non l'ultima) in layout multipli.

**Next steps (S9)**: hardening — mobile/a11y, PWA installabile, onboarding documentato.
Backlog: select settori al 40%, messaggio import backup con l'anno, «tra 0 giorni».

**Blocchi/aperture**: invariati (GU DL 89/2026, soglie GS, mapping ATECO 2025, quadro RR).

## 2026-08-23 — S7 Spese, override bollo ed export CSV

**Fatto**
- **Registro spese nell'hub** (Dexie v3, `spese: '++id, data'`): form data/importo/
  descrizione, tabella con elimina e totale dell'anno corrente. Copy senza ambiguità:
  «nel forfettario le spese NON si deducono, il coefficiente le forfetizza» — pesano solo
  sul **netto reale**, che il motore già calcolava (`speseCents` per anno di cassa via
  `spesePerAnno` in lib). Panoramica e Simulatore concatenato le usano da soli.
- **Override del bollo** sulla fattura manuale: campo «Bollo (€)» vuoto = regola dai params
  (mostrata live), pieno = forzatura (`fatturaFormSchema.bollo` con default ''). Il
  percorso XML con `DatiBollo` resta quello di S4.
- **Export CSV** di fatture e spese per Excel/Numbers italiani (separatore «;», decimali
  con virgola, date gg/mm/aaaa, campi quotati, BOM UTF-8): funzioni pure in `lib/csv.ts`
  + helper `lib/scarica.ts` riusato anche dal backup.
- **Backup `schemaVersion: 3`** (+spese): v1 e v2 si importano ancora (union+transform);
  chiuso il backlog «riepiloghi duplicati»: anni doppi ora RIFIUTATI all'import (v2 e v3).
- TDD: 159 test verdi (11 nuovi). Gotcha da verbale: mai sostituire il costruttore
  `URL` globale nei test jsdom (si aggiungono solo `createObjectURL`/`revokeObjectURL`,
  con ripristino in finally), e il BOM va in stringa semplice, non in template literal
  (eslint `no-irregular-whitespace`).

- **Review (code-reviewer): 3 blocchi, corretti in TDD**: (1) **CSV injection** — i campi
  che iniziano con `= + - @` (le descrizioni arrivano anche da XML di terzi) ora vengono
  neutralizzati con l'apice, perché Excel valuta le formule anche tra virgolette; (2) il BOM
  dell'export ora è asserito sui byte grezzi (lezione: `Blob.text()` decodifica via il BOM);
  (3) coperto il ramo di default del bollo (vuoto → regola dai params). Più due note:
  niente array condiviso nei transform del backup (immutabilità), convenzione
  `annoDi(oggiIso())` nel totale spese.

**Decisioni**: spese senza categorie (post-MVP la categorizzazione); niente spese nei
riepiloghi annuali (il pregresso spese raramente è noto; si riapre se serve); CSV = analisi
e commercialista, il backup JSON resta l'unico formato di ripristino.

**Next steps (S8)**: parser PDF con form di revisione. Backlog: select settori con value
duplicati al 40% (Wizard/Simulatore), messaggio import che nomini l'anno, «tra 0 giorni».

**Blocchi/aperture**: invariati (GU DL 89/2026, soglie GS, mapping ATECO 2025, quadro RR).

## 2026-08-22 — S6 Riepiloghi annuali e simulatore concatenato

**Fatto**
- **Riepiloghi annuali («pregresso»)** su richiesta di Federico ("non voglio ricostruire il
  2025 fattura per fattura"): nuova tabella Dexie v2 `riepiloghi` (chiave `anno`), sezione
  dedicata in «I miei dati» (form RHF+zod, anni da apertura a corrente, elimina con
  conferma, avviso sui riepiloghi orfani pre-apertura). Il pregresso si **SOMMA** alle
  fatture dell'anno in `buildTimelineInputs` (solo adattamento dati: le regole restano nel
  motore); la Panoramica mostra «include pregresso X» e le pillole coprono anche gli anni
  solo-riepilogo. Backup `schemaVersion: 2` con riepiloghi; i v1 si importano ancora
  (union+transform zod, testato).
- **Simulatore concatenato**: select «anno simulato» (apertura → corrente+1, solo col
  profilo) e spunta «Concatena i miei dati fino a Y−1»: lo scenario passa da `computeAnno`
  a `computeTimeline([anni reali, scenario])` e i **versati deducibili diventano derivati**
  (campo sola-lettura coi saldi+acconti veri della catena, riepiloghi inclusi); nota
  esplicita quando la catena usa l'anno in corso. «Parti dai tuoi dati» ora attiva la
  concatenazione. Senza profilo tutto invariato (sandbox manuale).
- TDD: 148 test verdi (18 nuovi: schemi/backup v1→v2, somma pregresso, mount riepiloghi,
  catena derivata col valore atteso calcolato dal motore nel test). `pnpm verify` verde.
- **Review (code-reviewer): 2 blocchi, corretti in TDD**: (1) simulando un anno senza params
  il ripiego era silenzioso — ora il Simulatore mostra i flag del motore nel ramo concatenato
  (anche più d'uno: la timeline compone l'F24 dell'anno dopo) e sintetizza lo stesso avviso
  nel ramo manuale (`annoParamsVicini` estratto in lib); (2) l'esclusione dei riepiloghi
  orfani (anno < apertura) promessa dalla UI ora è inchiodata da un test dedicato.

**Decisioni**: pregresso = somma (mai sostituzione) così l'anno ibrido "aggregato + fatture
nuove" funziona; anni registrabili solo fino al corrente (il futuro si simula); un riepilogo
per anno, risalvare sovrascrive.

**Next steps (S7)**: spese + export CSV (ex S6); poi S8 parser PDF. Backlog: select settori
con value duplicati al 40% (Wizard/Simulatore), messaggio import backup che nomini l'anno,
«tra 0 giorni» sull'F24 odierno.

**Blocchi/aperture**: invariati (GU DL 89/2026, soglie GS, mapping ATECO 2025, quadro RR).

## 2026-08-22 — S5 Redesign IA: Panoramica, Simulatore, I miei dati

**Fatto**
- **Wayfinder + prototipo approvato**: mappa decisionale in `.scratch/redesign-ia/` (tracker
  local-markdown, untracked), prototipo HTML navigabile approvato da Federico (riserva: la resa
  del Flusso andava migliorata in implementazione), spec e piano consolidati lì. Origine del
  feedback: il Calcolatore in landing sembrava modificare il profilo; mancava una vista
  d'insieme coi dati veri.
- **Nuova IA a tre concetti**: `/` = **Panoramica** col profilo (vista derivata read-only che
  «si aggiorna da sola da I miei dati») o landing di presentazione senza profilo; `/simulatore`
  = sandbox con livrea indaco, banda «qui non si salva niente», toggle «primo anno (nulla da
  dedurre)» e prefill SOLO esplicito «Parti dai tuoi dati»; `/dati` = hub della sorgente
  (Fatture + import XML, Profilo con modifica inline, Backup). Redirect: `/registro`→`/dati`,
  `/profilo`→`/dati`, `/bilancio`→`/`. Copy pattern: ogni pagina apre dichiarando la sorgente
  dei dati e cosa NON fa; termini canonici in `CONTEXT.md` (nuovo).
- **Componente `Flusso`** (il cuore, dai diagrammi di riferimento di Federico): proiezione
  year-aware dell'`ExplainMap` — primo anno = imponibile pieno; dagli anni dopo compare da
  solo il ramo «F24 pagati → di cui contributi deducibili» — nodi cliccabili che spostano la
  radice dell'ExplainTree («ogni numero col suo perché»), zero logica fiscale nell'app.
  Panoramica con riga «Adesso» (da incassare + CTA, prossimo F24 con countdown, barra soglie)
  e pillole per anno: il Bilancio è assorbito lì.
- 125 test verdi (19 nuovi: helper puri, Flusso year-aware, mount della nuova IA, sandbox che
  non scrive mai su Dexie); motore e params non toccati; import XML invariato.

- **Post-commit: 404 in produzione risolto alla causa.** Il push su GitHub innescava
  l'integrazione Git del progetto Vercel (Root Directory `.`, framework "Other" → deployment
  VUOTO in 1s che ruba l'alias di produzione: erano questi i «tentativi vuoti» già visti in
  S3). Alias ripuntato al deployment prebuilt buono e **integrazione Git scollegata**
  (`vercel git disconnect`): il push non crea più deployment, il deploy resta SOLO quello
  prebuilt da `apps/web`. Verifica live: 200 su tutte le rotte (rewrite SPA ok) e bundle di
  produzione con le stringhe S5. Nota CLI: `vercel inspect`/`alias` ignorano il link e cadono
  sullo scope enterprise di default → sempre `--scope federiconardelli-avalabsorgs-projects`.

- **Review, secondo passaggio (sul commit)**: i 3 fix del primo giro confermati corretti;
  un blocco nuovo e fondato — la card soglie della Panoramica hardcodava «85.000 €», la
  tacca all'85% e «85k · 100k» con `soglia85/soglia100` già in scope dai params. Ora
  etichette e tacca derivano da `params.soglie.*` (nuovo `formatEuroIntero`, test che segue
  i params; gotcha: testing-library non concatena i text node fratelli di `{expr}` in JSX →
  matcher a funzione su `textContent`). 130 test verdi.

**Decisioni**: tracker wayfinder local-markdown (niente GitHub Issues); la mappa decide,
la pipeline superpowers esegue; nel Simulatore MVP niente selettore dell'anno di apertura
né F24 di scenario (riaperture = nuovo sforzo).

**Next steps (S6)**: spese + export CSV (ex S5); poi S7 parser PDF con form di revisione.
Backlog: ricerca ATECO per descrizione (ISTAT), FPA12, import CSV storico, shadcn/ui,
Playwright, drill-down del Flusso fino alla singola riga F24.

**Blocchi/aperture**: invariati (GU DL 89/2026, soglie GS, mapping ATECO 2025, quadro RR).

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
