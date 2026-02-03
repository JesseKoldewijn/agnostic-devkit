/**
 * Label component tests with accessibility validation
 */
import { checkA11y, render } from "@test/core/helpers/renderUtils";
import { describe, expect, it } from "vitest";

import { Label } from "@/components/ui/Label";

describe("Label", () => {
	describe("rendering", () => {
		it("should render with default props", () => {
			const { container } = render(<Label>Username</Label>);
			const label = container.querySelector("label");

			expect(label).not.toBeNull();
			expect(label?.textContent).toBe("Username");
		});

		it("should render with required indicator", () => {
			const { container } = render(<Label required>Email</Label>);
			const label = container.querySelector("label");

			expect(label?.textContent).toContain("Email");
			expect(label?.textContent).toContain("*");
		});

		it("should apply custom class", () => {
			const { container } = render(<Label class="custom-label">Field</Label>);
			const label = container.querySelector("label");

			expect(label?.classList.contains("custom-label")).toBe(true);
		});

		it("should pass through HTML attributes", () => {
			const { container } = render(<Label for="username-input">Username</Label>);
			const label = container.querySelector("label");

			expect(label?.getAttribute("for")).toBe("username-input");
		});
	});

	describe("required indicator", () => {
		it("should show asterisk when required is true", () => {
			const { container } = render(<Label required>Required Field</Label>);
			const asterisk = container.querySelector("span");

			expect(asterisk).not.toBeNull();
			expect(asterisk?.textContent).toBe("*");
		});

		it("should not show asterisk when required is false", () => {
			const { container } = render(<Label required={false}>Optional Field</Label>);
			const asterisk = container.querySelector("span");

			expect(asterisk).toBeNull();
		});

		it("should not show asterisk when required is not provided", () => {
			const { container } = render(<Label>Optional Field</Label>);
			const asterisk = container.querySelector("span");

			expect(asterisk).toBeNull();
		});
	});

	describe("accessibility", () => {
		it("should have no accessibility violations with default props", async () => {
			const { container } = render(<Label>Field Label</Label>);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations with for attribute", async () => {
			const { container } = render(
				<div>
					<Label for="test-input">Test Field</Label>
					<input id="test-input" type="text" />
				</div>
			);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations with required indicator", async () => {
			const { container } = render(
				<div>
					<Label for="required-input" required>
						Required Field
					</Label>
					<input id="required-input" type="text" required />
				</div>
			);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});
	});
});
