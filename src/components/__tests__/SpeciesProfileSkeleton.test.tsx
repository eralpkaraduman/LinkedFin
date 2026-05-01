// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { SpeciesProfileSkeleton } from "../SpeciesProfileSkeleton";

test("renders skeleton placeholders", () => {
	const { container } = render(<SpeciesProfileSkeleton />);
	const placeholders = container.querySelectorAll(".animate-pulse");
	expect(placeholders.length).toBeGreaterThan(0);
});
