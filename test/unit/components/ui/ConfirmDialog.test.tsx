/**
 * ConfirmDialog component tests with accessibility validation
 */
import { checkA11y, render } from "@test/core/helpers/renderUtils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

describe("ConfirmDialog", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("rendering", () => {
		it("should render title", () => {
			const { container } = render(
				<ConfirmDialog
					open={true}
					onConfirm={() => {}}
					onCancel={() => {}}
					title="Delete Item"
					message="Are you sure?"
				/>
			);
			const title = container.querySelector("h2");

			expect(title?.textContent).toBe("Delete Item");
		});

		it("should render message", () => {
			const { container } = render(
				<ConfirmDialog
					open={true}
					onConfirm={() => {}}
					onCancel={() => {}}
					title="Confirm"
					message="This action cannot be undone."
				/>
			);
			const message = container.querySelector('[data-testid="confirm-dialog-message"]');

			expect(message?.textContent).toBe("This action cannot be undone.");
		});

		it("should render confirm button with default text", () => {
			const { container } = render(
				<ConfirmDialog
					open={true}
					onConfirm={() => {}}
					onCancel={() => {}}
					title="Confirm"
					message="Continue?"
				/>
			);
			const confirmButton = container.querySelector('[data-testid="confirm-dialog-confirm"]');

			expect(confirmButton?.textContent).toBe("Confirm");
		});

		it("should render cancel button with default text", () => {
			const { container } = render(
				<ConfirmDialog
					open={true}
					onConfirm={() => {}}
					onCancel={() => {}}
					title="Confirm"
					message="Continue?"
				/>
			);
			const cancelButton = container.querySelector('[data-testid="confirm-dialog-cancel"]');

			expect(cancelButton?.textContent).toBe("Cancel");
		});

		it("should render with custom confirmText", () => {
			const { container } = render(
				<ConfirmDialog
					open={true}
					onConfirm={() => {}}
					onCancel={() => {}}
					title="Delete"
					message="Delete this item?"
					confirmText="Yes, Delete"
				/>
			);
			const confirmButton = container.querySelector('[data-testid="confirm-dialog-confirm"]');

			expect(confirmButton?.textContent).toBe("Yes, Delete");
		});

		it("should render with custom cancelText", () => {
			const { container } = render(
				<ConfirmDialog
					open={true}
					onConfirm={() => {}}
					onCancel={() => {}}
					title="Confirm"
					message="Continue?"
					cancelText="No, Go Back"
				/>
			);
			const cancelButton = container.querySelector('[data-testid="confirm-dialog-cancel"]');

			expect(cancelButton?.textContent).toBe("No, Go Back");
		});

		it("should not render when open={false}", () => {
			const { container } = render(
				<ConfirmDialog
					open={false}
					onConfirm={() => {}}
					onCancel={() => {}}
					title="Hidden"
					message="Hidden message"
				/>
			);
			const dialog = container.querySelector('[role="dialog"]');

			expect(dialog).toBeNull();
		});

		it("should render with data-testid", () => {
			const { container } = render(
				<ConfirmDialog
					open={true}
					onConfirm={() => {}}
					onCancel={() => {}}
					title="Confirm"
					message="Continue?"
					data-testid="my-confirm-dialog"
				/>
			);
			const backdrop = container.querySelector('[data-testid="my-confirm-dialog"]');

			expect(backdrop).not.toBeNull();
		});
	});

	describe("variants", () => {
		it("should render default variant (secondary confirm button)", () => {
			const { container } = render(
				<ConfirmDialog
					open={true}
					onConfirm={() => {}}
					onCancel={() => {}}
					title="Confirm"
					message="Continue?"
					variant="default"
				/>
			);
			const confirmButton = container.querySelector('[data-testid="confirm-dialog-confirm"]');

			// Secondary variant has specific classes
			expect(confirmButton?.classList.contains("bg-secondary")).toBe(true);
		});

		it("should render danger variant (destructive confirm button)", () => {
			const { container } = render(
				<ConfirmDialog
					open={true}
					onConfirm={() => {}}
					onCancel={() => {}}
					title="Delete"
					message="Delete this item?"
					variant="danger"
				/>
			);
			const confirmButton = container.querySelector('[data-testid="confirm-dialog-confirm"]');

			// Destructive variant has specific classes
			expect(confirmButton?.classList.contains("bg-destructive")).toBe(true);
		});

		it("should use default variant when not specified", () => {
			const { container } = render(
				<ConfirmDialog
					open={true}
					onConfirm={() => {}}
					onCancel={() => {}}
					title="Confirm"
					message="Continue?"
				/>
			);
			const confirmButton = container.querySelector('[data-testid="confirm-dialog-confirm"]');

			expect(confirmButton?.classList.contains("bg-secondary")).toBe(true);
		});
	});

	describe("interactions", () => {
		it("should call onConfirm when confirm button clicked", () => {
			const handleConfirm = vi.fn();
			const { container } = render(
				<ConfirmDialog
					open={true}
					onConfirm={handleConfirm}
					onCancel={() => {}}
					title="Confirm"
					message="Continue?"
				/>
			);
			const confirmButton = container.querySelector(
				'[data-testid="confirm-dialog-confirm"]'
			) as HTMLElement;

			confirmButton.click();

			expect(handleConfirm).toHaveBeenCalledTimes(1);
		});

		it("should call onCancel when cancel button clicked", () => {
			const handleCancel = vi.fn();
			const { container } = render(
				<ConfirmDialog
					open={true}
					onConfirm={() => {}}
					onCancel={handleCancel}
					title="Confirm"
					message="Continue?"
				/>
			);
			const cancelButton = container.querySelector(
				'[data-testid="confirm-dialog-cancel"]'
			) as HTMLElement;

			cancelButton.click();

			expect(handleCancel).toHaveBeenCalledTimes(1);
		});

		it("should call onCancel when Escape pressed (inherits from Modal)", () => {
			const handleCancel = vi.fn();
			render(
				<ConfirmDialog
					open={true}
					onConfirm={() => {}}
					onCancel={handleCancel}
					title="Confirm"
					message="Continue?"
				/>
			);

			const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true });
			document.dispatchEvent(event);

			expect(handleCancel).toHaveBeenCalledTimes(1);
		});

		it("should call onCancel when backdrop clicked", () => {
			const handleCancel = vi.fn();
			const { container } = render(
				<ConfirmDialog
					open={true}
					onConfirm={() => {}}
					onCancel={handleCancel}
					title="Confirm"
					message="Continue?"
					data-testid="test-dialog"
				/>
			);
			const backdrop = container.querySelector('[data-testid="test-dialog"]') as HTMLElement;

			backdrop.click();

			expect(handleCancel).toHaveBeenCalledTimes(1);
		});

		it("should call onCancel when close button clicked (inherits from Modal)", () => {
			const handleCancel = vi.fn();
			const { container } = render(
				<ConfirmDialog
					open={true}
					onConfirm={() => {}}
					onCancel={handleCancel}
					title="Confirm"
					message="Continue?"
				/>
			);
			const closeButton = container.querySelector(
				'[data-testid="modal-close-button"]'
			) as HTMLElement;

			closeButton.click();

			expect(handleCancel).toHaveBeenCalledTimes(1);
		});
	});

	describe("accessibility", () => {
		it("should have no accessibility violations with default variant", async () => {
			const { container } = render(
				<ConfirmDialog
					open={true}
					onConfirm={() => {}}
					onCancel={() => {}}
					title="Confirm Action"
					message="Are you sure you want to continue with this action?"
				/>
			);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations with danger variant", async () => {
			const { container } = render(
				<ConfirmDialog
					open={true}
					onConfirm={() => {}}
					onCancel={() => {}}
					title="Delete Item"
					message="This action cannot be undone. Are you sure?"
					variant="danger"
					confirmText="Delete"
				/>
			);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});

		it("should have proper focus on open (inherits from Modal)", async () => {
			const { container } = render(
				<ConfirmDialog
					open={true}
					onConfirm={() => {}}
					onCancel={() => {}}
					title="Confirm"
					message="Continue?"
				/>
			);

			await new Promise((resolve) => requestAnimationFrame(resolve));

			// First focusable element is the close button
			const closeButton = container.querySelector('[data-testid="modal-close-button"]');
			expect(document.activeElement).toBe(closeButton);
		});

		it("should have role=dialog (inherits from Modal)", () => {
			const { container } = render(
				<ConfirmDialog
					open={true}
					onConfirm={() => {}}
					onCancel={() => {}}
					title="Confirm"
					message="Continue?"
				/>
			);
			const dialog = container.querySelector('[role="dialog"]');

			expect(dialog).not.toBeNull();
		});

		it("should have aria-modal=true (inherits from Modal)", () => {
			const { container } = render(
				<ConfirmDialog
					open={true}
					onConfirm={() => {}}
					onCancel={() => {}}
					title="Confirm"
					message="Continue?"
				/>
			);
			const dialog = container.querySelector('[role="dialog"]');

			expect(dialog?.getAttribute("aria-modal")).toBe("true");
		});
	});
});
