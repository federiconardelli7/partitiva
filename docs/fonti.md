# Fonti

Gerarchia di affidabilità: **1)** testi normativi (normattiva/GU) → **2)** prassi ufficiale
(circolari INPS, provvedimenti/risposte AdE, MEF) → **3)** stampa fiscale specializzata (solo come
segnale: va sempre risalita alla fonte primaria prima di fissare un parametro).

## Normativa primaria

- L. 190/2014, art. 1 co. 54–89 (regime forfettario):
  <https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:2014-12-23;190>
- DL 124/2019, art. 58 (acconti in due rate uguali per soggetti ISA/forfettari):
  <https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2019-10-26;124>
- DPR 633/1972, art. 7-ter (territorialità servizi B2B esteri);
  DPR 642/1972, tariffa art. 13 (imposta di bollo 2,00 € > 77,47 €).
- L. 199/2025 (Legge di Bilancio 2026): IRPEF 23/33/43, plafond previdenza complementare 5.300 €.
- DL 89/2026, art. 6 (proroga versamenti 2026 al 20/7; +0,80% fino al 20/8) e
  DL 63/2026 conv. L. 113/2026, art. 1-sexies (regola a regime) — ⚠️ da rileggere in GU in S2.

## Prassi ufficiale

- Circolare INPS n. 8 del 03/02/2026 — Gestione Separata 2026 (aliquote 26,07%/24%, massimale
  122.295 €, minimale di reddito 18.808 €). Notizia INPS:
  <https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2026.02.gestione-separata-le-aliquote-contributive-per-il-2026.html>
- Circolare INPS n. 27 del 30/01/2025 — Gestione Separata 2025 (26,07%/24%, massimale 120.607 €,
  minimale 18.555 €). Notizia INPS:
  <https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2025.01.gestione-separata-le-aliquote-contributive-per-il-2025.html>
- Scheda INPS "F24 per professionisti iscritti alla Gestione Separata" (causali PXX/P10):
  <https://www.inps.it/it/it/dettaglio-approfondimento.schede-informative.49920.F24-per-professionisti-iscritti-alla-Gestione-Separata.html>
- Circolare INPS n. 14 del 09/02/2026 — artigiani e commercianti (roadmap).
- MEF, principali misure della Legge di Bilancio 2026:
  <https://www.mef.gov.it/focus/Principali-misure-della-legge-di-bilancio-2026/>
- Ministero del Lavoro, novità previdenza complementare (L. 199/2025):
  <https://lavoro.gov.it/previdenza-complementare/comunicazione/notizie/previdenza-complementare-le-novita-della-legge-di-bilancio-2026-legge-1992025-vigore-dal-1deg-luglio-2026>

## Stampa specializzata usata nel double-check del 15/08/2026

- Il Sole 24 Ore NT+ Fisco — proroga 20/8 con maggiorazione 0,8%:
  <https://ntplusfisco.ilsole24ore.com/art/versamenti-proroga-20-agosto-maggiorazione-08percento-i-soggetti-isa-software-allineati-AIurhSXD>
- Fiscomania — proroga versamenti e nuova maggiorazione: <https://fiscomania.com/proroga-versamenti-fiscali/>
- Informazione Fiscale — interessi/maggiorazione per chi rinvia:
  <https://www.informazionefiscale.it/partite-iva-proroga-imposte-2026-isa-forfettari-interessi-maggiorazione>
- Commercialista.it — dettaglio circolare 8/2026:
  <https://www.commercialista.it/Dettaglio-Articolo/Contributi-Gestione-Separata-INPS-2026-aliquote-massimali-minimali-e-istruzioni-della-circolare-n-8/>
- PMI.it — calcolo acconti P.IVA/forfettari (rate 50% oltre 257,51 €):
  <https://www.pmi.it/professioni/regole-e-compensi/497407/calcolo-acconti-partita-iva-forfettari.html>
- LeggeInChiaro — soglie acconto imposta sostitutiva (51,65 / 257,52):
  <https://leggeinchiaro.it/acconto-imposta-sostitutiva-forfettari-2026/>
- EC News — revisione aliquote IRPEF in LdB 2026:
  <https://www.ecnews.it/lavoro/news-del-giorno/legge-bilancio-2026-revisione-aliquote-irpef/>
- FiscoeTasse — rateazione post-proroga per soggetti ISA:
  <https://www.fiscoetasse.com/approfondimenti/16567-dichiarazione-redditi-soggetti-ISA-rateazione-delle-imposte-e-date-da-ricordare.html>
- Quickfisco — F24 nel regime forfettario (codici 1790/1791/1792, causali PXX/P10):
  <https://quickfisco.it/blog/regime-forfettario/f24-nel-regime-forfettario/>

## Progetti di riferimento

- easypiva (MIT) — calcolatore forfettario, confronto regimi:
  <https://github.com/TheStreamCode/easypiva>
- openaccountants — skill `italy-tax-optimization`: **solo checklist di temi, mai numeri**
  (errore verificato: indica acconti 40/60, ma per ISA/forfettari sono 50/50):
  <https://github.com/openaccountants/openaccountants>

## Caso campione

Il contratto pubblico del motore è il **caso campione sintetico «Mario Rossi»** documentato in
`docs/regole-fiscali.md` e `TESTING.md`. La coerenza delle regole con documentazione reale (F24,
dichiarazioni) è stata verificata in locale: i valori reali non entrano nel repo.
