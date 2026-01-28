/**
 * PresetCoder - Compress and decompress presets for URL sharing
 *
 * Uses a multi-layer compression strategy:
 * 1. Strip unnecessary data (IDs, timestamps)
 * 2. Shorten keys (name -> n, parameters -> p, etc.)
 * 3. Encode enum values (queryParam -> q, etc.)
 * 4. LZ compression with URL-safe encoding
 */
import LZString from "lz-string";

import type { Parameter, ParameterType, Preset, PrimitiveType } from "../logic/parameters/types";
import { generateId } from "../logic/parameters/types";

/**
 * Key mappings used for compression:
 * - name -> n
 * - description -> d
 * - parameters -> p
 * - type -> t
 * - key -> k
 * - value -> v
 * - primitiveType -> pt
 */

// Parameter type mappings
const TYPE_MAP: Record<ParameterType, string> = {
	cookie: "c",
	localStorage: "l",
	queryParam: "q",
};

const TYPE_MAP_REVERSE: Record<string, ParameterType> = {
	c: "cookie",
	l: "localStorage",
	q: "queryParam",
};

// Primitive type mappings
const PRIMITIVE_TYPE_MAP: Record<PrimitiveType, string> = {
	boolean: "b",
	string: "s",
};

const PRIMITIVE_TYPE_MAP_REVERSE: Record<string, PrimitiveType> = {
	b: "boolean",
	s: "string",
};

// Compact parameter structure (for compression)
interface CompactParameter {
	d?: string; // description
	k: string; // key
	pt?: string; // primitiveType
	t: string; // type
	v: string; // value
}

// Compact preset structure (for compression)
interface CompactPreset {
	d?: string; // description
	n: string; // name
	p: CompactParameter[]; // parameters
}

/**
 * Convert a full Preset to a compact format for compression
 */
function toCompact(preset: Preset): CompactPreset {
	const compact: CompactPreset = {
		n: preset.name,
		p: preset.parameters.map((param) => {
			const compactParam: CompactParameter = {
				k: param.key,
				t: TYPE_MAP[param.type],
				v: param.value,
			};

			if (param.description) {
				compactParam.d = param.description;
			}

			if (param.primitiveType && param.primitiveType !== "string") {
				compactParam.pt = PRIMITIVE_TYPE_MAP[param.primitiveType];
			}

			return compactParam;
		}),
	};

	if (preset.description) {
		compact.d = preset.description;
	}

	return compact;
}

/**
 * Convert a compact format back to a full Preset
 */
function fromCompact(compact: CompactPreset): Preset {
	const now = Date.now();

	return {
		createdAt: now,
		description: compact.d,
		id: generateId(),
		name: compact.n,
		parameters: compact.p.map((cp) => {
			const param: Parameter = {
				id: generateId(),
				key: cp.k,
				type: TYPE_MAP_REVERSE[cp.t],
				value: cp.v,
			};

			if (cp.d) {
				param.description = cp.d;
			}

			if (cp.pt) {
				param.primitiveType = PRIMITIVE_TYPE_MAP_REVERSE[cp.pt];
			}

			return param;
		}),
		updatedAt: now,
	};
}

/**
 * Result of decompressing a preset string
 */
export interface DecompressResult {
	/** The decompressed presets */
	result: Preset[];
	/** Number of presets found */
	count: number;
	/** Whether multiple presets were found */
	isMultiplePresets: boolean;
}

/**
 * PresetCoder - Compress and decompress presets for URL sharing
 */
export class PresetCoder {
	/**
	 * Compress an array of presets to a URL-safe string
	 */
	static compress(presets: Preset[]): string {
		// Convert to compact format
		const compact = presets.map(toCompact);

		// Stringify with minimal whitespace
		const json = JSON.stringify(compact);

		// LZ compress and encode for URL
		const compressed = LZString.compressToEncodedURIComponent(json);

		return compressed;
	}

	/**
	 * Decompress a URL-safe string back to presets
	 */
	static decompress(encoded: string): DecompressResult {
		if (!encoded) {
			throw new Error("Cannot decompress empty string");
		}

		// LZ decompress
		const json = LZString.decompressFromEncodedURIComponent(encoded);

		if (!json) {
			throw new Error("Invalid compressed string");
		}

		// Parse JSON
		let compact: CompactPreset[];
		try {
			compact = JSON.parse(json);
		} catch {
			throw new Error("Invalid compressed string: failed to parse JSON");
		}

		// Convert back to full presets
		const result = compact.map(fromCompact);

		return {
			count: result.length,
			isMultiplePresets: result.length > 1,
			result,
		};
	}
}
