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
// These empty interfaces are required to extend Vitest's types with axe matchers
declare module "vitest" {
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars
	interface Assertion<T = any> extends AxeMatchers {}
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	interface AsymmetricMatchersContaining extends AxeMatchers {}
}
