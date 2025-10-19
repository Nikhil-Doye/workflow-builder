import { BaseTool } from "./BaseTool";
import { ToolParameter, ToolResult } from "../../types/tools";

export class CacheLookupTool extends BaseTool {
  name = "cache_lookup";
  description =
    "Look up cached results for similar requests to improve performance";
  parameters: ToolParameter[] = [
    {
      name: "key",
      type: "string",
      description: "The cache key to look up",
      required: true,
    },
  ];

  private cache = new Map<
    string,
    { data: any; timestamp: number; ttl: number }
  >();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  async execute(params: Record<string, any>): Promise<ToolResult> {
    const { key } = params;

    if (!key || typeof key !== "string") {
      return this.createResult(false, null, "Invalid cache key provided");
    }

    try {
      const { result, executionTime } = await this.measureExecution(
        async () => {
          return await this.lookupCache(key);
        }
      );

      return this.createResult(true, result, undefined, {
        executionTime,
        confidence: result ? 0.9 : 0.0,
      });
    } catch (error) {
      console.error("Error in CacheLookupTool:", error);
      return this.createResult(
        false,
        null,
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  private async lookupCache(key: string): Promise<any> {
    const entry = this.cache.get(key);

    if (!entry) {
      return null; // Cache miss
    }

    // Check if entry has expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null; // Cache expired
    }

    return entry.data;
  }

  // Helper method to store data in cache
  store(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  // Helper method to generate cache key from user input
  generateKey(userInput: string): string {
    return userInput.toLowerCase().trim().replace(/\s+/g, "_");
  }

  // Helper method to clear expired entries
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Helper method to get cache statistics
  getStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0.8, // Placeholder - would track actual hit rate
    };
  }
}
