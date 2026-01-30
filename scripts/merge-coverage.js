import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, "..");

const coverageDir = resolve(projectRoot, "coverage");
const vitestSummary = resolve(coverageDir, "vitest/coverage-summary.json");
const playwrightSummary = resolve(coverageDir, "playwright/coverage-summary.json");
const outputDir = resolve(coverageDir, "combined");

const METRIC_TYPES = ["lines", "statements", "functions", "branches"];

/**
 * Merge two coverage summaries by deduplicating files and taking the best coverage.
 * For files that appear in both reports, we take the MAX of covered counts.
 * This prevents double-counting when both unit tests and E2E tests cover the same file.
 */
function mergeSummaries(s1, s2) {
	// Collect all unique file paths (excluding 'total')
	const allFiles = new Set([
		...Object.keys(s1).filter((k) => k !== "total"),
		...Object.keys(s2).filter((k) => k !== "total"),
	]);

	// Merge per-file coverage, taking MAX covered for overlapping files
	const mergedFiles = {};
	for (const filePath of allFiles) {
		const f1 = s1[filePath];
		const f2 = s2[filePath];

		if (f1 && f2) {
			// File appears in both - take max coverage
			mergedFiles[filePath] = mergeFileCoverage(f1, f2);
		} else {
			// File only in one report - use that
			mergedFiles[filePath] = f1 || f2;
		}
	}

	// Calculate totals from merged file data
	const totals = {
		branches: { covered: 0, pct: 0, skipped: 0, total: 0 },
		functions: { covered: 0, pct: 0, skipped: 0, total: 0 },
		lines: { covered: 0, pct: 0, skipped: 0, total: 0 },
		statements: { covered: 0, pct: 0, skipped: 0, total: 0 },
	};

	for (const filePath of Object.keys(mergedFiles)) {
		const fileCov = mergedFiles[filePath];
		for (const type of METRIC_TYPES) {
			if (fileCov[type]) {
				totals[type].total += fileCov[type].total || 0;
				totals[type].covered += fileCov[type].covered || 0;
				totals[type].skipped += fileCov[type].skipped || 0;
			}
		}
	}

	// Calculate percentages
	for (const type of METRIC_TYPES) {
		if (totals[type].total > 0) {
			totals[type].pct = Math.round((totals[type].covered / totals[type].total) * 100 * 100) / 100;
		}
	}

	return { total: totals, ...mergedFiles };
}

/**
 * Merge coverage for a single file by taking MAX of covered counts.
 * Total should be the same in both reports (same file), but we validate.
 */
function mergeFileCoverage(f1, f2) {
	const result = {};
	for (const type of METRIC_TYPES) {
		const m1 = f1[type] || { covered: 0, total: 0, skipped: 0 };
		const m2 = f2[type] || { covered: 0, total: 0, skipped: 0 };

		// Take max of totals in case of slight differences
		const total = Math.max(m1.total, m2.total);
		// Take max of covered (best coverage from either test suite)
		const covered = Math.max(m1.covered, m2.covered);
		// Ensure covered doesn't exceed total
		const finalCovered = Math.min(covered, total);

		result[type] = {
			covered: finalCovered,
			pct: total > 0 ? Math.round((finalCovered / total) * 100 * 100) / 100 : 0,
			skipped: Math.max(m1.skipped || 0, m2.skipped || 0),
			total,
		};
	}
	return result;
}

async function mergeCoverage() {
	console.log("Merging coverage summaries...");

	if (!existsSync(outputDir)) {
		mkdirSync(outputDir, { recursive: true });
	}

	let s1 = null;
	let s2 = null;

	if (existsSync(vitestSummary)) {
		try {
			s1 = JSON.parse(readFileSync(vitestSummary, "utf8"));
			console.log("✅ Loaded Vitest summary");
		} catch {
			console.warn("Warning: Could not read Vitest summary");
		}
	}

	if (existsSync(playwrightSummary)) {
		try {
			s2 = JSON.parse(readFileSync(playwrightSummary, "utf8"));
			console.log("✅ Loaded Playwright summary");
		} catch {
			console.warn("Warning: Could not read Playwright summary");
		}
	}

	if (s1 && s2) {
		const combined = mergeSummaries(s1, s2);
		writeFileSync(resolve(outputDir, "coverage-summary.json"), JSON.stringify(combined, null, 2));
		console.log("\n✅ Combined coverage summary generated!");
		console.log(`📊 Combined Total Coverage: ${Math.round(combined.total.lines.pct)}%`);
	} else if (s1 || s2) {
		const combined = s1 || s2;
		writeFileSync(resolve(outputDir, "coverage-summary.json"), JSON.stringify(combined, null, 2));
		console.log("\n✅ Using single available coverage summary as combined");
		console.log(`📊 Combined Total Coverage: ${Math.round(combined.total.lines.pct)}%`);
	} else {
		console.error("❌ No coverage summaries found to merge.");
		process.exit(1);
	}
}

mergeCoverage().catch((error) => {
	console.error("Error merging coverage:", error);
	process.exit(1);
});
