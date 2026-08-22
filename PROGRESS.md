# Diario di bordo

> Una voce per sessione: fatto, decisioni, next steps, blocchi. Le ultime 2 voci si leggono
> all'inizio di ogni sessione (vedi CLAUDE.md).

## 2026-08-22 — S1.1 Pubblicazione e caso campione sintetico

**Fatto**
- Repo pubblicato: creato `federiconardelli7/partitiva` su GitHub (remote `origin`) con secret
  `PRIVACY_BLOCKLIST` impostato per la CI.
- **Decisione privacy (maintainer)**: nel repo non vivono importi reali — golden, fixture e docs
  usano il **caso campione sintetico «Mario Rossi»** (dataset pluriennale coerente con le regole;
  la coerenza con documentazione reale si verifica solo in locale). Sostituiti tutti gli importi;
  `docs/tracker-oracle.md` ridotto a sola logica, senza valori.
- Decisione: **nessun dominio a pagamento** — se si condivide, si userà il sottodominio Vercel.

**Next steps**: primo push (fatto il refresh dello scope `workflow` del token), CI verde su
Actions, poi S2 come da voce precedente.

## 2026-08-15 — S1 Fondazione

**Fatto**
- Fase 0 completata: nome **Partitiva** (partitiva.it risultava AVAILABLE al whois, handle GitHub
  libero), architettura **client-side puro**, workflow git **main diretto**, ordine MVP
  **motore prima**. Le 7 domande aperte del prompt hanno risposta in `docs/BRAINSTORM.md` e le
  decisioni sono formalizzate in `docs/ADR/0001-scelte-fondanti.md`.
- Double-check fiscale preliminare via web (dettagli e fonti in `docs/regole-fiscali.md`):
  circ. INPS 8/2026 confermata (26,07%, massimale 122.295 €); 20 luglio strutturale confermato;
  **scoperto che la maggiorazione 2026 per il differimento è 0,80%** (art. 6 DL 89/2026), non lo
  0,40% ordinario indicato nel prompt di avvio.
- Scaffold monorepo pnpm (`motore-fiscale`, `parser-fatture` come stub con test placeholder),
  CI GitHub Actions, privacy gate a 3 pattern + blocklist esterna al repo, fixture FPR12
  anonimizzata (anche il committente), governance completa (README, ROADMAP, CONTRIBUTING,
  SECURITY, TESTING, CHANGELOG, CLAUDE).
- Letto in profondità il tracker xlsx (formule + valori estratti con openpyxl): **catena
  verificata in locale contro i casi reali** e logica documentata in `docs/tracker-oracle.md`,
  inclusi i bug del tracker da correggere nel motore (deduzione negativa a fatturato zero →
  imposta fantasma; F24 negativi senza modello di credito; manca il check 100k nel Riepilogo;
  plafond 5.164,57 obsoleto nel foglio Ordinario) e la conferma empirica degli actuals (contributi
  dichiarati sovrascritti a mano sul teorico).

**Decisioni chiave**: vedi ADR-0001. In particolare: parametri fiscali = dati per anno con fonte
obbligatoria; il motore deve supportare gli "actuals" (i F24 reali implicano basi di dichiarazione
arrotondate che divergono di centesimi dai teorici).

**Next steps (S2)**: motore fiscale in TDD sui golden test di `TESTING.md`; `params/2025.ts` e
`params/2026.ts` con fonti; rilettura delle fonti primarie (testo L. 190/2014 su normattiva,
PDF circ. INPS 8/2026) prima di fissare i valori nei params.

- Design review dell'agente architect ricevuta e integrata nei docs: 6 rilievi verificati e
  accolti (actuals fino alle singole rate F24 — le rate effettive divergono di centesimi da
  qualunque base teorica o dichiarata; doppio netto competenza/reale; `ExplainedValue` a mappa
  piatta con `origine`/`valoreCalcolato`; flag `copertura` che guida aliquota E causale; regole
  pure di cassa/bollo nel motore così i golden testano il package; `url?` opzionale nelle fonti).

**Blocchi / aperture**
- Applicabilità delle soglie minime acconto (51,65 / 257,52 €) anche ai contributi GS: da chiarire.
- Causali INPS (PXX / P10) da confermare su fonte primaria in S2.
- Origine dello scarto di centesimi tra le rate INPS effettive e le basi teoriche/dichiarate
  (arrotondamenti del quadro RR?): da chiarire col commercialista prima di S2.
- Import dal tracker xlsx: rimandato (per ora mapping manuale documentato in roadmap).
