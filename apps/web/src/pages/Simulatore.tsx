import { computeAnno, computeTimeline, GRUPPI_ATECO, type Flag, type RisultatoAnno } from '@partitiva/motore-fiscale'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalcoloInverso } from '../components/CalcoloInverso'
import { ConfrontoDipendente } from '../components/ConfrontoDipendente'
import { ConfrontoOrdinario } from '../components/ConfrontoOrdinario'
import { Flusso } from '../components/Flusso'
import { IntestazionePagina } from '../components/IntestazionePagina'
import { Quadro, type SezioneConfronto } from '../components/Quadro'
import { SheetRisultati } from '../components/SheetRisultati'
import type { Fattura, Profilo, RiepilogoAnnuale, Spesa } from '../db'
import {
  annoDi,
  annoParamsVicini,
  annoUltimoStartup,
  buildTimelineInputs,
  gestioneDelProfilo,
  numeroAnnoAttivita,
  paramsVicini,
  settoreProfilo,
} from '../lib/bilancio'
import { centsInInput, formatEuro, oggiIso, parseImportoIt } from '../lib/format'
import { useDesktop } from '../lib/use-desktop'

const campoBase = 'mt-1 w-full rounded-md border bg-sfondo px-3 py-2'
const campo = `${campoBase} border-bordo-campo`
const campoInvalido = `${campoBase} border-errore-solido`

/** Sandbox: uno scenario alla volta, mai scritture su Dexie. Layout spec §4: colonna
 *  degli input a sinistra, Quadro sticky a destra; su mobile il Quadro vive nella sheet. */
export function Simulatore({
  profilo,
  fatture,
  riepiloghi,
  spese,
}: {
  profilo: Profilo | null
  fatture: Fattura[]
  riepiloghi: RiepilogoAnnuale[]
  spese: Spesa[]
}) {
  const annoCorrente = annoDi(oggiIso())
  const desktop = useDesktop()
  const [annoSimulato, setAnnoSimulato] = useState(annoCorrente)
  const [concatena, setConcatena] = useState(false)
  const [incassato, setIncassato] = useState('30.000')
  // Il settore si tiene per NOME: quattro gruppi condividono il 40% e il solo
  // coefficiente non sa quale opzione era selezionata. L'ultimo gruppo è «Altre attività».
  const SETTORE_PREDEFINITO = GRUPPI_ATECO[GRUPPI_ATECO.length - 1]!.settore
  const [settore, setSettore] = useState(SETTORE_PREDEFINITO)
  // Lo stato può contenere solo nomi validi (opzioni del select o settoreProfilo): find non fallisce.
  const coefficiente = GRUPPI_ATECO.find((g) => g.settore === settore)!.coefficiente
  const [startup, setStartup] = useState(true)
  const [copertura, setCopertura] = useState<'piena' | 'ridotta'>('piena')
  const [versati, setVersati] = useState('')
  const [primoAnno, setPrimoAnno] = useState(false)
  const [aperture, setAperture] = useState({ ordinario: false, dipendente: false, inverso: false })
  // La RAL vive qui (lift B4): la sezione la modifica, il Quadro ci calcola il verdetto.
  const [ral, setRal] = useState('')
  const ralCents = ral.trim() === '' ? null : parseImportoIt(ral)

  // Anni simulabili: da apertura a corrente+1 (il pregresso si registra, il futuro si simula).
  const anni = profilo
    ? Array.from({ length: annoCorrente + 2 - profilo.annoApertura }, (_, i) => profilo.annoApertura + i)
    : [annoCorrente]
  const concatenabile = profilo !== null && annoSimulato > profilo.annoApertura
  const concatenaAttiva = concatenabile && concatena

  const incassatoCents = parseImportoIt(incassato)
  const versatiCents = primoAnno || versati.trim() === '' ? 0 : (parseImportoIt(versati) ?? 0)

  // La gestione dello scenario segue il profilo (finestra 50% inclusa); senza profilo: GS.
  const gestioneScenario = profilo ? gestioneDelProfilo(profilo, annoSimulato) : undefined
  const gestioneSeparata = !gestioneScenario || gestioneScenario.tipo === 'gestione-separata'

  const { risultato, avvisi } = useMemo((): { risultato: RisultatoAnno | null; avvisi: Flag[] } => {
    if (incassatoCents === null) return { risultato: null, avvisi: [] }
    const scenario = {
      anno: annoSimulato,
      incassatoCents,
      coefficiente,
      startup,
      copertura,
      ...(gestioneScenario ? { gestione: gestioneScenario } : {}),
    }
    if (concatenaAttiva && profilo) {
      // Catena vera: anni reali (fatture + riepiloghi) fino a Y−1, poi lo scenario Y.
      const reali = buildTimelineInputs(profilo, fatture, riepiloghi, spese, annoSimulato - 1)
      const timeline = computeTimeline([...reali, { ...scenario, bolliCents: 0 }])
      return { risultato: timeline.anni[annoSimulato] ?? null, avvisi: timeline.flags }
    }
    // Nel ramo manuale paramsVicini ripiega in silenzio: l'avviso va detto qui.
    const annoParams = annoParamsVicini(annoSimulato)
    const avvisiManuali: Flag[] =
      annoParams !== annoSimulato
        ? [
            {
              codice: 'params-fallback',
              messaggio: `Parametri ${annoSimulato} non ancora disponibili: uso quelli del ${annoParams} (da riverificare a inizio anno).`,
            },
          ]
        : []
    return {
      risultato: computeAnno({ ...scenario, versatiContributiCents: versatiCents }, paramsVicini(annoSimulato)),
      avvisi: avvisiManuali,
    }
  }, [annoSimulato, incassatoCents, coefficiente, startup, copertura, gestioneScenario, versatiCents, concatenaAttiva, profilo, fatture, riepiloghi, spese])

  const cambiaAnno = (nuovo: number) => {
    setAnnoSimulato(nuovo)
    if (profilo) setStartup(nuovo <= annoUltimoStartup(profilo.annoApertura))
  }

  const partiDaiTuoiDati = () => {
    if (!profilo) return
    const reale = computeTimeline(buildTimelineInputs(profilo, fatture, riepiloghi, spese, annoCorrente)).anni[annoCorrente]
    if (!reale) return
    setAnnoSimulato(annoCorrente)
    setConcatena(numeroAnnoAttivita(profilo.annoApertura, annoCorrente) > 1)
    setIncassato(centsInInput(reale.explain[`${annoCorrente}:incassato`]!.value))
    // SEMPRE via settoreProfilo: valida il nome salvato e la coerenza col coefficiente.
    setSettore(settoreProfilo(profilo) ?? SETTORE_PREDEFINITO)
    setCopertura(profilo.copertura)
    setStartup(annoCorrente <= annoUltimoStartup(profilo.annoApertura))
    setPrimoAnno(numeroAnnoAttivita(profilo.annoApertura, annoCorrente) === 1)
    setVersati('')
  }

  const commutaSezione = (sezione: SezioneConfronto) =>
    setAperture((aperte) => ({ ...aperte, [sezione]: !aperte[sezione] }))

  /** Dal Quadro: apre la sezione e la porta in vista (spec §4: scroll + apertura). */
  const apriSezione = (sezione: SezioneConfronto) => {
    setAperture((aperte) => ({ ...aperte, [sezione]: true }))
    requestAnimationFrame(() => {
      const destinazione = document.getElementById(`sezione-${sezione}`)
      if (!destinazione) return
      const riduci =
        typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
      destinazione.scrollIntoView({ behavior: riduci ? 'auto' : 'smooth', block: 'start' })
    })
  }

  const quadro = (
    <Quadro
      anno={annoSimulato}
      incassatoCents={incassatoCents}
      risultato={risultato}
      copertura={copertura}
      gestione={gestioneScenario}
      spese={spese}
      ralCents={ralCents}
      onApriSezione={apriSezione}
    />
  )

  const colonna = (
    <div className="min-w-0 space-y-6">
      <div className="grid gap-3 rounded-xl border border-sim-bordo bg-superficie p-4 sm:grid-cols-2">
        {profilo && (
          <label className="text-sm">
            Anno simulato
            <select value={annoSimulato} onChange={(e) => cambiaAnno(Number(e.target.value))} className={campo}>
              {anni.map((a) => (
                <option key={a} value={a}>
                  {a}
                  {a === annoCorrente ? ' (in corso)' : a > annoCorrente ? ' (futuro)' : ''}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="text-sm">
          Incassato nell'anno (€)
          <input
            value={incassato}
            onChange={(e) => setIncassato(e.target.value)}
            className={incassatoCents === null ? campoInvalido : campo}
          />
          {incassatoCents === null && (
            <span className="mt-1 block text-xs text-errore">Importo non valido: usa il formato 1.234,56</span>
          )}
        </label>
        <label className="text-sm">
          Settore (coefficiente di redditività)
          <select value={settore} onChange={(e) => setSettore(e.target.value)} className={campo}>
            {GRUPPI_ATECO.map((g) => (
              <option key={g.settore} value={g.settore}>
                {g.settore} — {Math.round(g.coefficiente * 100)}%
              </option>
            ))}
          </select>
        </label>
        {concatenaAttiva ? (
          <div className="text-sm">
            Contributi versati nell'anno (derivati)
            <div className={`${campo} bg-rail tabular-nums`}>
              {risultato ? formatEuro(risultato.versatiContributiCents) : '—'}
            </div>
            <span className="mt-1 block text-xs text-testo-secondario">
              Saldi e acconti che pagheresti davvero, dalla catena reale fino al {annoSimulato - 1}.
            </span>
          </div>
        ) : (
          <label className="text-sm">
            Contributi versati nell'anno (€, facoltativo)
            <input
              value={primoAnno ? '' : versati}
              onChange={(e) => setVersati(e.target.value)}
              placeholder="0"
              disabled={primoAnno}
              className={`${campo} disabled:opacity-50`}
            />
            <span className="mt-1 block text-xs text-testo-secondario">
              Vuoto = niente da dedurre: è lo scenario più prudente.
            </span>
          </label>
        )}
        <div className="flex flex-col justify-center gap-2 text-sm">
          {concatenabile && (
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={concatena} onChange={(e) => setConcatena(e.target.checked)} />
              Concatena i miei dati fino al {annoSimulato - 1}
            </label>
          )}
          {concatenaAttiva && annoSimulato === annoCorrente + 1 && (
            <span className="text-xs text-testo-secondario">
              La catena usa il {annoCorrente} così com'è oggi (anno in corso).
            </span>
          )}
          {!concatenaAttiva && (
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={primoAnno} onChange={(e) => setPrimoAnno(e.target.checked)} />
              Primo anno di attività (nulla da dedurre)
            </label>
          )}
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={startup} onChange={(e) => setStartup(e.target.checked)} />
            Aliquota startup 5% (primi 5 anni; altrimenti 15%)
          </label>
          {gestioneSeparata ? (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={copertura === 'ridotta'}
                onChange={(e) => setCopertura(e.target.checked ? 'ridotta' : 'piena')}
              />
              Pensionato / altra copertura (GS ridotta)
            </label>
          ) : (
            <span className="text-xs text-testo-secondario">
              Gestione {gestioneScenario.tipo} dal profilo: fissi sul minimale + eccedenza
              {gestioneScenario.riduzione !== 'nessuna' ? ' (riduzione attiva)' : ''}
            </span>
          )}
          {profilo && (
            <button
              type="button"
              onClick={partiDaiTuoiDati}
              className="mt-1 self-start rounded-lg bg-accento-solido px-4 py-2 text-sm font-semibold text-testo-su-accento hover:opacity-90"
            >
              ↺ Parti dai tuoi dati
            </button>
          )}
        </div>
      </div>

      {avvisi.length > 0 && (
        <ul className="space-y-1 rounded-xl border border-avviso-bordo bg-avviso-fondo p-4 text-sm text-avviso-testo">
          {avvisi.map((avviso) => (
            <li key={avviso.codice + avviso.messaggio}>⚠️ {avviso.messaggio}</li>
          ))}
        </ul>
      )}

      {risultato && (
        <>
          <section className="rounded-xl border border-sim-bordo bg-superficie p-5 sm:p-7">
            <p className="mb-4 text-center">
              <span className="rounded-full border border-sim-bordo bg-sim-fondo px-3 py-1 text-xs font-medium text-sim-intenso">
                Flusso dello scenario — non è il tuo registro
              </span>
            </p>
            <Flusso explain={risultato.explain} anno={annoSimulato} livrea="sim" />
          </section>

          {incassatoCents !== null && (
            <div id="sezione-ordinario" className="scroll-mt-20">
              <ConfrontoOrdinario
                anno={annoSimulato}
                incassatoCents={incassatoCents}
                copertura={copertura}
                gestione={gestioneScenario}
                spese={spese}
                forfettario={risultato}
                regionePredefinita={profilo?.regione}
                aperto={aperture.ordinario}
                onToggle={() => commutaSezione('ordinario')}
              />
            </div>
          )}

          <div id="sezione-dipendente" className="scroll-mt-20">
            <ConfrontoDipendente
              anno={annoSimulato}
              nettoRealeForfettarioCents={risultato.nettoRealeCents}
              regionePredefinita={profilo?.regione}
              aperto={aperture.dipendente}
              onToggle={() => commutaSezione('dipendente')}
              ral={ral}
              onRalChange={setRal}
            />
          </div>

          <div id="sezione-inverso" className="scroll-mt-20">
            <CalcoloInverso
              anno={annoSimulato}
              coefficiente={coefficiente}
              startup={startup}
              copertura={copertura}
              gestione={gestioneScenario}
              versatiCents={risultato.versatiContributiCents}
              spese={spese}
              regionePredefinita={profilo?.regione}
              aperto={aperture.inverso}
              onToggle={() => commutaSezione('inverso')}
            />
          </div>
        </>
      )}

      <p className="text-xs text-testo-secondario">
        Chiudi o ricarica la pagina e lo scenario svanisce: niente di questa pagina finisce nei tuoi dati.
      </p>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-sim-bordo bg-sim-fondo px-4 py-2 text-center text-sm font-semibold text-sim-intenso">
        ⏈ Simulazione — qui non si salva niente: i tuoi dati veri non vengono toccati
      </div>

      <IntestazionePagina
        titolo={`Simulatore forfettario ${annoSimulato}`}
        extra={
          <span className="rounded-full border border-sim-bordo bg-sim-fondo px-3 py-1 text-xs font-semibold text-sim-intenso">
            ⏈ Sandbox
          </span>
        }
      >
        Uno scenario alla volta, senza toccare il tuo registro.{' '}
        {profilo ? (
          <>
            I numeri veri sono nella{' '}
            <Link className="underline underline-offset-2" to="/">
              Panoramica
            </Link>
            .
          </>
        ) : (
          <>
            Quando vuoi tracciare le fatture vere:{' '}
            <Link className="underline underline-offset-2" to="/dati">
              inizia da I miei dati
            </Link>
            .
          </>
        )}
      </IntestazionePagina>

      {desktop ? (
        <div className="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-5">
          {colonna}
          <div className="sticky top-4">{quadro}</div>
        </div>
      ) : (
        <>
          {colonna}
          <div aria-hidden="true" className="h-20" />
          <SheetRisultati nettoCents={risultato?.nettoRealeCents ?? null}>{quadro}</SheetRisultati>
        </>
      )}
    </div>
  )
}
