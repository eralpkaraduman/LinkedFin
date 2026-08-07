import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";
import {
	getNameById,
	getNames,
	getNamesBySpecies,
	getRelations,
	getSpeciesInfo,
	initDatabase,
	isInitialized,
} from "./database";
import type { DatabaseState, FishName } from "./types";

export interface DatabaseContextValue extends DatabaseState {
	/** Human-readable progress while the WASM database loads. */
	status: string;
	getNameById: (id: string) => FishName | undefined;
	getNamesBySpecies: (speciesId: string) => FishName[];
	getSpeciesInfo: (
		speciesId: string,
	) => { scientific_name: string; notes?: string } | undefined;
}

export const DatabaseContext = createContext<DatabaseContextValue | null>(null);

/**
 * Holds the client-side sqlite-wasm database.
 *
 * It deliberately does **not** gate `children` on the database being ready.
 * It used to, and that single early return was what made prerendering
 * pointless: the effect below never runs on the server, so all 620 pages
 * rendered the same "Initializing…" div and no route component ever mounted.
 * Detail routes now take their data from route loaders instead; the only screen
 * that still needs this context is the search on `/`, which renders its own
 * loading state from `isLoading`/`error`.
 */
export function DatabaseProvider({ children }: { children: ReactNode }) {
	const [state, setState] = useState<DatabaseState>({
		names: [],
		relations: [],
		isLoading: true,
		error: null,
	});
	const [status, setStatus] = useState("Initializing...");

	useEffect(() => {
		if (isInitialized()) {
			setState({
				names: getNames(),
				relations: getRelations(),
				isLoading: false,
				error: null,
			});
			return;
		}

		initDatabase(setStatus)
			.then(() => {
				setState({
					names: getNames(),
					relations: getRelations(),
					isLoading: false,
					error: null,
				});
			})
			.catch((err) => {
				setState({
					names: [],
					relations: [],
					isLoading: false,
					error: err instanceof Error ? err.message : "Unknown error",
				});
			});
	}, []);

	const value: DatabaseContextValue = {
		...state,
		status,
		getNameById,
		getNamesBySpecies,
		getSpeciesInfo,
	};

	return (
		<DatabaseContext.Provider value={value}>
			{children}
		</DatabaseContext.Provider>
	);
}

export function useDatabase(): DatabaseContextValue {
	const context = useContext(DatabaseContext);
	if (!context) {
		throw new Error("useDatabase must be used within a DatabaseProvider");
	}
	return context;
}
