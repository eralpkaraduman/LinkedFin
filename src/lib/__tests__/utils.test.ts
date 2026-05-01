import { cn } from "../utils";

test("cn merges class strings", () => {
	expect(cn("foo", "bar")).toBe("foo bar");
});

test("cn drops falsy values", () => {
	expect(cn("foo", false, null, undefined, "bar")).toBe("foo bar");
});

test("cn dedupes conflicting tailwind classes (last wins)", () => {
	expect(cn("p-2", "p-4")).toBe("p-4");
});

test("cn supports conditional objects via clsx", () => {
	expect(cn({ active: true, disabled: false }, "base")).toBe("active base");
});
