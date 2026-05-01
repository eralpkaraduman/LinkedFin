// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { ShareActions } from "../ShareActions";

afterEach(() => {
	// `"share" in navigator` is the runtime check; we must remove the property
	// (not just set it to undefined) to fully restore between tests.
	delete (navigator as { share?: unknown }).share;
});

test("renders copy-link button", () => {
	render(<ShareActions />);
	expect(screen.getByTitle("Copy link")).toBeInTheDocument();
});

test("clicking copy button writes URL to clipboard and shows confirmation", async () => {
	const writeText = vi.fn().mockResolvedValue(undefined);
	Object.defineProperty(navigator, "clipboard", {
		value: { writeText },
		configurable: true,
	});

	render(<ShareActions />);
	await userEvent.click(screen.getByTitle("Copy link"));

	expect(writeText).toHaveBeenCalledWith(window.location.href);
	await waitFor(() => {
		expect(
			screen.getByTitle("Copy link").querySelector("svg")?.classList.toString(),
		).toContain("text-green");
	});
});

test("does not render share button when navigator.share is unavailable", () => {
	render(<ShareActions />);
	expect(screen.queryByTitle("Share")).not.toBeInTheDocument();
});

test("renders share button and invokes navigator.share when supported", async () => {
	const share = vi.fn().mockResolvedValue(undefined);
	Object.defineProperty(navigator, "share", {
		value: share,
		configurable: true,
	});

	render(<ShareActions />);
	const shareBtn = screen.getByTitle("Share");
	await userEvent.click(shareBtn);

	expect(share).toHaveBeenCalledWith({ url: window.location.href });
});
