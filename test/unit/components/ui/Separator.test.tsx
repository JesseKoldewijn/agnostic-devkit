/**
 * Separator component tests with accessibility validation
 */
import { checkA11y, render } from "@test/core/helpers/renderUtils";
import { describe, expect, it } from "vitest";

import { Separator } from "@/components/ui/Separator";

describe("Separator", () => {
	describe("rendering", () => {
		it("should render with default horizontal orientation", () => {
			const { container } = render(<Separator />);
			const separator = container.firstElementChild;

			expect(separator).not.toBeNull();
			expect(separator?.classList.contains("w-full")).toBe(true);
		});

		it("should render with vertical orientation", () => {
			const { container } = render(<Separator orientation="vertical" />);
			const separator = container.firstElementChild;

			expect(separator).not.toBeNull();
			expect(separator?.classList.contains("h-full")).toBe(true);
		});

		it("should apply custom class", () => {
			const { container } = render(<Separator class="my-separator" />);
			const separator = container.firstElementChild;

			expect(separator?.classList.contains("my-separator")).toBe(true);
		});

		it("should pass through HTML attributes", () => {
			const { container } = render(<Separator role="separator" aria-orientation="horizontal" />);
			const separator = container.firstElementChild;

			expect(separator?.getAttribute("role")).toBe("separator");
			expect(separator?.getAttribute("aria-orientation")).toBe("horizontal");
		});
	});

	describe("orientations", () => {
		it("should have correct dimensions for horizontal", () => {
			const { container } = render(<Separator orientation="horizontal" />);
			const separator = container.firstElementChild;

			expect(separator?.classList.contains("h-[2px]")).toBe(true);
			expect(separator?.classList.contains("w-full")).toBe(true);
		});

		it("should have correct dimensions for vertical", () => {
			const { container } = render(<Separator orientation="vertical" />);
			const separator = container.firstElementChild;

			expect(separator?.classList.contains("h-full")).toBe(true);
			expect(separator?.classList.contains("w-[2px]")).toBe(true);
		});
	});

	describe("accessibility", () => {
		it("should have no accessibility violations with default props", async () => {
			const { container } = render(<Separator />);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations with role separator", async () => {
			const { container } = render(<Separator role="separator" aria-orientation="horizontal" />);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations with vertical orientation", async () => {
			const { container } = render(
				<Separator orientation="vertical" role="separator" aria-orientation="vertical" />
			);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});
	});
});
