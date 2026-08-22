# Spec parser fatture (XML FatturaPA, p7m, PDF)

Implementazione in S4 (XML/p7m) e S6 (PDF), in TDD sulla fixture
`packages/parser-fatture/tests/fixtures/fattura-fpr12-esempio.xml`.

## XML FatturaPA (FPR12, tolleranza FPA12)

**Osservazioni da un campione reale** (interamente anonimizzato nella fixture):

- namespace `http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2` con prefisso
  variabile (`ns2:` nel campione) → navigare per **local-name**, mai per prefisso;
- firma **XAdES incorporata** (`ds:Signature` con transform XPath filter2) da **ignorare**;
- il nome file segue `IT<PIVA>_<progressivo>.xml` (contiene la P.IVA del cedente!);
- `DatiBollo` può mancare; possono esserci più `DettaglioLinee` e più `DatiRiepilogo`;
  `DatiPagamento` può mancare (assente nel campione).

**Campi da estrarre**: numero, data, importo totale, divisa; cedente (P.IVA come `IdCodice` a 11
cifre + `IdPaese`, CF, nome/cognome o denominazione, `RegimeFiscale`); committente (denominazione,
paese, id fiscale); righe (descrizione, prezzo unitario/totale, aliquota IVA, natura); riepiloghi
(imponibile, imposta, natura, riferimento normativo); `DatiBollo` (`BolloVirtuale`,
`ImportoBollo`) se presenti.

**Validazioni e warning**:

- dedup per chiave (anno della data documento, numero, P.IVA cedente);
- coerenza: somma `PrezzoTotale` delle righe vs `ImportoTotaleDocumento` (warning se divergono);
- warning se `RegimeFiscale` ≠ RF19 (il tool è pensato per forfettari) o natura ≠ N2.x.

**Euristica valuta/cambio** (metadati opzionali della fattura): nelle descrizioni compaiono frasi
tipo `USD $5,000.00 convertiti in data 15/07 al cambio 0,877` → estrarre valuta, importo originale
(separatori USA), data e tasso (decimali italiani). Best effort: se il pattern non matcha, nessun
metadato, mai un errore.

## Busta p7m (CAdES)

I file possono arrivare come `IT…_….xml.p7m` (DER oppure base64). Strategia: **estrattore custom**
del payload — individuare l'XML incorporato (da `<?xml` o dal tag radice `FatturaElettronica` fino
alla chiusura) dentro il blob decodificato, senza verificare la firma (fuori scope). Fallback con
`asn1js` solo se i file reali dovessero rompere l'euristica. Fixture p7m da costruire in S4.

## PDF (S6)

- Pipeline: estrazione testo con `pdfjs-dist` (lazy-loaded) → euristiche per numero/data/importo/
  bollo → **form di revisione obbligatorio** precompilato: l'utente conferma o corregge, il parsing
  PDF **non salva mai nulla da solo**.
- Primo template: rendering "foglio di stile SdI" (fatturapa.gov.it), 3 pagine, testo estraibile,
  etichette stabili osservate nel campione: `Identificativo fiscale ai fini IVA:`,
  `Codice fiscale:`, `Regime fiscale: RF19`, `Numero documento:`, `Data documento:`,
  `Importo totale documento:`, `Importo bollo:`.
- I layout NON sono garantiti: le euristiche sono per-template, la revisione umana è il contratto.
- PDF non leggibile (scansione) → degradare con grazia a inserimento manuale precompilando il
  possibile. OCR fuori scope.
- Futuro (roadmap, opt-in dietro flag con avviso privacy esplicito): parsing assistito da AI.

## Privacy

Le fixtures usano SOLO i valori fittizi canonici (CONTRIBUTING.md). I file reali di test restano
fuori dal repo; `.gitignore` blocca anche i pattern `IT*_*.xml`, `*.p7m` e `Sdi_file_*.pdf` come
difesa in profondità, e il privacy gate riconosce il formato `<IdCodice>` di FatturaPA.
