/**
 * Mock builder for RepositoryConfiguration logic
 */
import type { Accessor } from "solid-js";

import { vi } from "vitest";

import type {
	ProviderInstance,
	RepositorySource,
	RepositorySourceType,
} from "@/logic/repository/types";

export interface RepositoryConfigurationLogic {
	// Provider state
	providerInstances: Accessor<ProviderInstance[]>;
	showProviderModal: Accessor<boolean>;
	editingProvider: Accessor<ProviderInstance | null>;
	providerName: Accessor<string>;
	providerBaseUrl: Accessor<string>;
	providerToken: Accessor<string>;
	providerTokenError: Accessor<string>;
	showToken: Accessor<boolean>;

	// Source state
	repositorySources: Accessor<RepositorySource[]>;
	showSourceModal: Accessor<boolean>;
	showSchemaInfo: Accessor<boolean>;
	editingSource: Accessor<RepositorySource | null>;
	sourceName: Accessor<string>;
	sourceUrl: Accessor<string>;
	sourceProviderId: Accessor<string>;
	sourceType: Accessor<RepositorySourceType>;

	// Provider callbacks
	onOpenAddProvider: () => void;
	onOpenEditProvider: (provider: ProviderInstance) => void;
	onSaveProvider: () => Promise<void>;
	onDeleteProvider: (id: string) => Promise<void>;
	onCloseProviderModal: () => void;
	onProviderNameChange: (name: string) => void;
	onProviderBaseUrlChange: (url: string) => void;
	onProviderTokenChange: (token: string) => void;
	onToggleShowToken: () => void;

	// Source callbacks
	onOpenAddSource: () => void;
	onOpenEditSource: (source: RepositorySource) => void;
	onSaveSource: () => Promise<void>;
	onDeleteSource: (id: string) => Promise<void>;
	onCloseSourceModal: () => void;
	onSourceNameChange: (name: string) => void;
	onSourceUrlChange: (url: string) => void;
	onSourceTypeChange: (type: RepositorySourceType) => void;
	onSourceProviderChange: (id: string) => void;

	// Schema modal
	onOpenSchemaInfo: () => void;
	onCloseSchemaInfo: () => void;
}

/**
 * Create a mock RepositoryConfigurationLogic for testing UI components
 */
export function createMockRepositoryConfigurationLogic(
	overrides: Partial<{
		providerInstances: ProviderInstance[];
		showProviderModal: boolean;
		editingProvider: ProviderInstance | null;
		providerName: string;
		providerBaseUrl: string;
		providerToken: string;
		providerTokenError: string;
		showToken: boolean;
		repositorySources: RepositorySource[];
		showSourceModal: boolean;
		showSchemaInfo: boolean;
		editingSource: RepositorySource | null;
		sourceName: string;
		sourceUrl: string;
		sourceProviderId: string;
		sourceType: RepositorySourceType;
		onOpenAddProvider: () => void;
		onOpenEditProvider: (provider: ProviderInstance) => void;
		onSaveProvider: () => Promise<void>;
		onDeleteProvider: (id: string) => Promise<void>;
		onCloseProviderModal: () => void;
		onProviderNameChange: (name: string) => void;
		onProviderBaseUrlChange: (url: string) => void;
		onProviderTokenChange: (token: string) => void;
		onToggleShowToken: () => void;
		onOpenAddSource: () => void;
		onOpenEditSource: (source: RepositorySource) => void;
		onSaveSource: () => Promise<void>;
		onDeleteSource: (id: string) => Promise<void>;
		onCloseSourceModal: () => void;
		onSourceNameChange: (name: string) => void;
		onSourceUrlChange: (url: string) => void;
		onSourceTypeChange: (type: RepositorySourceType) => void;
		onSourceProviderChange: (id: string) => void;
		onOpenSchemaInfo: () => void;
		onCloseSchemaInfo: () => void;
	}> = {}
): RepositoryConfigurationLogic {
	const {
		providerInstances = [],
		showProviderModal = false,
		editingProvider = null,
		providerName = "",
		providerBaseUrl = "",
		providerToken = "",
		providerTokenError = "",
		showToken = false,
		repositorySources = [],
		showSourceModal = false,
		showSchemaInfo = false,
		editingSource = null,
		sourceName = "",
		sourceUrl = "",
		sourceProviderId = "",
		sourceType = "github",
		onOpenAddProvider = vi.fn(),
		onOpenEditProvider = vi.fn(),
		onSaveProvider = vi.fn().mockResolvedValue(undefined),
		onDeleteProvider = vi.fn().mockResolvedValue(undefined),
		onCloseProviderModal = vi.fn(),
		onProviderNameChange = vi.fn(),
		onProviderBaseUrlChange = vi.fn(),
		onProviderTokenChange = vi.fn(),
		onToggleShowToken = vi.fn(),
		onOpenAddSource = vi.fn(),
		onOpenEditSource = vi.fn(),
		onSaveSource = vi.fn().mockResolvedValue(undefined),
		onDeleteSource = vi.fn().mockResolvedValue(undefined),
		onCloseSourceModal = vi.fn(),
		onSourceNameChange = vi.fn(),
		onSourceUrlChange = vi.fn(),
		onSourceTypeChange = vi.fn(),
		onSourceProviderChange = vi.fn(),
		onOpenSchemaInfo = vi.fn(),
		onCloseSchemaInfo = vi.fn(),
	} = overrides;

	return {
		providerInstances: () => providerInstances,
		showProviderModal: () => showProviderModal,
		editingProvider: () => editingProvider,
		providerName: () => providerName,
		providerBaseUrl: () => providerBaseUrl,
		providerToken: () => providerToken,
		providerTokenError: () => providerTokenError,
		showToken: () => showToken,
		repositorySources: () => repositorySources,
		showSourceModal: () => showSourceModal,
		showSchemaInfo: () => showSchemaInfo,
		editingSource: () => editingSource,
		sourceName: () => sourceName,
		sourceUrl: () => sourceUrl,
		sourceProviderId: () => sourceProviderId,
		sourceType: () => sourceType,
		onOpenAddProvider,
		onOpenEditProvider,
		onSaveProvider,
		onDeleteProvider,
		onCloseProviderModal,
		onProviderNameChange,
		onProviderBaseUrlChange,
		onProviderTokenChange,
		onToggleShowToken,
		onOpenAddSource,
		onOpenEditSource,
		onSaveSource,
		onDeleteSource,
		onCloseSourceModal,
		onSourceNameChange,
		onSourceUrlChange,
		onSourceTypeChange,
		onSourceProviderChange,
		onOpenSchemaInfo,
		onCloseSchemaInfo,
	};
}
