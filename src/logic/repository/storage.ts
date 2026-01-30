/**
 * Storage operations for repository configuration
 * Uses browser.storage.local for provider instances and repository sources
 */
import { browser } from "wxt/browser";

import type { ProviderInstance, RepositorySource } from "./types";

// ============================================================================
// Storage Keys
// ============================================================================

const PROVIDER_INSTANCES_KEY = "providerInstances";
const REPOSITORY_SOURCES_KEY = "repositorySources";

// ============================================================================
// Provider Instances CRUD
// ============================================================================

/**
 * Get all configured provider instances
 */
export async function getProviderInstances(): Promise<ProviderInstance[]> {
	const result = await browser.storage?.local.get([PROVIDER_INSTANCES_KEY]);
	return (result?.[PROVIDER_INSTANCES_KEY] as ProviderInstance[]) ?? [];
}

/**
 * Get a provider instance by ID
 */
export async function getProviderInstanceById(id: string): Promise<ProviderInstance | undefined> {
	const instances = await getProviderInstances();
	return instances.find((instance) => instance.id === id);
}

/**
 * Save all provider instances
 */
async function saveProviderInstances(instances: ProviderInstance[]): Promise<void> {
	await browser.storage?.local.set({ [PROVIDER_INSTANCES_KEY]: instances });
}

/**
 * Add a new provider instance
 */
export async function addProviderInstance(instance: ProviderInstance): Promise<void> {
	const instances = await getProviderInstances();
	instances.push(instance);
	await saveProviderInstances(instances);
}

/**
 * Update an existing provider instance
 */
export async function updateProviderInstance(
	id: string,
	updates: Partial<Omit<ProviderInstance, "id">>
): Promise<boolean> {
	const instances = await getProviderInstances();
	const index = instances.findIndex((instance) => instance.id === id);

	if (index === -1) {
		return false;
	}

	instances[index] = { ...instances[index], ...updates };
	await saveProviderInstances(instances);
	return true;
}

/**
 * Remove a provider instance
 * Also removes the link from any repository sources using this instance
 */
export async function removeProviderInstance(id: string): Promise<boolean> {
	const instances = await getProviderInstances();
	const index = instances.findIndex((instance) => instance.id === id);

	if (index === -1) {
		return false;
	}

	// Remove the instance
	instances.splice(index, 1);
	await saveProviderInstances(instances);

	// Unlink any sources that were using this instance
	const sources = await getRepositorySources();
	const updatedSources = sources.map((source) => {
		if (source.providerInstanceId === id) {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { providerInstanceId, ...rest } = source;
			return rest as RepositorySource;
		}
		return source;
	});
	await saveRepositorySources(updatedSources);

	return true;
}

/**
 * Listen for changes to provider instances
 * @returns Unsubscribe function
 */
export function onProviderInstancesChanged(
	callback: (instances: ProviderInstance[]) => void
): () => void {
	const listener = (
		changes: Record<string, { newValue?: unknown; oldValue?: unknown }>,
		areaName: string
	) => {
		if (areaName === "local" && changes[PROVIDER_INSTANCES_KEY]) {
			callback((changes[PROVIDER_INSTANCES_KEY].newValue as ProviderInstance[] | undefined) ?? []);
		}
	};
	browser.storage?.onChanged.addListener(listener);
	return () => browser.storage?.onChanged.removeListener(listener);
}

// ============================================================================
// Repository Sources CRUD
// ============================================================================

/**
 * Get all configured repository sources
 */
export async function getRepositorySources(): Promise<RepositorySource[]> {
	const result = await browser.storage?.local.get([REPOSITORY_SOURCES_KEY]);
	return (result?.[REPOSITORY_SOURCES_KEY] as RepositorySource[]) ?? [];
}

/**
 * Get a repository source by ID
 */
export async function getRepositorySourceById(id: string): Promise<RepositorySource | undefined> {
	const sources = await getRepositorySources();
	return sources.find((source) => source.id === id);
}

/**
 * Save all repository sources
 */
async function saveRepositorySources(sources: RepositorySource[]): Promise<void> {
	await browser.storage?.local.set({ [REPOSITORY_SOURCES_KEY]: sources });
}

/**
 * Add a new repository source
 */
export async function addRepositorySource(source: RepositorySource): Promise<void> {
	const sources = await getRepositorySources();
	sources.push(source);
	await saveRepositorySources(sources);
}

/**
 * Update an existing repository source
 */
export async function updateRepositorySource(
	id: string,
	updates: Partial<Omit<RepositorySource, "id">>
): Promise<boolean> {
	const sources = await getRepositorySources();
	const index = sources.findIndex((source) => source.id === id);

	if (index === -1) {
		return false;
	}

	sources[index] = { ...sources[index], ...updates };
	await saveRepositorySources(sources);
	return true;
}

/**
 * Remove a repository source
 */
export async function removeRepositorySource(id: string): Promise<boolean> {
	const sources = await getRepositorySources();
	const index = sources.findIndex((source) => source.id === id);

	if (index === -1) {
		return false;
	}

	sources.splice(index, 1);
	await saveRepositorySources(sources);
	return true;
}

/**
 * Listen for changes to repository sources
 * @returns Unsubscribe function
 */
export function onRepositorySourcesChanged(
	callback: (sources: RepositorySource[]) => void
): () => void {
	const listener = (
		changes: Record<string, { newValue?: unknown; oldValue?: unknown }>,
		areaName: string
	) => {
		if (areaName === "local" && changes[REPOSITORY_SOURCES_KEY]) {
			callback((changes[REPOSITORY_SOURCES_KEY].newValue as RepositorySource[] | undefined) ?? []);
		}
	};
	browser.storage?.onChanged.addListener(listener);
	return () => browser.storage?.onChanged.removeListener(listener);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get sources with their linked provider instances resolved
 */
export async function getSourcesWithProviders(): Promise<
	Array<{
		source: RepositorySource;
		providerInstance?: ProviderInstance;
	}>
> {
	const [sources, instances] = await Promise.all([getRepositorySources(), getProviderInstances()]);

	return sources.map((source) => ({
		providerInstance: source.providerInstanceId
			? instances.find((i) => i.id === source.providerInstanceId)
			: undefined,
		source,
	}));
}

/**
 * Clear all repository configuration (for testing)
 */
export async function clearRepositoryStorage(): Promise<void> {
	await browser.storage?.local.remove([PROVIDER_INSTANCES_KEY, REPOSITORY_SOURCES_KEY]);
}
