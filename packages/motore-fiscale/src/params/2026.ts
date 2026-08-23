// Parametri fiscali 2026 — SOLO DATI, ogni valore con la sua fonte.
// Riferimenti estesi e stato delle verifiche: docs/regole-fiscali.md.
import { cents } from '../money'
import { defineParams } from './types'

const CIRC_INPS_8_2026 = {
  riferimento: 'Circolare INPS n. 8 del 03/02/2026 — Gestione Separata 2026',
  url: 'https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2026.02.gestione-separata-le-aliquote-contributive-per-il-2026.html',
  verificatoIl: '2026-08-22',
} as const

const CIRC_INPS_14_2026 = {
  riferimento: 'Circolare INPS n. 14 del 09/02/2026 — Artigiani e commercianti: contribuzione 2026 (PDF verificato integralmente)',
  url: 'https://www.inps.it/it/it/inps-comunica/atti/circolari-messaggi-e-normativa/dettaglio.circolari-e-messaggi.2026.02.circolare-numero-14-del-09-02-2026_15162.html',
  verificatoIl: '2026-08-23',
} as const

const CAUSALI_ADE_IVS = {
  riferimento: 'Tabella causali contributo INPS (AdE, agg. 02/07/2026): AF/CF minimale, AP/CP extra minimale; conferma circ. INPS 87/2002',
  url: 'https://www.agenziaentrate.gov.it/portale/web/guest/strumenti/codici-attivita-e-tributo/f24-codici-tributo-per-i-versamenti/tabelle-dei-codici-tributo-e-altri-codici-per-il-modello-f24/tabelle-codici-inps-e-enti-previdenziali-ed-assicurativi',
  verificatoIl: '2026-08-23',
} as const

const RIDUZIONI_IVS = {
  riferimento:
    'Riduzione 35%: L. 190/2014 art. 1 c. 77 (fissi+eccedenza, maternità piena; la 0,48 non è esclusa dal testo: inclusione letterale, da confermare su tariffazione reale). Riduzione 50%: L. 207/2024 art. 1 c. 186 + circ. INPS 83 del 24/04/2025 §3 (solo IVS: maternità e 0,48 SEMPRE piene)',
  url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:2024-12-30;207',
  verificatoIl: '2026-08-23',
  daVerificare: true,
} as const

const L190_SOGLIE = {
  riferimento: 'L. 190/2014, art. 1 co. 54 e 71 (soglie modificate dalla L. 197/2022)',
  url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:2014-12-23;190',
  verificatoIl: '2026-08-15',
} as const

const L190_IMPOSTA = {
  riferimento: 'L. 190/2014, art. 1 co. 64–65 (imposta sostitutiva 15%, 5% startup per 5 anni)',
  url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:2014-12-23;190',
  verificatoIl: '2026-08-15',
} as const

export const params2026 = defineParams({
  anno: 2026,
  previdenza: {
    tipo: 'gestione-separata',
    aliquotaPiena: { valore: 0.2607, fonte: CIRC_INPS_8_2026 },
    aliquotaRidotta: { valore: 0.24, fonte: CIRC_INPS_8_2026 },
    massimale: { valore: cents(12_229_500), fonte: CIRC_INPS_8_2026 },
    minimaleAccredito: { valore: cents(1_880_800), fonte: CIRC_INPS_8_2026 },
  },
  previdenzaIvs: {
    minimale: { valore: cents(1_880_800), fonte: CIRC_INPS_14_2026 },
    aliquotaBase: { valore: 0.24, fonte: CIRC_INPS_14_2026 },
    aliquotaAggiuntivaCommercianti: { valore: 0.0048, fonte: CIRC_INPS_14_2026 },
    maternitaAnnua: { valore: cents(744), fonte: CIRC_INPS_14_2026 },
    fasciaPiuUno: { valore: cents(5_622_400), fonte: CIRC_INPS_14_2026 },
    incrementoOltreFascia: { valore: 0.01, fonte: CIRC_INPS_14_2026 },
    massimaleAnzianita1995: { valore: cents(9_370_700), fonte: CIRC_INPS_14_2026 },
    massimalePost1995: { valore: cents(12_229_500), fonte: CIRC_INPS_14_2026 },
    scadenzeRateFisse: {
      valore: ['05-16', '08-20', '11-16', '02-16'],
      fonte: {
        ...CIRC_INPS_14_2026,
        riferimento:
          'Circ. INPS 14/2026 §9: 18/05 (16/5 è sabato), 20/08, 16/11, 16/02/2027 — date base con slittamento sab/dom → lunedì (art. 18 D.Lgs. 241/1997; 20/08 da proroga di Ferragosto)',
      },
    },
    causali: {
      valore: { fissiArtigiani: 'AF', fissiCommercianti: 'CF', eccedenzaArtigiani: 'AP', eccedenzaCommercianti: 'CP' },
      fonte: CAUSALI_ADE_IVS,
    },
    quotaAccontiEccedenza: {
      valore: 1,
      fonte: {
        riferimento:
          'Istruzioni Redditi PF 2026, Fascicolo 2 (agg. 13/05/2026), Appendice «INPS - Modalità di calcolo degli acconti», p.to 1, pag. 62: due acconti di pari importo, senza riduzioni; base = eccedenza del reddito dell’anno precedente ricalcolata con minimale/massimale/aliquote/agevolazioni dell’anno corrente (ricalcolo in timeline); scadenze IRPEF ex art. 18, c. 4, D.Lgs. 241/1997',
        url: 'https://www.agenziaentrate.gov.it/portale/documents/d/guest/pf2_istruzioni_2026_agg-13-05-2026',
        verificatoIl: '2026-08-23',
      },
    },
    riduzioni: {
      valore: {
        riduzione35: { moltiplicatore: 0.65, riduceAliquotaAggiuntiva: true },
        riduzione50: { moltiplicatore: 0.5, riduceAliquotaAggiuntiva: false },
      },
      fonte: RIDUZIONI_IVS,
    },
  },
  imposta: {
    startup: { valore: 0.05, fonte: L190_IMPOSTA },
    ordinaria: { valore: 0.15, fonte: L190_IMPOSTA },
    anniStartup: { valore: 5, fonte: L190_IMPOSTA },
  },
  acconti: {
    quotaImposta: {
      valore: 1,
      fonte: {
        riferimento: 'Acconto imposta sostitutiva = 100% anno precedente (metodo storico, prassi AdE)',
        verificatoIl: '2026-08-22',
      },
    },
    quotaContributi: {
      valore: 0.8,
      fonte: {
        riferimento:
          'Acconto Gestione Separata = 80%: istruzioni Redditi PF 2026, Fascicolo 2, Appendice «INPS - Modalità di calcolo degli acconti», p.to 2, pag. 62 (aliquote dell’anno corrente sull’80% del reddito dell’anno precedente, col massimale corrente); il motore usa l’80% del dovuto dell’anno prima: identico finché aliquota e massimale non cambiano gli importi (equivalenza in docs/regole-fiscali.md)',
        url: 'https://www.agenziaentrate.gov.it/portale/documents/d/guest/pf2_istruzioni_2026_agg-13-05-2026',
        verificatoIl: '2026-08-23',
      },
    },
    ripartizione: {
      valore: [0.5, 0.5],
      fonte: {
        riferimento: 'art. 58 DL 124/2019 — due rate uguali per soggetti ISA e forfettari',
        url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2019-10-26;124',
        verificatoIl: '2026-08-15',
      },
    },
    minimoAcconto: {
      valore: cents(5_165),
      fonte: {
        riferimento: 'Nessun acconto se imposta anno precedente ≤ 51,65 € (regole acconti IRPEF estese alla sostitutiva)',
        verificatoIl: '2026-08-22',
      },
    },
    sogliaRataUnica: {
      valore: cents(25_752),
      fonte: {
        riferimento: 'Acconto < 257,52 € in unica rata a novembre (regole acconti IRPEF estese alla sostitutiva)',
        verificatoIl: '2026-08-22',
      },
    },
    soglieApplicabiliAContributi: {
      valore: false,
      fonte: {
        riferimento: 'Applicabilità delle soglie minime agli acconti GS non confermata da fonte primaria: default prudente = non applicate',
        verificatoIl: '2026-08-22',
        daVerificare: true,
      },
    },
    maggiorazioneDifferimento: {
      valore: 0.008,
      fonte: {
        riferimento: 'art. 6 DL 89/2026 (0,80% nel 2026; regola a regime: art. 1-sexies DL 63/2026, conv. L. 113/2026)',
        verificatoIl: '2026-08-22',
        daVerificare: true,
      },
    },
    scadenze: {
      valore: { saldoEPrimaRata: '07-20', secondaRata: '11-30' },
      fonte: {
        riferimento: 'Saldo + 1ª rata al 20/7 (differimento strutturale ISA/forfettari, per il 2026: art. 6 DL 89/2026); 2ª rata 30/11',
        verificatoIl: '2026-08-22',
      },
    },
    codiciTributo: {
      valore: { primoAcconto: '1790', secondoAcconto: '1791', saldo: '1792' },
      fonte: {
        riferimento: 'Codici tributo AdE per l’imposta sostitutiva forfettari (1791 anche per l’unica soluzione)',
        verificatoIl: '2026-08-22',
      },
    },
    causaliInps: {
      valore: { piena: 'PXX', ridotta: 'P10' },
      fonte: {
        riferimento: 'Causali contributo F24 Gestione Separata professionisti: PXX (aliquota piena), P10 (pensionati/altra copertura)',
        verificatoIl: '2026-08-22',
      },
    },
  },
  soglie: {
    uscitaAnnoSuccessivo: { valore: cents(8_500_000), fonte: L190_SOGLIE },
    uscitaImmediata: { valore: cents(10_000_000), fonte: L190_SOGLIE },
  },
  bollo: {
    soglia: { valore: cents(7_747), fonte: { riferimento: 'DPR 642/1972, tariffa art. 13', verificatoIl: '2026-08-15' } },
    importo: { valore: cents(200), fonte: { riferimento: 'DPR 642/1972, tariffa art. 13', verificatoIl: '2026-08-15' } },
  },
})
