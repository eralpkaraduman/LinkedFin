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
	initDatabase,
	isInitialized,
} from "./database";
import type { DatabaseState, FishName } from "./types";

interface DatabaseContextValue extends DatabaseState {
	getNameById: (id: string) => FishName | undefined;
	getNamesBySpecies: (speciesId: string) => FishName[];
}

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

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
		getNameById,
		getNamesBySpecies,
	};

	if (state.isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-center">
					<div className="mb-4 text-4xl">🐟</div>
					<div className="text-muted-foreground">{status}</div>
				</div>
			</div>
		);
	}

	if (state.error) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-center text-destructive">
					<div className="mb-4 text-4xl">❌</div>
					<div>Error: {state.error}</div>
				</div>
			</div>
		);
	}

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
