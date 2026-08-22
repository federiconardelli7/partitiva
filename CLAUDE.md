# CLAUDE.md — istruzioni permanenti per ogni sessione

## Rituale di sessione

- **Inizio**: leggi `PROGRESS.md` (ultime 2 voci) e `ROADMAP.md` prima di toccare il codice.
- **Fine**: aggiorna `PROGRESS.md` (fatto, decisioni, next steps, blocchi) e `CHANGELOG.md` se rilevante.

## Regole fiscali (le più importanti)

- **MAI modificare un parametro fiscale** senza, insieme: (1) fonte citata in
  `docs/regole-fiscali.md` con data di verifica, (2) golden test aggiornato, (3) riga nel CHANGELOG.
- I parametri sono **dati versionati per anno** (`packages/motore-fiscale/src/params/ANNO.ts`),
  mai hardcoded nella logica. Ogni valore porta con sé la propria fonte.
- Il motore fiscale si sviluppa in **TDD**: prima il test (dai casi reali in TESTING.md), poi
  l'implementazione. Ogni modifica a `packages/motore-fiscale` deve passare **TUTTI** i golden test.
- Se una fonte contraddice le regole documentate: **fermati e segnala a Federico**, non scegliere
  in silenzio.

## Privacy (il repo è pubblico)

- Dati personali reali (nomi, CF, P.IVA, indirizzi, ragioni sociali di clienti) **MAI nel repo**.
- Fixtures sempre anonimizzate con i valori canonici: MARIO ROSSI, CF `RSSMRA80A01H501U`,
  P.IVA `IT01234567890` (in XML: `<IdCodice>01234567890</IdCodice>`).
- Anche gli **importi**: nel repo vivono solo i numeri del **caso campione sintetico** (vedi
  TESTING.md); gli importi reali di tracker/F24/fatture restano fuori dal repo, nelle verifiche
  locali.
- Gate: `pnpm check-privacy` (gira anche in CI e nell'hook pre-commit locale). La blocklist dei
  valori reali vive FUORI dal repo (`~/.config/partitiva/privacy-blocklist`) e nel secret CI
  `PRIVACY_BLOCKLIST`.
- I file reali di Federico restano fuori dalla directory del repo (sono in `~/Downloads`).

## Convenzioni

- **Lingue**: UI, docs, messaggi di errore → italiano. Identificatori nel codice e commit → inglese.
- **Commit**: Conventional Commits in inglese (`feat:`, `fix:`, `docs:`, `test:`, `chore:`…), una
  riga, minuscolo dopo i due punti, niente body, niente attribution/Co-Authored-By.
- **Git**: repo in solo → commit diretti su `main`. Li esegue **Federico manualmente** (firma GPG):
  tu prepari lo staging con `git add` di file specifici e consegni il comando `git commit -m "…"`
  pronto da incollare. MAI eseguire `git commit`/`git push`. MAI staggiare `pnpm-lock.yaml`.
- **Verifica completa** prima di dichiarare finito: `pnpm verify`.
- Numeri e date in formato italiano nell'UI (1.234,56 € — gg/mm/aaaa), ISO negli storage.
