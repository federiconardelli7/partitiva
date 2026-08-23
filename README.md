# Partitiva

**Gestione open source e privacy-first della Partita IVA in regime forfettario.**

Partitiva trasforma la contabilità "da foglio di calcolo" del forfettario in una web app che gira
interamente nel tuo browser: registri le fatture (o le importi dai file XML FatturaPA), tracci gli
incassi per **principio di cassa**, e vedi in ogni momento quanto accantonare, quanto pagherai nei
prossimi F24 e quanto ti resta davvero — con **ogni passaggio del calcolo spiegato**, dal fatturato
al netto.

> ✅ **Stato: MVP in produzione** su **https://partitiva.vercel.app** — motore fiscale
> golden-tested, import XML/p7m e PDF (con revisione), riepiloghi annuali, spese, simulatore
> concatenato, backup ed export CSV, app installabile (PWA). Roadmap post-MVP in
> [ROADMAP.md](ROADMAP.md).

## Come si usa

L'app ha tre pagine — tre concetti (glossario in [CONTEXT.md](CONTEXT.md)):

- **Panoramica** (`/`) — la vista d'insieme: si aggiorna da sola dai tuoi dati. Il **Flusso**
  mostra la catena del tuo anno (incassato → reddito → contributi | imponibile → imposta →
  netto) e cambia forma da sola: al primo anno l'imponibile è pieno, dagli anni dopo compare
  il ramo «F24 pagati → contributi deducibili». Ogni riquadro si apre nel «perché» del numero.
  In alto: fatture da incassare, prossimo F24 col countdown, barra delle soglie 85k/100k.
- **Simulatore** (`/simulatore`) — il sandbox (livrea indaco: qui non si salva niente).
  Scegli l'anno, e con **«Concatena i miei dati»** i contributi deducibili dello scenario
  escono dalla catena reale, non da un campo a mano. «Parti dai tuoi dati» precompila dal
  tuo anno in corso.
- **I miei dati** (`/dati`) — la sorgente di tutto:
  - **Fatture**: a mano, da **XML FatturaPA/p7m** (import multiplo con dedup) o da **PDF**
    col foglio di stile SdI — il PDF precompila il form e *tu* controlli e salvi (le
    scansioni degradano a inserimento manuale). Bollo automatico dai parametri, forzabile.
  - **Riepiloghi annuali**: il totale di un anno che non vuoi ricostruire fattura per
    fattura («pregresso»): si somma alle fatture di quell'anno.
  - **Spese**: NON deducibili nel forfettario (il coefficiente le forfetizza) — servono
    solo al tuo netto reale.
  - **Backup**: esporta/importa tutto in JSON (è l'unica copia oltre al browser: fallo
    spesso); export **CSV** dei registri per fogli di calcolo e commercialista.

Al primo accesso un wizard chiede i tre dati che decidono tutto (anno di apertura, settore
o ATECO, Gestione Separata): si cambiano quando vuoi dal Profilo. Dal browser puoi
**installare l'app** (menu → «Installa Partitiva»): i dati restano comunque solo sul
dispositivo, quindi esporta un backup prima di cambiare browser o macchina.

## Principi non negoziabili

1. **Privacy-first** — i tuoi dati fiscali non lasciano MAI il dispositivo: niente backend, niente
   account, niente analytics. Qualsiasi funzione che parla con l'esterno sarà opzionale, opt-in ed
   evidente.
2. **Ogni numero ha una fonte** — nessuna aliquota o soglia entra nel codice senza riferimento
   normativo e data di verifica, registrati in [docs/regole-fiscali.md](docs/regole-fiscali.md).
3. **Parametri fiscali = dati versionati per anno** — mai hardcoded nella logica: un file per anno,
   aggiornabile con una PR di soli dati + test.
4. **Trasparenza dei calcoli** — ogni importo mostra il proprio breakdown (fatturato → reddito →
   contributi → imponibile → imposta → netto), come un F24 spiegato.
5. **Non è consulenza** — vedi il disclaimer qui sotto.
6. **Open source serio** — MIT, CI, golden test su casi reali, CHANGELOG.

## Sviluppo

Prerequisiti: Node.js ≥ 22 (pnpm arriva via [corepack](https://nodejs.org/api/corepack.html)).

```bash
corepack enable
pnpm install
pnpm verify   # lint + typecheck + test + privacy gate
```

Struttura del monorepo (pnpm workspaces):

```
packages/motore-fiscale/   # calcoli fiscali: TypeScript puro, zero dipendenze UI
packages/parser-fatture/   # parser FatturaPA (XML/p7m) + euristiche PDF
apps/web/                  # app React 19 + Vite + Tailwind, dati in IndexedDB (Dexie)
docs/                      # regole fiscali con fonti, ADR, architettura
```

Per contribuire: [CONTRIBUTING.md](CONTRIBUTING.md). Per l'aggiornamento annuale dei parametri
fiscali c'è una procedura dedicata (e un template di issue).

## Ringraziamenti

- [easypiva](https://github.com/TheStreamCode/easypiva) (MIT) — riferimento prezioso per il
  calcolatore forfettario e il confronto tra regimi.

## ⚠️ Disclaimer

Partitiva è uno strumento di **tracciamento e comprensione**, non un servizio di consulenza
fiscale. I calcoli possono contenere errori o non coprire il tuo caso specifico: le decisioni
fiscali vanno sempre verificate con il tuo commercialista. Gli autori non si assumono alcuna
responsabilità per l'uso dei risultati.

## Licenza

[MIT](LICENSE)
