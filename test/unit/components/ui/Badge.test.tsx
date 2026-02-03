/**
 * Badge component tests with accessibility validation
 */
import { checkA11y, render } from "@test/core/helpers/renderUtils";
import { describe, expect, it } from "vitest";

import { Badge } from "@/components/ui/Badge";

describe("Badge", () => {
	describe("rendering", () => {
		it("should render with default props", () => {
			const { container } = render(<Badge>New</Badge>);
			const badge = container.firstElementChild;

			expect(badge).not.toBeNull();
			expect(badge?.textContent).toBe("New");
		});

		it("should apply custom class", () => {
			const { container } = render(<Badge class="custom-badge">Badge</Badge>);
			const badge = container.firstElementChild;

			expect(badge?.classList.contains("custom-badge")).toBe(true);
		});

		it("should pass through HTML attributes", () => {
			const { container } = render(
				<Badge role="status" aria-label="3 new notifications">
					3
				</Badge>
			);
			const badge = container.firstElementChild;

			expect(badge?.getAttribute("role")).toBe("status");
			expect(badge?.getAttribute("aria-label")).toBe("3 new notifications");
		});
	});

	describe("variants", () => {
		const variants = ["default", "secondary", "outline", "destructive", "success"] as const;

		for (const variant of variants) {
			it(`should render ${variant} variant`, () => {
				const { container } = render(<Badge variant={variant}>Badge</Badge>);
				const badge = container.firstElementChild;

				expect(badge).not.toBeNull();
			});
		}
	});

	describe("accessibility", () => {
		it("should have no accessibility violations with default props", async () => {
			const { container } = render(<Badge>Status</Badge>);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations with role status", async () => {
			const { container } = render(<Badge role="status">Active</Badge>);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});

		for (const variant of ["default", "destructive", "secondary", "success"] as const) {
			it(`should have no accessibility violations with ${variant} variant`, async () => {
				const { container } = render(<Badge variant={variant}>Badge</Badge>);
				const results = await checkA11y(container);

				expect(results).toHaveNoViolations();
			});
		}
	});
});
