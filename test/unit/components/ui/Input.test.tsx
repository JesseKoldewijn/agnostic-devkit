/**
 * Input component tests with accessibility validation
 */
import { checkA11y, render } from "@test/core/helpers/renderUtils";
import { describe, expect, it } from "vitest";

import { Input } from "@/components/ui/Input";

describe("Input", () => {
	describe("rendering", () => {
		it("should render with default props", () => {
			const { container } = render(<Input />);
			const input = container.querySelector("input");

			expect(input).not.toBeNull();
		});

		it("should render with label", () => {
			const { container } = render(<Input label="Username" />);
			const label = container.querySelector("label");

			expect(label).not.toBeNull();
			expect(label?.textContent).toContain("Username");
		});

		it("should render with required indicator", () => {
			const { container } = render(<Input label="Email" required />);
			const label = container.querySelector("label");
			const input = container.querySelector("input");

			expect(label?.textContent).toContain("*");
			expect(input?.required).toBe(true);
		});

		it("should pass through HTML attributes", () => {
			const { container } = render(
				<Input type="email" placeholder="Enter email" disabled aria-describedby="email-hint" />
			);
			const input = container.querySelector("input");

			expect(input?.type).toBe("email");
			expect(input?.placeholder).toBe("Enter email");
			expect(input?.disabled).toBe(true);
			expect(input?.getAttribute("aria-describedby")).toBe("email-hint");
		});

		it("should apply custom class", () => {
			const { container } = render(<Input class="custom-input" />);
			const input = container.querySelector("input");

			expect(input?.classList.contains("custom-input")).toBe(true);
		});

		it("should apply container class", () => {
			const { container } = render(<Input containerClass="my-container" />);
			const wrapper = container.querySelector("div");

			expect(wrapper?.classList.contains("my-container")).toBe(true);
		});
	});

	describe("accessibility", () => {
		it("should have no accessibility violations with label", async () => {
			const { container } = render(<Input label="Search" />);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations when disabled", async () => {
			const { container } = render(<Input label="Disabled field" disabled />);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations with required field", async () => {
			const { container } = render(<Input label="Required field" required />);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations with placeholder", async () => {
			const { container } = render(
				<Input label="Email" placeholder="you@example.com" type="email" />
			);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});

		it("should associate label with input via htmlFor/id", () => {
			const { container } = render(<Input label="Username" />);
			const label = container.querySelector("label");
			const input = container.querySelector("input");

			expect(label?.getAttribute("for")).toBe(input?.id);
			expect(input?.id).toBeTruthy();
		});

		it("should use provided id for label association", () => {
			const { container } = render(<Input label="Username" id="custom-id" />);
			const label = container.querySelector("label");
			const input = container.querySelector("input");

			expect(label?.getAttribute("for")).toBe("custom-id");
			expect(input?.id).toBe("custom-id");
		});
	});
});
