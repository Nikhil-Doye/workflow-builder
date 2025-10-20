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
        const text = await resp.text();
        throw new Error(`Proxy error: ${resp.status} ${text}`);
      }

      const data = await resp.json();
      return {
        content: data.content || "",
        usage: data.usage,
      };
    }

    // Fallback (dev only): direct browser call (keys are exposed!)
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "LLM proxy not configured. In production, configure REACT_APP_API_BASE or localStorage 'api_base_url' to a secure backend."
      );
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error(
        "DeepSeek API key not configured. Set it in settings for local development, or configure a proxy for production."
      );
    }

    openai.apiKey = apiKey;
    const response = await openai.chat.completions.create({
      model: config.model,
      messages: [{ role: "user", content: prompt }],
      temperature: config.temperature,
      max_tokens: config.maxTokens || 1000,
    });

    const content = response.choices[0]?.message?.content || "";
    const usage = response.usage;

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
    console.error("OpenAI API Error:", error);
    throw new Error(
      `OpenAI API call failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
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
