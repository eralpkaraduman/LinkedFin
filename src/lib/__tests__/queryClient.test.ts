import { QueryClient } from "@tanstack/react-query";
import { queryClient } from "../queryClient";

test("the exported queryClient is a configured QueryClient instance", () => {
	expect(queryClient).toBeInstanceOf(QueryClient);
	// Smoke-test that defaults exist (don't pin specific values — those are
	// source-of-truth in queryClient.ts, asserting them just duplicates source).
	expect(queryClient.getDefaultOptions().queries).toBeDefined();
});
