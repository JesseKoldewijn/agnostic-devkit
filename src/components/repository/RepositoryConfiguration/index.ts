/**
 * RepositoryConfiguration component - Connected via HOC pattern
 * Wires the logic factory to the UI component
 */
import { connect } from "@/utils/connect";

import { createRepositoryConfigurationLogic } from "./logic";
import { RepositoryConfigurationUI } from "./ui";

/**
 * RepositoryConfiguration component for managing provider instances and repository sources
 * Uses the Enhanced Component pattern with HOC connection
 */
export const RepositoryConfiguration = connect(
	RepositoryConfigurationUI,
	createRepositoryConfigurationLogic
);

// Re-export types for external use
export type { RepositoryConfigurationLogic } from "./logic";
export { validateToken, normalizeBaseUrl } from "./logic";
