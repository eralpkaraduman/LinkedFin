# LinkedFin

*It's like LinkedIn, but for fish.*

A fintastic multilingual database of fish names across Mediterranean and Nordic regions.

**Live site:** [linkedfin.net](https://linkedfin.net)

## About

LinkedFin maps the sofishticated etymological connections between fish names in Turkish, Greek, Arabic, Finnish, Swedish, Estonian, Italian, and more. Explore how languages borrowed, adapted, and evolved names for the same species across cultures.

The database is actively growing with new species, languages, and etymological research.

## Local Development

```bash
brew install oven-sh/bun/bun pnpm
pnpm install
pnpm dev
```

Opens at http://localhost:4141

## Database

The SQLite database (`fish.db`) contains species, regional names, etymologies, and cross-language relations.

```bash
pnpm db:types   # Regenerate TypeScript types
pnpm db:copy    # Copy database to public folder
```

## Contributing

Found a mistake? Open an issue or PR.

## License

MIT
