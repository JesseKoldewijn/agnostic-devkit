/**
 * Accessibility testing utilities for Playwright E2E tests
 * Uses @axe-core/playwright for runtime accessibility validation
 */
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import type { AxeResults } from "axe-core";

/**
 * Options for accessibility checks
 */
export interface A11yCheckOptions {
	/**
	 * Specific rules to include in the check
	 * @see https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md
	 */
	includeRules?: string[];

	/**
	 * Specific rules to exclude from the check
	 */
	excludeRules?: string[];

	/**
	 * CSS selector for element to scope the check to
	 */
	include?: string;

	/**
	 * CSS selectors for elements to exclude from the check
	 */
	exclude?: string[];
}

/**
 * Check a Playwright page for accessibility violations
 *
 * @param page - Playwright page object
 * @param options - Optional configuration for the check
 * @returns Promise resolving to axe results
 *
 * @example
 * ```ts
 * test('page should be accessible', async ({ page }) => {
 *   await page.goto('/settings');
 *   const results = await checkPageA11y(page);
 *   expect(results.violations).toEqual([]);
 * });
 * ```
 */
export async function checkPageA11y(
	page: Page,
	options: A11yCheckOptions = {}
): Promise<AxeResults> {
	let builder = new AxeBuilder({ page });

	if (options.includeRules?.length) {
		builder = builder.withRules(options.includeRules);
	}

	if (options.excludeRules?.length) {
		builder = builder.disableRules(options.excludeRules);
	}

	if (options.include) {
		builder = builder.include(options.include);
	}

	if (options.exclude?.length) {
		for (const selector of options.exclude) {
			builder = builder.exclude(selector);
		}
	}

	return builder.analyze();
}

/**
 * Assert that a page has no accessibility violations
 * Throws an error with detailed violation info if any are found
 *
 * @param page - Playwright page object
 * @param options - Optional configuration for the check
 *
 * @example
 * ```ts
 * test('settings page accessibility', async ({ page }) => {
 *   await page.goto('/settings');
 *   await assertPageA11y(page);
 * });
 * ```
 */
export async function assertPageA11y(page: Page, options: A11yCheckOptions = {}): Promise<void> {
	const results = await checkPageA11y(page, options);

	if (results.violations.length > 0) {
		const violationMessages = results.violations.map((violation) => {
			const nodes = violation.nodes.map((node) => `  - ${node.html}`).join("\n");
			return `${violation.id}: ${violation.help}\n${nodes}`;
		});

		throw new Error(`Accessibility violations found:\n\n${violationMessages.join("\n\n")}`);
	}
}

/**
 * Get a summary of accessibility violations for logging/debugging
 *
 * @param results - Axe results from checkPageA11y
 * @returns Human-readable summary string
 */
export function getA11ySummary(results: AxeResults): string {
	if (results.violations.length === 0) {
		return "No accessibility violations found";
	}

	const summary = results.violations.map(
		(v) => `- ${v.id} (${v.impact}): ${v.help} [${v.nodes.length} nodes]`
	);

	return `Found ${results.violations.length} accessibility violations:\n${summary.join("\n")}`;
}
