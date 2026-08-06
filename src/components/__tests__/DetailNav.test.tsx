// @vitest-environment jsdom
import { fireEvent, screen } from "@testing-library/react";
import { BackButton, SiblingNav } from "#/components/DetailNav";
import { renderWithProviders } from "#/test/render";

const backMock = vi.fn();
const navigateMock = vi.fn();
let canGoBack = true;

vi.mock("@tanstack/react-router", async (importOriginal) => {
	const actual =
		await importOriginal<typeof import("@tanstack/react-router")>();
	return {
		...actual,
		useCanGoBack: () => canGoBack,
		useRouter: () => ({ history: { back: backMock } }),
		useNavigate: () => navigateMock,
	};
});

beforeEach(() => {
	backMock.mockReset();
	navigateMock.mockReset();
	canGoBack = true;
});

test("goes back in history when there is somewhere to go back to", async () => {
	renderWithProviders(<BackButton />);

	fireEvent.click(await screen.findByRole("button", { name: "Back" }));

	expect(backMock).toHaveBeenCalledTimes(1);
	expect(navigateMock).not.toHaveBeenCalled();
});

test("falls back to the search page when history is empty", async () => {
	canGoBack = false;
	renderWithProviders(<BackButton />);

	fireEvent.click(await screen.findByRole("button", { name: "Back" }));

	expect(backMock).not.toHaveBeenCalled();
	expect(navigateMock).toHaveBeenCalledWith({ to: "/", search: {} });
});

test("renders previous and next links pointing at the sibling entries", async () => {
	renderWithProviders(
		<SiblingNav
			to="/name/$id"
			prev={{ id: "nm_0001", label: "Ahven" }}
			next={{ id: "nm_0003", label: "Hauki" }}
			itemLabel="name"
		/>,
	);

	const prev = await screen.findByRole("link", {
		name: "Previous name: Ahven",
	});
	const next = screen.getByRole("link", { name: "Next name: Hauki" });
	expect(prev.getAttribute("href")).toContain("nm_0001");
	expect(next.getAttribute("href")).toContain("nm_0003");
});

test("renders nothing when there are no siblings", () => {
	const { container } = renderWithProviders(
		<SiblingNav
			to="/species/$id"
			prev={null}
			next={null}
			itemLabel="species"
		/>,
	);

	expect(container.querySelector("nav")).toBeNull();
});
