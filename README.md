# Partitiva

**Gestione open source e privacy-first della Partita IVA in regime forfettario.**

Partitiva trasforma la contabilità "da foglio di calcolo" del forfettario in una web app che gira
interamente nel tuo browser: registri le fatture (o le importi dai file XML FatturaPA), tracci gli
incassi per **principio di cassa**, e vedi in ogni momento quanto accantonare, quanto pagherai nei
prossimi F24 e quanto ti resta davvero — con **ogni passaggio del calcolo spiegato**, dal fatturato
al netto.

> 🚧 **Stato: pre-alpha.** Il progetto è in fase di fondazione: governance, regole fiscali
> documentate e struttura del monorepo. Il motore fiscale è la prossima milestone
> (vedi [ROADMAP.md](ROADMAP.md)).

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
packages/parser-fatture/   # parser FatturaPA (XML/p7m) e PDF
apps/web/                  # (prossimamente) app React 19 + Vite, dati in IndexedDB
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
