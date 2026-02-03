/**
 * Textarea component tests with accessibility validation
 */
import { checkA11y, render } from "@test/core/helpers/renderUtils";
import { describe, expect, it } from "vitest";

import { Textarea } from "@/components/ui/Textarea";

describe("Textarea", () => {
	describe("rendering", () => {
		it("should render with default props", () => {
			const { container } = render(<Textarea />);
			const textarea = container.querySelector("textarea");

			expect(textarea).not.toBeNull();
		});

		it("should render with label", () => {
			const { container } = render(<Textarea label="Description" />);
			const label = container.querySelector("label");

			expect(label).not.toBeNull();
			expect(label?.textContent).toContain("Description");
		});

		it("should render with required indicator", () => {
			const { container } = render(<Textarea label="Bio" required />);
			const label = container.querySelector("label");
			const textarea = container.querySelector("textarea");

			expect(label?.textContent).toContain("*");
			expect(textarea?.required).toBe(true);
		});

		it("should pass through HTML attributes", () => {
			const { container } = render(
				<Textarea
					rows={5}
					cols={40}
					placeholder="Enter your message..."
					disabled
					aria-describedby="textarea-hint"
					maxlength={500}
				/>
			);
			const textarea = container.querySelector("textarea");

			expect(textarea?.rows).toBe(5);
			expect(textarea?.cols).toBe(40);
			expect(textarea?.placeholder).toBe("Enter your message...");
			expect(textarea?.disabled).toBe(true);
			expect(textarea?.getAttribute("aria-describedby")).toBe("textarea-hint");
			expect(textarea?.maxLength).toBe(500);
		});

		it("should apply custom class", () => {
			const { container } = render(<Textarea class="custom-textarea" />);
			const textarea = container.querySelector("textarea");

			expect(textarea?.classList.contains("custom-textarea")).toBe(true);
		});

		it("should apply container class", () => {
			const { container } = render(<Textarea containerClass="my-container" />);
			const wrapper = container.querySelector("div");

			expect(wrapper?.classList.contains("my-container")).toBe(true);
		});
	});

	describe("accessibility", () => {
		it("should have no accessibility violations with label", async () => {
			const { container } = render(<Textarea label="Message input" />);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations when disabled", async () => {
			const { container } = render(<Textarea label="Disabled textarea" disabled />);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations with required field", async () => {
			const { container } = render(<Textarea label="Required message" required />);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations with placeholder", async () => {
			const { container } = render(
				<Textarea label="Feedback" placeholder="Share your thoughts..." />
			);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});

		it("should associate label with textarea via htmlFor/id", () => {
			const { container } = render(<Textarea label="Description" />);
			const label = container.querySelector("label");
			const textarea = container.querySelector("textarea");

			expect(label?.getAttribute("for")).toBe(textarea?.id);
			expect(textarea?.id).toBeTruthy();
		});

		it("should use provided id for label association", () => {
			const { container } = render(<Textarea label="Description" id="custom-id" />);
			const label = container.querySelector("label");
			const textarea = container.querySelector("textarea");

			expect(label?.getAttribute("for")).toBe("custom-id");
			expect(textarea?.id).toBe("custom-id");
		});
	});
});
