/**
 * Global test setup file for Vitest
 * Configures axe-core matchers for accessibility testing
 */
import { expect } from "vitest";
import type { AxeMatchers } from "vitest-axe/matchers";
import * as matchers from "vitest-axe/matchers";

// Extend Vitest's expect with axe-core matchers
expect.extend(matchers);

// Augment Vitest's Assertion interface with axe matchers
declare module "vitest" {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	interface Assertion<T = any> extends AxeMatchers {}
	interface AsymmetricMatchersContaining extends AxeMatchers {}
}
