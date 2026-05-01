// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { useDebouncedCallback } from "../useDebouncedCallback";

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

test("delays the callback by the given duration", () => {
	const callback = vi.fn();
	const { result } = renderHook(() => useDebouncedCallback(callback, 200));

	result.current("a");
	expect(callback).not.toHaveBeenCalled();

	vi.advanceTimersByTime(199);
	expect(callback).not.toHaveBeenCalled();

	vi.advanceTimersByTime(1);
	expect(callback).toHaveBeenCalledWith("a");
});

test("cancels pending invocations when called again", () => {
	const callback = vi.fn();
	const { result } = renderHook(() => useDebouncedCallback(callback, 100));

	result.current("first");
	vi.advanceTimersByTime(50);
	result.current("second");
	vi.advanceTimersByTime(100);

	expect(callback).toHaveBeenCalledTimes(1);
	expect(callback).toHaveBeenCalledWith("second");
});

test("forwards multiple arguments to the wrapped callback", () => {
	const callback = vi.fn<(a: string, b: number, c: { k: string }) => void>();
	const { result } = renderHook(() => useDebouncedCallback(callback, 50));

	result.current("x", 42, { k: "v" });
	vi.advanceTimersByTime(50);

	expect(callback).toHaveBeenCalledWith("x", 42, { k: "v" });
});
