/**
 * ScrollArea Component
 *
 * A simple scrollable container with proper flex layout integration.
 * Use for content that needs scroll containment but doesn't benefit
 * from virtualization (small lists, mixed content, etc.).
 *
 * Features:
 * - Proper flex layout integration (flex-1 min-h-0)
 * - Configurable scroll direction
 * - Automatic overflow handling
 *
 * @example
 * ```tsx
 * <ScrollArea>
 *   <div>Scrollable content...</div>
 * </ScrollArea>
 * ```
 */
import type { JSX, ParentProps } from "solid-js";

import { cn } from "@/utils/cn";

// ============================================================================
// Types
// ============================================================================

export interface ScrollAreaProps extends ParentProps {
	/** Scroll direction (default: "vertical") */
	readonly direction?: "vertical" | "horizontal" | "both";
	/** Additional class names for the scroll container */
	readonly class?: string;
	/** Test ID for the component */
	readonly "data-testid"?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * ScrollArea component for containing scrollable content.
 *
 * Uses the flex-1 min-h-0 pattern for proper integration with
 * flex column layouts, ensuring content doesn't overflow the parent.
 */
export function ScrollArea(props: Readonly<ScrollAreaProps>): JSX.Element {
	const overflowClass = (): string => {
		switch (props.direction ?? "vertical") {
			case "horizontal":
				return "overflow-x-auto overflow-y-hidden";
			case "both":
				return "overflow-auto";
			default:
				return "overflow-y-auto overflow-x-hidden";
		}
	};

	return (
		<div
			class={cn("min-h-0 flex-1", overflowClass(), props.class)}
			data-testid={props["data-testid"]}
		>
			{props.children}
		</div>
	);
}
