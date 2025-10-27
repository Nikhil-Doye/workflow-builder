import { BaseTool } from "./BaseTool";
import { ToolParameter, ToolResult } from "../../types/tools";

/**
 * Cache entry interface with LRU tracking
 */
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  lastAccessed: number;
  accessCount: number;
}

/**
 * Cache statistics for performance monitoring
 */
interface CacheStats {
  size: number;
  maxSize: number;
  hitRate: number;
  hits: number;
  misses: number;
  evictions: number;
  totalRequests: number;
  averageAccessCount: number;
  oldestEntryAge: number;
  newestEntryAge: number;
}

/**
 * LRU Cache implementation with TTL support and performance tracking
 */
export class CacheLookupTool extends BaseTool {
  name = "cache_lookup";
  description =
    "Look up cached results for similar requests to improve performance with LRU eviction";
  parameters: ToolParameter[] = [
    {
      name: "key",
      type: "string",
      description: "The cache key to look up",
      required: true,
    },
  ];

  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_SIZE = 100; // Maximum cache entries

  // Performance tracking
  private hits = 0;
  private misses = 0;
  private evictions = 0;

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
      this.misses++;
      return null; // Cache miss
    }

    // Check if entry has expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.misses++;
      return null; // Cache expired
    }

    // Cache hit - update LRU tracking
    this.hits++;
    entry.lastAccessed = now;
    entry.accessCount++;

    // Move to end of Map (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.data;
  }

  /**
   * Store data in cache with LRU eviction
   */
  store(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    const now = Date.now();

    // Check if we need to evict entries (LRU)
    if (this.cache.size >= this.MAX_SIZE && !this.cache.has(key)) {
      this.evictLRU();
    }

    // Update existing entry or add new one
    const entry: CacheEntry = {
      data,
      timestamp: now,
      ttl,
      lastAccessed: now,
      accessCount: 0,
    };

    // Remove old entry if exists (to move to end of Map)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    this.cache.set(key, entry);
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    if (this.cache.size === 0) return;

    // First entry in Map is least recently used (due to our re-ordering on access)
    const firstKey = this.cache.keys().next().value;
    if (firstKey) {
      this.cache.delete(firstKey);
      this.evictions++;
      console.log(`[CacheLookupTool] LRU eviction: ${firstKey}`);
    }
  }

  // Helper method to generate cache key from user input
  generateKey(userInput: string): string {
    return userInput.toLowerCase().trim().replace(/\s+/g, "_");
  }

  /**
   * Clear expired entries
   */
  clearExpired(): number {
    const now = Date.now();
    let cleared = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleared++;
      }
    }

    if (cleared > 0) {
      console.log(`[CacheLookupTool] Cleared ${cleared} expired entries`);
    }

    return cleared;
  }

  /**
   * Get comprehensive cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? this.hits / totalRequests : 0;

    // Calculate average access count
    let totalAccessCount = 0;
    let oldestTimestamp = Date.now();
    let newestTimestamp = 0;

    for (const entry of this.cache.values()) {
      totalAccessCount += entry.accessCount;
      oldestTimestamp = Math.min(oldestTimestamp, entry.timestamp);
      newestTimestamp = Math.max(newestTimestamp, entry.timestamp);
    }

    const averageAccessCount =
      this.cache.size > 0 ? totalAccessCount / this.cache.size : 0;

    const now = Date.now();
    const oldestEntryAge = this.cache.size > 0 ? now - oldestTimestamp : 0;
    const newestEntryAge = this.cache.size > 0 ? now - newestTimestamp : 0;

    return {
      size: this.cache.size,
      maxSize: this.MAX_SIZE,
      hitRate: Number(hitRate.toFixed(4)),
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      totalRequests,
      averageAccessCount: Number(averageAccessCount.toFixed(2)),
      oldestEntryAge: Math.floor(oldestEntryAge / 1000), // seconds
      newestEntryAge: Math.floor(newestEntryAge / 1000), // seconds
    };
  }

  /**
   * Get detailed cache report for monitoring
   */
  getDetailedReport(): string {
    const stats = this.getStats();
    const utilizationPercent = ((stats.size / stats.maxSize) * 100).toFixed(1);

    return `
Cache Performance Report
========================
Size: ${stats.size}/${stats.maxSize} (${utilizationPercent}% utilized)
Hit Rate: ${(stats.hitRate * 100).toFixed(2)}%
Hits: ${stats.hits}
Misses: ${stats.misses}
Total Requests: ${stats.totalRequests}
Evictions: ${stats.evictions}
Average Access Count: ${stats.averageAccessCount}
Oldest Entry: ${stats.oldestEntryAge}s ago
Newest Entry: ${stats.newestEntryAge}s ago

Performance:
- Cache efficiency: ${
      stats.hitRate >= 0.7 ? "Good ✓" : stats.hitRate >= 0.5 ? "Fair" : "Poor ✗"
    }
- Memory usage: ${stats.size >= stats.maxSize * 0.9 ? "High ⚠" : "Normal"}
- Eviction pressure: ${
      stats.evictions > stats.totalRequests * 0.1 ? "High ⚠" : "Normal"
    }
    `.trim();
  }

  /**
   * Reset all statistics (useful for testing)
   */
  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    console.log("[CacheLookupTool] Cache cleared");
  }

  /**
   * Get cache entries sorted by access frequency (for analysis)
   */
  getTopEntries(
    limit: number = 10
  ): Array<{ key: string; accessCount: number; age: number }> {
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({
        key,
        accessCount: entry.accessCount,
        age: Math.floor((Date.now() - entry.timestamp) / 1000),
      }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit);

    return entries;
  }
}
