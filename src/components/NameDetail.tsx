import { Link } from "@tanstack/react-router"
import { useDatabase } from "#/lib/DatabaseContext"
import { buildChain, getRelationsForName } from "#/lib/relations"
import type { FishName } from "#/lib/types"
import { Badge } from "#/components/ui/badge"

interface NameDetailProps {
  name: FishName
  onNavigate?: (id: string) => void
}

export function NameDetail({ name, onNavigate }: NameDetailProps) {
  const { relations, getNameById, getNamesBySpecies } = useDatabase()

  const sizeChain = buildChain(name.id, "smaller_than", relations)
  const alternates = buildChain(name.id, "alternate_of", relations)
  const { borrowedFrom, lentTo, confusedWith } = getRelationsForName(
    name.id,
    relations
  )
  const sameSpecies = getNamesBySpecies(name.species_id)

  const NameLink = ({
    id,
    children,
    className = "",
  }: {
    id: string
    children: React.ReactNode
    className?: string
  }) => {
    if (onNavigate) {
      return (
        <button
          type="button"
          onClick={() => onNavigate(id)}
          className={`text-primary hover:underline ${className}`}
        >
          {children}
        </button>
      )
    }
    return (
      <Link
        to="/name/$id"
        params={{ id }}
        className={`text-primary hover:underline ${className}`}
      >
        {children}
      </Link>
    )
  }

  return (
    <div className="space-y-4">
      {/* Meta info */}
      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
        <span>#{name.id}</span>
        <span>📍 {name.region}</span>
        <span>🗣️ {name.language}</span>
      </div>

      {/* Fields grid */}
      {(name.transliteration ||
        name.phonetic ||
        name.measurement_unit) && (
        <div className="rounded-lg bg-muted/50 p-3 text-sm">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            {name.transliteration && (
              <>
                <dt className="text-muted-foreground">Transliteration</dt>
                <dd className="font-mono">{name.transliteration}</dd>
              </>
            )}
            {name.phonetic && !name.phonetic.startsWith("[") && (
              <>
                <dt className="text-muted-foreground">IPA</dt>
                <dd className="font-serif">{name.phonetic}</dd>
              </>
            )}
            {name.measurement_unit && (
              <>
                <dt className="text-muted-foreground">Size</dt>
                <dd>
                  {name.measurement_min}–{name.measurement_max || "∞"}{" "}
                  {name.measurement_unit}
                </dd>
              </>
            )}
          </dl>
        </div>
      )}

      {/* Etymology */}
      {name.etymology && (
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="whitespace-pre-line text-sm">{name.etymology}</p>
        </div>
      )}

      {/* Species notes */}
      {name.species_notes && (
        <p className="border-l-2 border-muted pl-3 text-sm text-muted-foreground">
          {name.species_notes}
        </p>
      )}

      {/* Size progression chain */}
      {sizeChain.length > 1 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Size Progression
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            {sizeChain.map((id, i) => {
              const n = getNameById(id)
              if (!n) return null
              const isCurrent = id === name.id
              return (
                <span key={id} className="flex items-center gap-2">
                  <Badge
                    variant={isCurrent ? "default" : "outline"}
                    className={isCurrent ? "" : "cursor-pointer"}
                    render={
                      isCurrent ? undefined : (
                        <NameLink id={id}>
                          <span />
                        </NameLink>
                      )
                    }
                  >
                    {n.name}
                    {n.measurement_unit && (
                      <span className="ml-1 text-xs opacity-70">
                        {n.measurement_min}–{n.measurement_max || "∞"}
                      </span>
                    )}
                  </Badge>
                  {i < sizeChain.length - 1 && (
                    <span className="text-muted-foreground">→</span>
                  )}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Alternates */}
      {alternates.length > 1 && (
        <div className="text-sm">
          <span className="text-muted-foreground">Alternates: </span>
          {alternates
            .filter((id) => id !== name.id)
            .map((id, i, arr) => {
              const n = getNameById(id)
              if (!n) return null
              return (
                <span key={id}>
                  <NameLink id={id}>{n.name}</NameLink>
                  <span className="text-muted-foreground"> ({n.region})</span>
                  {i < arr.length - 1 && ", "}
                </span>
              )
            })}
        </div>
      )}

      {/* Borrowed from */}
      {borrowedFrom.length > 0 && (
        <div className="text-sm">
          <span className="text-muted-foreground">Borrowed from: </span>
          {borrowedFrom.map((rel, i) => {
            const n = getNameById(rel.target_id)
            if (!n) return null
            return (
              <span key={rel.target_id}>
                <NameLink id={rel.target_id}>{n.name}</NameLink>
                {i < borrowedFrom.length - 1 && ", "}
              </span>
            )
          })}
        </div>
      )}

      {/* Lent to */}
      {lentTo.length > 0 && (
        <div className="text-sm">
          <span className="text-muted-foreground">Lent to: </span>
          {lentTo.map((rel, i) => {
            const n = getNameById(rel.source_id)
            if (!n) return null
            return (
              <span key={rel.source_id}>
                <NameLink id={rel.source_id}>{n.name}</NameLink>
                {i < lentTo.length - 1 && ", "}
              </span>
            )
          })}
        </div>
      )}

      {/* Confused with */}
      {confusedWith.length > 0 && (
        <div className="text-sm text-amber-600 dark:text-amber-400">
          <span>⚠️ Often confused with: </span>
          {confusedWith.map((rel, i) => {
            const otherId =
              rel.source_id === name.id ? rel.target_id : rel.source_id
            const n = getNameById(otherId)
            if (!n) return null
            return (
              <span key={otherId}>
                <NameLink id={otherId} className="text-amber-600 dark:text-amber-400">
                  {n.name}
                </NameLink>
                <span> ({n.scientific_name})</span>
                {i < confusedWith.length - 1 && ", "}
              </span>
            )
          })}
        </div>
      )}

      {/* Same species, different names */}
      {sameSpecies.length > 1 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Same species, different names
          </h3>
          <div className="flex flex-wrap gap-2">
            {sameSpecies.map((n) => {
              const isCurrent = n.id === name.id
              return (
                <Badge
                  key={n.id}
                  variant={isCurrent ? "default" : "outline"}
                  className={isCurrent ? "" : "cursor-pointer"}
                  render={
                    isCurrent ? undefined : (
                      <NameLink id={n.id}>
                        <span />
                      </NameLink>
                    )
                  }
                >
                  {n.name}
                  <span className="ml-1 text-xs opacity-70">{n.region}</span>
                </Badge>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
