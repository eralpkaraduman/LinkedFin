import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { Input } from '#/components/ui/input'

export default function Header() {
  const search = useSearch({ strict: false }) as { q?: string; id?: string }
  const navigate = useNavigate()
  const q = search.q || ''
  const hasModal = !!search.id

  const handleSearch = (value: string) => {
    navigate({
      to: '/',
      search: (prev) => ({ ...prev, q: value || undefined }),
      replace: true,
    })
  }

  return (
    <header className="safe-top sticky top-0 z-50 overflow-hidden border-b border-border bg-background/95 px-2 backdrop-blur-sm sm:px-4">
      <nav className="flex items-center gap-2 py-2 sm:gap-3 sm:py-3">
        <h1 className="m-0 flex-shrink-0 text-base font-semibold tracking-tight">
          <Link
            to="/"
            search={{}}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-1 text-sm text-foreground no-underline transition hover:bg-muted sm:gap-2 sm:px-3 sm:py-1.5"
          >
            <span className="text-base sm:text-lg">🐟</span>
            LinkedFin
          </Link>
        </h1>

        <div className={`relative flex-1 transition-all ${hasModal ? 'opacity-40 blur-[2px]' : ''}`}>
          <Input
            value={q}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search..."
            className="h-8 text-sm sm:h-9"
          />
          {q && (
            <button
              type="button"
              onClick={() => handleSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded p-1 text-muted-foreground hover:text-foreground"
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

        <a
          href="https://github.com/eralpkaraduman/LinkedFin"
          target="_blank"
          rel="noreferrer"
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground no-underline transition hover:bg-muted hover:text-foreground sm:rounded-xl sm:p-2"
        >
          <span className="sr-only">View on GitHub</span>
          <svg viewBox="0 0 16 16" aria-hidden="true" width="18" height="18" className="sm:h-5 sm:w-5">
            <path
              fill="currentColor"
              d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"
            />
          </svg>
        </a>
      </nav>
    </header>
  )
}
