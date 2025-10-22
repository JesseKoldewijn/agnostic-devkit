import { readdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import MCR from "monocart-coverage-reports";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, "..");

const playwrightCoverageDir = resolve(projectRoot, "coverage/playwright");

// Check if Playwright coverage data exists
if (!existsSync(playwrightCoverageDir)) {
	console.warn(
		"No Playwright coverage directory found. Run tests with CI_COVERAGE=true first."
	);
	process.exit(0);
}

const coverageFiles = readdirSync(playwrightCoverageDir).filter((file) =>
	file.endsWith(".json")
);

if (coverageFiles.length === 0) {
	console.warn(
		"No Playwright coverage files found. Run tests with CI_COVERAGE=true first."
	);
	process.exit(0);
}

console.log(
	`Generating Playwright coverage report from ${coverageFiles.length} file(s)...`
);

// Generate standalone Playwright coverage report
const coverageReport = new MCR({
	name: "Playwright E2E Coverage Report",
	outputDir: playwrightCoverageDir,
	reports: ["console-details", "html", "json", "lcov"],
	// Exclude test files and config files
	entryFilter: (entry) => {
		return (
			entry.url &&
			entry.url.includes("/src/") &&
			!entry.url.includes("/test/") &&
			!entry.url.includes(".config.")
		);
	},
	// Source filter for source files
	sourceFilter: (sourcePath) => {
		return (
			sourcePath.includes("/src/") &&
			!sourcePath.includes("/test/") &&
			!sourcePath.includes(".config.")
		);
	},
});

// Add all coverage files
for (const file of coverageFiles) {
	const filePath = resolve(playwrightCoverageDir, file);
	try {
		const data = await import(filePath, { with: { type: "json" } });
		await coverageReport.add(data.default || data);
	} catch (error) {
		console.warn(`Warning: Could not process ${file}:`, error.message);
	}
}

// Generate the reports
await coverageReport.generate();

console.log(`\n✅ Playwright coverage report generated!`);
console.log(
	`📊 View the report at: ${resolve(playwrightCoverageDir, "index.html")}`
);
