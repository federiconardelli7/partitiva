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
- **Riepilogo annuale («pregresso»)** — il totale incassato di un anno NON tracciato a
  fatture (+ bolli, facoltativi). Si **somma** alle fatture dello stesso anno e alimenta
  Panoramica, scadenze e Simulatore. Anni ammessi: da apertura all'anno corrente — il
  futuro si simula, non si registra. Un riepilogo per anno (risalvare sostituisce).
- **Simulazione concatenata** — nel Simulatore, lo scenario dell'anno Y con i versati
  deducibili DERIVATI dalla catena reale (fatture + riepiloghi) fino a Y−1: saldi e
  acconti che si pagherebbero davvero, calcolati dal motore, non inseriti a mano.
- **Spese** — uscite NON deducibili (nel forfettario il coefficiente le forfetizza): si
  registrano solo per il **netto reale** (netto di competenza − bolli − spese), per anno
  di cassa della loro data. Mai chiamarle «deducibili».
- **Reale vs simulazione** — l'emerald marca i dati veri, l'indaco la simulazione: un
  colore, un significato, in tutta l'app.
