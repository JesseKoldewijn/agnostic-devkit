/**
 * VirtualList Component
 *
 * A generic virtualized list component using @tanstack/solid-virtual.
 * Renders only visible items for performance with large datasets.
 *
 * Features:
 * - Generic type support for any item type
 * - Configurable item height estimation
 * - Automatic scroll container management or external ref
 * - Proper flex layout integration (flex-1 min-h-0)
 * - Optional threshold-based virtualization fallback
 *
 * @example
 * ```tsx
 * // Self-managed scroll container
 * <VirtualList
 *   items={myItems}
 *   estimateSize={48}
 *   renderItem={(item, index) => <MyItem item={item} />}
 * />
 *
 * // External scroll container
 * let scrollRef: HTMLDivElement;
 * <div ref={scrollRef} class="overflow-y-auto">
 *   <VirtualList
 *     items={myItems}
 *     estimateSize={48}
 *     scrollContainerRef={scrollRef}
 *     renderItem={(item) => <MyItem item={item} />}
 *   />
 * </div>
 * ```
 */
import type { JSX } from "solid-js";
import { For, Show } from "solid-js";

import { createVirtualizer } from "@tanstack/solid-virtual";

import { cn } from "@/utils/cn";

// ============================================================================
// Types
// ============================================================================

export interface VirtualListProps<T> {
	/** Array of items to render */
	readonly items: readonly T[];
	/** Estimated height of each item in pixels */
	readonly estimateSize: number;
	/** Render function for each item */
	readonly renderItem: (item: T, index: number) => JSX.Element;
	/** Number of items to render outside the visible area (default: 5) */
	readonly overscan?: number;
	/** Additional class names for the scroll container (only used when self-managed) */
	readonly class?: string;
	/** Test ID for the component */
	readonly "data-testid"?: string;
	/** Gap between items in pixels (applied via CSS) */
	readonly gap?: number;
	/**
	 * External scroll container reference. When provided, the VirtualList
	 * won't create its own scroll container - useful when embedding in
	 * an existing scrollable area.
	 */
	readonly scrollContainerRef?: HTMLElement;
	/**
	 * Minimum number of items required before virtualization kicks in.
	 * Below this threshold, items are rendered normally without virtualization.
	 * This is useful for better test compatibility and small lists.
	 * Default: 0 (always virtualize)
	 */
	readonly minItemsForVirtualization?: number;
}

// ============================================================================
// Component
// ============================================================================

/**
 * VirtualList component for efficiently rendering large lists.
 *
 * Uses @tanstack/solid-virtual for windowed rendering, only creating
 * DOM nodes for visible items plus a small overscan buffer.
 */
export function VirtualList<T>(props: VirtualListProps<T>): JSX.Element {
	let internalScrollRef: HTMLDivElement | undefined;

	// Check if we should virtualize based on item count threshold
	const shouldVirtualize = (): boolean => {
		const threshold = props.minItemsForVirtualization ?? 0;
		return props.items.length >= threshold;
	};

	const virtualizer = createVirtualizer({
		get count() {
			return props.items.length;
		},
		getScrollElement: () => props.scrollContainerRef ?? internalScrollRef ?? null,
		estimateSize: () => props.estimateSize + (props.gap ?? 0),
		overscan: props.overscan ?? 5,
	});

	// Non-virtualized fallback content
	const fallbackContent = (
		<div class={cn(props.gap ? `space-y-[${props.gap}px]` : "")}>
			<For each={props.items}>{(item, index) => props.renderItem(item, index())}</For>
		</div>
	);

	// Virtualized content
	const virtualContent = (
		<div
			style={{
				height: `${virtualizer.getTotalSize()}px`,
				width: "100%",
				position: "relative",
			}}
		>
			<For each={virtualizer.getVirtualItems()}>
				{(virtualItem) => {
					const item = (): T => props.items[virtualItem.index];
					return (
						<div
							style={{
								position: "absolute",
								top: 0,
								left: 0,
								width: "100%",
								height: `${virtualItem.size}px`,
								transform: `translateY(${virtualItem.start}px)`,
							}}
						>
							{props.renderItem(item(), virtualItem.index)}
						</div>
					);
				}}
			</For>
		</div>
	);

	// When using external scroll container, just return the content
	if (props.scrollContainerRef !== undefined) {
		return (
			<Show when={shouldVirtualize()} fallback={fallbackContent}>
				{virtualContent}
			</Show>
		);
	}

	// Self-managed scroll container
	return (
		<div
			ref={internalScrollRef}
			class={cn("min-h-0 flex-1 overflow-y-auto", props.class)}
			data-testid={props["data-testid"]}
		>
			<Show when={shouldVirtualize()} fallback={fallbackContent}>
				{virtualContent}
			</Show>
		</div>
	);
}
