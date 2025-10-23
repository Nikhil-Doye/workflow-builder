/**
 * Registry for tracking supported node processors
 */
export class ProcessorRegistry {
  private static supportedTypes: Set<string> = new Set([
    "dataInput",
    "dataOutput",
    "webScraping",
    "llmTask",
    "database",
    "slack",
    "discord",
    "structuredOutput",
    "embeddingGenerator",
    "similaritySearch",
  ]);

  private static deprecatedTypes: Set<string> = new Set([
    // Add deprecated types here as they become obsolete
  ]);

  private static experimentalTypes: Set<string> = new Set([
    // Add experimental types here
  ]);

  /**
   * Check if a node type is supported
   */
  static isSupported(nodeType: string): boolean {
    return this.supportedTypes.has(nodeType);
  }

  /**
   * Check if a node type is deprecated
   */
  static isDeprecated(nodeType: string): boolean {
    return this.deprecatedTypes.has(nodeType);
  }

  /**
   * Check if a node type is experimental
   */
  static isExperimental(nodeType: string): boolean {
    return this.experimentalTypes.has(nodeType);
  }

  /**
   * Get all supported node types
   */
  static getSupportedTypes(): string[] {
    return Array.from(this.supportedTypes);
  }

  /**
   * Get all deprecated node types
   */
  static getDeprecatedTypes(): string[] {
    return Array.from(this.deprecatedTypes);
  }

  /**
   * Get all experimental node types
   */
  static getExperimentalTypes(): string[] {
    return Array.from(this.experimentalTypes);
  }

  /**
   * Register a new supported node type
   */
  static registerType(
    nodeType: string,
    options?: {
      experimental?: boolean;
      deprecated?: boolean;
    }
  ): void {
    this.supportedTypes.add(nodeType);

    if (options?.experimental) {
      this.experimentalTypes.add(nodeType);
    }

    if (options?.deprecated) {
      this.deprecatedTypes.add(nodeType);
    }
  }

  /**
   * Mark a node type as deprecated
   */
  static markAsDeprecated(nodeType: string): void {
    this.deprecatedTypes.add(nodeType);
  }

  /**
   * Mark a node type as experimental
   */
  static markAsExperimental(nodeType: string): void {
    this.experimentalTypes.add(nodeType);
  }

  /**
   * Get node type status information
   */
  static getNodeTypeStatus(nodeType: string): {
    supported: boolean;
    deprecated: boolean;
    experimental: boolean;
    status: "supported" | "deprecated" | "experimental" | "unsupported";
  } {
    const supported = this.isSupported(nodeType);
    const deprecated = this.isDeprecated(nodeType);
    const experimental = this.isExperimental(nodeType);

    let status: "supported" | "deprecated" | "experimental" | "unsupported";
    if (!supported) {
      status = "unsupported";
    } else if (deprecated) {
      status = "deprecated";
    } else if (experimental) {
      status = "experimental";
    } else {
      status = "supported";
    }

    return {
      supported,
      deprecated,
      experimental,
      status,
    };
  }

  /**
   * Get suggestions for similar node types
   */
  static getSimilarTypes(nodeType: string): string[] {
    const similarTypes: string[] = [];

    // Simple similarity matching based on common patterns
    const patterns = [
      { pattern: /data/i, types: ["dataInput", "dataOutput"] },
      { pattern: /web|scrap|extract/i, types: ["webScraping"] },
      { pattern: /llm|ai|gpt|openai/i, types: ["llmTask"] },
      {
        pattern: /db|database|sql/i,
        types: ["database"],
      },
      {
        pattern: /slack|message|notification|chat/i,
        types: ["slack"],
      },
      {
        pattern: /discord|gaming|community|server/i,
        types: ["discord"],
      },
      {
        pattern: /embed|vector/i,
        types: ["embeddingGenerator", "similaritySearch"],
      },
      { pattern: /struct|schema|json/i, types: ["structuredOutput"] },
    ];

    patterns.forEach(({ pattern, types }) => {
      if (pattern.test(nodeType)) {
        similarTypes.push(...types.filter((type) => this.isSupported(type)));
      }
    });

    return [...new Set(similarTypes)]; // Remove duplicates
  }
}
