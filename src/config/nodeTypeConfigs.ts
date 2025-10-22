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
  databaseQuery: {
    technicalName: "databaseQuery",
    userFriendlyName: "Get Database Info",
    description: "Retrieve specific information from your database",
    category: "Data Sources",
    icon: "🗄️",
    helpText:
      "Searches your database to find specific records or information. You can ask for customers, products, orders, or any data stored in your database.",
    commonUseCases: [
      "Find all customers from last month",
      "Get product inventory levels",
      "Retrieve order details",
      "Search for specific records",
    ],
  },
  databaseInsert: {
    technicalName: "databaseInsert",
    userFriendlyName: "Add to Database",
    description: "Add new records to your database",
    category: "Output",
    icon: "➕",
    helpText:
      "Adds new information to your database. Perfect for saving new customers, products, or any new data you've collected.",
    commonUseCases: [
      "Add new customer records",
      "Save form submissions",
      "Store new product information",
      "Record new transactions",
    ],
  },
  databaseUpdate: {
    technicalName: "databaseUpdate",
    userFriendlyName: "Update Database",
    description: "Modify existing records in your database",
    category: "Output",
    icon: "✏️",
    helpText:
      "Changes information that's already in your database. Use this to update customer details, product prices, or any existing records.",
    commonUseCases: [
      "Update customer contact information",
      "Change product prices",
      "Mark orders as completed",
      "Update employee records",
    ],
  },
  databaseDelete: {
    technicalName: "databaseDelete",
    userFriendlyName: "Remove from Database",
    description: "Delete records from your database",
    category: "Output",
    icon: "🗑️",
    helpText:
      "Removes records from your database. Use carefully - this action cannot be undone. Good for cleaning up old data or removing duplicates.",
    commonUseCases: [
      "Remove duplicate records",
      "Delete old test data",
      "Clean up expired records",
      "Remove cancelled orders",
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
