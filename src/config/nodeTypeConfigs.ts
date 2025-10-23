import { NodeType } from "../types";

export interface NodeTypeConfig {
  technicalName: string;
  userFriendlyName: string;
  description: string;
  category: string;
  icon: string;
  helpText: string;
  commonUseCases: string[];
}

export const nodeTypeConfigs: Record<NodeType, NodeTypeConfig> = {
  dataInput: {
    technicalName: "dataInput",
    userFriendlyName: "Get Data From",
    description: "Import data from files, websites, or other sources",
    category: "Data Sources",
    icon: "📥",
    helpText:
      "This node is your starting point. It brings data into your workflow from files, websites, databases, or manual input.",
    commonUseCases: [
      "Upload a CSV file with customer data",
      "Enter a website URL to scrape content",
      "Connect to your database to get records",
    ],
  },
  webScraping: {
    technicalName: "webScraping",
    userFriendlyName: "Get Website Content",
    description: "Extract text, images, and data from websites",
    category: "Data Sources",
    icon: "🌐",
    helpText:
      "Automatically visit websites and extract the content you need. Perfect for gathering information from news sites, product pages, or any public webpage.",
    commonUseCases: [
      "Scrape product prices from e-commerce sites",
      "Extract news articles for analysis",
      "Get contact information from business directories",
    ],
  },
  llmTask: {
    technicalName: "llmTask",
    userFriendlyName: "AI Assistant",
    description: "Use AI to analyze, summarize, or transform your data",
    category: "Processing",
    icon: "🤖",
    helpText:
      "Your AI-powered helper that can read, understand, and work with text data. It can summarize documents, answer questions, translate languages, or generate new content.",
    commonUseCases: [
      "Summarize long documents",
      "Generate product descriptions",
      "Translate text to different languages",
      "Extract key information from emails",
    ],
  },
  embeddingGenerator: {
    technicalName: "embeddingGenerator",
    userFriendlyName: "Create Search Index",
    description:
      "Convert text into searchable format for finding similar content",
    category: "Processing",
    icon: "🧠",
    helpText:
      "Transforms your text into a format that AI can use to find similar content. Think of it as creating a smart index for your data.",
    commonUseCases: [
      "Make your documents searchable",
      "Find similar articles or posts",
      "Create a knowledge base from your content",
    ],
  },
  similaritySearch: {
    technicalName: "similaritySearch",
    userFriendlyName: "Find Similar Content",
    description:
      "Search through your data to find content similar to what you're looking for",
    category: "Processing",
    icon: "🔍",
    helpText:
      "Uses AI to find content that's similar to your search. Great for finding related articles, similar products, or matching customer inquiries.",
    commonUseCases: [
      "Find similar customer support tickets",
      "Match job descriptions to resumes",
      "Find related articles in your content library",
    ],
  },
  structuredOutput: {
    technicalName: "structuredOutput",
    userFriendlyName: "Format Data",
    description: "Organize and structure your data in a specific format",
    category: "Processing",
    icon: "📋",
    helpText:
      "Takes messy or unstructured data and organizes it into a clean, consistent format. Perfect for preparing data for reports or other systems.",
    commonUseCases: [
      "Convert text into structured tables",
      "Format data for reports",
      "Prepare data for import into other systems",
    ],
  },
  dataOutput: {
    technicalName: "dataOutput",
    userFriendlyName: "Send Data To",
    description:
      "Export or send your processed data to files, emails, or other systems",
    category: "Output",
    icon: "📤",
    helpText:
      "This is where your workflow delivers results. You can save data to files, send emails, update databases, or display results.",
    commonUseCases: [
      "Save results to a CSV file",
      "Send email reports",
      "Update your CRM with new leads",
      "Display results on a dashboard",
    ],
  },
  database: {
    technicalName: "database",
    userFriendlyName: "Database Operations",
    description: "Query, insert, update, delete, and manage database records",
    category: "Data Sources",
    icon: "🗄️",
    helpText:
      "Connect and interact with your database in multiple ways. Query data, insert new records, update existing ones, delete records, run aggregations, or execute transactions. Choose your operation type and configure accordingly.",
    commonUseCases: [
      "Query customer data from your database",
      "Insert new leads from form submissions",
      "Update customer information and status",
      "Delete old or duplicate records",
      "Run reports with aggregate functions",
      "Execute complex multi-step transactions",
      "Sync data between different systems",
    ],
  },
  slack: {
    technicalName: "slack",
    userFriendlyName: "Slack Integration",
    description:
      "Send messages, manage channels, interact with users, and more on Slack",
    category: "Communication",
    icon: "💬",
    helpText:
      "Integrate with Slack to send messages, create channels, manage users, share files, add reactions, and set reminders. Perfect for notifications and team communication.",
    commonUseCases: [
      "Send automated notifications to channels",
      "Post daily reports and updates",
      "Create project-specific channels",
      "Send direct messages to team members",
      "Share files and documents",
      "Set reminders for important tasks",
      "React to messages with emojis",
    ],
  },
  discord: {
    technicalName: "discord",
    userFriendlyName: "Discord Integration",
    description:
      "Send messages, manage channels, roles, and interact with Discord servers",
    category: "Communication",
    icon: "🎮",
    helpText:
      "Integrate with Discord to send messages, create channels, manage roles, add reactions, and interact with your community. Perfect for gaming communities and developer teams.",
    commonUseCases: [
      "Send automated messages to channels",
      "Create and manage server channels",
      "Assign roles to users automatically",
      "Add reactions to messages",
      "Manage voice channels",
      "Send webhook notifications",
      "Moderate server content",
      "Welcome new members",
    ],
  },
};

export const getNodeTypeConfig = (nodeType: NodeType): NodeTypeConfig => {
  return (
    nodeTypeConfigs[nodeType] || {
      technicalName: nodeType,
      userFriendlyName: nodeType,
      description: "Unknown node type",
      category: "Other",
      icon: "❓",
      helpText: "This node type is not yet configured with help information.",
      commonUseCases: [],
    }
  );
};

export const getNodeTypesByCategory = (): Record<string, NodeType[]> => {
  const categories: Record<string, NodeType[]> = {};

  Object.entries(nodeTypeConfigs).forEach(([nodeType, config]) => {
    if (!categories[config.category]) {
      categories[config.category] = [];
    }
    categories[config.category].push(nodeType as NodeType);
  });

  return categories;
};
