// Gruppi di settore → coefficiente di redditività (allegato 4, L. 190/2014).
// I gruppi restano definiti sulla classificazione ATECO 2007 e continuano ad applicarsi anche
// dopo la riclassificazione ATECO 2025, in attesa dell'aggiornamento ufficiale del mapping.
import type { Fonte } from './types'

const FONTE_ALLEGATO_4: Fonte = {
  riferimento:
    'Allegato 4, L. 190/2014 (gruppi su ATECO 2007; applicabile anche dopo la riclassificazione ATECO 2025, mapping ufficiale in attesa)',
  url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:2014-12-23;190',
  verificatoIl: '2026-08-22',
  daVerificare: true,
}

export interface GruppoAteco {
  settore: string
  /** Prefissi ATECO (divisioni "62" o sottocategorie "46.1", "47.81"): vince il più specifico. */
  prefissi: readonly string[]
  coefficiente: number
  fonte: Fonte
}

const divisioni = (da: number, a: number): string[] =>
  Array.from({ length: a - da + 1 }, (_, i) => String(da + i).padStart(2, '0'))

export const GRUPPI_ATECO: readonly GruppoAteco[] = [
  {
    settore: 'Industrie alimentari e delle bevande',
    prefissi: divisioni(10, 11),
    coefficiente: 0.4,
    fonte: FONTE_ALLEGATO_4,
  },
  {
    settore: 'Commercio all’ingrosso e al dettaglio',
    prefissi: ['45', '46.2', '46.3', '46.4', '46.5', '46.6', '46.7', '46.8', '46.9', '47.1', '47.2', '47.3', '47.4', '47.5', '47.6', '47.7', '47.9'],
    coefficiente: 0.4,
    fonte: FONTE_ALLEGATO_4,
  },
  {
    settore: 'Commercio ambulante di prodotti alimentari e bevande',
    prefissi: ['47.81'],
    coefficiente: 0.4,
    fonte: FONTE_ALLEGATO_4,
  },
  {
    settore: 'Commercio ambulante di altri prodotti',
    prefissi: ['47.82', '47.83', '47.84', '47.85', '47.86', '47.87', '47.88', '47.89'],
    coefficiente: 0.54,
    fonte: FONTE_ALLEGATO_4,
  },
  {
    settore: 'Costruzioni e attività immobiliari',
    prefissi: [...divisioni(41, 43), '68'],
    coefficiente: 0.86,
    fonte: FONTE_ALLEGATO_4,
  },
  {
    settore: 'Intermediari del commercio',
    prefissi: ['46.1'],
    coefficiente: 0.62,
    fonte: FONTE_ALLEGATO_4,
  },
  {
    settore: 'Attività dei servizi di alloggio e di ristorazione',
    prefissi: divisioni(55, 56),
    coefficiente: 0.4,
    fonte: FONTE_ALLEGATO_4,
  },
  {
    settore:
      'Attività professionali, scientifiche, tecniche, sanitarie, di istruzione, servizi finanziari e assicurativi',
    prefissi: [...divisioni(64, 66), ...divisioni(69, 75), ...divisioni(85, 88)],
    coefficiente: 0.78,
    fonte: FONTE_ALLEGATO_4,
  },
  {
    settore: 'Altre attività economiche',
    prefissi: [
      ...divisioni(1, 3),
      ...divisioni(5, 9),
      ...divisioni(12, 33),
      ...divisioni(35, 39),
      ...divisioni(49, 53),
      ...divisioni(58, 63),
      ...divisioni(77, 82),
      '84',
      ...divisioni(90, 99),
    ],
    coefficiente: 0.67,
    fonte: FONTE_ALLEGATO_4,
  },
]

const PER_PREFISSO: ReadonlyMap<string, GruppoAteco> = new Map(
  GRUPPI_ATECO.flatMap((gruppo) => gruppo.prefissi.map((prefisso) => [prefisso, gruppo])),
)

/**
 * Dal codice ("620200", "62.2.10", "46.19.02") ai candidati dal più specifico al più generico,
 * inclusi i gruppi di terza cifra ("46.19.02" → ["46.19.02", "46.19", "46.1", "46"]).
 */
const candidatiPerCodice = (codice: string): string[] => {
  const cifre = codice.replace(/[^\d]/g, '')
  if (cifre.length < 2) return []
  const divisione = cifre.slice(0, 2)
  const classe = cifre.slice(2, 4)
  const sottocategoria = cifre.slice(4, 6)
  const candidati: string[] = []
  if (classe.length === 2 && sottocategoria.length > 0) {
    candidati.push(`${divisione}.${classe}.${sottocategoria}`)
  }
  if (classe.length === 2) candidati.push(`${divisione}.${classe}`)
  if (classe.length >= 1) candidati.push(`${divisione}.${classe[0]}`)
  candidati.push(divisione)
  return candidati
}

/** Gruppo (e coefficiente) per un codice ATECO; undefined se la divisione non è in tabella. */
export function coefficientePerAteco(codice: string): GruppoAteco | undefined {
  for (const candidato of candidatiPerCodice(codice)) {
    const gruppo = PER_PREFISSO.get(candidato)
    if (gruppo) return gruppo
  }
  return undefined
}
