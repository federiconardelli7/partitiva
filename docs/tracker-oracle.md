# Tracker di riferimento — logica estratta (senza valori)

Il motore replica la logica di un tracker Excel/LibreOffice privato, collaudato su F24 e
dichiarazioni reali. Il file resta **fuori dal repo** e i suoi valori non vi entrano mai: la
verifica dei calcoli contro i dati reali avviene solo in locale. Il **contratto pubblico** del
motore è il caso campione sintetico documentato in `TESTING.md` e `docs/regole-fiscali.md`.
Estrazione formule eseguita il 15/08/2026 con `openpyxl` (doppio load: `data_only=False` per le
formule, `True` per i valori — questi ultimi usati solo localmente).

## Mappa dei fogli

| Foglio | Ruolo |
|---|---|
| Leggimi | istruzioni d'uso, convenzione colori (giallo=input) |
| Riepilogo | **il motore**: colonne per anno (6 anni), catena di competenza + sezione cassa/F24 |
| Fogli anno (×3) | registri: fatturato manuale O registro fatture (vince il registro), bolli auto, spese |
| Forfettario | simulatore libero steady-state + confronto a tre (forfettario/ordinario/dipendente) |
| Ordinario / Dipendente | simulatori per i moduli post-MVP |

## La catena del Riepilogo (per colonna-anno N)

Parametri per anno (righe modificabili): coefficiente, aliquota imposta (5% negli anni startup,
poi 15%), aliquota GS, quota acconto imposta 100%, quota acconto INPS 80%.

```
reddito(N)        = incassato(N) × coefficiente(N)
inpsDovuti(N)     = reddito(N) × aliquotaGS(N)        ← sovrascrivibile a mano col dichiarato (actuals)
accImposta(N)     = imposta(N−1) × 100%                ← totale acconti versati nell'anno N
accInps(N)        = inpsDovuti(N−1) × 80%
versati(N)        = (inpsDovuti(N−1) − accInps(N−1)) + accInps(N)     ← deduzione per cassa
imponibile(N)     = max(0, reddito(N) − versati(N))
imposta(N)        = imponibile(N) × aliquotaImposta(N)
costoCompetenza(N)= inpsDovuti(N) + imposta(N)
nettoReale(N)     = incassato(N) − costoCompetenza(N) − bolli(N) − spese(N)

saldoLuglio(N)    = (imposta(N−1) − accImposta(N−1)) + (inpsDovuti(N−1) − accInps(N−1))
f24Luglio(N)      = saldoLuglio(N) + accImposta(N)/2 + accInps(N)/2
f24Novembre(N)    = accImposta(N)/2 + accInps(N)/2
daAccantonare(N)  = costoCompetenza(N) − (accImposta(N) + accInps(N))
quotaAccantono(N) = costoCompetenza(N) / incassato(N)
```

Registro anno: `bollo(riga) = IF(importo > 77,47; 2; "")`; `fatturatoEffettivo = registro se ha
righe, altrimenti manuale`; in modalità manuale `bolli = nFattureStimate × 2`.

## Limiti e bug del tracker — il motore deve fare MEGLIO, non copiarli

1. **Anno a fatturato zero (bug)**: `versati` può diventare negativo (acconti dell'anno prima,
   nessun dovuto) e `max(0, 0 − negativo)` produce un **imponibile fantasma pari agli acconti
   versati**, cioè imposta positiva su reddito nullo. Il motore: `versati = max(0, …)` e i
   rimborsi/crediti gestiti come flusso separato, mai come deduzione negativa.
2. **F24 negativi**: i saldi a credito compaiono come pagamenti negativi; manca un modello di
   credito/compensazione. Il motore espone `credito` esplicito e F24 mai < 0.
3. **Manca il controllo 100.000 €** nel Riepilogo (c'è solo l'85.000; il simulatore Forfettario
   li ha entrambi). Il motore: entrambe le soglie sempre.
4. **Niente soglie minime acconto** (51,65 / 257,52 €) né rata unica di novembre: le rate sono
   sempre 50/50. Il motore le implementa come edge case.
5. **Niente data di incasso**: il registro ha una sola colonna Data e la cassa è implicita nel
   foglio-anno. Il motore/app distinguono `dataFattura` da `dataIncasso` (riclassificabile).
6. **Foglio Ordinario col plafond vecchio**: deduzione fondo pensione `MIN(x; 5.164,57)` — dal 2026
   è **5.300 €** (L. 199/2025; il foglio Dipendente usa già 5.300). Da correggere quando si
   costruirà il modulo ordinario (post-MVP).

## Semi di funzionalità da preservare nell'app

- Doppio input: **fatturato manuale** (proiezione rapida) vs **registro** (vince se ha righe) — in
  app diventa la proiezione di fine anno accanto ai dati reali.
- «Quota da mettere via su ogni incasso» come numero guida della dashboard.
- Simulatore libero (foglio Forfettario) con vista «netto col 15% dal 6º anno» e confronto a tre
  forfettario/ordinario/dipendente (post-MVP).

## Come riestrarre la logica (verifica locale, output MAI nel repo)

```bash
python3 - <<'EOF'
import openpyxl
src = "~/Downloads/tracker_partita_iva_forfettario (1).xlsx"  # espandere ~ se serve
from pathlib import Path
src = str(Path(src).expanduser())
wf = openpyxl.load_workbook(src, data_only=False)["Riepilogo"]
wv = openpyxl.load_workbook(src, data_only=True)["Riepilogo"]
for row in wf.iter_rows():
    for c in row:
        if c.value is not None:
            print(c.coordinate, repr(c.value), "=", repr(wv[c.coordinate].value))
EOF
```
