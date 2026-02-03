/**
 * Button component tests with accessibility validation
 */
import { checkA11y, render } from "@test/core/helpers/renderUtils";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/ui/Button";

describe("Button", () => {
	describe("rendering", () => {
		it("should render with default props", () => {
			const { container } = render(<Button>Click me</Button>);
			const button = container.querySelector("button");

			expect(button).not.toBeNull();
			expect(button?.textContent).toBe("Click me");
		});

		it("should render with custom class", () => {
			const { container } = render(<Button class="custom-class">Click</Button>);
			const button = container.querySelector("button");

			expect(button?.classList.contains("custom-class")).toBe(true);
		});

		it("should pass through HTML attributes", () => {
			const { container } = render(
				<Button type="submit" disabled aria-label="Submit form">
					Submit
				</Button>
			);
			const button = container.querySelector("button");

			expect(button?.type).toBe("submit");
			expect(button?.disabled).toBe(true);
			expect(button?.getAttribute("aria-label")).toBe("Submit form");
		});
	});

	describe("variants", () => {
		const variants = [
			"default",
			"secondary",
			"destructive",
			"outline",
			"ghost",
			"ghost-destructive",
			"link",
		] as const;

		for (const variant of variants) {
			it(`should render ${variant} variant`, () => {
				const { container } = render(<Button variant={variant}>Button</Button>);
				const button = container.querySelector("button");

				expect(button).not.toBeNull();
			});
		}
	});

	describe("sizes", () => {
		const sizes = ["xs", "sm", "md", "lg", "icon", "icon-sm"] as const;

		for (const size of sizes) {
			it(`should render ${size} size`, () => {
				const { container } = render(<Button size={size}>Button</Button>);
				const button = container.querySelector("button");

				expect(button).not.toBeNull();
			});
		}
	});

	describe("accessibility", () => {
		it("should have no accessibility violations with default props", async () => {
			const { container } = render(<Button>Accessible Button</Button>);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations when disabled", async () => {
			const { container } = render(<Button disabled>Disabled Button</Button>);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations with icon button and aria-label", async () => {
			const { container } = render(
				<Button size="icon" aria-label="Add item">
					+
				</Button>
			);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});

		for (const variant of ["default", "destructive", "secondary", "outline"] as const) {
			it(`should have no accessibility violations with ${variant} variant`, async () => {
				const { container } = render(<Button variant={variant}>Button</Button>);
				const results = await checkA11y(container);

				expect(results).toHaveNoViolations();
			});
		}
	});
});
