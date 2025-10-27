import OpenAI from "openai";

// Get API key from environment or localStorage
const getApiKey = (): string => {
  return (
    localStorage.getItem("deepseek_api_key") ||
    process.env.REACT_APP_DEEPSEEK_API_KEY ||
    ""
  );
};

// Optional proxy base URL (recommended for production)
const getProxyBaseUrl = (): string | null => {
  const fromStorage = localStorage.getItem("api_base_url");
  const fromEnv = process.env.REACT_APP_API_BASE;
  return fromStorage || fromEnv || null;
};

// Initialize OpenAI client for DeepSeek (fallback-only; avoid in production)
const openai = new OpenAI({
  apiKey: getApiKey(),
  baseURL: "https://api.deepseek.com/v1",
  // Keep browser use only as a last-resort fallback during local dev
  dangerouslyAllowBrowser: true,
});

export interface OpenAIConfig {
  model: string;
  temperature: number;
  maxTokens?: number;
}

export interface OpenAIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export const callOpenAI = async (
  prompt: string,
  config: OpenAIConfig
): Promise<OpenAIResponse> => {
  try {
    // Prefer secure proxy in production
    const proxyBase = getProxyBaseUrl();
    if (proxyBase) {
      const resp = await fetch(`${proxyBase.replace(/\/$/, "")}/llm/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, config }),
      });

      if (!resp.ok) {
        let errorText = "";
        try {
          errorText = await resp.text();
        } catch {
          errorText = "Unable to read error response";
        }

        // Throw with status code for better error classification
        const error = new Error(
          `API proxy error: ${resp.status} ${resp.statusText}`
        ) as any;
        error.statusCode = resp.status;
        error.responseText = errorText;
        throw error;
      }

      let data: any;
      try {
        data = await resp.json();
      } catch (parseError) {
        throw new Error(
          "Invalid JSON response from API proxy. The service may be misconfigured."
        );
      }

      // Validate response structure
      if (!data || typeof data !== "object") {
        throw new Error(
          "Invalid response structure from API proxy. Expected an object."
        );
      }

      return {
        content: data.content || "",
        usage: data.usage,
      };
    }

    // Fallback (dev only): direct browser call (keys are exposed!)
    if (process.env.NODE_ENV === "production") {
      const error = new Error(
        "LLM proxy not configured. In production, configure REACT_APP_API_BASE or localStorage 'api_base_url' to a secure backend."
      ) as any;
      error.isConfigurationError = true;
      throw error;
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      const error = new Error(
        "DeepSeek API key not configured. Set it in settings for local development, or configure a proxy for production."
      ) as any;
      error.isConfigurationError = true;
      throw error;
    }

    openai.apiKey = apiKey;

    let response: any;
    try {
      response = await openai.chat.completions.create({
        model: config.model,
        messages: [{ role: "user", content: prompt }],
        temperature: config.temperature,
        max_tokens: config.maxTokens || 1000,
      });
    } catch (apiError: any) {
      // Extract useful error information from OpenAI SDK errors
      const statusCode = apiError?.status || apiError?.response?.status;
      const errorMessage =
        apiError?.message || apiError?.error?.message || "Unknown API error";

      const error = new Error(errorMessage) as any;
      error.statusCode = statusCode;
      error.originalError = apiError;

      // Add specific error details based on status code
      if (statusCode === 401) {
        error.message =
          "Invalid or expired API key. Please check your API key in settings.";
      } else if (statusCode === 429) {
        error.message =
          "Rate limit exceeded. Please wait a moment and try again.";
      } else if (statusCode === 500 || statusCode === 503) {
        error.message =
          "The AI service is temporarily unavailable. Please try again later.";
      }

      throw error;
    }

    // Validate response structure
    if (!response || !response.choices || response.choices.length === 0) {
      throw new Error(
        "Invalid response structure from AI service. Expected choices array."
      );
    }

    const content = response.choices[0]?.message?.content || "";
    const usage = response.usage;

    // Warn if content is empty
    if (!content) {
      console.warn(
        "OpenAI API returned empty content. This may indicate an issue with the request or model."
      );
    }

    return {
      content,
      usage: usage
        ? {
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens,
          }
        : undefined,
    };
  } catch (error) {
    // Enhanced error logging
    console.error("OpenAI API Error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      statusCode: (error as any)?.statusCode,
      model: config.model,
      promptLength: prompt.length,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Re-throw with preserved error information
    throw error;
  }
};

export const generateEmbedding = async (
  text: string,
  model: string = "text-embedding-ada-002"
): Promise<number[]> => {
  // Prefer secure proxy in production
  const proxyBase = getProxyBaseUrl();
  if (proxyBase) {
    const resp = await fetch(`${proxyBase.replace(/\/$/, "")}/llm/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, model }),
    });
    if (!resp.ok) {
      const textBody = await resp.text();
      throw new Error(`Proxy error: ${resp.status} ${textBody}`);
    }
    const data = await resp.json();
    return data.embedding as number[];
  }

  // Fallback (dev only)
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Embedding proxy not configured. In production, configure REACT_APP_API_BASE or localStorage 'api_base_url' to a secure backend."
    );
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      "OpenAI API key not configured. Set it in settings for local development, or configure a proxy for production."
    );
  }

  openai.apiKey = apiKey;
  const response = await openai.embeddings.create({ model, input: text });
  return response.data[0].embedding;
};

export const getAvailableModels = (): string[] => {
  return ["deepseek-chat", "deepseek-reasoner"];
};
