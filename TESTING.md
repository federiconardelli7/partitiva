# Strategia di testing

- **Unit** (Vitest) su ogni funzione del motore e dei parser.
- **Golden test fiscali**: il contratto pubblico del motore è il **caso campione «Mario Rossi»**,
  un dataset sintetico pluriennale coerente con le regole di `docs/regole-fiscali.md` (la coerenza
  delle regole con documentazione reale è stata verificata in locale: nessun importo reale nel
  repo). **Ogni modifica a `packages/motore-fiscale` deve passare tutti i golden**.
- **E2E** (Playwright) sui flussi upload → registro → bilancio, da quando esisterà la UI (S3+).
- **TDD obbligatorio** sul motore: prima il test, poi l'implementazione.

Comandi: `pnpm test` (tutti), `pnpm verify` (lint + typecheck + test + privacy gate).

## Golden test obbligatori (da implementare in S2)

| Caso | Input | Output atteso |
|---|---|---|
| Anno 1 (2025) | incassato 24.000, coeff. 67%, versati 0, aliquota 5% | reddito 16.080; contributi dovuti 4.192,06 (dichiarati 4.191,00); imposta 804,00 |
| F24 anno 2 (2026) | saldo 2025 + acconti 2026 | luglio 7.073,40 teorico — 7.073,35 con le rate effettive (saldo 804,00 + 4.191,00, acconti 402,00 + 1.676,35); novembre 2.078,34 (402,00 + 1.676,34) |
| Anno 2 (2026) | incassato 75.000, versati 7.543,69 | reddito 50.250; contributi dovuti 13.100,18; imponibile 42.706; imposta 2.135,30; netto di competenza 59.764,52 |
| Conguaglio anno 3 (2027) | dai valori 2026 | F24 luglio 17.386,51 (saldo INPS 9.747,49 + saldo imposta 1.331,30 + 1ª rata acconti 6.307,72); novembre 6.307,72 |
| Soglie | incassato 86.000 / 101.000 | flag uscita anno dopo / uscita immediata |
| Bollo | fattura 4.385,00 / fattura 50,00 | bollo 2,00 / bollo 0,00 |
| Cassa | fattura del 28/12/2026 incassata il 05/01/2027 | conteggiata nel 2027 |

## Tolleranze (e perché esistono)

- **±2,00 €** sui valori teorici "da dichiarazione": la dichiarazione arrotonda all'euro, quindi il
  teorico (es. contributi 4.192,06 del caso campione) può divergere dal dichiarato (4.191,00).
- **±0,01 €** sulle composizioni F24 quando si parte dagli importi effettivi (**actuals**) —
  forniti se serve a livello di **singola rata**: nel caso campione le rate INPS effettive
  1.676,35 + 1.676,34 non derivano né dal teorico né dal dichiarato (80% × 4.191,00 = 3.352,80),
  ma da una base implicita 4.190,86 — riproduzione di un fenomeno osservato su F24 reali
  (arrotondamenti interni di dichiarazione).
- I golden test coprono **entrambe le modalità**: catena teorica pura e catena con actuals.
- Il "netto 59.764,52" del caso 2026 è il **netto di competenza** (incassato − dovuti − imposta):
  coincide col netto reale solo perché nel caso golden bolli e spese sono zero — il motore espone
  entrambi i campi con nomi distinti.

Layout dei golden: dati in `packages/motore-fiscale/tests/golden/*.golden.ts` (input, attesi,
provenienza, tolleranza per campo) eseguiti da un unico `golden.test.ts` table-driven (vitest
raccoglie solo `*.test.ts`); un `registry.test.ts` impone che ogni anno presente in `params/`
abbia almeno un golden.

## Fixtures

- Parser XML: `packages/parser-fatture/tests/fixtures/fattura-fpr12-esempio.xml` — interamente
  sintetica (identità e importi), con firma XAdES da ignorare, `DatiBollo`, natura N2.2 e la
  descrizione con "USD $5,000.00 … cambio 0,877" per l'euristica valuta/cambio (4.385,00 =
  5.000 × 0,877). Asserzioni su tutti i campi.
- Mai dati personali reali nelle fixtures: valori canonici in CONTRIBUTING.md, gate automatico
  `pnpm check-privacy`.
