import archiver from "archiver";
import { createWriteStream, existsSync, unlinkSync } from "fs";
import { resolve } from "path";

async function packageExtension() {
	const outputPath = resolve("dist/extension.zip");

	// Remove old zip if it exists
	if (existsSync(outputPath)) {
		unlinkSync(outputPath);
		console.log("🗑️ Removed old extension.zip");
	}

	const output = createWriteStream(outputPath);
	const archive = archiver("zip", { zlib: { level: 9 } });

	return new Promise((resolvePromise, reject) => {
		output.on("close", () => {
			const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
			console.log(`✅ Created extension.zip (${sizeInMB} MB)`);
			resolvePromise();
		});

		archive.on("error", (err) => {
			reject(err);
		});

		archive.on("warning", (err) => {
			if (err.code === "ENOENT") {
				console.warn("⚠️ Warning:", err.message);
			} else {
				reject(err);
			}
		});

		archive.pipe(output);
		archive.glob("**/*", {
			cwd: "dist/",
			ignore: ["extension.zip"],
		});

		archive.finalize();
	});
}

packageExtension().catch((err) => {
	console.error("❌ Error creating zip:", err);
	process.exit(1);
});
