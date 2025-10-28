/**
 * Robust JSON Parser for LLM Outputs
 *
 * LLMs can occasionally generate malformed JSON with issues like:
 * - Code block wrappers (```json ... ```)
 * - Trailing commas in objects/arrays
 * - Extra whitespace or newlines
 * - Markdown formatting
 * - Incomplete JSON (truncated responses)
 *
 * This utility provides multiple parsing strategies to recover from these issues.
 */

export interface ParseResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  strategy?: string;
  cleanedJson?: string;
}

/**
 * Parse JSON with multiple fallback strategies
 */
export function parseRobustJson<T = any>(
  input: string,
  options: {
    strictMode?: boolean;
    fallbackValue?: T;
    logAttempts?: boolean;
  } = {}
): ParseResult<T> {
  const { strictMode = false, fallbackValue, logAttempts = false } = options;

  // Strategy 1: Direct parse (fast path for valid JSON)
  try {
    const data = JSON.parse(input);
    return { success: true, data, strategy: "direct" };
  } catch (error) {
    if (logAttempts) {
      console.debug("Direct JSON parse failed, trying cleanup strategies...");
    }
  }

  // Strategy 2: Clean and parse (remove common issues)
  try {
    const cleaned = cleanJsonString(input);
    const data = JSON.parse(cleaned);
    return { success: true, data, strategy: "cleaned", cleanedJson: cleaned };
  } catch (error) {
    if (logAttempts) {
      console.debug("Cleaned JSON parse failed, trying advanced recovery...");
    }
  }

  // Strategy 3: Advanced recovery (fix trailing commas, incomplete JSON)
  try {
    const recovered = advancedJsonRecovery(input);
    const data = JSON.parse(recovered);
    return {
      success: true,
      data,
      strategy: "recovered",
      cleanedJson: recovered,
    };
  } catch (error) {
    if (logAttempts) {
      console.debug("Advanced recovery failed");
    }
  }

  // Strategy 4: Relaxed parsing (more tolerant, less strict)
  if (!strictMode) {
    try {
      const relaxed = relaxedJsonParse(input);
      return {
        success: true,
        data: relaxed as T,
        strategy: "relaxed",
      };
    } catch (error) {
      if (logAttempts) {
        console.debug("Relaxed parsing failed");
      }
    }
  }

  // All strategies failed
  if (fallbackValue !== undefined) {
    return {
      success: false,
      data: fallbackValue,
      error: "All parsing strategies failed, using fallback value",
      strategy: "fallback",
    };
  }

  return {
    success: false,
    error: "Failed to parse JSON after trying all strategies",
  };
}

/**
 * Clean JSON string by removing common LLM artifacts
 */
function cleanJsonString(input: string): string {
  let cleaned = input.trim();

  // Remove code block markers (```json ... ``` or ``` ... ```)
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, "");
  cleaned = cleaned.replace(/\n?```\s*$/i, "");

  // Remove any leading/trailing markdown formatting
  cleaned = cleaned.replace(/^[\s\n]*\{/g, "{");
  cleaned = cleaned.replace(/\}[\s\n]*$/g, "}");
  cleaned = cleaned.replace(/^[\s\n]*\[/g, "[");
  cleaned = cleaned.replace(/\][\s\n]*$/g, "]");

  // Remove BOM (Byte Order Mark) if present
  if (cleaned.charCodeAt(0) === 0xfeff) {
    cleaned = cleaned.slice(1);
  }

  return cleaned.trim();
}

/**
 * Advanced JSON recovery - fix common structural issues
 */
function advancedJsonRecovery(input: string): string {
  let recovered = cleanJsonString(input);

  // Fix trailing commas in objects: ,} -> }
  recovered = recovered.replace(/,(\s*})/g, "$1");

  // Fix trailing commas in arrays: ,] -> ]
  recovered = recovered.replace(/,(\s*])/g, "$1");

  // Fix multiple consecutive commas
  recovered = recovered.replace(/,\s*,+/g, ",");

  // Fix missing quotes around property names (relaxed JSON)
  // e.g., {name: "value"} -> {"name": "value"}
  recovered = recovered.replace(
    /(\{|\,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g,
    '$1"$2":'
  );

  // Fix single quotes to double quotes (in property names and values)
  // This is a simple approach - for complex cases, use a proper parser
  recovered = recovered.replace(/'([^']*?)'/g, '"$1"');

  // Remove comments (both // and /* */ style)
  recovered = recovered.replace(/\/\*[\s\S]*?\*\//g, "");
  recovered = recovered.replace(/\/\/.*/g, "");

  // Remove trailing comma before closing brace/bracket at end of line
  recovered = recovered.replace(/,\s*\n\s*([}\]])/g, "\n$1");

  return recovered;
}

/**
 * Relaxed JSON parser - attempt to extract JSON even from partial/broken input
 */
function relaxedJsonParse(input: string): any {
  const cleaned = cleanJsonString(input);

  // Try to find JSON object or array boundaries
  const objectMatch = cleaned.match(/\{[\s\S]*\}/);
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);

  if (objectMatch) {
    const extracted = objectMatch[0];
    try {
      return JSON.parse(advancedJsonRecovery(extracted));
    } catch {
      // If still fails, try to extract key-value pairs manually
      return extractKeyValuePairs(extracted);
    }
  }

  if (arrayMatch) {
    const extracted = arrayMatch[0];
    try {
      return JSON.parse(advancedJsonRecovery(extracted));
    } catch {
      // If still fails, return empty array
      return [];
    }
  }

  // Last resort: try to extract any JSON-like structure
  return extractKeyValuePairs(cleaned);
}

/**
 * Extract key-value pairs manually (very relaxed parsing)
 */
function extractKeyValuePairs(input: string): Record<string, any> {
  const result: Record<string, any> = {};

  // Match key-value patterns like "key": "value" or key: value
  const kvPattern = /["']?([a-zA-Z_][a-zA-Z0-9_]*)["']?\s*:\s*([^,}\n]+)/g;
  let match;

  while ((match = kvPattern.exec(input)) !== null) {
    const key = match[1];
    let value: any = match[2].trim();

    // Remove trailing comma or closing brace
    value = value.replace(/[,}]\s*$/, "").trim();

    // Remove quotes if present
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    // Try to parse as number or boolean
    if (value === "true") value = true;
    else if (value === "false") value = false;
    else if (value === "null") value = null;
    else if (!isNaN(Number(value)) && value !== "") value = Number(value);

    result[key] = value;
  }

  return result;
}

/**
 * Validate that parsed JSON has expected structure
 */
export function validateJsonStructure<T = any>(
  data: any,
  requiredFields: Array<{ field: string; type: string }>,
  options: { allowExtra?: boolean } = {}
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    errors.push("Parsed data is not an object");
    return { isValid: false, errors };
  }

  for (const { field, type } of requiredFields) {
    if (!(field in data)) {
      errors.push(`Missing required field: ${field}`);
      continue;
    }

    const actualType = Array.isArray(data[field])
      ? "array"
      : typeof data[field];

    if (actualType !== type) {
      errors.push(
        `Field '${field}' has incorrect type: expected ${type}, got ${actualType}`
      );
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Parse JSON with validation
 */
export function parseAndValidate<T = any>(
  input: string,
  requiredFields: Array<{ field: string; type: string }>,
  options: {
    strictMode?: boolean;
    fallbackValue?: T;
    logAttempts?: boolean;
    allowExtra?: boolean;
  } = {}
): ParseResult<T> & { validationErrors?: string[] } {
  const parseResult = parseRobustJson<T>(input, options);

  if (!parseResult.success) {
    return parseResult;
  }

  const validation = validateJsonStructure(parseResult.data, requiredFields, {
    allowExtra: options.allowExtra,
  });

  if (!validation.isValid) {
    return {
      ...parseResult,
      success: false,
      error: `Validation failed: ${validation.errors.join(", ")}`,
      validationErrors: validation.errors,
    };
  }

  return parseResult;
}
