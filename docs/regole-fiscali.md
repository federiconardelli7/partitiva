# Regole fiscali — fonte di verità

Ogni regola del motore vive qui con formula, fonte normativa e data di verifica. Nessun numero
entra nel codice se non è in questa pagina. Legenda stato: ✅ verificata · ⚠️ da chiudere su fonte
primaria · 🔭 roadmap (non ancora riverificata).

**Ultimo double-check**: 15/08/2026, su fonti primarie (INPS, MEF) e stampa fiscale specializzata;
la rilettura dei testi primari (normattiva, PDF circolari) è prevista in S2 **prima** di fissare i
valori in `params/`. Regola ferma: se una fonte contraddice queste tabelle ⇒ STOP e segnalazione,
mai scelta silenziosa.

## Regime forfettario — L. 190/2014, art. 1, commi 54–89

| Regola | Valore/Formula | Fonte | Stato |
|---|---|---|---|
| Soglia ricavi/compensi | 85.000 € (sforamento → uscita dall'anno successivo) | L. 190/2014 co. 54 e 71, mod. L. 197/2022 | ✅ 15/08/2026 |
| Uscita immediata | > 100.000 € incassati nell'anno | L. 190/2014 co. 71 | ✅ 15/08/2026 |
| Principio di cassa | conta l'**incassato** nell'anno solare (data incasso, non data fattura) | L. 190/2014 co. 64 | ✅ 15/08/2026 |
| Reddito imponibile | incassato × coefficiente di redditività (per gruppo ATECO) | L. 190/2014 co. 64, all. 4 | ✅ 15/08/2026 |
| Coefficiente 67% | gruppo residuale "altre attività" (ATECO 58–63, incl. software: 62.02.00, ricodificato 62.20.10 in ATECO 2025 senza cambio coefficiente) | all. 4 L. 190/2014; ricodifica ISTAT ATECO 2025 | ⚠️ tabella completa da fonte ufficiale in S2 |
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
| Minimale di accredito 2026 | 4.903,25 € (sotto questo reddito l'anno non accredita 12 mesi di contributi: informativo, NON è un minimo di versamento) | circ. INPS 8/2026 | ✅ 15/08/2026 |
| Contributo minimo fisso | nessuno (a differenza di artigiani/commercianti) | circ. INPS 8/2026 | ✅ 15/08/2026 |
| Deducibilità | i contributi versati riducono l'imponibile fiscale dell'anno di **versamento** | L. 190/2014 co. 64 | ✅ 15/08/2026 |

## Acconti e scadenze

| Regola | Valore | Fonte | Stato |
|---|---|---|---|
| Acconto imposta sostitutiva | 100% dell'imposta anno precedente | metodo storico, prassi AdE | ✅ 15/08/2026 |
| Acconto Gestione Separata | 80% dei contributi dovuti anno precedente | prassi INPS | ✅ 15/08/2026 |
| Rate | **due rate uguali 50/50** per soggetti ISA e forfettari | art. 58 DL 124/2019 (+ riscontro empirico su F24 reali, verificati in locale) | ✅ 15/08/2026 |
| ⚠️ Trappola nota | molte fonti citano 40/60: è la regola dei soggetti NON-ISA. Anche la skill `italy-tax-optimization` di openaccountants riporta 40/60: errore per i forfettari | — | ✅ documentata |
| Soglie minime (imposta sostitutiva) | nessun acconto se imposta anno prec. ≤ 51,65 €; **rata unica al 30/11** se acconto < 257,52 €; due rate sopra | prassi AdE (regole IRPEF estese alla sostitutiva) | ✅ 15/08/2026 |
| Soglie minime per acconti GS | — | — | ⚠️ applicabilità da verificare in S2 |
| Saldo + 1ª rata | 30/6, **differito al 20/7 in via strutturale** per ISA/forfettari | per il 2026: art. 6 DL 89/2026 | ✅ 15/08/2026 |
| Maggiorazione differimento (fino al 20/8) | **0,40% ordinaria; 0,80% nel 2026** (raddoppiata) — parametro per-anno | art. 6 DL 89/2026; regola a regime: art. 1-sexies DL 63/2026, conv. L. 113/2026 | ⚠️ rileggere in GU in S2 |
| 2ª rata | 30/11, NON rateizzabile; saldo+1ª rateizzabili fino a metà dicembre | prassi AdE | ✅ 15/08/2026 |
| Codici tributo F24 | 1790 (1º acconto imposta), 1791 (2º acconto), 1792 (saldo); contributi GS in sezione INPS, causale PXX (aliquota piena) / P10, periodo 01–12 | prassi AdE/INPS | ⚠️ causali da confermare su fonte primaria in S2 |

## Caso campione «Mario Rossi» — dataset golden sintetico

I valori qui sotto sono **sintetici e coerenti con le regole di questa pagina** (coefficiente 67%,
GS 26,07%, imposta 5%, acconti 100%/80% in rate 50/50): sono il contratto pubblico del motore. La
coerenza delle regole con documentazione reale (F24, dichiarazioni) è stata verificata in locale:
nessun importo reale entra nel repo.

- **2025 (anno 1)**: incassato 24.000 → reddito 16.080 → imposta 804,00; contributi teorici
  4.192,06, **dichiarati 4.191,00** (l'arrotondamento all'euro della dichiarazione produce ±2 €);
  versato nel 2025: zero (prima scadenza nel 2026).
- **F24 2026**: 20/7 teorico = 7.073,40, **effettivo 7.073,35** (saldo imposta 804,00 + saldo GS
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

## Parametri per moduli futuri (roadmap)

| Tema | Valori | Fonte | Stato |
|---|---|---|---|
| IRPEF 2026 | 23% ≤28.000; **33%** 28.000–50.000; 43% oltre; sterilizzazione >200.000 (−440 € di detrazioni) | L. 199/2025 (Bilancio 2026) | ✅ 15/08/2026 (fonti secondarie) |
| Previdenza complementare | plafond deducibile **5.300 €/anno** dal 2026 (era 5.164,57) | L. 199/2025 | ✅ 15/08/2026 |
| Artigiani/commercianti 2026 | 24% / 24,48%; +1 punto oltre 56.224 €; minimale 18.808 € (fissi 4.521,36 / 4.611,64); massimali 93.707 / 122.295; riduzione 35% forfettari su domanda; 4 rate fisse | circ. INPS 14 del 09/02/2026 | 🔭 riverificare all'implementazione |
| CCNL Commercio / Fon.Te | 14 mensilità; lavoratore min 0,55% → datore 1,55% (con TFR conferito) | CCNL/Fon.Te | 🔭 riverificare all'implementazione |

## Procedura di manutenzione

1. Rieseguire il double-check **a ogni cambio d'anno fiscale** (le circolari INPS escono tra
   gennaio e febbraio) e quando Federico lo chiede.
2. Ogni modifica ai parametri richiede: fonte aggiornata qui + golden test + riga CHANGELOG
   (vedi CONTRIBUTING.md).
3. La skill openaccountants va usata solo come **checklist di temi**, mai come fonte di numeri.
