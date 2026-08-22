# Security & Privacy

## Modello di privacy

- Tutti i dati fiscali dell'utente vivono **solo nel suo browser** (IndexedDB). Nessun backend,
  nessun account, nessuna telemetria, nessun invio di fatture a server terzi.
- Ogni futura funzione che comunica con l'esterno (es. quotazioni, parsing AI) sarà **opt-in
  esplicito** con avviso chiaro di cosa viene inviato e a chi. Mai attiva di default.
- Il backup è responsabilità dell'utente: export/import JSON locale.

## Segnalare una vulnerabilità

Usa **GitHub → Security → Report a vulnerability** (private vulnerability reporting). Se non è
disponibile, apri una issue chiedendo un canale privato senza includere dettagli sfruttabili.

## Anti-leak di dati personali (il repo è pubblico)

- Gate automatico: `pnpm check-privacy` — gira in CI e come hook pre-commit
  (`cp scripts/pre-commit .git/hooks/pre-commit`).
- Pattern bloccati: codici fiscali e partite IVA italiane non presenti nell'allowlist dei valori
  fittizi documentati in CONTRIBUTING.md.
- Blocklist di valori reali (mai committata): in CI via secret `PRIVACY_BLOCKLIST`
  (valori separati da virgola: `gh secret set PRIVACY_BLOCKLIST`); in locale nel file
  `~/.config/partitiva/privacy-blocklist` (una voce per riga, righe `#` = commento).

## Se un dato reale finisce comunque nella storia git

1. Rimuovi il dato e riscrivi la storia (`git filter-repo`) prima possibile;
2. considera comunque il dato **compromesso** (fork, cache, mirror);
3. aggiungilo alla blocklist perché non rientri.
