import OpenAI from "openai";

// Get API key from environment or localStorage
const getApiKey = (): string => {
  return (
    localStorage.getItem("openai_api_key") ||
    process.env.REACT_APP_OPENAI_API_KEY ||
    ""
  );
};

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: getApiKey(),
  dangerouslyAllowBrowser: true, // Only for development - in production, use a backend
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
    // Check if API key is configured
    const apiKey = getApiKey();
    if (!apiKey || apiKey === "your_openai_api_key_here") {
      throw new Error(
        "OpenAI API key not configured. Please configure your API key in the settings."
      );
    }

    // Update the OpenAI client with the current API key
    openai.apiKey = apiKey;

    const response = await openai.chat.completions.create({
      model: config.model,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
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

    // Return a fallback response if API fails
    return {
      content: `Error calling OpenAI API: ${
        error instanceof Error ? error.message : "Unknown error"
      }. Please check your API key and try again.`,
    };
  }
};

export const getAvailableModels = (): string[] => {
  return [
    "gpt-3.5-turbo",
    "gpt-3.5-turbo-16k",
    "gpt-4",
    "gpt-4-turbo-preview",
    "gpt-4-32k",
  ];
};
