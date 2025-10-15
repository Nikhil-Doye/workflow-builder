import FirecrawlApp from "@mendable/firecrawl-js";

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
  formats?: ("markdown" | "html" | "text" | "summary" | "links" | "images")[];
  includeTags?: string[];
  excludeTags?: string[];
  onlyMainContent?: boolean;
  maxLength?: number;
  waitFor?: number;
  timeout?: number;
}

export interface FirecrawlResponse {
  success: boolean;
  data?: {
    content: string;
    markdown?: string;
    html?: string;
    metadata?: {
      title?: string;
      description?: string;
      language?: string;
      sourceURL?: string;
      createdAt?: string;
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
    const firecrawl = new FirecrawlApp({
      apiKey: apiKey,
    });

    // Prepare the scrape options according to Firecrawl v2 API
    const scrapeOptions: any = {
      formats: config.formats || ["markdown", "html"],
      onlyMainContent: config.onlyMainContent !== false, // Default to true
    };

    if (config.includeTags && config.includeTags.length > 0) {
      scrapeOptions.includeTags = config.includeTags;
    }

    if (config.excludeTags && config.excludeTags.length > 0) {
      scrapeOptions.excludeTags = config.excludeTags;
    }

    if (config.waitFor) {
      scrapeOptions.waitFor = config.waitFor;
    }

    if (config.timeout) {
      scrapeOptions.timeout = config.timeout;
    }

    // Perform the scrape using the correct method name
    const scrapeResult = await firecrawl.scrape(config.url, scrapeOptions);

    if (!scrapeResult.success) {
      throw new Error(scrapeResult.error || "Failed to scrape URL");
    }

    const data = scrapeResult.data;
    let content = data.markdown || data.html || data.content || "";

    // Apply max length if specified
    if (config.maxLength && content.length > config.maxLength) {
      content = content.substring(0, config.maxLength) + "...";
    }

    return {
      success: true,
      data: {
        content,
        markdown: data.markdown,
        html: data.html,
        metadata: {
          title: data.metadata?.title,
          description: data.metadata?.description,
          language: data.metadata?.language,
          sourceURL: config.url,
          createdAt: new Date().toISOString(),
        },
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
