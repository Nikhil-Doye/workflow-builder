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
      // Add base URL if needed
      // baseURL: 'https://api.firecrawl.dev/v0'
    });

    // Validate URL
    const url = (config.url || "").trim();
    if (!/^https?:\/\//i.test(url)) {
      throw new Error(
        `Invalid URL provided to Firecrawl: "${config.url}". URL must start with http:// or https://`
      );
    }

    // Prepare a minimal, whitelisted options object per Firecrawl v2
    // Some undocumented keys can cause 400 errors; keep this strict.
    const scrapeOptions: any = {
      formats:
        config.formats && config.formats.length > 0
          ? config.formats
          : ["markdown"],
      onlyMainContent: config.onlyMainContent !== false,
      ...(config.timeout !== undefined ? { timeout: config.timeout } : {}),
      ...(config.location ? { location: config.location } : {}),
    };

    // Perform the scrape - SDK returns data directly
    console.log("Firecrawl API Call - URL:", config.url);
    console.log("Firecrawl API Call - Options:", scrapeOptions);

    try {
      // First attempt with provided options
      const data = await firecrawl.scrape(url, scrapeOptions);
      console.log("Firecrawl API Response:", data);

      if (!data) {
        throw new Error("No data returned from Firecrawl API");
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
    } catch (apiError) {
      // Extract as much detail as possible from the error
      const anyErr: any = apiError as any;
      const status = anyErr?.status || anyErr?.response?.status;
      const body = anyErr?.response?.data || anyErr?.data || anyErr?.message;
      console.error("Firecrawl API Call Error:", {
        status,
        body,
      });

      // If it's a 400 Bad Request, retry once with ultra-minimal options
      if (status === 400) {
        const minimalOptions = {
          formats: ["markdown"],
          onlyMainContent: true,
        } as const;
        console.warn(
          "Retrying Firecrawl.scrape with minimal options:",
          minimalOptions
        );
        const retryData = await firecrawl.scrape(url, minimalOptions as any);
        if (!retryData) {
          throw new Error("No data returned from Firecrawl API (after retry)");
        }
        return {
          success: true,
          data: {
            markdown: retryData.markdown,
            html: retryData.html,
            rawHtml: retryData.rawHtml,
            summary: retryData.summary,
            links: retryData.links,
            images: retryData.images,
            screenshot: retryData.screenshot,
            json: retryData.json,
            actions: retryData.actions,
          },
        };
      }

      throw new Error(
        `Firecrawl request failed${status ? ` (status ${status})` : ""}: ${
          typeof body === "string" ? body : JSON.stringify(body)
        }`
      );
    }
  } catch (error) {
    console.error("Firecrawl API Error:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });

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
