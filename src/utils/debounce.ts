/**
 * Debounce Utilities
 *
 * Provides debouncing helpers for SolidJS reactive patterns.
 */
import type { Accessor } from "solid-js";
import { createSignal, onCleanup } from "solid-js";

/**
 * Creates a debounced signal that delays updates by the specified delay.
 *
 * @param initialValue - The initial value of the signal
 * @param delayMs - Delay in milliseconds before the value updates
 * @returns Tuple of [debouncedValue accessor, setValue setter]
 *
 * @example
 * ```tsx
 * const [debouncedQuery, setQuery] = createDebouncedSignal("", 150);
 *
 * // In JSX:
 * <Input onInput={(e) => setQuery(e.currentTarget.value)} />
 * <For each={filteredItems(debouncedQuery())}>...</For>
 * ```
 */
export function createDebouncedSignal<T>(
	initialValue: T,
	delayMs: number
): [Accessor<T>, (value: T) => void] {
	const [debouncedValue, setDebouncedValue] = createSignal<T>(initialValue);
	let timeoutId: ReturnType<typeof setTimeout> | undefined;

	const setValue = (value: T): void => {
		if (timeoutId !== undefined) {
			clearTimeout(timeoutId);
		}
		timeoutId = setTimeout(() => {
			setDebouncedValue(() => value);
			timeoutId = undefined;
		}, delayMs);
	};

	// Clean up timeout on disposal
	onCleanup(() => {
		if (timeoutId !== undefined) {
			clearTimeout(timeoutId);
		}
	});

	return [debouncedValue, setValue];
}
