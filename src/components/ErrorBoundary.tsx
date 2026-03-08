import { Component, type ReactNode } from "react";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	render() {
		if (this.state.hasError) {
			return (
				this.props.fallback ?? (
					<div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
						<p className="text-sm text-muted-foreground">
							Something went wrong loading this content.
						</p>
						<button
							type="button"
							onClick={() =>
								this.setState({ hasError: false, error: undefined })
							}
							className="text-sm text-primary hover:underline"
						>
							Try again
						</button>
					</div>
				)
			);
		}

		return this.props.children;
	}
}
