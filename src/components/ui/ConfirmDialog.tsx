import type { Component } from "solid-js";
import { splitProps } from "solid-js";

import { cn } from "@/utils/cn";

import { Button } from "./Button";
import { Modal } from "./Modal";

export interface ConfirmDialogProps {
	/**
	 * Whether the dialog is open
	 */
	open: boolean;
	/**
	 * Callback fired when the user confirms
	 */
	onConfirm: () => void;
	/**
	 * Callback fired when the user cancels
	 */
	onCancel: () => void;
	/**
	 * Dialog title
	 */
	title: string;
	/**
	 * Confirmation message to display
	 */
	message: string;
	/**
	 * Text for the confirm button
	 * @default "Confirm"
	 */
	confirmText?: string;
	/**
	 * Text for the cancel button
	 * @default "Cancel"
	 */
	cancelText?: string;
	/**
	 * Visual variant that determines the confirm button style
	 * @default "default"
	 */
	variant?: "default" | "danger";
	/**
	 * Test ID for the dialog
	 */
	"data-testid"?: string;
}

/**
 * A confirmation dialog component for destructive or important actions.
 *
 * Built on top of Modal, inherits focus trap and accessibility features.
 *
 * Variants:
 * - "default": Normal confirm button
 * - "danger": Destructive (red) confirm button for delete operations
 */
export const ConfirmDialog: Component<ConfirmDialogProps> = (props) => {
	const [local] = splitProps(props, [
		"open",
		"onConfirm",
		"onCancel",
		"title",
		"message",
		"confirmText",
		"cancelText",
		"variant",
		"data-testid",
	]);

	const confirmText = () => local.confirmText ?? "Confirm";
	const cancelText = () => local.cancelText ?? "Cancel";
	const variant = () => local.variant ?? "default";

	return (
		<Modal
			open={local.open}
			onClose={local.onCancel}
			title={local.title}
			description={local.message}
			size="sm"
			data-testid={local["data-testid"]}
		>
			<div class={cn("space-y-4")}>
				{/* Message */}
				<p
					class={cn("text-foreground/80 text-sm leading-relaxed")}
					data-testid="confirm-dialog-message"
				>
					{local.message}
				</p>

				{/* Actions */}
				<div class={cn("flex justify-end gap-3 pt-2")}>
					<Button
						variant="ghost"
						size="sm"
						onClick={local.onCancel}
						data-testid="confirm-dialog-cancel"
					>
						{cancelText()}
					</Button>
					<Button
						variant={variant() === "danger" ? "destructive" : "secondary"}
						size="sm"
						onClick={local.onConfirm}
						data-testid="confirm-dialog-confirm"
					>
						{confirmText()}
					</Button>
				</div>
			</div>
		</Modal>
	);
};
