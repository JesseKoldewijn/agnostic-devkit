/**
 * RepositoryConfiguration component logic
 * Manages provider instances and repository sources state
 */
import type { Accessor } from "solid-js";
import { createEffect, createSignal, onCleanup, onMount } from "solid-js";

import {
	type ProviderInstance,
	type RepositorySource,
	type RepositorySourceType,
	addProviderInstance,
	addRepositorySource,
	createProviderInstance,
	createRepositorySource,
	getProviderInstances,
	getRepositorySources,
	onProviderInstancesChanged,
	onRepositorySourcesChanged,
	removeProviderInstance,
	removeRepositorySource,
	updateProviderInstance,
	updateRepositorySource,
} from "@/logic/repository";

// ============================================================================
// Logic Interface (what UI receives)
// ============================================================================

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

// ============================================================================
// Helper Functions (pure logic, no SolidJS)
// ============================================================================

/**
 * Validate PAT token format
 * Returns error message if invalid, null if valid
 */
export function validateToken(token: string): string | null {
	if (!token) return null;
	// Classic PAT tokens start with ghp_
	if (token.startsWith("ghp_")) {
		return "Classic PAT tokens are not supported. Please use a fine-grained personal access token instead (starts with github_pat_).";
	}
	// GitHub OAuth tokens start with gho_
	if (token.startsWith("gho_")) {
		return "OAuth tokens are not supported. Please use a fine-grained personal access token (starts with github_pat_).";
	}
	// GitHub App tokens start with ghu_ or ghs_
	if (token.startsWith("ghu_") || token.startsWith("ghs_")) {
		return "GitHub App tokens are not supported. Please use a fine-grained personal access token (starts with github_pat_).";
	}
	return null;
}

/**
 * Normalize base URL (remove protocol, lowercase)
 */
export function normalizeBaseUrl(url: string): string {
	return url
		.trim()
		.toLowerCase()
		.replace(/^https?:\/\//, "");
}

// ============================================================================
// Logic Factory
// ============================================================================

export function createRepositoryConfigurationLogic(): RepositoryConfigurationLogic {
	// Provider state
	const [providerInstances, setProviderInstances] = createSignal<ProviderInstance[]>([]);
	const [showProviderModal, setShowProviderModal] = createSignal(false);
	const [editingProvider, setEditingProvider] = createSignal<ProviderInstance | null>(null);
	const [providerName, setProviderName] = createSignal("");
	const [providerBaseUrl, setProviderBaseUrl] = createSignal("");
	const [providerToken, setProviderToken] = createSignal("");
	const [providerTokenError, setProviderTokenError] = createSignal("");
	const [showToken, setShowToken] = createSignal(false);

	// Source state
	const [repositorySources, setRepositorySources] = createSignal<RepositorySource[]>([]);
	const [showSourceModal, setShowSourceModal] = createSignal(false);
	const [showSchemaInfo, setShowSchemaInfo] = createSignal(false);
	const [editingSource, setEditingSource] = createSignal<RepositorySource | null>(null);
	const [sourceName, setSourceName] = createSignal("");
	const [sourceUrl, setSourceUrl] = createSignal("");
	const [sourceProviderId, setSourceProviderId] = createSignal<string>("");
	const [sourceType, setSourceType] = createSignal<RepositorySourceType>("github");

	// Load data on mount
	onMount(async () => {
		const [instances, sources] = await Promise.all([
			getProviderInstances(),
			getRepositorySources(),
		]);
		setProviderInstances(instances);
		setRepositorySources(sources);
	});

	// Subscribe to changes
	createEffect(() => {
		const unsubProviders = onProviderInstancesChanged(setProviderInstances);
		const unsubSources = onRepositorySourcesChanged(setRepositorySources);

		onCleanup(() => {
			unsubProviders();
			unsubSources();
		});
	});

	// Reset provider form
	const resetProviderForm = (): void => {
		setProviderName("");
		setProviderBaseUrl("");
		setProviderToken("");
		setProviderTokenError("");
		setShowToken(false);
		setEditingProvider(null);
	};

	// Reset source form
	const resetSourceForm = (): void => {
		setSourceName("");
		setSourceUrl("");
		setSourceProviderId("");
		setSourceType("github");
		setEditingSource(null);
	};

	// Provider callbacks
	const onOpenAddProvider = (): void => {
		resetProviderForm();
		setShowProviderModal(true);
	};

	const onOpenEditProvider = (provider: ProviderInstance): void => {
		setEditingProvider(provider);
		setProviderName(provider.name);
		setProviderBaseUrl(provider.baseUrl);
		setProviderToken(provider.token ?? "");
		setShowProviderModal(true);
	};

	const onSaveProvider = async (): Promise<void> => {
		const name = providerName().trim();
		const baseUrl = normalizeBaseUrl(providerBaseUrl());
		const token = providerToken().trim() || undefined;

		if (!name || !baseUrl) return;

		// Validate token format
		if (token) {
			const tokenError = validateToken(token);
			if (tokenError) {
				setProviderTokenError(tokenError);
				return;
			}
		}
		setProviderTokenError("");

		const editing = editingProvider();
		if (editing) {
			await updateProviderInstance(editing.id, { baseUrl, name, token });
		} else {
			const instance = createProviderInstance("github", name, baseUrl, token);
			await addProviderInstance(instance);
		}

		setShowProviderModal(false);
		resetProviderForm();
	};

	const onDeleteProvider = async (id: string): Promise<void> => {
		await removeProviderInstance(id);
	};

	const onCloseProviderModal = (): void => {
		setShowProviderModal(false);
		resetProviderForm();
	};

	const onProviderNameChange = (name: string): void => {
		setProviderName(name);
	};

	const onProviderBaseUrlChange = (url: string): void => {
		setProviderBaseUrl(url);
	};

	const onProviderTokenChange = (token: string): void => {
		setProviderToken(token);
		setProviderTokenError("");
	};

	const onToggleShowToken = (): void => {
		setShowToken(!showToken());
	};

	// Source callbacks
	const onOpenAddSource = (): void => {
		resetSourceForm();
		setShowSourceModal(true);
	};

	const onOpenEditSource = (source: RepositorySource): void => {
		setEditingSource(source);
		setSourceName(source.name);
		setSourceUrl(source.url);
		setSourceProviderId(source.providerInstanceId ?? "");
		setSourceType(source.type);
		setShowSourceModal(true);
	};

	const onSaveSource = async (): Promise<void> => {
		const name = sourceName().trim();
		const url = sourceUrl().trim();
		const type = sourceType();
		const providerId = type === "github" ? sourceProviderId() || undefined : undefined;

		if (!name || !url) return;

		const editing = editingSource();
		if (editing) {
			await updateRepositorySource(editing.id, {
				name,
				providerInstanceId: providerId,
				type,
				url,
			});
		} else {
			const source = createRepositorySource(name, url, type, providerId);
			await addRepositorySource(source);
		}

		setShowSourceModal(false);
		resetSourceForm();
	};

	const onDeleteSource = async (id: string): Promise<void> => {
		await removeRepositorySource(id);
	};

	const onCloseSourceModal = (): void => {
		setShowSourceModal(false);
		resetSourceForm();
	};

	const onSourceNameChange = (name: string): void => {
		setSourceName(name);
	};

	const onSourceUrlChange = (url: string): void => {
		setSourceUrl(url);
	};

	const onSourceTypeChange = (type: RepositorySourceType): void => {
		setSourceType(type);
		if (type === "url") {
			setSourceProviderId("");
		}
	};

	const onSourceProviderChange = (id: string): void => {
		setSourceProviderId(id);
	};

	// Schema modal callbacks
	const onOpenSchemaInfo = (): void => {
		setShowSchemaInfo(true);
	};

	const onCloseSchemaInfo = (): void => {
		setShowSchemaInfo(false);
	};

	return {
		// Provider state
		providerInstances,
		showProviderModal,
		editingProvider,
		providerName,
		providerBaseUrl,
		providerToken,
		providerTokenError,
		showToken,

		// Source state
		repositorySources,
		showSourceModal,
		showSchemaInfo,
		editingSource,
		sourceName,
		sourceUrl,
		sourceProviderId,
		sourceType,

		// Provider callbacks
		onOpenAddProvider,
		onOpenEditProvider,
		onSaveProvider,
		onDeleteProvider,
		onCloseProviderModal,
		onProviderNameChange,
		onProviderBaseUrlChange,
		onProviderTokenChange,
		onToggleShowToken,

		// Source callbacks
		onOpenAddSource,
		onOpenEditSource,
		onSaveSource,
		onDeleteSource,
		onCloseSourceModal,
		onSourceNameChange,
		onSourceUrlChange,
		onSourceTypeChange,
		onSourceProviderChange,

		// Schema modal
		onOpenSchemaInfo,
		onCloseSchemaInfo,
	};
}
