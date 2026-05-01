import { getRouter } from "../router";

test("getRouter wires the app's generated routeTree into a fresh router each call", () => {
	const r1 = getRouter();
	const r2 = getRouter();

	// Each call yields a fresh instance (so consumers can scope a router per request).
	expect(r1).not.toBe(r2);
	// The router is wired to the app's route tree (has at least one route).
	expect(r1.routeTree).toBeDefined();
	expect(Object.keys(r1.routesById ?? {}).length).toBeGreaterThan(0);
});
