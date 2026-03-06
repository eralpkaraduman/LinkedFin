import { useState } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useDatabase } from "#/lib/DatabaseContext"
import { NameDetail } from "#/components/NameDetail"
import { Button } from "#/components/ui/button"
import { ArrowLeftIcon, LinkIcon, CheckIcon } from "lucide-react"

export const Route = createFileRoute("/name/$id")({
  component: DetailPage,
})

function DetailPage() {
  const { id } = Route.useParams()
  const { getNameById } = useDatabase()
  const [copied, setCopied] = useState(false)

  const name = getNameById(id)

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!name) {
    return (
      <main className="page-wrap px-4 py-8">
        <div className="text-center">
          <p className="mb-4 text-muted-foreground">Name not found: {id}</p>
          <Link to="/" search={{}} className="text-primary hover:underline">
            Back to search
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="page-wrap px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <Link
              to="/"
              search={{}}
              className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to search
            </Link>
            <h1 className="text-2xl font-bold">{name.name}</h1>
            <a
              href={`https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(name.scientific_name)}`}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground italic underline underline-offset-2"
            >
              {name.scientific_name}
            </a>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={copyLink}
            title="Copy link"
          >
            {copied ? (
              <CheckIcon className="h-4 w-4 text-green-500" />
            ) : (
              <LinkIcon className="h-4 w-4" />
            )}
          </Button>
        </div>

        <NameDetail name={name} />
      </div>
    </main>
  )
}
