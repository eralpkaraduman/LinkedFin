// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { renderWithProviders } from "#/test/render";
import Header from "../Header";

test("renders search input and brand link", async () => {
	renderWithProviders(<Header />);
	expect(
		await screen.findByPlaceholderText(/search fish names/i),
	).toBeInTheDocument();
	expect(screen.getByRole("link", { name: /LinkedFin/i })).toBeInTheDocument();
});

test("typing into search shows the clear button", async () => {
	renderWithProviders(<Header />);
	const input = await screen.findByPlaceholderText(/search fish names/i);

	await userEvent.type(input, "salmon");

	expect(screen.getByText("Clear")).toBeInTheDocument();
});

test("clicking the clear button empties the input", async () => {
	renderWithProviders(<Header />);
	const input = (await screen.findByPlaceholderText(
		/search fish names/i,
	)) as HTMLInputElement;
	await userEvent.type(input, "salmon");
	expect(input.value).toBe("salmon");

	await userEvent.click(screen.getByText("Clear"));
	expect(input.value).toBe("");
});

test("dims the search container when a name modal is open", async () => {
	renderWithProviders(<Header />, { initialPath: "/?name=nm_0001" });
	const input = await screen.findByPlaceholderText(/search fish names/i);
	const container = input.closest("div");
	expect(container?.className).toContain("opacity-40");
});
