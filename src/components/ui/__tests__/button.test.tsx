// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { Button } from "../button";

const variants = [
	"default",
	"outline",
	"secondary",
	"ghost",
	"destructive",
	"link",
] as const;

const sizes = [
	"default",
	"xs",
	"sm",
	"lg",
	"icon",
	"icon-xs",
	"icon-sm",
	"icon-lg",
] as const;

test.each(
	variants,
)("%s variant renders and applies a non-empty className", (variant) => {
	render(<Button variant={variant}>x</Button>);
	const btn = screen.getByText("x");
	expect(btn).toBeInTheDocument();
	expect(btn.className.length).toBeGreaterThan(0);
});

test("variants produce distinct classNames", () => {
	const classNames = variants.map((variant) => {
		const { container, unmount } = render(<Button variant={variant}>x</Button>);
		const cls = container.querySelector("[data-slot=button]")?.className ?? "";
		unmount();
		return cls;
	});
	expect(new Set(classNames).size).toBe(variants.length);
});

test.each(
	sizes,
)("%s size renders and applies a non-empty className", (size) => {
	render(<Button size={size}>x</Button>);
	const btn = screen.getByText("x");
	expect(btn).toBeInTheDocument();
	expect(btn.className.length).toBeGreaterThan(0);
});

test("sizes produce distinct classNames", () => {
	const classNames = sizes.map((size) => {
		const { container, unmount } = render(<Button size={size}>x</Button>);
		const cls = container.querySelector("[data-slot=button]")?.className ?? "";
		unmount();
		return cls;
	});
	expect(new Set(classNames).size).toBe(sizes.length);
});

test("merges custom className", () => {
	render(<Button className="custom-x">x</Button>);
	expect(screen.getByText("x").className).toContain("custom-x");
});

test("falls back to default variant/size when props are omitted or undefined", () => {
	const { container: a, unmount } = render(<Button>x</Button>);
	const omitted = a.querySelector("[data-slot=button]")?.className ?? "";
	unmount();

	const { container: b } = render(
		<Button variant={undefined} size={undefined}>
			x
		</Button>,
	);
	const explicit = b.querySelector("[data-slot=button]")?.className ?? "";

	// Both code paths reach the same classNames (default fallback).
	expect(omitted).toBe(explicit);
});
