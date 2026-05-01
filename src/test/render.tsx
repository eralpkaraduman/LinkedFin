// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { type RenderOptions, render } from "@testing-library/react";
import type { ReactElement } from "react";
import {
	DatabaseContext,
	type DatabaseContextValue,
} from "#/lib/DatabaseContext";

interface ProviderOptions {
	initialPath?: string;
	database?: Partial<DatabaseContextValue>;
}

const defaultDb: DatabaseContextValue = {
	names: [],
	relations: [],
	isLoading: false,
	error: null,
	getNameById: () => undefined,
	getNamesBySpecies: () => [],
	getSpeciesInfo: () => undefined,
};

export function renderWithProviders(
	ui: ReactElement,
	{ initialPath = "/", database = {} }: ProviderOptions = {},
	options?: RenderOptions,
) {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false, gcTime: 0, staleTime: 0 },
		},
	});

	const rootRoute = createRootRoute();
	const testRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: "/",
		component: () => ui,
	});
	const router = createRouter({
		routeTree: rootRoute.addChildren([testRoute]),
		history: createMemoryHistory({ initialEntries: [initialPath] }),
	});

	const dbValue: DatabaseContextValue = { ...defaultDb, ...database };

	return render(
		<QueryClientProvider client={queryClient}>
			<DatabaseContext.Provider value={dbValue}>
				{/* biome-ignore lint/suspicious/noExplicitAny: test router type */}
				<RouterProvider router={router as any} />
			</DatabaseContext.Provider>
		</QueryClientProvider>,
		options,
	);
}
