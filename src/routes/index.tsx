import { useState } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Input } from "#/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table"
import { useDatabase } from "#/lib/DatabaseContext"
import { useSearch, getItem } from "#/hooks/useSearch"
import { DetailModal } from "#/components/DetailModal"
import { NameDetail } from "#/components/NameDetail"
import type { FishName } from "#/lib/types"

interface SearchParams {
  q?: string
}

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  component: HomePage,
})

function HomePage() {
  const { q = "" } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { names } = useDatabase()
  const results = useSearch(q)
  const [selectedName, setSelectedName] = useState<FishName | null>(null)

  const handleSearch = (value: string) => {
    navigate({
      search: { q: value || undefined },
      replace: true,
    })
  }

  const displayResults = results.map(getItem)

  return (
    <main className="page-wrap flex flex-col px-4 pb-8">
      <div className="mb-6 mt-4">
        <p className="mb-4 text-sm text-muted-foreground">
          A so<strong>fish</strong>ticated database for fish names and their
          etymologies across cultures
        </p>
        <div className="relative">
          <Input
            value={q}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search names, species, regions..."
            className="h-10"
          />
          {q && (
            <button
              type="button"
              onClick={() => handleSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
            >
              <span className="sr-only">Clear</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {q ? `${displayResults.length} results` : `${names.length} names`}
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="hidden sm:table-cell">
              Transliteration
            </TableHead>
            <TableHead>Region</TableHead>
            <TableHead className="hidden md:table-cell">Species</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayResults.map((item) => (
            <TableRow
              key={item.id}
              className="cursor-pointer"
              onClick={() => setSelectedName(item)}
            >
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell className="hidden sm:table-cell">
                {item.transliteration || ""}
              </TableCell>
              <TableCell>{item.region}</TableCell>
              <TableCell className="hidden italic md:table-cell">
                {item.scientific_name}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <DetailModal
        open={!!selectedName}
        onOpenChange={(open) => !open && setSelectedName(null)}
        title={selectedName?.name || ""}
        description={selectedName?.scientific_name}
      >
        {selectedName && (
          <NameDetail
            name={selectedName}
            onNavigate={(id) => {
              const newName = names.find((n) => n.id === id)
              if (newName) setSelectedName(newName)
            }}
          />
        )}
      </DetailModal>
    </main>
  )
}
