/**
 * Deterministic, seeded random ordering.
 *
 * The table's "Random" sort mode has to survive pagination and re-renders: if
 * the order were recomputed with `Math.random()` on every render, paging
 * forward would show duplicate rows and silently skip others. Instead each row
 * gets a rank derived purely from (seed, row id), so the same seed always
 * produces the same permutation. Pressing shuffle bumps the seed.
 */

/**
 * xorshift/multiply hash of a string id mixed with a numeric seed.
 * Returns an unsigned 32-bit integer.
 */
export function seededRank(seed: number, id: string): number {
	let hash = (seed ^ 0x9e3779b9) >>> 0;
	for (let i = 0; i < id.length; i++) {
		hash = Math.imul(hash ^ id.charCodeAt(i), 0x85ebca6b) >>> 0;
		hash = (hash ^ (hash >>> 13)) >>> 0;
	}
	hash = Math.imul(hash ^ (hash >>> 16), 0xc2b2ae35) >>> 0;
	return (hash ^ (hash >>> 16)) >>> 0;
}

/**
 * Return a new array ordered by the seeded rank of each item's id.
 * Pure: same (items, seed) always yields the same order.
 */
export function shuffleWithSeed<T>(
	items: readonly T[],
	seed: number,
	getId: (item: T) => string,
): T[] {
	return [...items]
		.map((item) => ({ item, id: getId(item) }))
		.sort((a, b) => {
			const diff = seededRank(seed, a.id) - seededRank(seed, b.id);
			// Tie-break on id so equal hashes still produce a total order.
			return diff !== 0 ? diff : a.id.localeCompare(b.id);
		})
		.map(({ item }) => item);
}

/** Pick a fresh non-zero seed. Only called from event handlers / effects. */
export function nextSeed(): number {
	return Math.floor(Math.random() * 0xffffffff) >>> 0 || 1;
}
