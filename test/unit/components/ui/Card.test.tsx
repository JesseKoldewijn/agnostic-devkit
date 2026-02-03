/**
 * Card component tests with accessibility validation
 */
import { checkA11y, render } from "@test/core/helpers/renderUtils";
import { describe, expect, it } from "vitest";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

describe("Card", () => {
	describe("rendering", () => {
		it("should render with default props", () => {
			const { container } = render(<Card>Card content</Card>);
			const card = container.firstElementChild;

			expect(card).not.toBeNull();
			expect(card?.textContent).toBe("Card content");
		});

		it("should render with hoverable state", () => {
			const { container } = render(<Card hoverable>Hoverable card</Card>);
			const card = container.firstElementChild;

			expect(card).not.toBeNull();
		});

		it("should apply custom class", () => {
			const { container } = render(<Card class="custom-card">Content</Card>);
			const card = container.firstElementChild;

			expect(card?.classList.contains("custom-card")).toBe(true);
		});

		it("should pass through HTML attributes", () => {
			const { container } = render(
				<Card role="article" aria-labelledby="card-title">
					Content
				</Card>
			);
			const card = container.firstElementChild;

			expect(card?.getAttribute("role")).toBe("article");
			expect(card?.getAttribute("aria-labelledby")).toBe("card-title");
		});
	});

	describe("CardHeader", () => {
		it("should render header", () => {
			const { container } = render(<CardHeader>Header content</CardHeader>);
			const header = container.firstElementChild;

			expect(header?.textContent).toBe("Header content");
		});

		it("should apply custom class", () => {
			const { container } = render(<CardHeader class="custom-header">Header</CardHeader>);
			const header = container.firstElementChild;

			expect(header?.classList.contains("custom-header")).toBe(true);
		});
	});

	describe("CardTitle", () => {
		it("should render as h3", () => {
			const { container } = render(<CardTitle>Title</CardTitle>);
			const title = container.querySelector("h3");

			expect(title).not.toBeNull();
			expect(title?.textContent).toBe("Title");
		});

		it("should apply custom class", () => {
			const { container } = render(<CardTitle class="custom-title">Title</CardTitle>);
			const title = container.querySelector("h3");

			expect(title?.classList.contains("custom-title")).toBe(true);
		});
	});

	describe("CardContent", () => {
		it("should render content", () => {
			const { container } = render(<CardContent>Content here</CardContent>);
			const content = container.firstElementChild;

			expect(content?.textContent).toBe("Content here");
		});

		it("should apply custom class", () => {
			const { container } = render(<CardContent class="custom-content">Content</CardContent>);
			const content = container.firstElementChild;

			expect(content?.classList.contains("custom-content")).toBe(true);
		});
	});

	describe("composed card", () => {
		it("should render full card structure", () => {
			const { container } = render(
				<Card>
					<CardHeader>
						<CardTitle>My Card</CardTitle>
					</CardHeader>
					<CardContent>Card body content</CardContent>
				</Card>
			);

			const card = container.firstElementChild;
			const title = container.querySelector("h3");
			const content = container.querySelector('[class*="pt-3"]');

			expect(card).not.toBeNull();
			expect(title?.textContent).toBe("My Card");
			expect(content).not.toBeNull();
		});
	});

	describe("accessibility", () => {
		it("should have no accessibility violations with default props", async () => {
			const { container } = render(<Card>Simple card content</Card>);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations with full structure", async () => {
			const { container } = render(
				<Card>
					<CardHeader>
						<CardTitle>Accessible Card</CardTitle>
					</CardHeader>
					<CardContent>This card has proper heading structure.</CardContent>
				</Card>
			);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations with role and aria attributes", async () => {
			const { container } = render(
				<Card role="article" aria-labelledby="card-title-1">
					<CardHeader>
						<CardTitle id="card-title-1">Labeled Card</CardTitle>
					</CardHeader>
					<CardContent>Content with proper labeling.</CardContent>
				</Card>
			);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});
	});
});
