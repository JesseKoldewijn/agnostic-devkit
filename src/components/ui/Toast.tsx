import type { Component, JSX } from "solid-js";
import { Show, createEffect, createSignal, onCleanup, splitProps } from "solid-js";

import { cn } from "@/utils/cn";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastProps {
	/**
	 * Whether the toast is visible
	 */
	visible: boolean;
	/**
	 * The message to display
	 */
	message: string;
	/**
	 * The type of toast which determines styling and icon
	 * @default "info"
	 */
	type?: ToastType;
	/**
	 * Auto-dismiss duration in milliseconds. Set to 0 to disable auto-dismiss.
	 * @default 3000
	 */
	duration?: number;
	/**
	 * Callback fired when the toast should be dismissed
	 */
	onDismiss?: () => void;
	/**
	 * Whether to show a dismiss button
	 * @default false
	 */
	dismissible?: boolean;
	/**
	 * Additional class for styling
	 */
	class?: string;
	/**
	 * Test ID for the toast
	 */
	"data-testid"?: string;
}

const typeStyles: Record<ToastType, string> = {
	success: "bg-green-600 text-white",
	error: "bg-destructive text-destructive-foreground",
	warning: "bg-yellow-500 text-black",
	info: "bg-foreground text-background",
};

const icons: Record<ToastType, JSX.Element> = {
	success: (
		<svg
			class={cn("size-4")}
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
			aria-hidden="true"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
		</svg>
	),
	error: (
		<svg
			class={cn("size-4")}
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
			aria-hidden="true"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M6 18L18 6M6 6l12 12"
			/>
		</svg>
	),
	warning: (
		<svg
			class={cn("size-4")}
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
			aria-hidden="true"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
			/>
		</svg>
	),
	info: (
		<svg
			class={cn("size-4")}
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
			aria-hidden="true"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
	),
};

/**
 * A toast notification component for displaying temporary messages.
 *
 * Features:
 * - Auto-dismiss after configurable duration
 * - Multiple types with appropriate styling and icons
 * - Optional dismiss button
 * - Accessible with proper ARIA roles
 * - Respects prefers-reduced-motion (no animation class when reduced motion preferred)
 */
export const Toast: Component<ToastProps> = (props) => {
	const [local] = splitProps(props, [
		"visible",
		"message",
		"type",
		"duration",
		"onDismiss",
		"dismissible",
		"class",
		"data-testid",
	]);

	const [isHovered, setIsHovered] = createSignal(false);

	// Auto-dismiss timer
	createEffect(() => {
		if (!local.visible) return;

		const duration = local.duration ?? 3000;
		if (duration === 0) return;

		// Don't auto-dismiss while hovered
		if (isHovered()) return;

		const timer = setTimeout(() => {
			local.onDismiss?.();
		}, duration);

		onCleanup(() => clearTimeout(timer));
	});

	const toastType = local.type ?? "info";
	// Use role="alert" for errors/warnings, role="status" for info/success
	const role = toastType === "error" || toastType === "warning" ? "alert" : "status";

	// Check for reduced motion preference
	const prefersReducedMotion =
		typeof window !== "undefined" &&
		window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

	return (
		<Show when={local.visible}>
			<output
				role={role}
				aria-live={role === "alert" ? "assertive" : "polite"}
				data-testid={local["data-testid"]}
				class={cn(
					"fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 shadow-2xl",
					!prefersReducedMotion && "fade-in slide-in-from-bottom-4 animate-in duration-300",
					typeStyles[toastType],
					local.class
				)}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				{icons[toastType]}
				<span class={cn("text-[11px] font-black tracking-widest uppercase")}>{local.message}</span>
				<Show when={local.dismissible}>
					<button
						type="button"
						onClick={local.onDismiss}
						class={cn("ml-1 rounded-full p-1 transition-colors hover:bg-white/20")}
						aria-label="Dismiss notification"
						data-testid="toast-dismiss-button"
					>
						<svg
							class={cn("size-3")}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</Show>
			</output>
		</Show>
	);
};
