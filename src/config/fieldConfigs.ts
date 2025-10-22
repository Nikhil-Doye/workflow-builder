export interface FieldConfig {
  technicalName: string;
  userFriendlyName: string;
  description: string;
  helpText: string;
  examples: string[];
  validation?: {
    required: boolean;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}

export const fieldConfigs: Record<string, FieldConfig> = {
  // Data Input Fields
  dataType: {
    technicalName: "dataType",
    userFriendlyName: "What type of data?",
    description: "Choose the format of your input data",
    helpText:
      "Select the type of data you're working with. This helps the system process your data correctly.",
    examples: [
      "Text document",
      "CSV spreadsheet",
      "Website URL",
      "PDF file",
      "JSON data",
    ],
    validation: {
      required: true,
    },
  },
  defaultValue: {
    technicalName: "defaultValue",
    userFriendlyName: "Sample data",
    description: "Provide example data to test your workflow",
    helpText:
      "Enter sample data that represents what you'll be processing. This helps test your workflow before using real data.",
    examples: [
      "John Doe, john@example.com, 555-1234",
      "https://example.com",
      "Sample product description",
    ],
  },

  // AI Task Fields
  prompt: {
    technicalName: "prompt",
    userFriendlyName: "What should AI do?",
    description: "Tell the AI what task to perform on your data",
    helpText:
      "Write clear instructions for what you want the AI to do. Be specific about the output format you want.",
    examples: [
      "Summarize this text in 3 bullet points",
      "Extract the main topics from this document",
      "Translate this text to Spanish",
      "Generate a product description based on these features",
    ],
    validation: {
      required: true,
      minLength: 10,
    },
  },
  model: {
    technicalName: "model",
    userFriendlyName: "AI Assistant type",
    description: "Choose which AI model to use for your task",
    helpText:
      "Different AI models are better at different tasks. The default option works well for most cases.",
    examples: ["DeepSeek Chat (recommended)", "OpenAI GPT-4", "OpenAI GPT-3.5"],
    validation: {
      required: true,
    },
  },
  temperature: {
    technicalName: "temperature",
    userFriendlyName: "How creative should AI be?",
    description: "Control how creative or focused the AI responses are",
    helpText:
      "Lower values (0.1-0.3) give more focused, consistent responses. Higher values (0.7-1.0) give more creative, varied responses.",
    examples: [
      "0.1 - Very focused (good for facts)",
      "0.7 - Balanced (good for most tasks)",
      "1.0 - Very creative (good for writing)",
    ],
    validation: {
      required: true,
    },
  },
  maxTokens: {
    technicalName: "maxTokens",
    userFriendlyName: "Response length",
    description: "Set the maximum length of AI responses",
    helpText:
      "Controls how long the AI response can be. Shorter responses are faster and cheaper, longer responses give more detail.",
    examples: [
      "100 - Very short (1-2 sentences)",
      "500 - Short (1 paragraph)",
      "1000 - Medium (2-3 paragraphs)",
      "2000 - Long (detailed response)",
    ],
    validation: {
      required: true,
    },
  },

  // Web Scraping Fields
  url: {
    technicalName: "url",
    userFriendlyName: "Website address",
    description: "Enter the URL of the website to scrape",
    helpText:
      "Provide the full website address (including https://) that you want to extract content from.",
    examples: [
      "https://example.com",
      "https://news.ycombinator.com",
      "https://github.com/trending",
    ],
    validation: {
      required: true,
      pattern: "^https?://.+",
    },
  },
  formats: {
    technicalName: "formats",
    userFriendlyName: "What format do you want?",
    description: "Choose how you want the website content formatted",
    helpText:
      "Select the format that best fits your needs. Markdown is great for text, HTML preserves formatting, and JSON is good for structured data.",
    examples: [
      "Markdown - Clean text format",
      "HTML - Preserves website formatting",
      "JSON - Structured data format",
    ],
    validation: {
      required: true,
    },
  },
  maxLength: {
    technicalName: "maxLength",
    userFriendlyName: "Maximum content length",
    description: "Set the maximum amount of content to extract",
    helpText:
      "Limit how much content to extract from the website. This helps avoid processing very long pages and keeps costs down.",
    examples: [
      "1000 - Short article",
      "5000 - Medium article",
      "10000 - Long article",
      "20000 - Very long content",
    ],
    validation: {
      required: true,
    },
  },
  onlyMainContent: {
    technicalName: "onlyMainContent",
    userFriendlyName: "Extract main content only?",
    description: "Focus on the main article content, skip navigation and ads",
    helpText:
      "When enabled, this extracts only the main content of the page, filtering out navigation menus, advertisements, and other non-essential elements.",
    examples: [
      "Yes - Clean article content only",
      "No - Include all page elements",
    ],
  },
  includeTags: {
    technicalName: "includeTags",
    userFriendlyName: "Include specific elements",
    description: "Specify which HTML elements to include",
    helpText:
      "Enter CSS selectors to include specific parts of the page. Leave empty to include everything.",
    examples: ["h1, h2, p", ".article-content", "#main"],
  },
  excludeTags: {
    technicalName: "excludeTags",
    userFriendlyName: "Exclude specific elements",
    description: "Specify which HTML elements to exclude",
    helpText:
      "Enter CSS selectors to exclude specific parts of the page like ads, navigation, or footers.",
    examples: [".advertisement", "nav", ".sidebar", "footer"],
  },

  // Database Fields
  query: {
    technicalName: "query",
    userFriendlyName: "What data do you want?",
    description: "Write a query to get specific data from your database",
    helpText:
      "Write a database query to retrieve the data you need. Use simple language or SQL depending on your database type.",
    examples: [
      "SELECT * FROM customers WHERE created_at > '2024-01-01'",
      "Find all products with price > 100",
      "Get the last 10 orders",
    ],
    validation: {
      required: true,
      minLength: 5,
    },
  },
  table: {
    technicalName: "table",
    userFriendlyName: "Which table?",
    description: "Select the database table to work with",
    helpText:
      "Choose which table in your database contains the data you want to work with.",
    examples: ["customers", "products", "orders", "inventory"],
    validation: {
      required: true,
    },
  },
  connectionId: {
    technicalName: "connectionId",
    userFriendlyName: "Database connection",
    description: "Choose which database to connect to",
    helpText:
      "Select a pre-configured database connection. You can manage connections in the Database settings.",
    examples: ["Production Database", "Test Database", "Analytics Database"],
    validation: {
      required: true,
    },
  },

  // Output Fields
  format: {
    technicalName: "format",
    userFriendlyName: "Output format",
    description: "Choose how to format your final results",
    helpText:
      "Select the format for your output data. This determines how your results will be saved or displayed.",
    examples: [
      "JSON - Structured data",
      "CSV - Spreadsheet format",
      "TXT - Plain text",
      "HTML - Web format",
    ],
    validation: {
      required: true,
    },
  },
  filename: {
    technicalName: "filename",
    userFriendlyName: "File name",
    description: "Name for the output file",
    helpText:
      "Enter a name for the file where your results will be saved. Include the file extension (.csv, .txt, .json).",
    examples: ["report.csv", "analysis.txt", "data.json", "results.html"],
    validation: {
      required: true,
      pattern: '^[^<>:"/\\\\|?*]+\\.[a-zA-Z0-9]+$',
    },
  },

  // Similarity Search Fields
  vectorStore: {
    technicalName: "vectorStore",
    userFriendlyName: "Search database",
    description: "Choose where to search for similar content",
    helpText:
      "Select the vector database where your content is indexed. This is where the AI will search for similar content.",
    examples: ["Pinecone", "Weaviate", "Chroma"],
    validation: {
      required: true,
    },
  },
  topK: {
    technicalName: "topK",
    userFriendlyName: "How many results?",
    description: "Number of similar results to return",
    helpText:
      "Set how many similar results you want to find. More results give you more options but may include less relevant matches.",
    examples: [
      "3 - Few results (most relevant)",
      "5 - Moderate results",
      "10 - Many results",
    ],
    validation: {
      required: true,
    },
  },
  threshold: {
    technicalName: "threshold",
    userFriendlyName: "How similar should results be?",
    description: "Minimum similarity score for results",
    helpText:
      "Set how similar results need to be to your search. Higher values (0.8-1.0) return only very similar content. Lower values (0.5-0.7) return more varied results.",
    examples: [
      "0.9 - Very similar only",
      "0.8 - Similar",
      "0.6 - Somewhat similar",
    ],
    validation: {
      required: true,
    },
  },

  // Structured Output Fields
  schema: {
    technicalName: "schema",
    userFriendlyName: "Data structure",
    description: "Define how you want your data organized",
    helpText:
      "Describe the structure you want for your output data. This helps the AI format your results consistently.",
    examples: [
      "Name, Email, Phone",
      "Title, Description, Price, Category",
      "Date, Amount, Description, Category",
    ],
    validation: {
      required: true,
      minLength: 5,
    },
  },

  // General Fields
  label: {
    technicalName: "label",
    userFriendlyName: "Node name",
    description: "Give this node a descriptive name",
    helpText:
      "Choose a name that describes what this node does. This helps you identify it in your workflow and use it in other nodes.",
    examples: [
      "Customer Data Input",
      "AI Content Analyzer",
      "Email Report Generator",
    ],
    validation: {
      required: true,
      minLength: 3,
      maxLength: 50,
    },
  },
};

export const getFieldConfig = (fieldName: string): FieldConfig | null => {
  return fieldConfigs[fieldName] || null;
};

export const getFieldsForNodeType = (nodeType: string): string[] => {
  const fieldMappings: Record<string, string[]> = {
    dataInput: ["dataType", "defaultValue", "label"],
    webScraping: [
      "url",
      "formats",
      "maxLength",
      "onlyMainContent",
      "includeTags",
      "excludeTags",
      "label",
    ],
    llmTask: ["prompt", "model", "temperature", "maxTokens", "label"],
    embeddingGenerator: ["model", "label"],
    similaritySearch: ["vectorStore", "topK", "threshold", "label"],
    structuredOutput: ["schema", "model", "label"],
    dataOutput: ["format", "filename", "label"],
    databaseQuery: ["connectionId", "query", "table", "label"],
    databaseInsert: ["connectionId", "table", "label"],
    databaseUpdate: ["connectionId", "table", "label"],
    databaseDelete: ["connectionId", "table", "label"],
  };

  return fieldMappings[nodeType] || [];
};
