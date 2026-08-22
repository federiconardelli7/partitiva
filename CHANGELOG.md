# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/it-IT/1.1.0/); versioning:
[SemVer](https://semver.org/lang/it/).

## [Unreleased]

### Added

- Struttura monorepo pnpm: `packages/motore-fiscale` e `packages/parser-fatture` (stub) con
  lint, typecheck e test in CI.
- Privacy gate anti-leak (`scripts/check-privacy.mjs`): pattern strutturali CF/P.IVA (incluso il
  formato `IdCodice` di FatturaPA) con allowlist dei valori fittizi + blocklist esterna al repo
  (secret `PRIVACY_BLOCKLIST` in CI, file locale per l'hook pre-commit).
- Fixture FatturaPA FPR12 anonimizzata con firma XAdES di esempio.
- Governance: README, ROADMAP, CONTRIBUTING (con procedura di aggiornamento fiscale annuale),
  SECURITY, TESTING, CLAUDE.md, template issue/PR, dependabot.
- Documentazione: `docs/regole-fiscali.md` (ogni parametro con fonte e data di verifica),
  `docs/fonti.md`, `docs/ADR/0001-scelte-fondanti.md`, `docs/architettura.md`,
  `docs/parsing-fatture.md`, `docs/BRAINSTORM.md`.
- `docs/tracker-oracle.md`: logica del tracker di riferimento estratta e verificata
  (limiti noti da correggere nel motore).

### Changed

- Golden test, fixture e documentazione usano il **caso campione sintetico «Mario Rossi»**:
  nessun importo reale nel repo (i valori reali restano nelle verifiche locali).
