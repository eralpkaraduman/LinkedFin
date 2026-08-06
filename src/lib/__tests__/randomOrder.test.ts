import { nextSeed, seededRank, shuffleWithSeed } from "#/lib/randomOrder";

const items = Array.from({ length: 50 }, (_, i) => ({ id: `nm_${i}` }));
const getId = (item: { id: string }) => item.id;

describe("seededRank", () => {
	test("is deterministic for the same seed and id", () => {
		expect(seededRank(7, "nm_0001")).toBe(seededRank(7, "nm_0001"));
	});

	test("differs between seeds", () => {
		expect(seededRank(7, "nm_0001")).not.toBe(seededRank(8, "nm_0001"));
	});

	test("returns an unsigned 32-bit integer", () => {
		const rank = seededRank(123, "nm_0042");
		expect(Number.isInteger(rank)).toBe(true);
		expect(rank).toBeGreaterThanOrEqual(0);
		expect(rank).toBeLessThanOrEqual(0xffffffff);
	});
});

describe("shuffleWithSeed", () => {
	test("produces the same order for the same seed", () => {
		const a = shuffleWithSeed(items, 42, getId);
		const b = shuffleWithSeed(items, 42, getId);
		expect(a.map(getId)).toEqual(b.map(getId));
	});

	test("produces a different order for a different seed", () => {
		const a = shuffleWithSeed(items, 42, getId).map(getId);
		const b = shuffleWithSeed(items, 43, getId).map(getId);
		expect(a).not.toEqual(b);
	});

	test("keeps every item exactly once (no duplicates, nothing dropped)", () => {
		const shuffled = shuffleWithSeed(items, 99, getId);
		expect(shuffled).toHaveLength(items.length);
		expect(new Set(shuffled.map(getId)).size).toBe(items.length);
	});

	test("does not mutate the input array", () => {
		const original = [...items];
		shuffleWithSeed(items, 5, getId);
		expect(items).toEqual(original);
	});

	test("is actually shuffled rather than the identity order", () => {
		const shuffled = shuffleWithSeed(items, 12345, getId).map(getId);
		expect(shuffled).not.toEqual(items.map(getId));
	});

	test("handles an empty list", () => {
		expect(shuffleWithSeed([], 1, getId)).toEqual([]);
	});
});

describe("nextSeed", () => {
	test("never returns 0 (0 means 'not seeded yet')", () => {
		const spy = vi.spyOn(Math, "random").mockReturnValue(0);
		expect(nextSeed()).toBe(1);
		spy.mockRestore();
	});

	test("returns an unsigned 32-bit integer", () => {
		const seed = nextSeed();
		expect(Number.isInteger(seed)).toBe(true);
		expect(seed).toBeGreaterThan(0);
		expect(seed).toBeLessThanOrEqual(0xffffffff);
	});
});
