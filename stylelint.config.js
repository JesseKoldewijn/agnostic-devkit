/** @type {import('stylelint').Config} */
export default {
	extends: ["stylelint-config-standard", "stylelint-config-tailwindcss"],
	rules: {
		// Allow Tailwind's @theme, @apply, @config, @plugin, @source, @utility, @variant directives
		"at-rule-no-unknown": [
			true,
			{
				ignoreAtRules: [
					"tailwind",
					"apply",
					"config",
					"plugin",
					"source",
					"utility",
					"variant",
					"theme",
					"layer",
					"screen",
					"responsive",
					"variants",
				],
			},
		],
		// Allow Tailwind's theme() function
		"function-no-unknown": [
			true,
			{
				ignoreFunctions: ["theme", "screen"],
			},
		],
		// Disable import-notation rule - Tailwind v4 uses @import differently
		"import-notation": null,
		// Allow custom properties without fallback (Tailwind generates them)
		"custom-property-no-missing-var-function": null,
		// Disable color function notation preference (Tailwind uses both)
		"color-function-notation": null,
		// Allow alpha-value percentage (Tailwind uses both)
		"alpha-value-notation": null,
		// Allow empty lines before custom properties (for readability grouping)
		"custom-property-empty-line-before": null,
		// Allow both short and long hex colors
		"color-hex-length": null,
		// Allow quotes around font family names (more explicit)
		"font-family-name-quotes": null,
		// Allow duplicate selectors (sometimes needed for cascade)
		"no-duplicate-selectors": null,
	},
	ignoreFiles: ["build-output/**", "node_modules/**", "coverage/**", ".wxt/**"],
};
