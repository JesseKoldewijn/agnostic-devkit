/**
 * Common test utility functions
 */
import { expect } from "vitest";

/**
 * Wait for a condition to be true (useful for async operations)
 */
export async function waitFor(
	condition: () => boolean | Promise<boolean>,
	options: { timeout?: number; interval?: number } = {}
): Promise<void> {
	const { timeout = 5000, interval = 50 } = options;
	const startTime = Date.now();

	while (Date.now() - startTime < timeout) {
		if (await condition()) {
			return;
		}
		await new Promise((resolve) => setTimeout(resolve, interval));
	}

	throw new Error(`waitFor timed out after ${timeout}ms`);
}

/**
 * Create a deferred promise for testing async flows
 */
export function createDeferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;

	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});

	return { promise, resolve, reject };
}

/**
 * Assert that an async function throws with a specific message
 */
export async function expectAsyncError(
	fn: () => Promise<unknown>,
	expectedMessage?: string | RegExp
): Promise<void> {
	let error: Error | undefined;

	try {
		await fn();
	} catch (e) {
		error = e as Error;
	}

	expect(error).toBeDefined();

	if (expectedMessage) {
		if (typeof expectedMessage === "string") {
			expect(error?.message).toContain(expectedMessage);
		} else {
			expect(error?.message).toMatch(expectedMessage);
		}
	}
}

/**
 * Generate a unique ID for test isolation
 */
export function uniqueId(prefix = "test"): string {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Sleep for a specified duration (use sparingly in tests)
 */
export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a mock URL for testing
 */
export function createTestUrl(path = "/test", params: Record<string, string> = {}): string {
	const url = new URL(`https://example.com${path}`);
	for (const [key, value] of Object.entries(params)) {
		url.searchParams.set(key, value);
	}
	return url.toString();
}

/**
 * Deep clone an object (useful for isolating test data)
 */
export function deepClone<T>(obj: T): T {
	return JSON.parse(JSON.stringify(obj));
}
