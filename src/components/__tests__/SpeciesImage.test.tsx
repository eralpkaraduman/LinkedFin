// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { SpeciesImage } from "../SpeciesImage";

test("renders fallback emoji when no imageUrl", () => {
	render(<SpeciesImage imageUrl={null} alt="Salmon" />);
	expect(screen.getByText(/🐟/)).toBeInTheDocument();
});

test("renders fallback when imageUrl is undefined", () => {
	render(<SpeciesImage imageUrl={undefined} alt="Salmon" />);
	expect(screen.getByText(/🐟/)).toBeInTheDocument();
});

test("renders small image with width=80 when imageUrl provided", () => {
	render(<SpeciesImage imageUrl="https://example.com/fish.jpg" alt="Salmon" />);
	const small = screen.getByAltText("Salmon");
	expect(small.getAttribute("src")).toContain("width=80");
});

test("renders large image with width=600 when large=true", () => {
	const { container } = render(
		<SpeciesImage imageUrl="https://example.com/fish.jpg" alt="Salmon" large />,
	);
	const imgs = container.querySelectorAll("img");
	const large = Array.from(imgs).find((img) =>
		img.getAttribute("src")?.includes("width=600"),
	);
	expect(large).toBeDefined();
});

test("preserves existing query params and adds width", () => {
	const { container } = render(
		<SpeciesImage
			imageUrl="https://example.com/fish.jpg?cache=abc"
			alt="Salmon"
		/>,
	);
	const img = container.querySelector("img");
	const src = img?.getAttribute("src") ?? "";
	expect(src).toContain("cache=abc");
	expect(src).toContain("width=80");
});

test("falls back to manual query string for malformed URLs", () => {
	const { container } = render(
		<SpeciesImage imageUrl="not-a-url" alt="Salmon" />,
	);
	const src = container.querySelector("img")?.getAttribute("src") ?? "";
	expect(src).toContain("?width=80");
});

test("falls back with & separator when URL already has query", () => {
	const { container } = render(
		<SpeciesImage imageUrl="not-a-url?x=1" alt="Salmon" />,
	);
	const src = container.querySelector("img")?.getAttribute("src") ?? "";
	expect(src).toContain("&width=80");
});

test("hides image until loaded then fades in via opacity", () => {
	const { container } = render(
		<SpeciesImage imageUrl="https://example.com/fish.jpg" alt="Salmon" />,
	);
	const small = screen.getByAltText("Salmon") as HTMLImageElement;
	expect(small.className).toContain("opacity-0");

	fireEvent.load(container.querySelectorAll("img")[0]);

	expect(small.className).toContain("opacity-100");
});

test("large image triggers its own onLoad", () => {
	const { container } = render(
		<SpeciesImage imageUrl="https://example.com/fish.jpg" alt="Salmon" large />,
	);
	const imgs = container.querySelectorAll("img");
	const largeImg = imgs[2];
	expect(largeImg.className).toContain("opacity-0");
	fireEvent.load(largeImg);
	expect(largeImg.className).toContain("opacity-100");
});
