import Firecrawl from "@mendable/firecrawl-js";

// Get API key from environment or localStorage
const getFirecrawlApiKey = (): string => {
  return (
    localStorage.getItem("firecrawl_api_key") ||
    process.env.REACT_APP_FIRECRAWL_API_KEY ||
    ""
  );
};

export interface FirecrawlConfig {
  url: string;
  formats?: (
    | "markdown"
    | "html"
    | "rawHtml"
    | "summary"
    | "links"
    | "images"
    | "screenshot"
    | "json"
  )[];
  includeTags?: string[];
  excludeTags?: string[];
  onlyMainContent?: boolean;
  maxLength?: number;
  waitFor?: number;
  timeout?: number;
  maxAge?: number;
  storeInCache?: boolean;
  actions?: any[];
  location?: {
    country?: string;
    languages?: string[];
  };
}

export interface FirecrawlResponse {
  success: boolean;
  data?: {
    markdown?: string;
    html?: string;
    rawHtml?: string;
    summary?: string;
    links?: string[];
    images?: string[];
    screenshot?: string;
    json?: any;
    metadata?: {
      title?: string;
      description?: string;
      language?: string;
      keywords?: string;
      robots?: string;
      ogTitle?: string;
      ogDescription?: string;
      ogUrl?: string;
      ogImage?: string;
      ogSiteName?: string;
      sourceURL?: string;
      statusCode?: number;
    };
    actions?: {
      screenshots?: string[];
      scrapes?: any[];
    };
  };
  error?: string;
}

export const scrapeWithFirecrawl = async (
  config: FirecrawlConfig
): Promise<FirecrawlResponse> => {
  try {
    // Check if API key is configured
    const apiKey = getFirecrawlApiKey();
    if (!apiKey || apiKey === "your_firecrawl_api_key_here") {
      throw new Error(
        "Firecrawl API key not configured. Please configure your API key in the settings."
      );
    }

    // Initialize Firecrawl client with the current API key
    const firecrawl = new Firecrawl({
      apiKey: apiKey,
    });

    // Prepare the scrape options according to Firecrawl v2 API
    const scrapeOptions: any = {
      formats: config.formats || ["markdown", "html"],
      onlyMainContent: config.onlyMainContent !== false, // Default to true
    };

    // Add optional parameters
    if (config.includeTags && config.includeTags.length > 0) {
      scrapeOptions.includeTags = config.includeTags;
    }

    if (config.excludeTags && config.excludeTags.length > 0) {
      scrapeOptions.excludeTags = config.excludeTags;
    }

    if (config.waitFor !== undefined) {
      scrapeOptions.waitFor = config.waitFor;
    }

    if (config.timeout !== undefined) {
      scrapeOptions.timeout = config.timeout;
    }

    if (config.maxAge !== undefined) {
      scrapeOptions.maxAge = config.maxAge;
    }

    if (config.storeInCache !== undefined) {
      scrapeOptions.storeInCache = config.storeInCache;
    }

    if (config.actions) {
      scrapeOptions.actions = config.actions;
    }

    if (config.location) {
      scrapeOptions.location = config.location;
    }

    // Perform the scrape - SDK returns data directly
    const data = await firecrawl.scrape(config.url, scrapeOptions);

    // Apply max length to markdown if specified
    if (config.maxLength && data.markdown) {
      data.markdown = data.markdown.substring(0, config.maxLength) + "...";
    }

    return {
      success: true,
      data: {
        markdown: data.markdown,
        html: data.html,
        rawHtml: data.rawHtml,
        summary: data.summary,
        links: data.links,
        images: data.images,
        screenshot: data.screenshot,
        json: data.json,
        //  metadata: data.metadata,
        actions: data.actions,
      },
    };
  } catch (error) {
    console.error("Firecrawl API Error:", error);

    // Return a fallback response if API fails
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

export const getFirecrawlApiKeyStatus = (): boolean => {
  const apiKey = getFirecrawlApiKey();
  return !!(apiKey && apiKey !== "your_firecrawl_api_key_here");
};

// New helper function for batch scraping
export const batchScrapeWithFirecrawl = async (
  urls: string[],
  config?: Omit<FirecrawlConfig, "url">
): Promise<any> => {
  try {
    const apiKey = getFirecrawlApiKey();
    if (!apiKey || apiKey === "your_firecrawl_api_key_here") {
      throw new Error(
        "Firecrawl API key not configured. Please configure your API key in the settings."
      );
    }

    const firecrawl = new Firecrawl({
      apiKey: apiKey,
    });

    const options = {
      formats: config?.formats || ["markdown", "html"],
      ...(config?.onlyMainContent !== undefined && {
        onlyMainContent: config.onlyMainContent,
      }),
      ...(config?.timeout && { timeout: config.timeout }),
      ...(config?.maxAge !== undefined && { maxAge: config.maxAge }),
    };

    // Use the batch_scrape method (synchronous version)
    const result = await firecrawl.batchScrape(urls, options);

    return result;
  } catch (error) {
    console.error("Batch scrape error:", error);
    throw error;
  }
};
