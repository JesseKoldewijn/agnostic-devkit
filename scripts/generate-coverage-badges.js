import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, "..");

function getCoverageScore(type) {
	const coverageDir = resolve(projectRoot, `coverage/${type}`);
	const summaryFile = resolve(coverageDir, "coverage-summary.json");

	if (!existsSync(summaryFile)) {
		return null;
	}

	try {
		const summary = JSON.parse(readFileSync(summaryFile, "utf-8"));
		
		// Handle different summary formats
		// Vitest format: { total: { lines: { pct: ... } } }
		// Monocart format: { total: { lines: { pct: ... } } }
		if (summary.total && summary.total.lines && typeof summary.total.lines.pct === "number") {
			return Math.round(summary.total.lines.pct);
		}
		
		// Fallback: try to find any coverage percentage
		if (summary.total) {
			const totals = summary.total;
			if (totals.lines?.pct !== undefined) return Math.round(totals.lines.pct);
			if (totals.statements?.pct !== undefined) return Math.round(totals.statements.pct);
			if (totals.branches?.pct !== undefined) return Math.round(totals.branches.pct);
			if (totals.functions?.pct !== undefined) return Math.round(totals.functions.pct);
		}
		
		return null;
	} catch (error) {
		console.error(`Error reading coverage summary for ${type}:`, error.message);
		return null;
	}
}

const badgesDir = resolve(projectRoot, ".badges");

// Ensure badges directory exists
if (!existsSync(badgesDir)) {
	mkdirSync(badgesDir, { recursive: true });
}

function generateBadgeJson(score, label) {
	const color =
		score >= 80 ? "brightgreen" : score >= 60 ? "yellow" : score >= 40 ? "orange" : "red";

	return {
		schemaVersion: 1,
		label: label,
		message: `${score}%`,
		color: color,
	};
}

// Get coverage scores
const vitestScore = getCoverageScore("vitest");
const playwrightScore = getCoverageScore("playwright");
const combinedScore = getCoverageScore("combined");

// Generate badge JSON files
if (vitestScore !== null) {
	const badge = generateBadgeJson(vitestScore, "Unit Coverage");
	writeFileSync(
		resolve(badgesDir, "coverage-unit.json"),
		JSON.stringify(badge, null, 2)
	);
	console.log(`✅ Generated unit coverage badge: ${vitestScore}%`);
} else {
	console.warn("⚠️  No Vitest coverage data found");
}

if (playwrightScore !== null) {
	const badge = generateBadgeJson(playwrightScore, "E2E Coverage");
	writeFileSync(
		resolve(badgesDir, "coverage-e2e.json"),
		JSON.stringify(badge, null, 2)
	);
	console.log(`✅ Generated E2E coverage badge: ${playwrightScore}%`);
} else {
	console.warn("⚠️  No Playwright coverage data found");
}

if (combinedScore !== null) {
	const badge = generateBadgeJson(combinedScore, "Total Coverage");
	writeFileSync(
		resolve(badgesDir, "coverage-total.json"),
		JSON.stringify(badge, null, 2)
	);
	console.log(`✅ Generated total coverage badge: ${combinedScore}%`);
} else {
	console.warn("⚠️  No combined coverage data found");
}

