// @vitest-environment jsdom
import { render } from "@testing-library/react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../table";

test("renders a complete table with header and body cells", () => {
	const { container, getByText } = render(
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Name</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				<TableRow>
					<TableCell>Salmon</TableCell>
				</TableRow>
			</TableBody>
		</Table>,
	);

	expect(container.querySelector("table")).not.toBeNull();
	expect(container.querySelector("thead")).not.toBeNull();
	expect(container.querySelector("tbody")).not.toBeNull();
	expect(getByText("Salmon")).toBeInTheDocument();
	expect(getByText("Name")).toBeInTheDocument();
});

test("Table merges className with default classes", () => {
	const { container } = render(
		<Table className="custom-class">
			<TableBody>
				<TableRow>
					<TableCell>x</TableCell>
				</TableRow>
			</TableBody>
		</Table>,
	);
	const table = container.querySelector("table");
	expect(table?.className).toContain("custom-class");
	expect(table?.className).toContain("w-full");
});

test("each subcomponent forwards className", () => {
	const { container } = render(
		<Table>
			<TableHeader className="th-class">
				<TableRow className="row-class">
					<TableHead className="head-class">h</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody className="body-class">
				<TableRow className="row-class">
					<TableCell className="cell-class">c</TableCell>
				</TableRow>
			</TableBody>
		</Table>,
	);
	expect(container.querySelector("thead")?.className).toContain("th-class");
	expect(container.querySelector("tbody")?.className).toContain("body-class");
	expect(container.querySelector("th")?.className).toContain("head-class");
	expect(container.querySelector("td")?.className).toContain("cell-class");
	expect(container.querySelectorAll("tr").length).toBe(2);
});
