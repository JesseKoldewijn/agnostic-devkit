import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import betterTailwindcss from "eslint-plugin-better-tailwindcss";
import jsxA11y from "eslint-plugin-jsx-a11y";
import solid from "eslint-plugin-solid/configs/recommended";
import sonarjs from "eslint-plugin-sonarjs";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

/**
 * ESLint flat config for the project.
 * Uses ESLint's defineConfig() for type-safe configuration.
 *
 * Config order matters - later configs override earlier ones.
 * eslint-config-prettier MUST be last to disable rules that conflict with Prettier.
 */
export default defineConfig(
	// Global ignores - applied to all files
	{
		ignores: [
			"build-output/**",
			"node_modules/**",
			"coverage/**",
			".wxt/**",
			"dist/**",
			"playwright-report/**",
			"test-results/**",
			"CHANGELOG.md",
		],
	},

	// Base JavaScript rules
	js.configs.recommended,

	// TypeScript rules
	tseslint.configs.recommended,

	// SonarJS rules for clean code
	sonarjs.configs.recommended,
	{
		rules: {
			// Disable security rules that are false positives in browser extension context
			"sonarjs/pseudo-random": "off", // Math.random() is fine for non-crypto uses
			"sonarjs/no-os-command-from-path": "off", // Build scripts legitimately use PATH
			"sonarjs/os-command": "off", // Build scripts legitimately execute commands
			"sonarjs/publicly-writable-directories": "off", // Test fixtures use /tmp safely
			"sonarjs/no-hardcoded-ip": "off", // Test fixtures use mock IPs
			// Relax complexity rules for better DX (can refactor later)
			"sonarjs/cognitive-complexity": ["warn", 25], // Warn instead of error, raise limit
			// Allow nested ternaries in moderation (Prettier formats them well)
			"sonarjs/no-nested-conditional": "off",
			// Allow nested template literals (useful for code generation)
			"sonarjs/no-nested-template-literals": "off",
		},
	},

	// Accessibility rules for JSX
	jsxA11y.flatConfigs.recommended,

	// Tailwind CSS rules
	betterTailwindcss.configs.recommended,
	{
		settings: {
			"better-tailwindcss": {
				entryPoint: "src/styles/main.css",
			},
		},
		rules: {
			// Disable class order - Prettier handles it via prettier-plugin-tailwindcss
			"better-tailwindcss/enforce-consistent-class-order": "off",
			// Disable line wrapping - prefer single-line classes
			"better-tailwindcss/enforce-consistent-line-wrapping": "off",
			// Disable canonical-classes - overlaps with other rules
			"better-tailwindcss/enforce-canonical-classes": "off",
			// Disable no-unknown-classes - false positives with object keys
			"better-tailwindcss/no-unknown-classes": "off",
			// Enable canonical important position (suffix ! instead of prefix !)
			"better-tailwindcss/enforce-consistent-important-position": "warn",
			// Enable shorthand classes (e.g., size-full instead of w-full h-full)
			"better-tailwindcss/enforce-shorthand-classes": "warn",
		},
	},

	// TypeScript-specific rules
	{
		rules: {
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^_",
				},
			],
		},
	},

	// SolidJS rules for source files
	{
		files: ["src/**/*.{ts,tsx}"],
		...solid,
		languageOptions: {
			...solid.languageOptions,
			globals: {
				...globals.browser,
				...globals.webextensions,
			},
		},
		rules: {
			// SolidJS components often have deeply nested callbacks (ref + queueMicrotask)
			"sonarjs/no-nested-functions": "off",
		},
	},

	// Test files - relax some rules
	{
		files: ["**/*.test.ts", "**/*.spec.ts", "test/**/*"],
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
			"sonarjs/slow-regex": "off", // Test assertions use simple patterns
			"sonarjs/cognitive-complexity": "off", // Test fixtures can be complex
		},
	},

	// Node.js scripts
	{
		files: ["scripts/**/*.js"],
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
	},

	// Prettier - MUST be last to disable conflicting rules
	eslintConfigPrettier
);
