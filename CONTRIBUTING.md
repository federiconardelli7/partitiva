# Contribuire a Partitiva

Grazie! Questo progetto tratta calcoli fiscali reali: la barra su accuratezza e privacy è alta.

## Setup

```bash
corepack enable   # attiva pnpm alla versione pinnata in package.json
pnpm install
pnpm verify       # lint + typecheck + test + privacy gate: deve essere verde
```

## Convenzioni

- **Lingue**: identificatori nel codice e messaggi di commit in **inglese**; UI, docs e messaggi
  d'errore in **italiano**.
- **Commit**: [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`,
  `docs:`, `test:`, `chore:`, `refactor:`…), soggetto breve e minuscolo dopo i due punti.
- **TDD sul motore fiscale**: prima il test, poi l'implementazione. Ogni PR che tocca
  `packages/motore-fiscale` deve passare tutti i golden test (vedi `TESTING.md`).

## Aggiornamento fiscale annuale (procedura)

I parametri fiscali sono **dati versionati per anno**, mai hardcoded. Per proporre l'anno nuovo
(es. 2027) apri una PR di soli dati + test che contenga:

1. `packages/motore-fiscale/src/params/2027.ts` — copiando l'anno precedente e aggiornando i
   valori; **ogni valore deve avere la sua fonte** (`{ riferimento, url?, verificatoIl }` — l'URL
   quando esiste un link stabile; per citazioni di Gazzetta Ufficiale basta il riferimento
   puntuale): tipicamente le circolari INPS di gennaio/febbraio e la legge di bilancio;
2. il **golden test** del 2027 (`packages/motore-fiscale/tests/golden/`);
3. l'aggiornamento di `docs/regole-fiscali.md` (fonte e data di verifica per ogni parametro
   cambiato) e di `docs/fonti.md` se compaiono fonti nuove;
4. una riga nel `CHANGELOG.md`.

C'è un template di issue dedicato ("Aggiornamento fiscale annuale") per discuterne prima.
Numeri senza fonte primaria verificabile non vengono mergiati.

## Privacy delle fixtures (repo pubblico!)

- Mai dati personali reali: nomi, codici fiscali, P.IVA, indirizzi, ragioni sociali di clienti.
- Valori canonici per le fixtures: **MARIO ROSSI**, CF **RSSMRA80A01H501U**,
  P.IVA **IT01234567890** (negli XML FatturaPA: `<IdCodice>01234567890</IdCodice>`),
  committente **ACME SERVICES LLC**. Gli importi possono restare realistici.
- Il gate `pnpm check-privacy` gira in CI e blocca pattern di CF/P.IVA non in allowlist.
  In locale puoi installarlo come hook: `cp scripts/pre-commit .git/hooks/pre-commit`.

## Checklist PR

- [ ] `pnpm verify` verde
- [ ] Parametri fiscali toccati → fonte in `docs/regole-fiscali.md` + golden test + CHANGELOG
- [ ] Nessun dato personale reale (il privacy gate deve passare)
- [ ] UI/docs in italiano, identificatori in inglese
