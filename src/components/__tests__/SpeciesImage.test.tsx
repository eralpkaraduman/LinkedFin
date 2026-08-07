// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { SpeciesImage } from "../SpeciesImage";

const gallery = {
	sizes: "(min-width: 736px) 672px, calc(100vw - 4rem)",
	widths: [250, 500, 960, 1280],
	width: 600,
	height: 400,
};

const thumb = { sizes: "40px", widths: [40, 60, 120], width: 40, height: 40 };

test("renders fallback emoji when no file", () => {
	render(<SpeciesImage file={null} alt="Salmon" {...thumb} />);
	expect(screen.getByText(/🐟/)).toBeInTheDocument();
});

test("renders fallback when file is undefined", () => {
	render(<SpeciesImage file={undefined} alt="Salmon" {...thumb} />);
	expect(screen.getByText(/🐟/)).toBeInTheDocument();
});

test("every src points straight at upload.wikimedia.org", () => {
	// Special:FilePath cost two redirects per image; nothing should reach for it.
	const { container } = render(
		<SpeciesImage file="Carp bream.jpg" alt="Bream" {...gallery} />,
	);
	const imgs = Array.from(container.querySelectorAll("img"));
	expect(imgs.length).toBeGreaterThan(0);
	for (const img of imgs) {
		expect(img.getAttribute("src")).toMatch(
			/^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/thumb\//,
		);
	}
});

test("blur and placeholder layers share one small file", () => {
	const { container } = render(
		<SpeciesImage file="Carp bream.jpg" alt="Bream" {...gallery} />,
	);
	const imgs = container.querySelectorAll("img");
	expect(imgs[0].getAttribute("src")).toBe(imgs[1].getAttribute("src"));
	expect(imgs[0].getAttribute("src")).toContain("/120px-Carp_bream.jpg");
});

test("sharp layer offers every candidate bucket via srcset + sizes", () => {
	const { container } = render(
		<SpeciesImage file="Carp bream.jpg" alt="Bream" {...gallery} />,
	);
	const sharp = container.querySelectorAll("img")[2];
	const srcset = sharp.getAttribute("srcset") ?? "";
	for (const w of gallery.widths) {
		expect(srcset).toContain(`/${w}px-Carp_bream.jpg ${w}w`);
	}
	expect(sharp.getAttribute("sizes")).toBe(gallery.sizes);
});

test("a slot no larger than the blur file gets no third request", () => {
	// A 40px card thumb is already covered by the 120px file at 3x DPR.
	const { container } = render(
		<SpeciesImage file="Carp bream.jpg" alt="Bream" {...thumb} />,
	);
	expect(container.querySelectorAll("img")).toHaveLength(2);
	expect(container.querySelector("img")?.getAttribute("src")).toContain(
		"/120px-Carp_bream.jpg",
	);
});

test("lazy-loads by default", () => {
	const { container } = render(
		<SpeciesImage file="Carp bream.jpg" alt="Bream" {...gallery} />,
	);
	for (const img of container.querySelectorAll("img")) {
		expect(img.getAttribute("loading")).toBe("lazy");
		expect(img.getAttribute("fetchpriority")).toBeNull();
	}
});

test("eager images are not lazy-loaded and are prioritised", () => {
	// Lazy-loading an LCP candidate makes LCP worse, which is the opposite of
	// the point of this change.
	const { container } = render(
		<SpeciesImage file="Carp bream.jpg" alt="Bream" eager {...gallery} />,
	);
	const imgs = container.querySelectorAll("img");
	for (const img of imgs) expect(img.getAttribute("loading")).toBe("eager");
	expect(imgs[2].getAttribute("fetchpriority")).toBe("high");
});

test("carries intrinsic width/height so the box is reserved", () => {
	const { container } = render(
		<SpeciesImage file="Carp bream.jpg" alt="Bream" {...gallery} />,
	);
	for (const img of container.querySelectorAll("img")) {
		expect(img.getAttribute("width")).toBe("600");
		expect(img.getAttribute("height")).toBe("400");
	}
});

test("hides image until loaded then fades in via opacity", () => {
	const { container } = render(
		<SpeciesImage file="Carp bream.jpg" alt="Salmon" {...gallery} />,
	);
	const small = screen.getAllByAltText("Salmon")[0];
	expect(small.className).toContain("opacity-0");

	fireEvent.load(container.querySelectorAll("img")[0]);

	expect(small.className).toContain("opacity-100");
});

test("sharp layer triggers its own onLoad", () => {
	const { container } = render(
		<SpeciesImage file="Carp bream.jpg" alt="Salmon" {...gallery} />,
	);
	const sharp = container.querySelectorAll("img")[2];
	expect(sharp.className).toContain("opacity-0");
	fireEvent.load(sharp);
	expect(sharp.className).toContain("opacity-100");
});

test("resets the fade state when the file changes", () => {
	const { container, rerender } = render(
		<SpeciesImage file="Carp bream.jpg" alt="Salmon" {...gallery} />,
	);
	fireEvent.load(container.querySelectorAll("img")[0]);
	expect(container.querySelectorAll("img")[0].className).toContain(
		"opacity-100",
	);

	rerender(<SpeciesImage file="Hecht.jpg" alt="Pike" {...gallery} />);

	expect(container.querySelectorAll("img")[0].className).toContain("opacity-0");
	expect(container.querySelectorAll("img")[0].getAttribute("src")).toContain(
		"Hecht.jpg",
	);
});
