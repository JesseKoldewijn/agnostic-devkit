import type { Component, JSX } from "solid-js";
import { ErrorBoundary, createMemo } from "solid-js";

import { cn } from "./cn";

/**
 * Props for the error fallback component
 */
interface ErrorFallbackProps {
	error: Error;
	reset: () => void;
}

/**
 * Default error fallback component
 * Displays a user-friendly error message with a retry option
 */
const DefaultErrorFallback: Component<ErrorFallbackProps> = (props) => {
	return (
		<div
			class={cn(
				"flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center"
			)}
		>
			<div class="text-sm font-medium text-destructive">Something went wrong</div>
			<div class="max-w-xs text-xs text-destructive/70">{props.error.message}</div>
			<button
				type="button"
				onClick={props.reset}
				class={cn(
					"rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground",
					"hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-destructive/50"
				)}
			>
				Try Again
			</button>
		</div>
	);
};

/**
 * Options for the connect HOC
 */
export interface ConnectOptions<TLogic> {
	/**
	 * Custom error fallback component
	 * If not provided, uses DefaultErrorFallback
	 */
	errorFallback?: Component<ErrorFallbackProps>;

	/**
	 * Called when an error is caught by the ErrorBoundary
	 * Useful for logging or error reporting
	 */
	onError?: (error: Error, logic: TLogic) => void;

	/**
	 * Display name for debugging purposes
	 * Defaults to "Connected(ComponentName)"
	 */
	displayName?: string;
}

/**
 * Creates an error handler function for the ErrorBoundary
 * Extracted to avoid code duplication between connect variants
 */
function createErrorHandler<TLogic>(
	ErrorFallback: Component<ErrorFallbackProps>,
	onError: ((error: Error, logic: TLogic) => void) | undefined,
	getLogic: () => TLogic
): (error: Error, reset: () => void) => JSX.Element {
	return (error: Error, reset: () => void): JSX.Element => {
		if (onError) {
			try {
				onError(error, getLogic());
			} catch {
				// Prevent errors in error handler from causing issues
				console.error("Error in onError handler:", error);
			}
		}

		return <ErrorFallback error={error} reset={reset} />;
	};
}

/**
 * Sets the display name on a component for debugging purposes
 */
function setComponentDisplayName<TProps extends object>(
	component: Component<TProps>,
	displayName: string | undefined,
	uiComponentName: string | undefined
): void {
	const name = displayName ?? (uiComponentName ? `Connected(${uiComponentName})` : undefined);
	if (name) {
		Object.defineProperty(component, "name", { value: name });
	}
}

/**
 * Type for the logic factory function
 * Returns the logic object that will be passed as props to the UI component
 */
type LogicFactory<TLogic extends object> = () => TLogic;

/**
 * Connect HOC - Bridges logic and UI components
 *
 * This implements the Enhanced Component pattern, separating concerns:
 * - logic.ts: Pure TypeScript logic (no SolidJS primitives)
 * - ui.tsx: Presentational component (receives props, renders JSX)
 * - index.ts: Uses connect() to wire them together
 *
 * Features:
 * - Type-safe prop injection from logic to UI
 * - Built-in ErrorBoundary for graceful error handling
 * - Memoized logic creation to prevent unnecessary re-initialization
 *
 * @example
 * ```typescript
 * // logic.ts
 * export interface MyComponentLogic {
 *   items: Item[];
 *   onAdd: (item: Item) => void;
 * }
 *
 * export function createMyComponentLogic(): MyComponentLogic {
 *   return {
 *     items: [],
 *     onAdd: (item) => { ... }
 *   };
 * }
 *
 * // ui.tsx
 * export const MyComponentUI: Component<MyComponentLogic> = (props) => {
 *   return <div>...</div>;
 * };
 *
 * // index.ts
 * export const MyComponent = connect(MyComponentUI, createMyComponentLogic);
 * ```
 */
export function connect<TLogic extends object>(
	UIComponent: Component<TLogic>,
	createLogic: LogicFactory<TLogic>,
	options: ConnectOptions<TLogic> = {}
): Component {
	const { errorFallback: ErrorFallback = DefaultErrorFallback, onError, displayName } = options;

	const ConnectedComponent: Component = () => {
		// Memoize logic creation to ensure it's only created once per component instance
		const logic = createMemo(() => createLogic());
		const handleError = createErrorHandler(ErrorFallback, onError, logic);

		return (
			<ErrorBoundary fallback={handleError}>
				<UIComponent {...logic()} />
			</ErrorBoundary>
		);
	};

	setComponentDisplayName(ConnectedComponent, displayName, UIComponent.name);

	return ConnectedComponent;
}

/**
 * Connect with props - Variant that allows passing additional props to the connected component
 *
 * Use this when the connected component needs to receive props from its parent
 * in addition to the logic-provided props.
 *
 * @example
 * ```typescript
 * interface ExternalProps {
 *   initialValue: string;
 * }
 *
 * export const MyComponent = connectWithProps<MyLogic, ExternalProps>(
 *   MyComponentUI,
 *   (props) => createMyLogic(props.initialValue)
 * );
 *
 * // Usage: <MyComponent initialValue="hello" />
 * ```
 */
export function connectWithProps<
	TLogic extends object,
	TExternalProps extends object,
>(
	UIComponent: Component<TLogic>,
	createLogic: (props: TExternalProps) => TLogic,
	options: ConnectOptions<TLogic> = {}
): Component<TExternalProps> {
	const { errorFallback: ErrorFallback = DefaultErrorFallback, onError, displayName } = options;

	const ConnectedComponent: Component<TExternalProps> = (externalProps) => {
		// Create logic with access to external props
		// This is re-evaluated when external props change due to SolidJS reactivity
		const logic = createMemo(() => createLogic(externalProps));
		const handleError = createErrorHandler(ErrorFallback, onError, logic);

		return (
			<ErrorBoundary fallback={handleError}>
				<UIComponent {...logic()} />
			</ErrorBoundary>
		);
	};

	setComponentDisplayName(ConnectedComponent, displayName, UIComponent.name);

	return ConnectedComponent;
}

export type { ErrorFallbackProps };
