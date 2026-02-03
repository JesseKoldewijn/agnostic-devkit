/**
 * Toast component tests with accessibility validation
 */
import { checkA11y, render } from "@test/core/helpers/renderUtils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Toast } from "@/components/ui/Toast";

describe("Toast", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	describe("rendering", () => {
		it("should render message", () => {
			const { container } = render(<Toast visible={true} message="Test message" />);
			const toast = container.querySelector('[role="status"]');

			expect(toast?.textContent).toContain("Test message");
		});

		it("should render with icon", () => {
			const { container } = render(<Toast visible={true} message="Test" />);
			const icon = container.querySelector("svg");

			expect(icon).not.toBeNull();
		});

		it("should not render when not visible", () => {
			const { container } = render(<Toast visible={false} message="Hidden message" />);
			const toast = container.querySelector('[role="status"]');

			expect(toast).toBeNull();
		});

		it("should apply custom class", () => {
			const { container } = render(
				<Toast visible={true} message="Test" class="custom-toast-class" />
			);
			const toast = container.querySelector('[role="status"]');

			expect(toast?.classList.contains("custom-toast-class")).toBe(true);
		});

		it("should render dismiss button when dismissible", () => {
			const { container } = render(<Toast visible={true} message="Test" dismissible />);
			const dismissButton = container.querySelector('[data-testid="toast-dismiss-button"]');

			expect(dismissButton).not.toBeNull();
		});

		it("should NOT render dismiss button by default", () => {
			const { container } = render(<Toast visible={true} message="Test" />);
			const dismissButton = container.querySelector('[data-testid="toast-dismiss-button"]');

			expect(dismissButton).toBeNull();
		});

		it("should render with data-testid", () => {
			const { container } = render(<Toast visible={true} message="Test" data-testid="my-toast" />);
			const toast = container.querySelector('[data-testid="my-toast"]');

			expect(toast).not.toBeNull();
		});
	});

	describe("types", () => {
		it("should render success type with green styling", () => {
			const { container } = render(<Toast visible={true} message="Success!" type="success" />);
			const toast = container.querySelector('[role="status"]');

			expect(toast?.classList.contains("bg-green-600")).toBe(true);
		});

		it("should render error type with red styling", () => {
			const { container } = render(<Toast visible={true} message="Error!" type="error" />);
			const toast = container.querySelector('[role="alert"]');

			expect(toast?.classList.contains("bg-destructive")).toBe(true);
		});

		it("should render warning type with yellow styling", () => {
			const { container } = render(<Toast visible={true} message="Warning!" type="warning" />);
			const toast = container.querySelector('[role="alert"]');

			expect(toast?.classList.contains("bg-yellow-500")).toBe(true);
		});

		it("should render info type with foreground styling", () => {
			const { container } = render(<Toast visible={true} message="Info" type="info" />);
			const toast = container.querySelector('[role="status"]');

			expect(toast?.classList.contains("bg-foreground")).toBe(true);
		});

		it("should render default type (info) when no type provided", () => {
			const { container } = render(<Toast visible={true} message="Default" />);
			const toast = container.querySelector('[role="status"]');

			expect(toast?.classList.contains("bg-foreground")).toBe(true);
		});

		it("should render different icons for each type", () => {
			const { container: successContainer } = render(
				<Toast visible={true} message="Success" type="success" />
			);
			const { container: errorContainer } = render(
				<Toast visible={true} message="Error" type="error" />
			);

			const successIcon = successContainer.querySelector("svg path");
			const errorIcon = errorContainer.querySelector("svg path");

			// Check that they have different paths
			expect(successIcon?.getAttribute("d")).not.toBe(errorIcon?.getAttribute("d"));
		});
	});

	describe("auto-dismiss", () => {
		it("should auto-dismiss after default timeout (3000ms)", () => {
			const handleDismiss = vi.fn();
			render(<Toast visible={true} message="Test" onDismiss={handleDismiss} />);

			expect(handleDismiss).not.toHaveBeenCalled();

			vi.advanceTimersByTime(3000);

			expect(handleDismiss).toHaveBeenCalledTimes(1);
		});

		it("should auto-dismiss after custom timeout", () => {
			const handleDismiss = vi.fn();
			render(<Toast visible={true} message="Test" duration={5000} onDismiss={handleDismiss} />);

			vi.advanceTimersByTime(3000);
			expect(handleDismiss).not.toHaveBeenCalled();

			vi.advanceTimersByTime(2000);
			expect(handleDismiss).toHaveBeenCalledTimes(1);
		});

		it("should NOT auto-dismiss when duration={0}", () => {
			const handleDismiss = vi.fn();
			render(<Toast visible={true} message="Test" duration={0} onDismiss={handleDismiss} />);

			vi.advanceTimersByTime(10000);

			expect(handleDismiss).not.toHaveBeenCalled();
		});

		it("should call onDismiss callback when dismissed", () => {
			const handleDismiss = vi.fn();
			render(<Toast visible={true} message="Test" onDismiss={handleDismiss} />);

			vi.advanceTimersByTime(3000);

			expect(handleDismiss).toHaveBeenCalledTimes(1);
		});

		it("should NOT auto-dismiss when not visible", () => {
			const handleDismiss = vi.fn();
			render(<Toast visible={false} message="Test" onDismiss={handleDismiss} />);

			vi.advanceTimersByTime(5000);

			expect(handleDismiss).not.toHaveBeenCalled();
		});
	});

	describe("interactions", () => {
		it("should dismiss when dismiss button clicked", () => {
			vi.useRealTimers(); // Use real timers for click test
			const handleDismiss = vi.fn();
			const { container } = render(
				<Toast visible={true} message="Test" dismissible onDismiss={handleDismiss} />
			);
			const dismissButton = container.querySelector(
				'[data-testid="toast-dismiss-button"]'
			) as HTMLElement;

			dismissButton.click();

			expect(handleDismiss).toHaveBeenCalledTimes(1);
		});

		it("should pause auto-dismiss on hover", () => {
			const handleDismiss = vi.fn();
			const { container } = render(
				<Toast visible={true} message="Test" duration={3000} onDismiss={handleDismiss} />
			);
			const toast = container.querySelector('[role="status"]') as HTMLElement;

			// Start hovering before timer fires
			vi.advanceTimersByTime(1000);
			toast.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));

			// Continue past the original timeout
			vi.advanceTimersByTime(5000);

			// Should NOT have been called because we're hovering
			expect(handleDismiss).not.toHaveBeenCalled();
		});

		it("should resume auto-dismiss after hover ends", () => {
			const handleDismiss = vi.fn();
			const { container } = render(
				<Toast visible={true} message="Test" duration={3000} onDismiss={handleDismiss} />
			);
			const toast = container.querySelector('[role="status"]') as HTMLElement;

			// Hover
			toast.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
			vi.advanceTimersByTime(5000);

			// Unhover
			toast.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));

			// Should auto-dismiss after duration
			vi.advanceTimersByTime(3000);

			expect(handleDismiss).toHaveBeenCalledTimes(1);
		});
	});

	describe("accessibility", () => {
		it("should have no accessibility violations", async () => {
			vi.useRealTimers(); // a11y checks need real timers
			const { container } = render(<Toast visible={true} message="Accessible toast" />);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});

		it("should have role=status for info/success", () => {
			const { container: infoContainer } = render(
				<Toast visible={true} message="Info" type="info" />
			);
			const { container: successContainer } = render(
				<Toast visible={true} message="Success" type="success" />
			);

			expect(infoContainer.querySelector('[role="status"]')).not.toBeNull();
			expect(successContainer.querySelector('[role="status"]')).not.toBeNull();
		});

		it("should have role=alert for error/warning", () => {
			const { container: errorContainer } = render(
				<Toast visible={true} message="Error" type="error" />
			);
			const { container: warningContainer } = render(
				<Toast visible={true} message="Warning" type="warning" />
			);

			expect(errorContainer.querySelector('[role="alert"]')).not.toBeNull();
			expect(warningContainer.querySelector('[role="alert"]')).not.toBeNull();
		});

		it("should have aria-live=polite for status toasts", () => {
			const { container } = render(<Toast visible={true} message="Info" type="info" />);
			const toast = container.querySelector('[role="status"]');

			expect(toast?.getAttribute("aria-live")).toBe("polite");
		});

		it("should have aria-live=assertive for alert toasts", () => {
			const { container } = render(<Toast visible={true} message="Error" type="error" />);
			const toast = container.querySelector('[role="alert"]');

			expect(toast?.getAttribute("aria-live")).toBe("assertive");
		});

		it("should have accessible dismiss button label", () => {
			vi.useRealTimers();
			const { container } = render(<Toast visible={true} message="Test" dismissible />);
			const dismissButton = container.querySelector('[data-testid="toast-dismiss-button"]');

			expect(dismissButton?.getAttribute("aria-label")).toBe("Dismiss notification");
		});

		it("should have no violations with dismiss button", async () => {
			vi.useRealTimers();
			const { container } = render(
				<Toast visible={true} message="Dismissible toast" dismissible onDismiss={() => {}} />
			);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});

		it("should have no violations for error type", async () => {
			vi.useRealTimers();
			const { container } = render(<Toast visible={true} message="Error occurred" type="error" />);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});

		it("should have no violations for warning type", async () => {
			vi.useRealTimers();
			const { container } = render(<Toast visible={true} message="Warning" type="warning" />);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});

		it("should have no violations for success type", async () => {
			vi.useRealTimers();
			const { container } = render(<Toast visible={true} message="Success" type="success" />);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});
	});
});
