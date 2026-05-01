// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { Input } from "../input";

test("renders an input element with merged className", () => {
	render(<Input placeholder="search" className="custom" />);
	const input = screen.getByPlaceholderText("search");
	expect(input.className).toContain("custom");
});

test("forwards arbitrary props", () => {
	render(<Input placeholder="x" type="email" autoComplete="off" />);
	const input = screen.getByPlaceholderText("x");
	expect(input.getAttribute("type")).toBe("email");
	expect(input.getAttribute("autocomplete")).toBe("off");
});

test("renders with no className or type prop", () => {
	render(<Input placeholder="x" />);
	expect(screen.getByPlaceholderText("x")).toBeInTheDocument();
});

test("explicit undefined className/type", () => {
	render(<Input placeholder="x" className={undefined} type={undefined} />);
	expect(screen.getByPlaceholderText("x")).toBeInTheDocument();
});
