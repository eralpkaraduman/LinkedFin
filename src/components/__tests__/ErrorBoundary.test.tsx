// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { ErrorBoundary } from "../ErrorBoundary";

function Boom(): never {
	throw new Error("kaboom");
}

beforeEach(() => {
	vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
	vi.restoreAllMocks();
});

test("renders children when no error", () => {
	render(
		<ErrorBoundary>
			<span>safe content</span>
		</ErrorBoundary>,
	);
	expect(screen.getByText("safe content")).toBeInTheDocument();
});

test("renders default fallback after a child throws", () => {
	render(
		<ErrorBoundary>
			<Boom />
		</ErrorBoundary>,
	);
	expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
	expect(
		screen.getByRole("button", { name: /try again/i }),
	).toBeInTheDocument();
});

test("renders custom fallback when provided", () => {
	render(
		<ErrorBoundary fallback={<div>custom fallback</div>}>
			<Boom />
		</ErrorBoundary>,
	);
	expect(screen.getByText("custom fallback")).toBeInTheDocument();
});

test("clicking try-again resets the error state", async () => {
	let shouldThrow = true;
	function Toggleable() {
		if (shouldThrow) throw new Error("first render");
		return <span>recovered</span>;
	}

	render(
		<ErrorBoundary>
			<Toggleable />
		</ErrorBoundary>,
	);
	expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

	shouldThrow = false;
	await userEvent.click(screen.getByRole("button", { name: /try again/i }));

	expect(screen.getByText("recovered")).toBeInTheDocument();
});
