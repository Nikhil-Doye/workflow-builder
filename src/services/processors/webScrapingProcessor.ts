import { scrapeWithFirecrawl } from "../firecrawlService";
import { ExecutionContext, ExecutionPlan } from "../executionEngine";

export default async function webScrapingProcessor(
  context: ExecutionContext,
  plan: ExecutionPlan
): Promise<any> {
  const { config } = context;

  try {
    const result = await scrapeWithFirecrawl({
      url: config.url,
      formats: config.formats || ["markdown"],
      onlyMainContent:
        config.onlyMainContent !== undefined ? config.onlyMainContent : true,
      maxLength: config.maxLength || 10000,
    });

    if (result.success) {
      return {
        url: config.url,
        content: result.data?.markdown || "",
        metadata: result.data?.metadata || {},
        links: result.data?.links || [],
        images: result.data?.images || [],
        success: true,
      };
    } else {
      throw new Error(result.error || "Web scraping failed");
    }
  } catch (error) {
    throw new Error(
      `Web scraping failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
