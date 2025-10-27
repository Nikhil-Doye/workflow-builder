import Firecrawl from "@mendable/firecrawl-js";
import {
  safeAPICall,
  validateJSONResponse,
  formatAPIErrorForUI,
  getAPIErrorDetails,
} from "./apiErrorHandler";

// Get API key from environment or localStorage
const getFirecrawlApiKey = (): string => {
  return (
    localStorage.getItem("firecrawl_api_key") ||
    process.env.REACT_APP_FIRECRAWL_API_KEY ||
    ""
  );
};

// Optional proxy base URL (recommended for production)
const getProxyBaseUrl = (): string | null => {
  const fromStorage = localStorage.getItem("api_base_url");
  const fromEnv = process.env.REACT_APP_API_BASE;
  return fromStorage || fromEnv || null;
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
    const proxyBase = getProxyBaseUrl();

    // Validate URL
    const url = (config.url || "").trim();
    if (!/^https?:\/\//i.test(url)) {
      throw new Error(
        `Invalid URL provided to Firecrawl: "${config.url}". URL must start with http:// or https://`
      );
    }

    // Prefer secure proxy in production
    if (proxyBase) {
      const endpoint = `${proxyBase.replace(/\/$/, "")}/firecrawl/scrape`;
      const payload = {
        url,
        formats:
          config.formats && config.formats.length > 0
            ? config.formats
            : ["markdown"],
        onlyMainContent: config.onlyMainContent !== false,
        timeout: config.timeout,
        location: config.location,
      };

      const resp = await safeAPICall(
        () =>
          fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }),
        {
          timeout: config.timeout || 30000,
          retries: 1,
          retryDelay: 1500,
          validateResponse: () => ({ isValid: true, errors: [], warnings: [] }),
          operationName: "Firecrawl proxy scrape",
          context: { url },
        }
      );

      if (!resp.ok) {
        let body: any = "";
        try {
          body = await resp.text();
        } catch {}
        const err = new Error(
          `Firecrawl proxy error: ${resp.status} ${resp.statusText}`
        ) as any;
        (err as any).statusCode = resp.status;
        (err as any).responseText = body;
        throw err;
      }

      let data: any;
      try {
        data = await resp.json();
      } catch {
        throw new Error(
          "Invalid JSON response from Firecrawl proxy. The service may be misconfigured."
        );
      }

      return { success: true, data };
    }

    // Fallback (dev only): direct browser call with SDK
    if (process.env.NODE_ENV === "production") {
      const error = new Error(
        "Firecrawl proxy not configured. In production, configure REACT_APP_API_BASE or localStorage 'api_base_url' to a secure backend."
      ) as any;
      (error as any).isConfigurationError = true;
      throw error;
    }

    // Check if API key is configured (dev only)
    const apiKey = getFirecrawlApiKey();
    if (!apiKey || apiKey === "your_firecrawl_api_key_here") {
      const error = new Error(
        "Firecrawl API key not configured. Open Settings and add your Firecrawl API key."
      ) as any;
      (error as any).isConfigurationError = true;
      throw error;
    }

    // Initialize Firecrawl client with the current API key (dev only)
    const firecrawl = new Firecrawl({ apiKey });

    // Prepare minimal, whitelisted options
    const scrapeOptions: any = {
      formats:
        config.formats && config.formats.length > 0
          ? config.formats
          : ["markdown"],
      onlyMainContent: config.onlyMainContent !== false,
      ...(config.timeout !== undefined ? { timeout: config.timeout } : {}),
      ...(config.location ? { location: config.location } : {}),
    };

    // Perform the scrape with SDK
    const data = await firecrawl.scrape(url, scrapeOptions);
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
        actions: data.actions,
      },
    };
  } catch (error) {
    // Enhanced error handling with user-friendly messaging
    const apiError = getAPIErrorDetails(error);
    if (apiError) {
      const ui = formatAPIErrorForUI(error);
      return {
        success: false,
        error: `${ui.message} ${
          ui.action
            ? `Suggested action: ${ui.action}. Go to Settings → API Keys to configure.`
            : ""
        }`.trim(),
      };
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `${message} ${
        message.includes("API key") || message.includes("proxy")
          ? "Go to Settings → API Keys to configure your Firecrawl key or set a proxy."
          : ""
      }`.trim(),
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
    const proxyBase = getProxyBaseUrl();

    if (proxyBase) {
      const endpoint = `${proxyBase.replace(/\/$/, "")}/firecrawl/batch`;
      const payload = {
        urls,
        options: {
          formats: config?.formats || ["markdown", "html"],
          ...(config?.onlyMainContent !== undefined && {
            onlyMainContent: config.onlyMainContent,
          }),
          ...(config?.timeout && { timeout: config.timeout }),
          ...(config?.maxAge !== undefined && { maxAge: config.maxAge }),
        },
      };

      const resp = await safeAPICall(
        () =>
          fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }),
        {
          timeout: (config?.timeout as number) || 30000,
          retries: 1,
          retryDelay: 1500,
          validateResponse: () => ({ isValid: true, errors: [], warnings: [] }),
          operationName: "Firecrawl proxy batch scrape",
          context: { urlCount: urls.length },
        }
      );

      if (!resp.ok) {
        let body: any = "";
        try {
          body = await resp.text();
        } catch {}
        const err = new Error(
          `Firecrawl proxy error: ${resp.status} ${resp.statusText}`
        ) as any;
        (err as any).statusCode = resp.status;
        (err as any).responseText = body;
        throw err;
      }

      return await resp.json();
    }

    // Dev fallback with SDK
    if (process.env.NODE_ENV === "production") {
      const error = new Error(
        "Firecrawl proxy not configured. In production, configure REACT_APP_API_BASE or localStorage 'api_base_url' to a secure backend."
      ) as any;
      (error as any).isConfigurationError = true;
      throw error;
    }

    const apiKey = getFirecrawlApiKey();
    if (!apiKey || apiKey === "your_firecrawl_api_key_here") {
      const error = new Error(
        "Firecrawl API key not configured. Open Settings and add your Firecrawl API key."
      ) as any;
      (error as any).isConfigurationError = true;
      throw error;
    }

    const firecrawl = new Firecrawl({ apiKey });
    const options = {
      formats: config?.formats || ["markdown", "html"],
      ...(config?.onlyMainContent !== undefined && {
        onlyMainContent: config.onlyMainContent,
      }),
      ...(config?.timeout && { timeout: config.timeout }),
      ...(config?.maxAge !== undefined && { maxAge: config.maxAge }),
    };
    return await firecrawl.batchScrape(urls, options);
  } catch (error) {
    const apiError = getAPIErrorDetails(error);
    if (apiError) {
      const ui = formatAPIErrorForUI(error);
      throw new Error(
        `${ui.message} ${
          ui.action
            ? `Suggested action: ${ui.action}. Go to Settings → API Keys to configure.`
            : ""
        }`.trim()
      );
    }
    throw error instanceof Error ? error : new Error("Unknown Firecrawl error");
  }
};
