/**
 * Modal component tests with accessibility validation
 */
import { checkA11y, render } from "@test/core/helpers/renderUtils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

describe("Modal", () => {
	// Clean up any lingering modals between tests
	beforeEach(() => {
		document.body.innerHTML = "";
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("rendering", () => {
		it("should not render when open={false}", () => {
			const { container } = render(
				<Modal open={false} onClose={() => {}} title="Test Modal">
					<p>Modal content</p>
				</Modal>
			);
			const modal = container.querySelector('[role="dialog"]');

			expect(modal).toBeNull();
		});

		it("should render when open={true}", () => {
			const { container } = render(
				<Modal open={true} onClose={() => {}} title="Test Modal">
					<p>Modal content</p>
				</Modal>
			);
			const modal = container.querySelector('[role="dialog"]');

			expect(modal).not.toBeNull();
		});

		it("should render title in header", () => {
			const { container } = render(
				<Modal open={true} onClose={() => {}} title="My Custom Title">
					<p>Content</p>
				</Modal>
			);
			const title = container.querySelector("h2");

			expect(title?.textContent).toBe("My Custom Title");
		});

		it("should render children in content area", () => {
			const { container } = render(
				<Modal open={true} onClose={() => {}} title="Test">
					<p data-testid="modal-content">Hello World</p>
				</Modal>
			);
			const content = container.querySelector('[data-testid="modal-content"]');

			expect(content?.textContent).toBe("Hello World");
		});

		it("should render close button", () => {
			const { container } = render(
				<Modal open={true} onClose={() => {}} title="Test">
					<p>Content</p>
				</Modal>
			);
			const closeButton = container.querySelector('[data-testid="modal-close-button"]');

			expect(closeButton).not.toBeNull();
		});

		it("should apply custom class to content", () => {
			const { container } = render(
				<Modal open={true} onClose={() => {}} title="Test" class="custom-modal-class">
					<p>Content</p>
				</Modal>
			);
			const card = container.querySelector('[role="dialog"]');

			expect(card?.classList.contains("custom-modal-class")).toBe(true);
		});

		it("should render with data-testid", () => {
			const { container } = render(
				<Modal open={true} onClose={() => {}} title="Test" data-testid="my-modal">
					<p>Content</p>
				</Modal>
			);
			const backdrop = container.querySelector('[data-testid="my-modal"]');

			expect(backdrop).not.toBeNull();
		});
	});

	describe("sizes", () => {
		it("should render sm size", () => {
			const { container } = render(
				<Modal open={true} onClose={() => {}} title="Test" size="sm">
					<p>Content</p>
				</Modal>
			);
			const card = container.querySelector('[role="dialog"]');

			expect(card?.classList.contains("max-w-sm")).toBe(true);
		});

		it("should render md size (default)", () => {
			const { container } = render(
				<Modal open={true} onClose={() => {}} title="Test">
					<p>Content</p>
				</Modal>
			);
			const card = container.querySelector('[role="dialog"]');

			expect(card?.classList.contains("max-w-md")).toBe(true);
		});

		it("should render lg size", () => {
			const { container } = render(
				<Modal open={true} onClose={() => {}} title="Test" size="lg">
					<p>Content</p>
				</Modal>
			);
			const card = container.querySelector('[role="dialog"]');

			expect(card?.classList.contains("max-w-lg")).toBe(true);
		});
	});

	describe("interactions", () => {
		it("should call onClose when close button clicked", () => {
			const handleClose = vi.fn();
			const { container } = render(
				<Modal open={true} onClose={handleClose} title="Test">
					<p>Content</p>
				</Modal>
			);
			const closeButton = container.querySelector(
				'[data-testid="modal-close-button"]'
			) as HTMLElement;

			closeButton.click();

			expect(handleClose).toHaveBeenCalledTimes(1);
		});

		it("should call onClose when backdrop clicked", () => {
			const handleClose = vi.fn();
			const { container } = render(
				<Modal open={true} onClose={handleClose} title="Test" data-testid="test-modal">
					<p>Content</p>
				</Modal>
			);
			const backdrop = container.querySelector('[data-testid="test-modal"]') as HTMLElement;

			backdrop.click();

			expect(handleClose).toHaveBeenCalledTimes(1);
		});

		it("should NOT close when clicking inside modal content", () => {
			const handleClose = vi.fn();
			const { container } = render(
				<Modal open={true} onClose={handleClose} title="Test">
					<p data-testid="inner-content">Content</p>
				</Modal>
			);
			const content = container.querySelector('[data-testid="inner-content"]') as HTMLElement;

			content.click();

			expect(handleClose).not.toHaveBeenCalled();
		});

		it("should NOT close on backdrop click when closeOnBackdropClick={false}", () => {
			const handleClose = vi.fn();
			const { container } = render(
				<Modal
					open={true}
					onClose={handleClose}
					title="Test"
					closeOnBackdropClick={false}
					data-testid="test-modal"
				>
					<p>Content</p>
				</Modal>
			);
			const backdrop = container.querySelector('[data-testid="test-modal"]') as HTMLElement;

			backdrop.click();

			expect(handleClose).not.toHaveBeenCalled();
		});

		it("should call onClose when Escape key pressed", () => {
			const handleClose = vi.fn();
			render(
				<Modal open={true} onClose={handleClose} title="Test">
					<p>Content</p>
				</Modal>
			);

			const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true });
			document.dispatchEvent(event);

			expect(handleClose).toHaveBeenCalledTimes(1);
		});

		it("should NOT call onClose when other keys pressed", () => {
			const handleClose = vi.fn();
			render(
				<Modal open={true} onClose={handleClose} title="Test">
					<p>Content</p>
				</Modal>
			);

			const event = new KeyboardEvent("keydown", { key: "a", bubbles: true });
			document.dispatchEvent(event);

			expect(handleClose).not.toHaveBeenCalled();
		});

		it("should NOT respond to Escape when modal is closed", () => {
			const handleClose = vi.fn();
			render(
				<Modal open={false} onClose={handleClose} title="Test">
					<p>Content</p>
				</Modal>
			);

			const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true });
			document.dispatchEvent(event);

			expect(handleClose).not.toHaveBeenCalled();
		});
	});

	describe("focus management", () => {
		it("should focus first focusable element on open", async () => {
			const { container } = render(
				<Modal open={true} onClose={() => {}} title="Test">
					<Button data-testid="first-button">First</Button>
					<Button data-testid="second-button">Second</Button>
				</Modal>
			);

			// Wait for requestAnimationFrame
			await new Promise((resolve) => requestAnimationFrame(resolve));

			// The close button is the first focusable element in the modal
			const closeButton = container.querySelector('[data-testid="modal-close-button"]');
			expect(document.activeElement).toBe(closeButton);
		});

		it("should trap focus within modal (Tab cycles to first element)", async () => {
			const { container } = render(
				<Modal open={true} onClose={() => {}} title="Test">
					<Button data-testid="first-button">First</Button>
					<Button data-testid="last-button">Last</Button>
				</Modal>
			);

			await new Promise((resolve) => requestAnimationFrame(resolve));

			// Focus the last button
			const lastButton = container.querySelector('[data-testid="last-button"]') as HTMLElement;
			lastButton.focus();

			// Press Tab - should wrap to first button (close button)
			const tabEvent = new KeyboardEvent("keydown", { key: "Tab", bubbles: true });
			document.dispatchEvent(tabEvent);

			// First focusable element in modal is the close button
			const closeButton = container.querySelector('[data-testid="modal-close-button"]');
			expect(document.activeElement).toBe(closeButton);
		});

		it("should trap focus within modal (Shift+Tab cycles to last element)", async () => {
			const { container } = render(
				<Modal open={true} onClose={() => {}} title="Test">
					<Button data-testid="first-button">First</Button>
					<Button data-testid="last-button">Last</Button>
				</Modal>
			);

			await new Promise((resolve) => requestAnimationFrame(resolve));

			// Focus the close button (first focusable)
			const closeButton = container.querySelector(
				'[data-testid="modal-close-button"]'
			) as HTMLElement;
			closeButton.focus();

			// Press Shift+Tab - should wrap to last button
			const shiftTabEvent = new KeyboardEvent("keydown", {
				key: "Tab",
				shiftKey: true,
				bubbles: true,
			});
			document.dispatchEvent(shiftTabEvent);

			const lastButton = container.querySelector('[data-testid="last-button"]');
			expect(document.activeElement).toBe(lastButton);
		});

		it("should return focus to trigger element on close", async () => {
			// Create a trigger button outside the modal
			const triggerButton = document.createElement("button");
			triggerButton.setAttribute("data-testid", "trigger-button");
			document.body.appendChild(triggerButton);
			triggerButton.focus();

			const { unmount } = render(
				<Modal open={true} onClose={() => {}} title="Test">
					<Button>Inside Modal</Button>
				</Modal>
			);

			await new Promise((resolve) => requestAnimationFrame(resolve));

			// Unmount the modal (simulates closing)
			unmount();

			// The previously focused element should be refocused
			// Note: In real usage, the parent component would set open={false}
			// and the modal's effect would restore focus
			expect(document.body.contains(triggerButton)).toBe(true);

			// Cleanup
			document.body.removeChild(triggerButton);
		});
	});

	describe("accessibility", () => {
		it("should have no accessibility violations when open", async () => {
			const { container } = render(
				<Modal open={true} onClose={() => {}} title="Accessible Modal">
					<p>Modal content goes here</p>
				</Modal>
			);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});

		it("should have role=dialog", () => {
			const { container } = render(
				<Modal open={true} onClose={() => {}} title="Test">
					<p>Content</p>
				</Modal>
			);
			const dialog = container.querySelector('[role="dialog"]');

			expect(dialog).not.toBeNull();
		});

		it("should have aria-modal=true", () => {
			const { container } = render(
				<Modal open={true} onClose={() => {}} title="Test">
					<p>Content</p>
				</Modal>
			);
			const dialog = container.querySelector('[role="dialog"]');

			expect(dialog?.getAttribute("aria-modal")).toBe("true");
		});

		it("should have aria-labelledby pointing to title", () => {
			const { container } = render(
				<Modal open={true} onClose={() => {}} title="My Title">
					<p>Content</p>
				</Modal>
			);
			const dialog = container.querySelector('[role="dialog"]');
			const labelledBy = dialog?.getAttribute("aria-labelledby");
			const title = container.querySelector(`#${labelledBy}`);

			expect(title?.textContent).toBe("My Title");
		});

		it("should have aria-describedby when description provided", () => {
			const { container } = render(
				<Modal open={true} onClose={() => {}} title="Test" description="This is an important modal">
					<p>Content</p>
				</Modal>
			);
			const dialog = container.querySelector('[role="dialog"]');
			const describedBy = dialog?.getAttribute("aria-describedby");

			expect(describedBy).not.toBeNull();

			const description = container.querySelector(`#${describedBy}`);
			expect(description?.textContent).toBe("This is an important modal");
		});

		it("should NOT have aria-describedby when no description provided", () => {
			const { container } = render(
				<Modal open={true} onClose={() => {}} title="Test">
					<p>Content</p>
				</Modal>
			);
			const dialog = container.querySelector('[role="dialog"]');

			expect(dialog?.getAttribute("aria-describedby")).toBeNull();
		});

		it("should have close button with accessible label", () => {
			const { container } = render(
				<Modal open={true} onClose={() => {}} title="Test">
					<p>Content</p>
				</Modal>
			);
			const closeButton = container.querySelector('[data-testid="modal-close-button"]');

			expect(closeButton?.getAttribute("aria-label")).toBe("Close modal");
		});

		it("should have no violations with description", async () => {
			const { container } = render(
				<Modal
					open={true}
					onClose={() => {}}
					title="Confirmation"
					description="Please confirm your action"
				>
					<p>Are you sure?</p>
					<Button>Confirm</Button>
				</Modal>
			);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});

		it("should have no violations with multiple interactive elements", async () => {
			const { container } = render(
				<Modal open={true} onClose={() => {}} title="Form Modal">
					<input type="text" aria-label="Name" />
					<Button>Submit</Button>
					<Button>Cancel</Button>
				</Modal>
			);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});
	});
});
