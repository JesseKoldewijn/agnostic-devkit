import type { Component, JSX } from "solid-js";
import { Show, createEffect, createSignal, onCleanup, onMount, splitProps } from "solid-js";

import { cn } from "@/utils/cn";

import { Button } from "./Button";
import { Card } from "./Card";

export interface ModalProps {
	/**
	 * Whether the modal is open
	 */
	open: boolean;
	/**
	 * Callback fired when the modal should close
	 */
	onClose: () => void;
	/**
	 * Modal title displayed in the header
	 */
	title: string;
	/**
	 * Modal content
	 */
	children: JSX.Element;
	/**
	 * Optional description for accessibility (aria-describedby)
	 */
	description?: string;
	/**
	 * Modal size
	 * @default "md"
	 */
	size?: "sm" | "md" | "lg";
	/**
	 * Additional class for the modal content card
	 */
	class?: string;
	/**
	 * Test ID for the modal
	 */
	"data-testid"?: string;
	/**
	 * Whether clicking the backdrop closes the modal
	 * @default true
	 */
	closeOnBackdropClick?: boolean;
}

const sizeClasses = {
	sm: "max-w-sm",
	md: "max-w-md",
	lg: "max-w-lg",
};

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
	const focusableSelectors = [
		'a[href]:not([disabled]):not([tabindex="-1"])',
		'button:not([disabled]):not([tabindex="-1"])',
		'input:not([disabled]):not([tabindex="-1"])',
		'select:not([disabled]):not([tabindex="-1"])',
		'textarea:not([disabled]):not([tabindex="-1"])',
		'[tabindex]:not([tabindex="-1"]):not([disabled])',
	].join(", ");

	return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));
}

/**
 * A reusable modal dialog component with focus trap and accessibility features.
 *
 * Features:
 * - Focus trap: Tab cycles through modal elements only
 * - Escape key to close
 * - Click outside to close (optional)
 * - Returns focus to trigger element on close
 * - Proper ARIA attributes
 */
export const Modal: Component<ModalProps> = (props) => {
	const [local] = splitProps(props, [
		"open",
		"onClose",
		"title",
		"children",
		"description",
		"size",
		"class",
		"data-testid",
		"closeOnBackdropClick",
	]);

	// Store the element that was focused before opening the modal
	const [previouslyFocused, setPreviouslyFocused] = createSignal<HTMLElement | null>(null);
	let modalRef: HTMLDivElement | undefined;
	let contentRef: HTMLDivElement | undefined;

	// Generate unique IDs for accessibility
	const titleId = `modal-title-${Math.random().toString(36).slice(2, 9)}`;
	const descriptionId = local.description
		? `modal-desc-${Math.random().toString(36).slice(2, 9)}`
		: undefined;

	// Handle escape key
	const handleKeyDown = (e: KeyboardEvent) => {
		if (!local.open) return;

		if (e.key === "Escape") {
			e.preventDefault();
			local.onClose();
			return;
		}

		// Focus trap
		if (e.key === "Tab" && contentRef) {
			const focusableElements = getFocusableElements(contentRef);
			if (focusableElements.length === 0) return;

			const firstElement = focusableElements[0];
			const lastElement = focusableElements[focusableElements.length - 1];

			if (e.shiftKey) {
				// Shift + Tab: going backwards
				if (document.activeElement === firstElement) {
					e.preventDefault();
					lastElement.focus();
				}
			} else {
				// Tab: going forwards
				if (document.activeElement === lastElement) {
					e.preventDefault();
					firstElement.focus();
				}
			}
		}
	};

	// Handle backdrop click
	const handleBackdropClick = (e: MouseEvent) => {
		if (local.closeOnBackdropClick !== false && e.target === modalRef) {
			local.onClose();
		}
	};

	// Focus management
	createEffect(() => {
		if (local.open) {
			// Store currently focused element
			setPreviouslyFocused(document.activeElement as HTMLElement);

			// Focus first focusable element after a brief delay
			// to allow the modal to render
			requestAnimationFrame(() => {
				if (contentRef) {
					const focusableElements = getFocusableElements(contentRef);
					if (focusableElements.length > 0) {
						focusableElements[0].focus();
					} else {
						// If no focusable elements, focus the content div itself
						contentRef.focus();
					}
				}
			});
		} else {
			// Return focus to previously focused element
			const prev = previouslyFocused();
			if (prev && typeof prev.focus === "function") {
				prev.focus();
			}
		}
	});

	// Add keyboard listener
	onMount(() => {
		document.addEventListener("keydown", handleKeyDown);
	});

	onCleanup(() => {
		document.removeEventListener("keydown", handleKeyDown);
	});

	return (
		<Show when={local.open}>
			<div
				ref={modalRef}
				class={cn(
					"bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
				)}
				onClick={handleBackdropClick}
				data-testid={local["data-testid"]}
				role="presentation"
			>
				<Card
					ref={contentRef}
					class={cn("m-4 w-full", sizeClasses[local.size || "md"], local.class)}
					role="dialog"
					aria-modal="true"
					aria-labelledby={titleId}
					aria-describedby={descriptionId}
					tabIndex={-1}
				>
					<div class={cn("flex flex-col gap-4 p-6")}>
						{/* Header */}
						<div class={cn("flex items-center justify-between")}>
							<h2
								id={titleId}
								class={cn("text-foreground text-[13px] font-black tracking-[0.15em] uppercase")}
							>
								{local.title}
							</h2>
							<Button
								variant="ghost"
								size="xs"
								onClick={local.onClose}
								aria-label="Close modal"
								data-testid="modal-close-button"
							>
								<svg
									class={cn("size-3.5")}
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
							</Button>
						</div>

						{/* Description (hidden, for screen readers) */}
						<Show when={local.description}>
							<p id={descriptionId} class="sr-only">
								{local.description}
							</p>
						</Show>

						{/* Content */}
						{local.children}
					</div>
				</Card>
			</div>
		</Show>
	);
};
