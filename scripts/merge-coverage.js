import { existsSync, mkdirSync, rmSync, readdirSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import MCR from "monocart-coverage-reports";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, "..");

const vitestCoverageDir = resolve(projectRoot, "coverage/vitest");
const playwrightCoverageDir = resolve(projectRoot, "coverage/playwright");
const mergedCoverageDir = resolve(projectRoot, "coverage/merged");

// Clean and recreate the merged directory
if (existsSync(mergedCoverageDir)) {
	try {
		rmSync(mergedCoverageDir, { recursive: true, force: true });
	} catch {
		// Ignore errors
	}
}
mkdirSync(mergedCoverageDir, { recursive: true });

// Collect coverage files
const coverageFiles = [];

// Find Vitest coverage files (only coverage-final.json, not coverage-summary.json)
if (existsSync(vitestCoverageDir)) {
	const vitestFiles = readdirSync(vitestCoverageDir).filter(
		(f) => f === "coverage-final.json"
	);
	for (const file of vitestFiles) {
		coverageFiles.push(resolve(vitestCoverageDir, file));
	}
	console.log(`Found Vitest coverage: ${vitestFiles.length} file(s)`);
}

// Find Playwright coverage files (only coverage-final.json, not coverage-summary.json)
if (existsSync(playwrightCoverageDir)) {
	const playwrightFiles = readdirSync(playwrightCoverageDir).filter(
		(f) => f === "coverage-final.json"
	);
	for (const file of playwrightFiles) {
		coverageFiles.push(resolve(playwrightCoverageDir, file));
	}
	console.log(`Found Playwright coverage: ${playwrightFiles.length} file(s)`);
}

if (coverageFiles.length === 0) {
	console.warn(
		"No coverage data files found. Make sure to run tests with coverage enabled."
	);
	process.exit(0);
}

console.log(`\nMerging coverage from ${coverageFiles.length} file(s)...`);

// Merge coverage using monocart-coverage-reports
const coverageReport = new MCR({
	name: "Combined Coverage Report",
	outputDir: mergedCoverageDir,
	reports: ["console-details", "html", "json", "json-summary", "lcov"],
	// Exclude test files and config files
	entryFilter: (entry) => {
		if (!entry.url) return false;
		return (
			entry.url.includes("/src/") &&
			!entry.url.includes("/test/") &&
			!entry.url.includes(".config.")
		);
	},
	sourceFilter: (sourcePath) => {
		return (
			sourcePath.includes("/src/") &&
			!sourcePath.includes("/test/") &&
			!sourcePath.includes(".config.")
		);
	},
});

// Add coverage from each file
for (const filePath of coverageFiles) {
	try {
		const content = readFileSync(filePath, "utf-8");
		const data = JSON.parse(content);
		await coverageReport.add(data);
		console.log(`  Added: ${filePath}`);
	} catch (error) {
		console.warn(`Warning: Could not process ${filePath}:`, error.message);
	}
}

// Generate the merged report
await coverageReport.generate();

const reportPath = resolve(mergedCoverageDir, "index.html");

if (existsSync(reportPath)) {
	console.log(`\n✅ Coverage merged successfully!`);
	console.log(`📊 View the merged report at: ${reportPath}`);
	console.log(`\nIndividual reports:`);
	console.log(`  - Vitest: ${resolve(vitestCoverageDir, "index.html")}`);
	console.log(
		`  - Playwright: ${resolve(playwrightCoverageDir, "index.html")}`
	);
} else {
	console.error(`\n❌ Error: Coverage report was not generated`);
	process.exit(1);
}
