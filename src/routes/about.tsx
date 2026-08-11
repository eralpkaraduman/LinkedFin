import { createFileRoute, Link } from "@tanstack/react-router";
import { loadFishData } from "#/lib/fishData";
import { buildHead } from "#/lib/head";
import { GENERIC_META, SITE_NAME } from "#/shared/pageMeta";

/**
 * Counts come from the same isomorphic loader the region and detail pages use,
 * so they end up in the prerendered HTML rather than appearing after hydration.
 * Hardcoding them would go stale on the next content pass, the same mistake
 * llms.txt used to make.
 */
export const Route = createFileRoute("/about")({
	loader: async () => {
		const { names, relations } = await loadFishData();
		return {
			names: names.length,
			species: new Set(names.map((n) => n.species_id)).size,
			regions: new Set(names.map((n) => n.region_id)).size,
			languages: new Set(names.map((n) => n.lang)).size,
			relations: relations.length,
		};
	},
	staleTime: Number.POSITIVE_INFINITY,
	head: () =>
		buildHead({
			path: "/about",
			meta: {
				...GENERIC_META,
				title: `About — ${SITE_NAME}`,
				headline: `About ${SITE_NAME}`,
				description:
					"What LinkedFin is, where its etymologies come from, and how entries are written.",
			},
		}),
	component: About,
});

const SOURCES = [
	["Wiktionary", "and the reference works it cites"],
	["Nişanyan Sözlük", "Turkish"],
	["Kotus, Suomen etymologinen sanakirja", "Finnish"],
	["Eesti Keele Instituut", "Estonian"],
	["Liddell–Scott–Jones", "Ancient Greek"],
	["Svenska Akademiens ordbok", "Swedish"],
];

function About() {
	const stats = Route.useLoaderData();

	return (
		<main className="page-wrap px-4 py-12">
			<section className="island-shell rounded-2xl p-6 sm:p-8">
				<p className="island-kicker mb-2">About</p>
				<h1 className="display-title mb-4 text-4xl font-bold text-[var(--sea-ink)] sm:text-5xl">
					About {SITE_NAME}
				</h1>

				<div className="max-w-3xl space-y-8 text-base leading-8 text-[var(--sea-ink-soft)]">
					<p className="m-0">
						{SITE_NAME} collects the names people give fish and shellfish, and
						traces where those names came from. One entry is one name in one
						language. It currently holds{" "}
						<strong>{stats.names.toLocaleString()} names</strong> for{" "}
						{stats.species} species across {stats.regions} regions and{" "}
						{stats.languages} languages, with {stats.relations} links between
						names.
					</p>

					<section>
						<h2 className="mb-2 text-xl font-semibold text-[var(--sea-ink)]">
							Where the etymologies come from
						</h2>
						<p className="m-0 mb-3">
							They are taken from published dictionaries rather than inferred
							from how words look. The ones used most:
						</p>
						<ul className="m-0 list-disc space-y-1 pl-6">
							{SOURCES.map(([name, note]) => (
								<li key={name}>
									{name} <span className="opacity-75">({note})</span>
								</li>
							))}
						</ul>
					</section>

					<section>
						<h2 className="mb-2 text-xl font-semibold text-[var(--sea-ink)]">
							How entries are written
						</h2>
						<p className="m-0 mb-3">
							Every foreign word in an etymology is given with its meaning. When
							a word travelled through several languages, each step is written
							out instead of skipped, so you can see where the sense shifted.
						</p>
						<p className="m-0">
							When the sources disagree, or say the origin is unknown, the entry
							says that. Plenty of fish names have no settled etymology, and a
							plausible-sounding guess is worse than admitting it.
						</p>
					</section>

					<section>
						<h2 className="mb-2 text-xl font-semibold text-[var(--sea-ink)]">
							Links between names
						</h2>
						<p className="m-0">
							Names are connected where one was borrowed from another, where two
							languages name the same fish, or where a name is commonly applied
							to the wrong species. These links only run between names for the
							same species. A connection that crosses that line, like a word
							borrowed twice that ended up on two different animals, is
							described in the entry text instead.
						</p>
					</section>

					<section>
						<h2 className="mb-2 text-xl font-semibold text-[var(--sea-ink)]">
							Who makes this
						</h2>
						<p className="m-0 mb-3">
							{SITE_NAME} is a hobby project by{" "}
							<a
								href="https://eralp.dev"
								target="_blank"
								rel="noreferrer"
								className="underline"
							>
								Eralp Karaduman
							</a>
							. A name says a lot about the people who coined it: one culture
							names a fish for how it moves or feeds, another for a belief
							attached to it, another for what it is at the market or on the
							plate. The same animal carries all of those names at once.
						</p>
						<p className="m-0">
							Names travel, too. A borrowed name is a record of contact between
							cultures, kept by accident in everyday words. That history is what
							keeps me at this.
						</p>
					</section>

					<section>
						<h2 className="mb-2 text-xl font-semibold text-[var(--sea-ink)]">
							Corrections
						</h2>
						<p className="m-0">
							Mistakes are likely, particularly in the older Mediterranean
							material. If you find one, especially if you have a dictionary to
							point at,{" "}
							<a
								href="https://github.com/eralpkaraduman/LinkedFin/issues"
								target="_blank"
								rel="noreferrer"
								className="underline"
							>
								open an issue on GitHub
							</a>
							. A correction with a source is much easier to act on than one
							without.
						</p>
					</section>

					<p className="m-0">
						<Link to="/" search={{}} className="underline">
							Browse the names
						</Link>
					</p>
				</div>
			</section>
		</main>
	);
}
