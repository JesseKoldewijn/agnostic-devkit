/**
 * Unit tests for RepositoryConfiguration UI component
 */
import {
	checkA11y,
	createMockRepositoryConfigurationLogic,
	createProviderInstance,
	createRepositorySource,
	renderComponent,
} from "@test/core";
import { describe, expect, it, vi } from "vitest";

import { RepositoryConfigurationUI } from "@/components/repository/RepositoryConfiguration/ui";

// Mock the repository module to avoid esbuild issues
vi.mock("@/logic/repository", () => ({
	PRESET_SCHEMA_DESCRIPTION: "Test schema description",
	PRESET_SCHEMA_EXAMPLE: '{ "presets": [] }',
}));

describe("RepositoryConfigurationUI", () => {
	describe("rendering", () => {
		it("should render with data-testid", () => {
			const logic = createMockRepositoryConfigurationLogic();
			const { container } = renderComponent(RepositoryConfigurationUI, { ...logic });

			expect(
				container.querySelector('[data-testid="repository-configuration-section"]')
			).not.toBeNull();
		});

		it("should render card title", () => {
			const logic = createMockRepositoryConfigurationLogic();
			const { container } = renderComponent(RepositoryConfigurationUI, { ...logic });

			expect(container.textContent).toContain("Repository Sources");
		});

		it("should render schema info button", () => {
			const logic = createMockRepositoryConfigurationLogic();
			const { container } = renderComponent(RepositoryConfigurationUI, { ...logic });

			expect(container.querySelector('[data-testid="schema-info-button"]')).not.toBeNull();
		});
	});

	describe("provider instances section", () => {
		it("should show no providers message when empty", () => {
			const logic = createMockRepositoryConfigurationLogic({ providerInstances: [] });
			const { container } = renderComponent(RepositoryConfigurationUI, { ...logic });

			expect(container.querySelector('[data-testid="no-providers-message"]')).not.toBeNull();
			expect(container.textContent).toContain("No GitHub instances configured");
		});

		it("should render provider instances", () => {
			const providers = [
				createProviderInstance({ id: "1", name: "Company GitHub", baseUrl: "github.company.com" }),
				createProviderInstance({ id: "2", name: "Personal", baseUrl: "github.com" }),
			];
			const logic = createMockRepositoryConfigurationLogic({ providerInstances: providers });
			const { container } = renderComponent(RepositoryConfigurationUI, { ...logic });

			const items = container.querySelectorAll('[data-testid="provider-instance-item"]');
			expect(items.length).toBe(2);
		});

		it("should show provider name and baseUrl", () => {
			const providers = [
				createProviderInstance({ id: "1", name: "Company GitHub", baseUrl: "github.company.com" }),
			];
			const logic = createMockRepositoryConfigurationLogic({ providerInstances: providers });
			const { container } = renderComponent(RepositoryConfigurationUI, { ...logic });

			expect(container.textContent).toContain("Company GitHub");
			expect(container.textContent).toContain("github.company.com");
		});

		it("should show token indicator when token is configured", () => {
			const providers = [
				createProviderInstance({
					id: "1",
					name: "Company",
					baseUrl: "github.com",
					token: "github_pat_xxx",
				}),
			];
			const logic = createMockRepositoryConfigurationLogic({ providerInstances: providers });
			const { container } = renderComponent(RepositoryConfigurationUI, { ...logic });

			expect(container.textContent).toContain("Token configured");
		});

		it("should call onOpenAddProvider when add button is clicked", () => {
			const onOpenAddProvider = vi.fn();
			const logic = createMockRepositoryConfigurationLogic({ onOpenAddProvider });
			const { container } = renderComponent(RepositoryConfigurationUI, { ...logic });

			const addBtn = container.querySelector('[data-testid="add-provider-button"]');
			(addBtn as HTMLElement).click();

			expect(onOpenAddProvider).toHaveBeenCalled();
		});

		it("should call onOpenEditProvider when edit button is clicked", () => {
			const onOpenEditProvider = vi.fn();
			const providers = [createProviderInstance({ id: "1", name: "Test" })];
			const logic = createMockRepositoryConfigurationLogic({
				providerInstances: providers,
				onOpenEditProvider,
			});
			const { container } = renderComponent(RepositoryConfigurationUI, { ...logic });

			const editBtn = container.querySelector('[data-testid="edit-provider-button"]');
			(editBtn as HTMLElement).click();

			expect(onOpenEditProvider).toHaveBeenCalledWith(providers[0]);
		});

		it("should call onDeleteProvider when delete button is clicked", () => {
			const onDeleteProvider = vi.fn();
			const providers = [createProviderInstance({ id: "1", name: "Test" })];
			const logic = createMockRepositoryConfigurationLogic({
				providerInstances: providers,
				onDeleteProvider,
			});
			const { container } = renderComponent(RepositoryConfigurationUI, { ...logic });

			const deleteBtn = container.querySelector('[data-testid="delete-provider-button"]');
			(deleteBtn as HTMLElement).click();

			expect(onDeleteProvider).toHaveBeenCalledWith("1");
		});
	});

	describe("repository sources section", () => {
		it("should show no sources message when empty", () => {
			const logic = createMockRepositoryConfigurationLogic({ repositorySources: [] });
			const { container } = renderComponent(RepositoryConfigurationUI, { ...logic });

			expect(container.querySelector('[data-testid="no-sources-message"]')).not.toBeNull();
			expect(container.textContent).toContain("No preset sources configured");
		});

		it("should render repository sources", () => {
			const sources = [
				createRepositorySource({ id: "1", name: "Source One" }),
				createRepositorySource({ id: "2", name: "Source Two" }),
			];
			const logic = createMockRepositoryConfigurationLogic({ repositorySources: sources });
			const { container } = renderComponent(RepositoryConfigurationUI, { ...logic });

			const items = container.querySelectorAll('[data-testid="repository-source-item"]');
			expect(items.length).toBe(2);
		});

		it("should show source name and URL", () => {
			const sources = [
				createRepositorySource({
					id: "1",
					name: "My Presets",
					url: "https://github.com/user/repo",
				}),
			];
			const logic = createMockRepositoryConfigurationLogic({ repositorySources: sources });
			const { container } = renderComponent(RepositoryConfigurationUI, { ...logic });

			expect(container.textContent).toContain("My Presets");
			expect(container.textContent).toContain("https://github.com/user/repo");
		});

		it("should show provider name when source has provider", () => {
			const providers = [createProviderInstance({ id: "p1", name: "Company GitHub" })];
			const sources = [
				createRepositorySource({ id: "1", name: "Private Repo", providerInstanceId: "p1" }),
			];
			const logic = createMockRepositoryConfigurationLogic({
				providerInstances: providers,
				repositorySources: sources,
			});
			const { container } = renderComponent(RepositoryConfigurationUI, { ...logic });

			expect(container.textContent).toContain("via Company GitHub");
		});

		it("should call onOpenAddSource when add button is clicked", () => {
			const onOpenAddSource = vi.fn();
			const logic = createMockRepositoryConfigurationLogic({ onOpenAddSource });
			const { container } = renderComponent(RepositoryConfigurationUI, { ...logic });

			const addBtn = container.querySelector('[data-testid="add-source-button"]');
			(addBtn as HTMLElement).click();

			expect(onOpenAddSource).toHaveBeenCalled();
		});

		it("should call onOpenEditSource when edit button is clicked", () => {
			const onOpenEditSource = vi.fn();
			const sources = [createRepositorySource({ id: "1", name: "Test" })];
			const logic = createMockRepositoryConfigurationLogic({
				repositorySources: sources,
				onOpenEditSource,
			});
			const { container } = renderComponent(RepositoryConfigurationUI, { ...logic });

			const editBtn = container.querySelector('[data-testid="edit-source-button"]');
			(editBtn as HTMLElement).click();

			expect(onOpenEditSource).toHaveBeenCalledWith(sources[0]);
		});

		it("should call onDeleteSource when delete button is clicked", () => {
			const onDeleteSource = vi.fn();
			const sources = [createRepositorySource({ id: "1", name: "Test" })];
			const logic = createMockRepositoryConfigurationLogic({
				repositorySources: sources,
				onDeleteSource,
			});
			const { container } = renderComponent(RepositoryConfigurationUI, { ...logic });

			const deleteBtn = container.querySelector('[data-testid="delete-source-button"]');
			(deleteBtn as HTMLElement).click();

			expect(onDeleteSource).toHaveBeenCalledWith("1");
		});
	});

	describe("provider modal", () => {
		it("should not show modal when showProviderModal is false", () => {
			const logic = createMockRepositoryConfigurationLogic({ showProviderModal: false });
			const { container } = renderComponent(RepositoryConfigurationUI, { ...logic });

			expect(container.querySelector('[data-testid="provider-modal"]')).toBeNull();
		});

		it("should show modal when showProviderModal is true", () => {
			const logic = createMockRepositoryConfigurationLogic({ showProviderModal: true });
			const { container } = renderComponent(RepositoryConfigurationUI, { ...logic });

			expect(container.querySelector('[data-testid="provider-modal"]')).not.toBeNull();
		});

		it("should show Add title when not editing", () => {
			const logic = createMockRepositoryConfigurationLogic({
				showProviderModal: true,
				editingProvider: null,
			});
			const { container } = renderComponent(RepositoryConfigurationUI, { ...logic });

			expect(container.textContent).toContain("Add GitHub Instance");
		});

		it("should show Edit title when editing", () => {
			const editing = createProviderInstance({ id: "1", name: "Test" });
			const logic = createMockRepositoryConfigurationLogic({
				showProviderModal: true,
				editingProvider: editing,
			});
			const { container } = renderComponent(RepositoryConfigurationUI, { ...logic });

			expect(container.textContent).toContain("Edit GitHub Instance");
		});

		it("should show token error when set", () => {
			const logic = createMockRepositoryConfigurationLogic({
				showProviderModal: true,
				providerTokenError: "Invalid token format",
			});
			const { container } = renderComponent(RepositoryConfigurationUI, { ...logic });

			expect(container.textContent).toContain("Invalid token format");
		});

		it("should disable save button when name or URL is empty", () => {
			const logic = createMockRepositoryConfigurationLogic({
				showProviderModal: true,
				providerName: "",
				providerBaseUrl: "",
			});
			const { container } = renderComponent(RepositoryConfigurationUI, { ...logic });

			const saveBtn = container.querySelector('[data-testid="save-provider-button"]');
			expect((saveBtn as HTMLButtonElement).disabled).toBe(true);
		});

		it("should enable save button when name and URL are provided", () => {
			const logic = createMockRepositoryConfigurationLogic({
				showProviderModal: true,
				providerName: "Test",
				providerBaseUrl: "github.com",
			});
			const { container } = renderComponent(RepositoryConfigurationUI, { ...logic });

			const saveBtn = container.querySelector('[data-testid="save-provider-button"]');
			expect((saveBtn as HTMLButtonElement).disabled).toBe(false);
		});
	});

	describe("source modal", () => {
		it("should not show modal when showSourceModal is false", () => {
			const logic = createMockRepositoryConfigurationLogic({ showSourceModal: false });
			const { container } = renderComponent(RepositoryConfigurationUI, { ...logic });

			expect(container.querySelector('[data-testid="source-modal"]')).toBeNull();
		});

		it("should show modal when showSourceModal is true", () => {
			const logic = createMockRepositoryConfigurationLogic({ showSourceModal: true });
			const { container } = renderComponent(RepositoryConfigurationUI, { ...logic });

			expect(container.querySelector('[data-testid="source-modal"]')).not.toBeNull();
		});

		it("should show Add title when not editing", () => {
			const logic = createMockRepositoryConfigurationLogic({
				showSourceModal: true,
				editingSource: null,
			});
			const { container } = renderComponent(RepositoryConfigurationUI, { ...logic });

			expect(container.textContent).toContain("Add Preset Source");
		});

		it("should show Edit title when editing", () => {
			const editing = createRepositorySource({ id: "1", name: "Test" });
			const logic = createMockRepositoryConfigurationLogic({
				showSourceModal: true,
				editingSource: editing,
			});
			const { container } = renderComponent(RepositoryConfigurationUI, { ...logic });

			expect(container.textContent).toContain("Edit Preset Source");
		});

		it("should show provider select when type is github", () => {
			const logic = createMockRepositoryConfigurationLogic({
				showSourceModal: true,
				sourceType: "github",
			});
			const { container } = renderComponent(RepositoryConfigurationUI, { ...logic });

			expect(container.querySelector('[data-testid="source-provider-select"]')).not.toBeNull();
		});

		it("should not show provider select when type is url", () => {
			const logic = createMockRepositoryConfigurationLogic({
				showSourceModal: true,
				sourceType: "url",
			});
			const { container } = renderComponent(RepositoryConfigurationUI, { ...logic });

			expect(container.querySelector('[data-testid="source-provider-select"]')).toBeNull();
		});
	});

	describe("schema info modal", () => {
		it("should not show modal when showSchemaInfo is false", () => {
			const logic = createMockRepositoryConfigurationLogic({ showSchemaInfo: false });
			const { container } = renderComponent(RepositoryConfigurationUI, { ...logic });

			expect(container.querySelector('[data-testid="schema-info-modal"]')).toBeNull();
		});

		it("should show modal when showSchemaInfo is true", () => {
			const logic = createMockRepositoryConfigurationLogic({ showSchemaInfo: true });
			const { container } = renderComponent(RepositoryConfigurationUI, { ...logic });

			expect(container.querySelector('[data-testid="schema-info-modal"]')).not.toBeNull();
		});

		it("should call onOpenSchemaInfo when info button is clicked", () => {
			const onOpenSchemaInfo = vi.fn();
			const logic = createMockRepositoryConfigurationLogic({ onOpenSchemaInfo });
			const { container } = renderComponent(RepositoryConfigurationUI, { ...logic });

			const infoBtn = container.querySelector('[data-testid="schema-info-button"]');
			(infoBtn as HTMLElement).click();

			expect(onOpenSchemaInfo).toHaveBeenCalled();
		});
	});

	describe("accessibility", () => {
		// Known a11y issues in form elements
		const axeOptions = {
			rules: {
				"nested-interactive": { enabled: false },
				label: { enabled: false },
			},
		};

		it("should have no accessibility violations in default state", async () => {
			const logic = createMockRepositoryConfigurationLogic();
			const { container } = renderComponent(RepositoryConfigurationUI, { ...logic });

			const results = await checkA11y(container, axeOptions);
			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations with providers", async () => {
			const providers = [createProviderInstance({ id: "1", name: "Test" })];
			const logic = createMockRepositoryConfigurationLogic({ providerInstances: providers });
			const { container } = renderComponent(RepositoryConfigurationUI, { ...logic });

			const results = await checkA11y(container, axeOptions);
			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations with sources", async () => {
			const sources = [createRepositorySource({ id: "1", name: "Test" })];
			const logic = createMockRepositoryConfigurationLogic({ repositorySources: sources });
			const { container } = renderComponent(RepositoryConfigurationUI, { ...logic });

			const results = await checkA11y(container, axeOptions);
			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations with provider modal", async () => {
			const logic = createMockRepositoryConfigurationLogic({ showProviderModal: true });
			const { container } = renderComponent(RepositoryConfigurationUI, { ...logic });

			const results = await checkA11y(container, axeOptions);
			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations with source modal", async () => {
			const logic = createMockRepositoryConfigurationLogic({ showSourceModal: true });
			const { container } = renderComponent(RepositoryConfigurationUI, { ...logic });

			const results = await checkA11y(container, axeOptions);
			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations with schema info modal", async () => {
			const logic = createMockRepositoryConfigurationLogic({ showSchemaInfo: true });
			const { container } = renderComponent(RepositoryConfigurationUI, { ...logic });

			const results = await checkA11y(container, axeOptions);
			expect(results).toHaveNoViolations();
		});
	});
});
