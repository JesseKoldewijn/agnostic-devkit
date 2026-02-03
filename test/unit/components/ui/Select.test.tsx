/**
 * Select component tests with accessibility validation
 */
import { checkA11y, render } from "@test/core/helpers/renderUtils";
import { describe, expect, it } from "vitest";

import { Select } from "@/components/ui/Select";

describe("Select", () => {
	describe("rendering", () => {
		it("should render with default props", () => {
			const { container } = render(
				<Select>
					<option value="">Choose...</option>
					<option value="1">Option 1</option>
				</Select>
			);
			const select = container.querySelector("select");

			expect(select).not.toBeNull();
		});

		it("should render with label", () => {
			const { container } = render(
				<Select label="Category">
					<option value="">Select category</option>
				</Select>
			);
			const label = container.querySelector("label");

			expect(label).not.toBeNull();
			expect(label?.textContent).toContain("Category");
		});

		it("should render with required indicator", () => {
			const { container } = render(
				<Select label="Priority" required>
					<option value="">Select priority</option>
				</Select>
			);
			const label = container.querySelector("label");

			expect(label?.textContent).toContain("*");
		});

		it("should render children options", () => {
			const { container } = render(
				<Select>
					<option value="a">Alpha</option>
					<option value="b">Beta</option>
					<option value="c">Gamma</option>
				</Select>
			);
			const options = container.querySelectorAll("option");

			expect(options.length).toBe(3);
		});

		it("should pass through HTML attributes", () => {
			const { container } = render(
				<Select disabled aria-describedby="select-hint">
					<option value="">Choose</option>
				</Select>
			);
			const select = container.querySelector("select");

			expect(select?.disabled).toBe(true);
			expect(select?.getAttribute("aria-describedby")).toBe("select-hint");
		});

		it("should apply custom class", () => {
			const { container } = render(
				<Select class="custom-select">
					<option value="">Choose</option>
				</Select>
			);
			const select = container.querySelector("select");

			expect(select?.classList.contains("custom-select")).toBe(true);
		});

		it("should apply container class", () => {
			const { container } = render(
				<Select containerClass="my-container">
					<option value="">Choose</option>
				</Select>
			);
			const wrapper = container.firstElementChild;

			expect(wrapper?.classList.contains("my-container")).toBe(true);
		});

		it("should render chevron icon", () => {
			const { container } = render(
				<Select>
					<option value="">Choose</option>
				</Select>
			);
			const svg = container.querySelector("svg");

			expect(svg).not.toBeNull();
		});
	});

	describe("accessibility", () => {
		it("should have no accessibility violations with label", async () => {
			const { container } = render(
				<Select label="Select an option">
					<option value="">Choose...</option>
					<option value="1">Option 1</option>
				</Select>
			);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations when disabled", async () => {
			const { container } = render(
				<Select label="Disabled select" disabled>
					<option value="">N/A</option>
				</Select>
			);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations with required field", async () => {
			const { container } = render(
				<Select label="Required field" required>
					<option value="">Please select</option>
					<option value="1">Option 1</option>
				</Select>
			);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});

		it("should associate label with select via htmlFor/id", () => {
			const { container } = render(
				<Select label="Country">
					<option value="">Choose...</option>
				</Select>
			);
			const label = container.querySelector("label");
			const select = container.querySelector("select");

			expect(label?.getAttribute("for")).toBe(select?.id);
			expect(select?.id).toBeTruthy();
		});

		it("should use provided id for label association", () => {
			const { container } = render(
				<Select label="Country" id="country-select">
					<option value="">Choose...</option>
				</Select>
			);
			const label = container.querySelector("label");
			const select = container.querySelector("select");

			expect(label?.getAttribute("for")).toBe("country-select");
			expect(select?.id).toBe("country-select");
		});
	});
});
