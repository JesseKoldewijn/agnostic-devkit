/**
 * PresetManagerUI Component Tests
 *
 * Tests for the pure presentational PresetManagerUI component.
 * Uses mocked logic interface to test UI behavior in isolation.
 */
import { checkA11y, renderComponent } from "@test/core";
import { createMockPresetManagerLogic } from "@test/core/mocks/mockPresetManager";
import { describe, expect, it, vi } from "vitest";

import { PresetManagerUI } from "@/components/presets/PresetManager/ui";

// Mock the sub-components to isolate testing
vi.mock("@/components/presets/manager/Header", () => ({
	Header: (props: { onClose?: () => void; onStartCreate: () => void }) => (
		<div data-testid="mock-header">
			<button data-testid="create-button" onClick={props.onStartCreate}>
				Create
			</button>
			{props.onClose && (
				<button data-testid="close-button" onClick={props.onClose}>
					Close
				</button>
			)}
		</div>
	),
}));

vi.mock("@/components/presets/manager/EmptyStates", () => ({
	EmptyStates: (props: { isLoading: boolean; hasPresets: boolean }) => (
		<div data-testid="mock-empty-states">
			{props.isLoading && <div data-testid="loading-state">Loading...</div>}
			{!props.isLoading && !props.hasPresets && <div data-testid="empty-state">No presets</div>}
		</div>
	),
}));

vi.mock("@/components/presets/manager/List", () => ({
	List: (props: { presets: unknown[] }) => (
		<div data-testid="mock-list">
			<span data-testid="preset-count">{props.presets.length} presets</span>
		</div>
	),
}));

vi.mock("@/components/presets/manager/Form", () => ({
	Form: (props: { viewMode: string; onCancel: () => void; onSave: () => void }) => (
		<div data-testid="mock-form">
			<span data-testid="form-mode">{props.viewMode}</span>
			<button data-testid="form-cancel" onClick={props.onCancel}>
				Cancel
			</button>
			<button data-testid="form-save" onClick={props.onSave}>
				Save
			</button>
		</div>
	),
}));

vi.mock("@/components/presets/manager/Export", () => ({
	Export: (props: { onCancel: () => void }) => (
		<div data-testid="mock-export">
			<button data-testid="export-cancel" onClick={props.onCancel}>
				Cancel
			</button>
		</div>
	),
}));

vi.mock("@/components/presets/manager/Import", () => ({
	Import: (props: { onCancel: () => void }) => (
		<div data-testid="mock-import">
			<button data-testid="import-cancel" onClick={props.onCancel}>
				Cancel
			</button>
		</div>
	),
}));

vi.mock("@/components/presets/manager/ShareImport", () => ({
	ShareImport: (props: { onCancel: () => void }) => (
		<div data-testid="mock-share-import">
			<button data-testid="share-import-cancel" onClick={props.onCancel}>
				Cancel
			</button>
		</div>
	),
}));

vi.mock("@/components/repository", () => ({
	RepositoryImportView: (props: { onCancel: () => void }) => (
		<div data-testid="mock-repository-import">
			<button data-testid="repository-import-cancel" onClick={props.onCancel}>
				Cancel
			</button>
		</div>
	),
}));

describe("PresetManagerUI", () => {
	describe("rendering", () => {
		it("should render with data-testid", () => {
			const logic = createMockPresetManagerLogic();
			const { container } = renderComponent(PresetManagerUI, { ...logic });

			expect(container.querySelector('[data-testid="preset-manager"]')).not.toBeNull();
		});

		it("should apply custom class from props", () => {
			const logic = createMockPresetManagerLogic({ class: "custom-class" });
			const { container } = renderComponent(PresetManagerUI, { ...logic });

			const element = container.querySelector('[data-testid="preset-manager"]');
			expect(element?.classList.contains("custom-class")).toBe(true);
		});
	});

	describe("list view", () => {
		it("should show header in list view", () => {
			const logic = createMockPresetManagerLogic({ viewMode: "list" });
			const { container } = renderComponent(PresetManagerUI, { ...logic });

			expect(container.querySelector('[data-testid="mock-header"]')).not.toBeNull();
		});

		it("should show loading state when loading", () => {
			const logic = createMockPresetManagerLogic({ viewMode: "list", loading: true });
			const { container } = renderComponent(PresetManagerUI, { ...logic });

			expect(container.querySelector('[data-testid="loading-state"]')).not.toBeNull();
		});

		it("should show empty state when no presets", () => {
			const logic = createMockPresetManagerLogic({
				viewMode: "list",
				loading: false,
				presets: [],
			});
			const { container } = renderComponent(PresetManagerUI, { ...logic });

			expect(container.querySelector('[data-testid="empty-state"]')).not.toBeNull();
		});

		it("should show list when presets exist", () => {
			const logic = createMockPresetManagerLogic({
				viewMode: "list",
				loading: false,
				presets: [
					{ id: "1", name: "Preset 1", parameters: [] },
					{ id: "2", name: "Preset 2", parameters: [] },
				],
			});
			const { container } = renderComponent(PresetManagerUI, { ...logic });

			expect(container.querySelector('[data-testid="mock-list"]')).not.toBeNull();
			expect(container.querySelector('[data-testid="preset-count"]')?.textContent).toBe(
				"2 presets"
			);
		});

		it("should call onStartCreate when create button is clicked", () => {
			const onStartCreate = vi.fn();
			const logic = createMockPresetManagerLogic({
				viewMode: "list",
				onStartCreate,
			});
			const { container } = renderComponent(PresetManagerUI, { ...logic });

			const button = container.querySelector('[data-testid="create-button"]') as HTMLElement;
			button?.click();
			expect(onStartCreate).toHaveBeenCalledTimes(1);
		});

		it("should call onClose when close button is clicked", () => {
			const onClose = vi.fn();
			const logic = createMockPresetManagerLogic({ viewMode: "list", onClose });
			const { container } = renderComponent(PresetManagerUI, { ...logic });

			const button = container.querySelector('[data-testid="close-button"]') as HTMLElement;
			button?.click();
			expect(onClose).toHaveBeenCalledTimes(1);
		});
	});

	describe("create view", () => {
		it("should show form in create mode", () => {
			const logic = createMockPresetManagerLogic({ viewMode: "create" });
			const { container } = renderComponent(PresetManagerUI, { ...logic });

			expect(container.querySelector('[data-testid="mock-form"]')).not.toBeNull();
			expect(container.querySelector('[data-testid="form-mode"]')?.textContent).toBe("create");
		});

		it("should not show list in create mode", () => {
			const logic = createMockPresetManagerLogic({ viewMode: "create" });
			const { container } = renderComponent(PresetManagerUI, { ...logic });

			expect(container.querySelector('[data-testid="preset-manager-list"]')).toBeNull();
		});

		it("should call onCancelForm when form cancel is clicked", () => {
			const onCancelForm = vi.fn();
			const logic = createMockPresetManagerLogic({
				viewMode: "create",
				onCancelForm,
			});
			const { container } = renderComponent(PresetManagerUI, { ...logic });

			const button = container.querySelector('[data-testid="form-cancel"]') as HTMLElement;
			button?.click();
			expect(onCancelForm).toHaveBeenCalledTimes(1);
		});

		it("should call onSavePreset when form save is clicked", () => {
			const onSavePreset = vi.fn().mockResolvedValue(undefined);
			const logic = createMockPresetManagerLogic({
				viewMode: "create",
				onSavePreset,
			});
			const { container } = renderComponent(PresetManagerUI, { ...logic });

			const button = container.querySelector('[data-testid="form-save"]') as HTMLElement;
			button?.click();
			expect(onSavePreset).toHaveBeenCalledTimes(1);
		});
	});

	describe("edit view", () => {
		it("should show form in edit mode", () => {
			const logic = createMockPresetManagerLogic({
				viewMode: "edit",
				editingPreset: { id: "1", name: "Test Preset", parameters: [] },
			});
			const { container } = renderComponent(PresetManagerUI, { ...logic });

			expect(container.querySelector('[data-testid="mock-form"]')).not.toBeNull();
			expect(container.querySelector('[data-testid="form-mode"]')?.textContent).toBe("edit");
		});
	});

	describe("export view", () => {
		it("should show export component in export mode", () => {
			const logic = createMockPresetManagerLogic({ viewMode: "export" });
			const { container } = renderComponent(PresetManagerUI, { ...logic });

			expect(container.querySelector('[data-testid="mock-export"]')).not.toBeNull();
		});

		it("should not show list in export mode", () => {
			const logic = createMockPresetManagerLogic({ viewMode: "export" });
			const { container } = renderComponent(PresetManagerUI, { ...logic });

			expect(container.querySelector('[data-testid="preset-manager-list"]')).toBeNull();
		});

		it("should call onCancelExport when export cancel is clicked", () => {
			const onCancelExport = vi.fn();
			const logic = createMockPresetManagerLogic({
				viewMode: "export",
				onCancelExport,
			});
			const { container } = renderComponent(PresetManagerUI, { ...logic });

			const button = container.querySelector('[data-testid="export-cancel"]') as HTMLElement;
			button?.click();
			expect(onCancelExport).toHaveBeenCalledTimes(1);
		});
	});

	describe("file-import view", () => {
		it("should show import component in file-import mode", () => {
			const logic = createMockPresetManagerLogic({ viewMode: "file-import" });
			const { container } = renderComponent(PresetManagerUI, { ...logic });

			expect(container.querySelector('[data-testid="mock-import"]')).not.toBeNull();
		});

		it("should call onCancelFileImport when import cancel is clicked", () => {
			const onCancelFileImport = vi.fn();
			const logic = createMockPresetManagerLogic({
				viewMode: "file-import",
				onCancelFileImport,
			});
			const { container } = renderComponent(PresetManagerUI, { ...logic });

			const button = container.querySelector('[data-testid="import-cancel"]') as HTMLElement;
			button?.click();
			expect(onCancelFileImport).toHaveBeenCalledTimes(1);
		});
	});

	describe("share-import view", () => {
		it("should show share import component in share-import mode", () => {
			const logic = createMockPresetManagerLogic({ viewMode: "share-import" });
			const { container } = renderComponent(PresetManagerUI, { ...logic });

			expect(container.querySelector('[data-testid="mock-share-import"]')).not.toBeNull();
		});

		it("should call onShareImportCancel when share import cancel is clicked", () => {
			const onShareImportCancel = vi.fn();
			const logic = createMockPresetManagerLogic({
				viewMode: "share-import",
				onShareImportCancel,
			});
			const { container } = renderComponent(PresetManagerUI, { ...logic });

			const button = container.querySelector('[data-testid="share-import-cancel"]') as HTMLElement;
			button?.click();
			expect(onShareImportCancel).toHaveBeenCalledTimes(1);
		});
	});

	describe("repository-import view", () => {
		it("should show repository import component in repository-import mode", () => {
			const logic = createMockPresetManagerLogic({ viewMode: "repository-import" });
			const { container } = renderComponent(PresetManagerUI, { ...logic });

			expect(container.querySelector('[data-testid="mock-repository-import"]')).not.toBeNull();
		});

		it("should call onRepositoryImportCancel when repository import cancel is clicked", () => {
			const onRepositoryImportCancel = vi.fn();
			const logic = createMockPresetManagerLogic({
				viewMode: "repository-import",
				onRepositoryImportCancel,
			});
			const { container } = renderComponent(PresetManagerUI, { ...logic });

			const button = container.querySelector(
				'[data-testid="repository-import-cancel"]'
			) as HTMLElement;
			button?.click();
			expect(onRepositoryImportCancel).toHaveBeenCalledTimes(1);
		});
	});

	describe("view mode switching", () => {
		it("should only show one view at a time - list", () => {
			const logic = createMockPresetManagerLogic({ viewMode: "list" });
			const { container } = renderComponent(PresetManagerUI, { ...logic });

			expect(container.querySelector('[data-testid="preset-manager-list"]')).not.toBeNull();
			expect(container.querySelector('[data-testid="mock-form"]')).toBeNull();
			expect(container.querySelector('[data-testid="mock-export"]')).toBeNull();
			expect(container.querySelector('[data-testid="mock-import"]')).toBeNull();
			expect(container.querySelector('[data-testid="mock-share-import"]')).toBeNull();
			expect(container.querySelector('[data-testid="mock-repository-import"]')).toBeNull();
		});

		it("should only show one view at a time - create", () => {
			const logic = createMockPresetManagerLogic({ viewMode: "create" });
			const { container } = renderComponent(PresetManagerUI, { ...logic });

			expect(container.querySelector('[data-testid="preset-manager-list"]')).toBeNull();
			expect(container.querySelector('[data-testid="mock-form"]')).not.toBeNull();
			expect(container.querySelector('[data-testid="mock-export"]')).toBeNull();
		});

		it("should only show one view at a time - export", () => {
			const logic = createMockPresetManagerLogic({ viewMode: "export" });
			const { container } = renderComponent(PresetManagerUI, { ...logic });

			expect(container.querySelector('[data-testid="preset-manager-list"]')).toBeNull();
			expect(container.querySelector('[data-testid="mock-form"]')).toBeNull();
			expect(container.querySelector('[data-testid="mock-export"]')).not.toBeNull();
		});
	});

	describe("accessibility", () => {
		it("should have no accessibility violations in list view", async () => {
			const logic = createMockPresetManagerLogic({
				viewMode: "list",
				loading: false,
				presets: [{ id: "1", name: "Test Preset", parameters: [] }],
			});
			const { container } = renderComponent(PresetManagerUI, { ...logic });

			const results = await checkA11y(container);
			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations in create view", async () => {
			const logic = createMockPresetManagerLogic({ viewMode: "create" });
			const { container } = renderComponent(PresetManagerUI, { ...logic });

			const results = await checkA11y(container);
			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations in export view", async () => {
			const logic = createMockPresetManagerLogic({ viewMode: "export" });
			const { container } = renderComponent(PresetManagerUI, { ...logic });

			const results = await checkA11y(container);
			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations in loading state", async () => {
			const logic = createMockPresetManagerLogic({
				viewMode: "list",
				loading: true,
			});
			const { container } = renderComponent(PresetManagerUI, { ...logic });

			const results = await checkA11y(container);
			expect(results).toHaveNoViolations();
		});

		it("should have no accessibility violations in empty state", async () => {
			const logic = createMockPresetManagerLogic({
				viewMode: "list",
				loading: false,
				presets: [],
			});
			const { container } = renderComponent(PresetManagerUI, { ...logic });

			const results = await checkA11y(container);
			expect(results).toHaveNoViolations();
		});
	});
});
