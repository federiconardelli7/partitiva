# Regole fiscali — fonte di verità

Ogni regola del motore vive qui con formula, fonte normativa e data di verifica. Nessun numero
entra nel codice se non è in questa pagina. Legenda stato: ✅ verificata · ⚠️ da chiudere su fonte
primaria · 🔭 roadmap (non ancora riverificata).

**Ultimo double-check**: 22/08/2026 (S2), su fonti primarie (INPS, MEF) e stampa fiscale
specializzata; i valori sono fissati in `packages/motore-fiscale/src/params/` con la stessa fonte
riportata qui. **Aperture residue** (parametri marcati `daVerificare` nel codice): testo GU del
DL 89/2026 (maggiorazione 0,80%); applicabilità delle soglie minime acconto ai contributi GS
(default prudente: non applicate); rilettura integrale L. 190/2014 su normattiva; tabella completa
ATECO→coefficienti (serve in S3); scadenze trimestrali del bollo virtuale (S5). Regola ferma: se
una fonte contraddice queste tabelle ⇒ STOP e segnalazione, mai scelta silenziosa.

## Regime forfettario — L. 190/2014, art. 1, commi 54–89

| Regola | Valore/Formula | Fonte | Stato |
|---|---|---|---|
| Soglia ricavi/compensi | 85.000 € (sforamento → uscita dall'anno successivo) | L. 190/2014 co. 54 e 71, mod. L. 197/2022 | ✅ 15/08/2026 |
| Uscita immediata | > 100.000 € incassati nell'anno | L. 190/2014 co. 71 | ✅ 15/08/2026 |
| Principio di cassa | conta l'**incassato** nell'anno solare (data incasso, non data fattura) | L. 190/2014 co. 64 | ✅ 15/08/2026 |
| Reddito imponibile | incassato × coefficiente di redditività (per gruppo ATECO) | L. 190/2014 co. 64, all. 4 | ✅ 15/08/2026 |
| Coefficiente 67% | gruppo residuale "altre attività" (ATECO 58–63, incl. software: 62.02.00, ricodificato 62.20.10 in ATECO 2025 senza cambio coefficiente) | all. 4 L. 190/2014; ricodifica ISTAT ATECO 2025 | ✅ 22/08/2026 |
| Tabella completa 9 gruppi | in `packages/motore-fiscale/src/params/ateco.ts` (40/40/40/54/86/62/40/78/67); i gruppi restano su ATECO 2007 anche dopo la riclassificazione 2025 | all. 4 L. 190/2014 (verifica incrociata su fonti tabellari) | ⚠️ `daVerificare`: mapping ufficiale ATECO 2025 in attesa |
| Imposta sostitutiva | 5% per i primi 5 anni (requisiti startup, co. 65), poi 15%; sostituisce IRPEF, addizionali, IRAP | L. 190/2014 co. 64–65 | ✅ 15/08/2026 |
| Unica deduzione | contributi previdenziali obbligatori **versati nell'anno** (cassa); niente spese, niente detrazioni IRPEF, niente deduzione fondo pensione | L. 190/2014 co. 64 | ✅ 15/08/2026 |
| IVA / estero B2B | niente IVA in fattura; verso committente estero B2B: fuori campo art. 7-ter DPR 633/72, natura **N2.2**, regime **RF19**, nessuna ritenuta | DPR 633/72 art. 7-ter (riscontrato anche nell'XML reale) | ✅ 15/08/2026 |
| Bollo | 2,00 € per fattura con importo > 77,47 € (operazioni senza IVA); nel flusso SdI: bollo virtuale dichiarato in `DatiBollo` | DPR 642/1972, tariffa art. 13 | ✅ 15/08/2026 |
| Versamento del bollo | scadenze trimestrali via AdE (promemoria in roadmap) | — | ⚠️ dettaglio da documentare in S5 |
| Esclusioni (warning informativi) | lavoro dipendente anno prec. > 35.000 € (salvo rapporto cessato); partecipazioni in SRL con attività riconducibile; compensi a ex datori; dipendenti > 20.000 € | L. 190/2014 co. 57 | ⚠️ solo warning, verifica testo in S2 |

## Gestione Separata INPS — circolare n. 8 del 03/02/2026

| Regola | Valore | Fonte | Stato |
|---|---|---|---|
| Aliquota professionisti senza altra copertura | **26,07%** (25 + 0,72 aliquota aggiuntiva + 0,35 ISCRO) — invariata dal 2025 (circ. 27/2025) | circ. INPS 8/2026 | ✅ 15/08/2026 |
| Aliquota con altra copertura / pensionati | 24% | circ. INPS 8/2026 | ✅ 15/08/2026 |
| Base imponibile | reddito forfettario **lordo** (incassato × coefficiente), NON ridotto dei contributi | prassi INPS costante | ✅ 15/08/2026 |
| Massimale 2026 | 122.295 € — **mai vincolante per un forfettario** (reddito max teorico = 100.000 × 0,86 = 86.000): modellato come warning informativo | circ. INPS 8/2026 | ✅ 15/08/2026 |
| Minimale di reddito 2026 | 18.808 € — sotto, l'anno non accredita 12 mesi di contributi (il contributo minimo corrispondente è 18.808 × 26,07% = 4.903,25 €). Informativo, NON è un minimo di versamento | circ. INPS 8/2026 | ✅ 22/08/2026 |
| Valori 2025 | aliquote invariate (26,07% / 24%); massimale 120.607 €; minimale di reddito 18.555 € (contributo corrispondente 4.837,29 €) | circ. INPS n. 27 del 30/01/2025 | ✅ 22/08/2026 |
| Contributo minimo fisso | nessuno (a differenza di artigiani/commercianti) | circ. INPS 8/2026 | ✅ 15/08/2026 |
| Deducibilità | i contributi versati riducono l'imponibile fiscale dell'anno di **versamento** | L. 190/2014 co. 64 | ✅ 15/08/2026 |

## Acconti e scadenze

| Regola | Valore | Fonte | Stato |
|---|---|---|---|
| Acconto imposta sostitutiva | 100% dell'imposta anno precedente | metodo storico, prassi AdE | ✅ 15/08/2026 |
| Acconto Gestione Separata | 80% — per la lettera AdE: «aliquote previste per l'anno [corrente] sull'80% del reddito di lavoro autonomo [dell'anno precedente], tenendo conto del massimale [corrente]». Il motore usa 80% × contributi dovuti anno precedente (actuals compresi): identico finché aliquota e massimale non cambiano gli importi (equivalenza dichiarata, v. Semplificazioni IVS) | istruzioni Redditi PF 2026, Fascicolo 2, Appendice «INPS - Modalità di calcolo degli acconti», p.to 2, pag. 62 | ✅ 23/08/2026 |
| Rate | **due rate uguali 50/50** per soggetti ISA e forfettari (imposte, art. 58); per i **contributi** il 50/50 è regola propria delle istruzioni RR («due acconti di pari importo», per tutti) | art. 58 DL 124/2019 (+ riscontro empirico su F24 reali, verificati in locale); istruzioni Redditi PF 2026 Fasc. 2, Appendice pag. 62 | ✅ 23/08/2026 |
| ⚠️ Trappola nota | molte fonti citano 40/60: è la regola dei soggetti NON-ISA. Anche la skill `italy-tax-optimization` di openaccountants riporta 40/60: errore per i forfettari | — | ✅ documentata |
| Soglie minime (imposta sostitutiva) | nessun acconto se imposta anno prec. ≤ 51,65 €; **rata unica al 30/11** se acconto < 257,52 €; due rate sopra | prassi AdE (regole IRPEF estese alla sostitutiva) | ✅ 15/08/2026 |
| Soglie minime per acconti GS | — | — | ⚠️ applicabilità da verificare in S2 |
| Saldo + 1ª rata | 30/6, **differito al 20/7 in via strutturale** per ISA/forfettari | per il 2026: art. 6 DL 89/2026 | ✅ 15/08/2026 |
| Maggiorazione differimento (fino al 20/8) | **0,40% ordinaria; 0,80% nel 2026** (raddoppiata) — parametro per-anno | art. 6 DL 89/2026; regola a regime: art. 1-sexies DL 63/2026, conv. L. 113/2026 | ⚠️ rileggere in GU in S2 |
| 2ª rata | 30/11, NON rateizzabile; saldo+1ª rateizzabili fino a metà dicembre | prassi AdE | ✅ 15/08/2026 |
| Codici tributo F24 | 1790 (1º acconto imposta), 1791 (2º acconto **e** unica soluzione), 1792 (saldo); contributi GS in sezione INPS, periodo 01–12 | prassi AdE (guide specialistiche concordanti) | ✅ 22/08/2026 |
| Causali contributo GS | **PXX** = professionisti (saldo/acconto); **P10** = titolari di pensione o con altra copertura previdenziale (la platea del 24%) | scheda INPS "F24 per professionisti iscritti alla Gestione Separata" + riscontro su F24 reali (verifica locale) | ✅ 22/08/2026 |

## Caso campione «Mario Rossi» — dataset golden sintetico

I valori qui sotto sono **sintetici e coerenti con le regole di questa pagina** (coefficiente 67%,
GS 26,07%, imposta 5%, acconti 100%/80% in rate 50/50): sono il contratto pubblico del motore. La
coerenza delle regole con documentazione reale (F24, dichiarazioni) è stata verificata in locale:
nessun importo reale entra nel repo.

- **2025 (anno 1)**: incassato 24.000 → reddito 16.080 → imposta 804,00; contributi teorici
  4.192,06, **dichiarati 4.191,00** (l'arrotondamento all'euro della dichiarazione produce ±2 €);
  versato nel 2025: zero (prima scadenza nel 2026).
- **F24 2026**: 20/7 in tre regimi — teorico puro 7.074,89 (contributi 4.192,06), col dichiarato
  7.073,40 (rate teoriche su 4.191,00), **effettivo 7.073,35** (saldo imposta 804,00 + saldo GS
  4.191,00 + 1ª rata acconti 402,00 + 1.676,35); 30/11 = **2.078,34** (402,00 + 1.676,34). Totale
  versato 2026 = **7.543,69** = deduzione dell'anno d'imposta 2026 (invariante: la deduzione di N è
  la somma delle righe INPS degli F24 pagati in N: 4.191,00 + 1.676,35 + 1.676,34 = 7.543,69).
  Nota: 1.676,35 + 1.676,34 = 3.352,69 = 80% × **4.190,86** — base implicita che non coincide né
  col teorico né col dichiarato (80% × 4.191,00 = 3.352,80): è la riproduzione di un fenomeno
  osservato su F24 reali (arrotondamenti interni di dichiarazione). Per questo gli **actuals** del
  motore devono poter sovrascrivere anche le **singole rate**, non solo i totali.
- **2026**: incassato 75.000 → reddito 50.250; contributi dovuti 13.100,18; imponibile 42.706;
  imposta 2.135,30; costo di competenza 15.235,48 (20,3%); netto di competenza 59.764,52 (79,7%).
- **2027**: F24 20/7 = **17.386,51** (saldo GS 9.747,49 + saldo imposta 1.331,30 + 1ª rata acconti
  6.307,72); 30/11 = **6.307,72**.

## Artigiani e commercianti (gestioni IVS)

Verifica del 23/08/2026 su PDF integrali: circ. INPS **38 del 07/02/2025** e **14 del
09/02/2026** (valori e scadenze), **83 del 24/04/2025** (riduzione 50%), L. 190/2014
art. 1 c. 76–84 e L. 207/2024 art. 1 c. 186 (testi vigenti su Normattiva), tabella causali
contributo AdE (agg. 02/07/2026) + circ. INPS 87/2002. Ogni importo sotto è quadrato al
centesimo contro il testo delle circolari. Per gli **acconti sull'eccedenza** (S12,
23/08/2026): istruzioni **Redditi PF 2026, Fascicolo 2** (agg. 13/05/2026, Appendice
«INPS - Modalità di calcolo degli acconti», pag. 62) e **circ. INPS 62 del 27/05/2026**
(che per il calcolo rinvia espressamente al Fascicolo 2).

| Tema | 2025 | 2026 | Fonte | Stato |
|---|---|---|---|---|
| Minimale di reddito | 18.555 € | 18.808 € | circ. 38/2025 §2; 14/2026 §2 | ✅ 23/08/2026 |
| Aliquote artigiani / commercianti | 24% / 24,48% (0,46 indennizzo cessazione + 0,02) | invariate | §1 (under 21: non più ridotte dal 2025) | ✅ 23/08/2026 |
| Fascia del +1 punto | oltre 55.448 € (→25/25,48%) | oltre 56.224 € | §3 | ✅ 23/08/2026 |
| Contributi fissi annui (maternità 7,44 € inclusa) | 4.460,64 / 4.549,70 | 4.521,36 / 4.611,64 | §2 (= minimale × aliquota + 7,44, quadratura esatta) | ✅ 23/08/2026 |
| Massimali (anzianità al 31/12/1995 / iscritti dal 1996) | 92.413 / 120.607 | 93.707 / 122.295 | §4 (contributo max 2026 ante-96 art.: 22.864,51 = riprodotto dal motore + 7,44) | ✅ 23/08/2026 |
| 4 rate fisse | 16/05, 20/08, **17/11**, 16/02/26 | **18/05**, 20/08, 16/11, 16/02/27 | §9 — nel motore: date base (16/05, 20/08, 16/11, 16/02) + slittamento sab/dom → lunedì, che riproduce le date ufficiali | ✅ 23/08/2026 |
| Eccedenza sul minimale | saldo + 1º e 2º acconto alle scadenze delle imposte; acconti = **due rate di pari importo** (regola propria delle istruzioni RR, vale per tutti gli iscritti), importo complessivo **senza riduzioni** (100%) = eccedenza del **reddito dell'anno precedente** ricalcolata con **minimale, massimale, aliquote e agevolazioni dell'anno corrente** | idem | circ. §5 e §9 (rinvio); **istruzioni Redditi PF 2026, Fascicolo 2 agg. 13/05/2026, Appendice «INPS - Modalità di calcolo degli acconti», p.to 1, pag. 62**; scadenze ex art. 18 c. 4 D.Lgs. 241/1997; circ. INPS 62/2026 §2.1 e §3 | ✅ 23/08/2026 (S12; il contrasto è il p.to 2 GS, dove l'80% è esplicito) |
| Causali F24 | AF/CF (fissi sul minimale), AP/CP (eccedenza: stessa causale per saldo e acconti) | invariate | tabella causali AdE 02/07/2026; circ. 87/2002; circ. 62/2026 | ✅ 23/08/2026 |
| Riduzione 35% (forfettari) | −35% su fissi + eccedenza; maternità sempre piena; a domanda (già attivi: entro il 28/02, termine di decadenza); permanenza automatica; uscita definitiva (c. 82) | invariata | L. 190/2014 c. 77–84; circ. 35/2016 §1; circ. 14/2026 §8 | ✅ — ⚠️ la 0,48 commercianti non è esclusa dal testo → nel motore è ridotta (lettura letterale, da confermare su una tariffazione reale) |
| Riduzione 50% (nuovi iscritti) | solo prima iscrizione 1/1–31/12/**2025**, 36 mesi senza soluzione di continuità, one-shot, alternativa alla 35% per singolo lavoratore; maternità E 0,48 **sempre piene**; NON estesa ai nuovi iscritti 2026 | — | L. 207/2024 c. 186 (testo vigente); circ. 83/2025 §1–§8; msg 2449/2025 | ✅ 23/08/2026 |
| Accredito con riduzioni | mesi accreditati ∝ versato / contributo pieno sul minimale (es. INPS: 50% sul minimale → 6 mesi) | — | art. 2 c. 29 L. 335/1995; circ. 83/2025 §4 | ✅ (informativo in app, flag `accredito-ridotto`) |

Semplificazioni del motore, dichiarate: finestra della 50% per **anni interi**
apertura..apertura+2 (dal terzo anno successivo si torna al pieno: prudente per
l'accantonamento); nessuna maggiorazione da differimento (conflitto 0,40%/0,80% del
DL 89/2026, v. Acconti); nessuna rateizzazione APR/CPR/API/CPI; metodo previsionale solo
per la Gestione Separata; cambio di gestione tra gli anni di una stessa timeline non
supportato (errore esplicito: gli acconti dell'anno di transizione non sono modellati);
nell'**anno di conguaglio** (successivo all'ultimo anno di dati) gli acconti assumono le
agevolazioni dell'ultimo anno inserito; **acconti GS** = 80% del dovuto dell'anno prima
(actuals compresi) anziché il ricalcolo letterale dell'Appendice RR: identico finché
aliquota e massimale non cambiano gli importi (per l'IVS invece il ricalcolo è
implementato: minimale e massimali cambiano ogni anno);
codice sede e code-line 17 cifre degli F24 INPS non calcolabili
(in UI: rimando al Cassetto previdenziale).

## Regime ordinario — per il confronto «quando conviene uscire»

Verifica del 23/08/2026 su fonti primarie: testi VIGENTI su Normattiva (TUIR artt. 11, 13,
15, 16-ter, 54, 66; L. 199/2025; L. 207/2024; D.Lgs. 68/2011; D.Lgs. 360/1998; DPR 600/1973),
circ. AdE 6/E/2025 e ris. AdE 93/E/2019 lette in PDF, scheda AdE agg. 13/01/2026 come
riscontro di prassi. Alimenta il confronto del Simulatore (`computeOrdinario`): non è un
modulo di gestione del regime ordinario.

| Regola | Valore | Fonte | Stato |
|---|---|---|---|
| Scaglioni IRPEF 2026 | 23% ≤ 28.000 · **33%** 28.000–50.000 · 43% oltre (imposta a 50.000 = 13.700) | art. 11, c. 1, TUIR vigente; L. 199/2025, art. 1, c. 3 (in vigore 1/1/2026, art. 21) | ✅ 23/08/2026 |
| Scaglioni IRPEF 2025 | 23% · **35%** · 43% (imposta a 50.000 = 14.140) | art. 11 TUIR vigente al 30/06/2025; L. 207/2024, art. 1, c. 2, lett. a | ✅ 23/08/2026 |
| Detrazione lavoro autonomo / impresa minore (2025 = 2026) | 1.265 € (RC ≤ 5.500) · 500 + 765 × (28.000−RC)/22.500 (≤ 28.000) · 500 × (50.000−RC)/22.000 (≤ 50.000) · zero oltre; **+50 €** se 11.000 < RC ≤ 17.000; rapporti alle prime **4 cifre decimali** (troncamento) | art. 13, c. 5, 5-ter e 6, TUIR (riscrittura L. 234/2021) | ✅ 23/08/2026 |
| Tetto oneri detraibili (dal 2025) | RC > 75.000: spese ammesse ≤ 14.000 (fino a 100.000) / 8.000 (oltre) × coefficiente figli 0,50/0,70/0,85/1 — è un cap sulle **SPESE**; la detrazione art. 13 ne è FUORI | art. 16-ter, c. 1-3, TUIR (L. 207/2024, c. 10); circ. AdE 6/E/2025, pp. 7-9 | ✅ 23/08/2026 |
| Degressione detrazioni art. 15 | RC 120.000–240.000: × (240.000−RC)/120.000, zero oltre; salve le sanitarie e gli interessi sui mutui | art. 15, c. 3-bis, 3-ter e 3-quater, TUIR | ✅ 23/08/2026 |
| Taglio alti redditi (dal 2026) | −440 € se RC > 200.000, SOLO sul monte detrazioni degli oneri 19% (escluse sanitarie) + partiti + premi calamità, a valle di tetto e degressione; clamp a zero | art. 16-ter, c. 5-bis (L. 199/2025, art. 1, c. 4) | ✅ 23/08/2026 (clamp: interpretazione dichiarata) |
| Addizionale regionale | base 1,23%, max 3,33%; su RC al netto degli oneri deducibili; dovuta solo se l'IRPEF netta è dovuta; **unica soluzione a saldo** (niente acconto) | D.Lgs. 68/2011, art. 6; D.Lgs. 446/1997, art. 50, c. 2 e 5 | ✅ 23/08/2026 — aliquota = input utente |
| Addizionale comunale | max 0,8% (+0,4 Roma Capitale); eventuale soglia di esenzione **a scalino**; acconto 30% su imponibile, aliquota e soglia dell'anno precedente | D.Lgs. 360/1998, art. 1; DL 78/2010, art. 14, c. 14; DL 138/2011, art. 1, c. 11 | ✅ 23/08/2026 — aliquota = input utente |
| Acconti IRPEF | 100% del rigo «differenza»; non dovuti ≤ 51,65 €; **50/50 anche per l'ex-forfettario** (attività con ISA approvato, a prescindere dall'applicarlo); 40/60 solo senza ISA (1ª rata se > 103 €) | DL 76/2013, art. 11, c. 18; L. 97/1977, art. 1; DL 124/2019, art. 58 + DL 34/2019, art. 12-quinquies; ris. AdE 93/E/2019; DPR 435/2001, art. 17, c. 3 | ✅ 23/08/2026 (informativo: il confronto è di competenza) |
| IRAP persone fisiche | mai dovuta (dal 2022) | L. 234/2021, art. 1, c. 8 | ✅ 23/08/2026 |
| Regime di atterraggio all'uscita | impresa: contabilità semplificata naturale sotto 500.000/800.000 (reddito per cassa impropria, art. 66); professionista: art. 54, cassa pura — la timeline incassi resta valida | DPR 600/1973, art. 18; TUIR, artt. 54 e 66 | ✅ 23/08/2026 |

Semplificazioni del confronto, dichiarate: il confronto è **a regime e di competenza** — i
contributi DOVUTI dell'anno fanno da deduzione (nel regime vero si deducono i versati per
cassa) e non si modellano acconti/cassa (alla lettera, il primo anno di ordinario col metodo
storico nascerebbe senza acconti IRPEF e con l'acconto di sostitutiva a credito); l'input
«oneri 19%» raccoglie SOLO gli oneri soggetti a tetto/degressione/taglio (sanitarie e
interessi sui mutui, salvati per legge, restano fuori dall'input); aliquote delle addizionali
come input unico (le regioni possono articolare per scaglioni e oltre +0,5 punti la
maggiorazione non tocca il 1º scaglione); RC al lordo dell'abitazione principale (l'app non
ha redditi immobiliari); perdite non modellate (reddito clampato a zero, con avviso); IVA
neutra sui clienti B2B e adempimenti fuori dal confronto.

## Parametri per moduli futuri (roadmap)

| Tema | Valori | Fonte | Stato |
|---|---|---|---|
| IRPEF 2026 | implementata per il confronto: v. sezione «Regime ordinario» qui sopra (il −440 riguarda SOLO il monte oneri 19%/partiti/calamità, non tutte le detrazioni) | testi vigenti su Normattiva (primarie) | ✅ 23/08/2026 |
| Previdenza complementare | plafond deducibile **5.300 €/anno** dal periodo d'imposta 2026 (era 5.164,57); nota di drafting: il veicolo (c. 201) decorre dall'1/7/2026 ma il testo inserito dice «dal periodo d'imposta 2026» — per un limite annuo, stesso risultato | D.Lgs. 252/2005, art. 8, c. 4, vigente (L. 199/2025, art. 1, c. 201, lett. a, n. 1) | ✅ 23/08/2026 |
| Artigiani/commercianti | implementato: vedi la sezione dedicata «Artigiani e commercianti (gestioni IVS)» | circ. INPS 38/2025 e 14/2026 | ✅ 23/08/2026 |
| CCNL Commercio / Fon.Te | 14 mensilità; lavoratore min 0,55% → datore 1,55% (con TFR conferito) | CCNL/Fon.Te | 🔭 riverificare all'implementazione |

## Procedura di manutenzione

1. Rieseguire il double-check **a ogni cambio d'anno fiscale** (le circolari INPS escono tra
   gennaio e febbraio) e quando Federico lo chiede.
2. Ogni modifica ai parametri richiede: fonte aggiornata qui + golden test + riga CHANGELOG
   (vedi CONTRIBUTING.md).
3. La skill openaccountants va usata solo come **checklist di temi**, mai come fonte di numeri.
