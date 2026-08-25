import { Link, NavLink } from 'react-router-dom'
import { TemaToggle } from './TemaToggle'

export interface VoceNav {
  to: string
  label: string
  end: boolean
  sim: boolean
}

/** Contenuto della navigazione della shell: brand, voci e tema. Vive nella sidebar su
 *  desktop e dentro il Drawer su mobile (spec redesign §3): un solo posto per la nav. */
export function ShellNav({
  voci,
  conBrand = true,
  conTema = true,
  onNaviga,
}: {
  voci: VoceNav[]
  conBrand?: boolean
  conTema?: boolean
  onNaviga?: () => void
}) {
  const stileVoce = (attivo: boolean, sim: boolean) =>
    `rounded-lg px-3 py-2 text-sm transition ${
      attivo
        ? `bg-nav-attiva font-semibold shadow-sm ${sim ? 'text-sim' : 'text-testo'}`
        : 'font-medium text-testo-secondario hover:text-testo'
    }`

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 p-4">
      {conBrand && (
        <h1 className="text-[15px] font-bold tracking-tight">
          <Link to="/" onClick={onNaviga}>
            Partitiva <span className="font-medium text-reale">· forfettario</span>
          </Link>
        </h1>
      )}
      <nav aria-label="Principale" className="flex flex-col gap-1">
        {voci.map((voce) => (
          <NavLink
            key={voce.to}
            to={voce.to}
            end={voce.end}
            onClick={onNaviga}
            className={({ isActive }) => stileVoce(isActive, voce.sim)}
          >
            {voce.label}
          </NavLink>
        ))}
      </nav>
      {conTema && (
        <div className="mt-auto border-t border-bordo-sottile pt-3">
          <TemaToggle />
        </div>
      )}
    </div>
  )
}
