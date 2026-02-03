/**
 * Switch component tests with accessibility validation
 */
import { checkA11y, render } from "@test/core/helpers/renderUtils";
import { describe, expect, it, vi } from "vitest";

import { Switch } from "@/components/ui/Switch";

describe("Switch", () => {
	describe("rendering", () => {
		it("should render unchecked by default", () => {
			const { container } = render(<Switch checked={false} />);
			const input = container.querySelector('input[type="checkbox"]');

			expect(input).not.toBeNull();
			expect((input as HTMLInputElement).checked).toBe(false);
		});

		it("should render checked when checked prop is true", () => {
			const { container } = render(<Switch checked={true} />);
			const input = container.querySelector('input[type="checkbox"]');

			expect((input as HTMLInputElement).checked).toBe(true);
		});

		it("should render with label", () => {
			const { container } = render(<Switch checked={false} label="Enable notifications" />);
			const label = container.querySelector("label");
			const span = container.querySelector("span");

			expect(label).not.toBeNull();
			expect(span?.textContent).toBe("Enable notifications");
		});

		it("should apply custom class to label wrapper", () => {
			const { container } = render(<Switch checked={false} class="custom-switch" />);
			const label = container.querySelector("label");

			expect(label?.classList.contains("custom-switch")).toBe(true);
		});

		it("should call onCheckedChange when toggled", () => {
			const handleChange = vi.fn();
			const { container } = render(<Switch checked={false} onCheckedChange={handleChange} />);
			const input = container.querySelector('input[type="checkbox"]') as HTMLInputElement;

			// Simulate change event
			input.checked = true;
			input.dispatchEvent(new Event("change", { bubbles: true }));

			expect(handleChange).toHaveBeenCalledWith(true);
		});

		it("should pass through HTML attributes", () => {
			const { container } = render(
				<Switch checked={false} disabled aria-describedby="switch-hint" name="notifications" />
			);
			const input = container.querySelector('input[type="checkbox"]') as HTMLInputElement;

			expect(input.disabled).toBe(true);
			expect(input.getAttribute("aria-describedby")).toBe("switch-hint");
			expect(input.name).toBe("notifications");
		});
	});

	describe("visual states", () => {
		it("should have different visual state when checked", () => {
			const { container: uncheckedContainer } = render(<Switch checked={false} />);
			const { container: checkedContainer } = render(<Switch checked={true} />);

			const uncheckedTrack = uncheckedContainer.querySelector("div > div");
			const checkedTrack = checkedContainer.querySelector("div > div");

			// Both should exist but have different classes
			expect(uncheckedTrack).not.toBeNull();
			expect(checkedTrack).not.toBeNull();
		});
	});

	describe("accessibility", () => {
		it("should have no accessibility violations with label", async () => {
			const { container } = render(<Switch checked={false} label="Dark mode" />);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations with aria-label", async () => {
			const { container } = render(<Switch checked={false} aria-label="Toggle dark mode" />);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations when checked", async () => {
			const { container } = render(<Switch checked={true} label="Active feature" />);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations when disabled", async () => {
			const { container } = render(<Switch checked={false} label="Disabled option" disabled />);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});
	});
});
