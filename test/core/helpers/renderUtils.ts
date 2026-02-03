/**
 * Component rendering utilities for SolidJS testing
 * Provides helpers for rendering components and checking accessibility
 */
import type { Component, JSX } from "solid-js";

import { render as solidRender } from "@solidjs/testing-library";
import type { AxeResults } from "axe-core";
import { axe } from "vitest-axe";

/**
 * Result type from render operations
 */
export interface RenderResult {
	container: HTMLElement;
	unmount: () => void;
}

/**
 * Render a SolidJS component for testing
 *
 * @param ui - The JSX element or component to render
 * @returns RenderResult with container and unmount function
 *
 * @example
 * ```ts
 * const { container, unmount } = render(<Button>Click me</Button>);
 * expect(container.querySelector('button')).toBeInTheDocument();
 * unmount();
 * ```
 */
export function render(ui: JSX.Element): RenderResult {
	const result = solidRender(() => ui);
	return {
		container: result.container,
		unmount: result.unmount,
	};
}

/**
 * Render a component with props for testing
 *
 * @param Component - The component constructor
 * @param props - Props to pass to the component
 * @returns RenderResult with container and unmount function
 *
 * @example
 * ```ts
 * const { container } = renderComponent(Button, { children: "Click", variant: "primary" });
 * ```
 */
export function renderComponent<TProps extends object>(
	Component: Component<TProps>,
	props: TProps
): RenderResult {
	const result = solidRender(() => {
		const element = Component(props);
		return element;
	});
	return {
		container: result.container,
		unmount: result.unmount,
	};
}

/**
 * Check accessibility violations using axe-core
 *
 * @param container - The DOM element to check
 * @param options - Optional axe-core run options
 * @returns Promise resolving to axe results
 *
 * @example
 * ```ts
 * const { container } = render(<Button>Click me</Button>);
 * const results = await checkA11y(container);
 * expect(results).toHaveNoViolations();
 * ```
 */
export async function checkA11y(
	container: Element,
	options?: Parameters<typeof axe>[1]
): Promise<AxeResults> {
	return axe(container, options);
}

/**
 * Render a component and immediately check for accessibility violations
 * Combines render + checkA11y in one call for convenience
 *
 * @param ui - The JSX element to render
 * @param axeOptions - Optional axe-core run options
 * @returns Promise resolving to render result and axe results
 *
 * @example
 * ```ts
 * const { container, a11yResults } = await renderWithA11y(<Button>Click me</Button>);
 * expect(a11yResults).toHaveNoViolations();
 * ```
 */
export async function renderWithA11y(
	ui: JSX.Element,
	axeOptions?: Parameters<typeof axe>[1]
): Promise<RenderResult & { a11yResults: AxeResults }> {
	const renderResult = render(ui);
	const a11yResults = await checkA11y(renderResult.container, axeOptions);
	return {
		...renderResult,
		a11yResults,
	};
}

/**
 * Render a component with props and check accessibility
 *
 * @param Component - The component constructor
 * @param props - Props to pass to the component
 * @param axeOptions - Optional axe-core run options
 * @returns Promise resolving to render result and axe results
 */
export async function renderComponentWithA11y<TProps extends object>(
	Component: Component<TProps>,
	props: TProps,
	axeOptions?: Parameters<typeof axe>[1]
): Promise<RenderResult & { a11yResults: AxeResults }> {
	const renderResult = renderComponent(Component, props);
	const a11yResults = await checkA11y(renderResult.container, axeOptions);
	return {
		...renderResult,
		a11yResults,
	};
}
