// Parametri fiscali 2025 — SOLO DATI, ogni valore con la sua fonte.
// Riferimenti estesi e stato delle verifiche: docs/regole-fiscali.md.
import { cents } from '../money'
import { defineParams } from './types'

const CIRC_INPS_38_2025 = {
  riferimento: 'Circolare INPS n. 38 del 07/02/2025 — Artigiani e commercianti: contribuzione 2025 (PDF verificato integralmente)',
  url: 'https://www.inps.it/it/it/inps-comunica/atti/circolari-messaggi-e-normativa/dettaglio.circolari-e-messaggi.2025.02.circolare-numero-38-del-07-02-2025_14820.html',
  verificatoIl: '2026-08-23',
} as const

const CAUSALI_ADE_IVS_2025 = {
  riferimento: 'Tabella causali contributo INPS (AdE): AF/CF minimale, AP/CP extra minimale; conferma circ. INPS 87/2002',
  url: 'https://www.agenziaentrate.gov.it/portale/web/guest/strumenti/codici-attivita-e-tributo/f24-codici-tributo-per-i-versamenti/tabelle-dei-codici-tributo-e-altri-codici-per-il-modello-f24/tabelle-codici-inps-e-enti-previdenziali-ed-assicurativi',
  verificatoIl: '2026-08-23',
} as const

const RIDUZIONI_IVS_2025 = {
  riferimento:
    'Riduzione 35%: L. 190/2014 art. 1 c. 77 (fissi+eccedenza, maternità piena; 0,48 inclusa per lettura letterale, da confermare). Riduzione 50% nuovi iscritti 2025: L. 207/2024 art. 1 c. 186 + circ. INPS 83 del 24/04/2025 §3 (maternità e 0,48 SEMPRE piene)',
  url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:2024-12-30;207',
  verificatoIl: '2026-08-23',
  daVerificare: true,
} as const

const CIRC_INPS_27_2025 = {
  riferimento: 'Circolare INPS n. 27 del 30/01/2025 — Gestione Separata 2025',
  url: 'https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2025.01.gestione-separata-le-aliquote-contributive-per-il-2025.html',
  verificatoIl: '2026-08-22',
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

export const params2025 = defineParams({
  anno: 2025,
  previdenza: {
    tipo: 'gestione-separata',
    aliquotaPiena: { valore: 0.2607, fonte: CIRC_INPS_27_2025 },
    aliquotaRidotta: { valore: 0.24, fonte: CIRC_INPS_27_2025 },
    massimale: { valore: cents(12_060_700), fonte: CIRC_INPS_27_2025 },
    minimaleAccredito: { valore: cents(1_855_500), fonte: CIRC_INPS_27_2025 },
  },
  previdenzaIvs: {
    minimale: { valore: cents(1_855_500), fonte: CIRC_INPS_38_2025 },
    aliquotaBase: { valore: 0.24, fonte: CIRC_INPS_38_2025 },
    aliquotaAggiuntivaCommercianti: { valore: 0.0048, fonte: CIRC_INPS_38_2025 },
    maternitaAnnua: { valore: cents(744), fonte: CIRC_INPS_38_2025 },
    fasciaPiuUno: { valore: cents(5_544_800), fonte: CIRC_INPS_38_2025 },
    incrementoOltreFascia: { valore: 0.01, fonte: CIRC_INPS_38_2025 },
    massimaleAnzianita1995: { valore: cents(9_241_300), fonte: CIRC_INPS_38_2025 },
    massimalePost1995: { valore: cents(12_060_700), fonte: CIRC_INPS_38_2025 },
    scadenzeRateFisse: {
      valore: ['05-16', '08-20', '11-16', '02-16'],
      fonte: {
        ...CIRC_INPS_38_2025,
        riferimento:
          'Circ. INPS 38/2025 §9: 16/05, 20/08, 17/11 (16/11 è domenica), 16/02/2026 — date base con slittamento sab/dom → lunedì',
      },
    },
    causali: {
      valore: { fissiArtigiani: 'AF', fissiCommercianti: 'CF', eccedenzaArtigiani: 'AP', eccedenzaCommercianti: 'CP' },
      fonte: CAUSALI_ADE_IVS_2025,
    },
    quotaAccontiEccedenza: {
      valore: 1,
      fonte: {
        riferimento:
          'Regola strutturale, verificata sull’edizione 2026 delle istruzioni Redditi PF (Fascicolo 2, Appendice «INPS - Modalità di calcolo degli acconti», p.to 1, pag. 62): due acconti di pari importo, senza riduzioni; base = eccedenza del reddito dell’anno precedente ricalcolata coi parametri e le agevolazioni dell’anno corrente; scadenze IRPEF ex art. 18, c. 4, D.Lgs. 241/1997',
        url: 'https://www.agenziaentrate.gov.it/portale/documents/d/guest/pf2_istruzioni_2026_agg-13-05-2026',
        verificatoIl: '2026-08-23',
      },
    },
    riduzioni: {
      valore: {
        riduzione35: { moltiplicatore: 0.65, riduceAliquotaAggiuntiva: true },
        riduzione50: { moltiplicatore: 0.5, riduceAliquotaAggiuntiva: false },
      },
      fonte: RIDUZIONI_IVS_2025,
    },
  },
  imposta: {
    startup: { valore: 0.05, fonte: L190_IMPOSTA },
    ordinaria: { valore: 0.15, fonte: L190_IMPOSTA },
    anniStartup: { valore: 5, fonte: L190_IMPOSTA },
  },
  irpef: {
    scaglioni: {
      valore: [
        { finoACents: 2_800_000, aliquota: 0.23 },
        { finoACents: 5_000_000, aliquota: 0.35 },
        { finoACents: null, aliquota: 0.43 },
      ],
      fonte: {
        riferimento:
          'Art. 11, c. 1, TUIR vigente al 30/06/2025 (multivigente Normattiva): 23% fino a 28.000, 35% da 28.000 a 50.000, 43% oltre (a regime dal 2025: L. 207/2024, art. 1, c. 2, lett. a). Imposta a 50.000 = 14.140',
        url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:1986-12-22;917~art11!vig=2025-06-30',
        verificatoIl: '2026-08-23',
      },
    },
    detrazioneLavoroAutonomo: {
      valore: {
        bassa: { finoACents: 550_000, importoCents: 126_500 },
        media: { finoACents: 2_800_000, baseCents: 50_000, extraCents: 76_500, divisoreCents: 2_250_000 },
        alta: { finoACents: 5_000_000, baseCents: 50_000, divisoreCents: 2_200_000 },
        bonus: { oltreCents: 1_100_000, finoACents: 1_700_000, importoCents: 5_000 },
      },
      fonte: {
        riferimento:
          'Art. 13, c. 5, 5-ter e 6, TUIR vigente (riscrittura L. 234/2021, invariata 2025/2026): 1.265 fino a 5.500; 500 + 765 × (28.000 − RC)/22.500 fino a 28.000; 500 × (50.000 − RC)/22.000 fino a 50.000; +50 tra 11.000 e 17.000; rapporti alle prime 4 cifre decimali (troncamento). RC al netto dell’abitazione principale: non modellata, l’app non ha redditi immobiliari',
        url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:1986-12-22;917~art13!vig=',
        verificatoIl: '2026-08-23',
      },
    },
    oneriDetraibili: {
      valore: {
        aliquota: 0.19,
        tetto: {
          daCents: 7_500_000,
          sogliaBase100kCents: 10_000_000,
          importoBaseCents: { fino100k: 1_400_000, oltre100k: 800_000 },
          coefficientiFigli: { nessuno: 0.5, uno: 0.7, due: 0.85, oltreODisabilita: 1 },
        },
        degressione: { daCents: 12_000_000, aCents: 24_000_000 },
        taglioAltiRedditi: null,
      },
      fonte: {
        riferimento:
          'Oneri 19% SOGGETTI ai meccanismi (sanitarie e interessi mutui ne sono fuori per legge, quindi fuori dall’input): tetto di spesa oltre 75.000 = 14.000/8.000 × coefficiente figli (art. 16-ter, c. 1-3, TUIR, dal 2025; circ. AdE 6/E/2025: è un cap sulle SPESE); degressione × (240.000 − RC)/120.000 tra 120.000 e 240.000 (art. 15, c. 3-bis). Il taglio −440 oltre 200.000 decorre dal 2026: assente nel 2025',
        url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:1986-12-22;917~art16ter!vig=',
        verificatoIl: '2026-08-23',
      },
    },
    addizionali: {
      valore: { regionaleBase: 0.0123, regionaleMax: 0.0333, comunaleMax: 0.009 },
      fonte: {
        riferimento:
          'Regionale: aliquota di base 1,23%, maggiorazione max 2,1 punti (D.Lgs. 68/2011, art. 6, c. 1); comunale: max 0,8 punti + 0,4 Roma Capitale (D.Lgs. 360/1998, art. 1, c. 3; DL 78/2010, art. 14, c. 14, lett. b). Aliquota unica in input = semplificazione dichiarata (le regioni possono articolare per scaglioni IRPEF)',
        url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2011-05-06;68~art6!vig=',
        verificatoIl: '2026-08-23',
      },
    },
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
      valore: 0.004,
      fonte: {
        riferimento: 'Maggiorazione ordinaria 0,40% per il versamento differito (nel 2026 raddoppiata: vedi params 2026)',
        verificatoIl: '2026-08-22',
      },
    },
    scadenze: {
      valore: { saldoEPrimaRata: '07-20', secondaRata: '11-30' },
      fonte: {
        riferimento: 'Saldo + 1ª rata al 20/7 (differimento strutturale ISA/forfettari); 2ª rata 30/11',
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
