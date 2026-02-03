/**
 * Checkbox component tests with accessibility validation
 */
import { checkA11y, render } from "@test/core/helpers/renderUtils";
import { describe, expect, it, vi } from "vitest";

import { Checkbox } from "@/components/ui/Checkbox";

describe("Checkbox", () => {
	describe("rendering", () => {
		it("should render with default props", () => {
			const { container } = render(<Checkbox checked={false} aria-label="Test checkbox" />);
			const checkbox = container.querySelector('[role="checkbox"]');

			expect(checkbox).not.toBeNull();
		});

		it("should render checkmark icon when checked", () => {
			const { container } = render(<Checkbox checked={true} aria-label="Checked checkbox" />);
			const svg = container.querySelector("svg");

			expect(svg).not.toBeNull();
		});

		it("should not render checkmark when unchecked", () => {
			const { container } = render(<Checkbox checked={false} aria-label="Unchecked checkbox" />);
			const svg = container.querySelector("svg");

			expect(svg).toBeNull();
		});

		it("should apply custom class", () => {
			const { container } = render(
				<Checkbox checked={false} class="custom-class" aria-label="Custom checkbox" />
			);
			const checkbox = container.querySelector('[role="checkbox"]');

			expect(checkbox?.classList.contains("custom-class")).toBe(true);
		});

		it("should pass through HTML attributes", () => {
			const { container } = render(
				<Checkbox checked={false} data-testid="my-checkbox" aria-label="Test checkbox" />
			);
			const checkbox = container.querySelector('[role="checkbox"]');

			expect(checkbox?.getAttribute("data-testid")).toBe("my-checkbox");
		});
	});

	describe("states", () => {
		it("should render unchecked state with border only", () => {
			const { container } = render(<Checkbox checked={false} aria-label="Unchecked" />);
			const checkbox = container.querySelector('[role="checkbox"]');

			expect(checkbox?.classList.contains("border-border")).toBe(true);
			expect(checkbox?.classList.contains("bg-background")).toBe(true);
		});

		it("should render checked state with primary background", () => {
			const { container } = render(<Checkbox checked={true} aria-label="Checked" />);
			const checkbox = container.querySelector('[role="checkbox"]');

			expect(checkbox?.classList.contains("border-primary")).toBe(true);
			expect(checkbox?.classList.contains("bg-primary")).toBe(true);
		});

		it("should render disabled state with reduced opacity", () => {
			const { container } = render(<Checkbox checked={false} disabled aria-label="Disabled" />);
			const checkbox = container.querySelector('[role="checkbox"]');

			expect(checkbox?.classList.contains("opacity-50")).toBe(true);
			expect(checkbox?.classList.contains("cursor-not-allowed")).toBe(true);
		});

		it("should render disabled + checked state", () => {
			const { container } = render(
				<Checkbox checked={true} disabled aria-label="Disabled checked" />
			);
			const checkbox = container.querySelector('[role="checkbox"]');

			expect(checkbox?.classList.contains("opacity-50")).toBe(true);
			expect(checkbox?.classList.contains("bg-primary")).toBe(true);
			expect(container.querySelector("svg")).not.toBeNull();
		});
	});

	describe("interactions", () => {
		it("should call onChange with true when unchecked checkbox clicked", () => {
			const handleChange = vi.fn();
			const { container } = render(
				<Checkbox checked={false} onChange={handleChange} aria-label="Click me" />
			);
			const checkbox = container.querySelector('[role="checkbox"]') as HTMLElement;

			checkbox.click();

			expect(handleChange).toHaveBeenCalledWith(true);
		});

		it("should call onChange with false when checked checkbox clicked", () => {
			const handleChange = vi.fn();
			const { container } = render(
				<Checkbox checked={true} onChange={handleChange} aria-label="Click me" />
			);
			const checkbox = container.querySelector('[role="checkbox"]') as HTMLElement;

			checkbox.click();

			expect(handleChange).toHaveBeenCalledWith(false);
		});

		it("should NOT call onChange when disabled", () => {
			const handleChange = vi.fn();
			const { container } = render(
				<Checkbox checked={false} onChange={handleChange} disabled aria-label="Disabled" />
			);
			const checkbox = container.querySelector('[role="checkbox"]') as HTMLElement;

			checkbox.click();

			expect(handleChange).not.toHaveBeenCalled();
		});

		it("should respond to Space key press", () => {
			const handleChange = vi.fn();
			const { container } = render(
				<Checkbox checked={false} onChange={handleChange} aria-label="Keyboard test" />
			);
			const checkbox = container.querySelector('[role="checkbox"]') as HTMLElement;

			const event = new KeyboardEvent("keydown", { key: " ", bubbles: true });
			checkbox.dispatchEvent(event);

			expect(handleChange).toHaveBeenCalledWith(true);
		});

		it("should respond to Enter key press", () => {
			const handleChange = vi.fn();
			const { container } = render(
				<Checkbox checked={false} onChange={handleChange} aria-label="Keyboard test" />
			);
			const checkbox = container.querySelector('[role="checkbox"]') as HTMLElement;

			const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true });
			checkbox.dispatchEvent(event);

			expect(handleChange).toHaveBeenCalledWith(true);
		});

		it("should NOT respond to keyboard when disabled", () => {
			const handleChange = vi.fn();
			const { container } = render(
				<Checkbox checked={false} onChange={handleChange} disabled aria-label="Disabled" />
			);
			const checkbox = container.querySelector('[role="checkbox"]') as HTMLElement;

			const event = new KeyboardEvent("keydown", { key: " ", bubbles: true });
			checkbox.dispatchEvent(event);

			expect(handleChange).not.toHaveBeenCalled();
		});

		it("should not respond to other keys", () => {
			const handleChange = vi.fn();
			const { container } = render(
				<Checkbox checked={false} onChange={handleChange} aria-label="Keyboard test" />
			);
			const checkbox = container.querySelector('[role="checkbox"]') as HTMLElement;

			const event = new KeyboardEvent("keydown", { key: "a", bubbles: true });
			checkbox.dispatchEvent(event);

			expect(handleChange).not.toHaveBeenCalled();
		});
	});

	describe("accessibility", () => {
		it("should have no accessibility violations with default props", async () => {
			const { container } = render(<Checkbox checked={false} aria-label="Accept terms" />);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations when checked", async () => {
			const { container } = render(<Checkbox checked={true} aria-label="Accept terms" />);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations when disabled", async () => {
			const { container } = render(
				<Checkbox checked={false} disabled aria-label="Disabled option" />
			);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});

		it("should have role=checkbox", () => {
			const { container } = render(<Checkbox checked={false} aria-label="Test" />);
			const checkbox = container.querySelector('[role="checkbox"]');

			expect(checkbox).not.toBeNull();
		});

		it("should have aria-checked=false when unchecked", () => {
			const { container } = render(<Checkbox checked={false} aria-label="Test" />);
			const checkbox = container.querySelector('[role="checkbox"]');

			expect(checkbox?.getAttribute("aria-checked")).toBe("false");
		});

		it("should have aria-checked=true when checked", () => {
			const { container } = render(<Checkbox checked={true} aria-label="Test" />);
			const checkbox = container.querySelector('[role="checkbox"]');

			expect(checkbox?.getAttribute("aria-checked")).toBe("true");
		});

		it("should have aria-disabled when disabled", () => {
			const { container } = render(<Checkbox checked={false} disabled aria-label="Disabled" />);
			const checkbox = container.querySelector('[role="checkbox"]');

			expect(checkbox?.getAttribute("aria-disabled")).toBe("true");
		});

		it("should be focusable with tabindex=0", () => {
			const { container } = render(<Checkbox checked={false} aria-label="Focusable" />);
			const checkbox = container.querySelector('[role="checkbox"]');

			expect(checkbox?.getAttribute("tabindex")).toBe("0");
		});

		it("should not be focusable when disabled (tabindex=-1)", () => {
			const { container } = render(
				<Checkbox checked={false} disabled aria-label="Not focusable" />
			);
			const checkbox = container.querySelector('[role="checkbox"]');

			expect(checkbox?.getAttribute("tabindex")).toBe("-1");
		});

		it("should have aria-label attribute", () => {
			const { container } = render(<Checkbox checked={false} aria-label="My checkbox label" />);
			const checkbox = container.querySelector('[role="checkbox"]');

			expect(checkbox?.getAttribute("aria-label")).toBe("My checkbox label");
		});
	});
});
