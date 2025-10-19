// Get API key from environment or localStorage
const getPineconeApiKey = (): string => {
  return (
    localStorage.getItem("pinecone_api_key") ||
    process.env.REACT_APP_PINECONE_API_KEY ||
    ""
  );
};

// Get environment from environment or localStorage
const getPineconeEnvironment = (): string => {
  return (
    localStorage.getItem("pinecone_environment") ||
    process.env.REACT_APP_PINECONE_ENVIRONMENT ||
    "us-east-1-aws"
  );
};

// Get Pinecone API base URL
const getPineconeApiUrl = (): string => {
  const environment = getPineconeEnvironment();
  return `https://${environment}.pinecone.io`;
};

export const initializePinecone = async (): Promise<void> => {
  const apiKey = getPineconeApiKey();

  if (!apiKey || apiKey === "your_pinecone_api_key_here") {
    throw new Error(
      "Pinecone API key not configured. Please configure your API key in the settings."
    );
  }

  // Test the API key by making a simple request
  try {
    const response = await fetch(`${getPineconeApiUrl()}/actions/whoami`, {
      method: "GET",
      headers: {
        "Api-Key": apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Pinecone API authentication failed: ${response.status} ${response.statusText}`
      );
    }
  } catch (error) {
    throw new Error(
      `Failed to initialize Pinecone: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export interface SimilaritySearchResult {
  id: string;
  content: string;
  similarity: number;
  metadata?: Record<string, any>;
}

export const searchSimilarVectors = async (
  queryVector: number[],
  indexName: string,
  topK: number = 5,
  threshold: number = 0.8
): Promise<SimilaritySearchResult[]> => {
  await initializePinecone();

  const apiKey = getPineconeApiKey();
  const apiUrl = getPineconeApiUrl();

  const response = await fetch(`${apiUrl}/vectors/query`, {
    method: "POST",
    headers: {
      "Api-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      vector: queryVector,
      topK,
      includeMetadata: true,
      filter: {},
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Pinecone query failed: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  const results: SimilaritySearchResult[] =
    data.matches
      ?.filter((match: any) => match.score && match.score >= threshold)
      .map((match: any) => ({
        id: match.id || "",
        content: match.metadata?.content || "",
        similarity: match.score || 0,
        metadata: match.metadata,
      })) || [];

  return results;
};

export const upsertVectors = async (
  vectors: Array<{
    id: string;
    values: number[];
    metadata?: Record<string, any>;
  }>,
  indexName: string
): Promise<void> => {
  await initializePinecone();

  const apiKey = getPineconeApiKey();
  const apiUrl = getPineconeApiUrl();

  const response = await fetch(`${apiUrl}/vectors/upsert`, {
    method: "POST",
    headers: {
      "Api-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      vectors: vectors,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Pinecone upsert failed: ${response.status} ${response.statusText}`
    );
  }
};
