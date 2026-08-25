# CONTEXT — glossario del dominio UI

Glossario dei termini canonici di `apps/web`. Solo linguaggio: le decisioni architetturali
vivono in `docs/ADR/`, le regole fiscali (con fonti) in `docs/regole-fiscali.md`.

- **Panoramica** — la vista d'insieme dell'anno: derivata e **read-only**, si aggiorna da
  sola da «I miei dati». Qui non si inserisce niente. Rotta `/` (quando esiste un profilo).
- **Simulatore** — il **sandbox**: uno scenario alla volta, non scrive mai su Dexie, livrea
  sim. Il prefill dai dati veri è solo esplicito («Parti dai tuoi dati»). Rotta `/simulatore`.
- **Quadro** — il pannello sticky dei risultati del Simulatore (netto reale, da accantonare,
  pressione, soglie, verdetti dei confronti in miniatura); su mobile diventa la sheet
  ancorata al bordo inferiore (peek col solo netto). Vive solo nel Simulatore.
- **Duello** — il pattern delle viste di confronto aperte: due tile coi totali a confronto
  (il vincitore in peso, non in colore), verdetto subito sotto, tabella del breakdown come
  dettaglio. Vale per ordinario, dipendente e calcolo inverso.
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
- **Revisione PDF** — l'import da PDF è un *suggerimento*, mai un salvataggio: le
  euristiche precompilano il form «Nuova fattura» e l'utente controlla e salva. Un PDF
  senza testo (scansione) degrada a inserimento manuale con avviso.
- **Reale vs simulazione** — un colore, un significato, in tutta l'app: il verde (grass)
  marca i dati veri, il viola (violet) la simulazione (dal build B1 della spec redesign;
  prima erano emerald e indigo). I verdetti positivi («restare conviene») usano la stessa
  scala verde ma token separati (`--esito-ok-*`), mai il token `--reale`.
