# CONTEXT — glossario del dominio UI

Glossario dei termini canonici di `apps/web`. Solo linguaggio: le decisioni architetturali
vivono in `docs/ADR/`, le regole fiscali (con fonti) in `docs/regole-fiscali.md`.

- **Panoramica** — la vista d'insieme dell'anno: derivata e **read-only**, si aggiorna da
  sola da «I miei dati». Qui non si inserisce niente. Rotta `/` (quando esiste un profilo).
- **Simulatore** — il **sandbox**: uno scenario alla volta, non scrive mai su Dexie, livrea
  indaco. Il prefill dai dati veri è solo esplicito («Parti dai tuoi dati»). Rotta `/simulatore`.
- **I miei dati** — la **sorgente** modificabile: fatture (registro + import XML/p7m),
  profilo e backup in un posto solo. Rotta `/dati`.
- **Flusso** — la rappresentazione grafica year-aware della catena del motore (incassato →
  reddito → contributi | imponibile → imposta → netto): proiezione pura dell'`ExplainMap`,
  nessuna logica fiscale nella UI.
- **Primo anno** — anno senza contributi versati da dedurre: imponibile pieno («nulla da
  dedurre»). Dagli anni successivi compare il ramo «F24 pagati → di cui contributi deducibili».
- **Reale vs simulazione** — l'emerald marca i dati veri, l'indaco la simulazione: un
  colore, un significato, in tutta l'app.
