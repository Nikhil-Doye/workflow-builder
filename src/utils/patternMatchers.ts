import {
  IntentClassification,
  EntityExtraction,
  ComplexityAnalysis,
} from "../types";

// Pattern matching for different intent types
export const intentPatterns = {
  WEB_SCRAPING: [
    /scrape/i,
    /extract.*website/i,
    /get.*from.*url/i,
    /web.*content/i,
    /html.*content/i,
    /crawl/i,
    /fetch.*page/i,
    /download.*content/i,
  ],
  AI_ANALYSIS: [
    /analyze/i,
    /summarize/i,
    /classify/i,
    /sentiment/i,
    /ai.*process/i,
    /llm/i,
    /gpt/i,
    /artificial.*intelligence/i,
    /machine.*learning/i,
    /nlp/i,
    /natural.*language/i,
  ],
  DATA_PROCESSING: [
    /convert/i,
    /transform/i,
    /format/i,
    /parse/i,
    /json/i,
    /csv/i,
    /structure/i,
    /process.*data/i,
    /clean.*data/i,
    /normalize/i,
    /standardize/i,
  ],
  SEARCH_AND_RETRIEVAL: [
    /search/i,
    /find.*similar/i,
    /embedding/i,
    /vector.*search/i,
    /similarity/i,
    /match/i,
    /retrieve/i,
    /lookup/i,
    /query/i,
  ],
  CONTENT_GENERATION: [
    /generate/i,
    /create.*content/i,
    /write/i,
    /produce/i,
    /synthesize/i,
    /compose/i,
    /draft/i,
    /author/i,
    /craft/i,
  ],
};

// Mixed intent patterns
export const mixedIntentPatterns = {
  // Sequential operations
  sequential: [
    /first.*then/i,
    /scrape.*and.*analyze/i,
    /extract.*then.*process/i,
    /get.*data.*and.*transform/i,
    /step.*by.*step/i,
    /after.*that/i,
    /then.*also/i,
  ],

  // Parallel operations
  parallel: [
    /both.*and/i,
    /simultaneously/i,
    /at.*same.*time/i,
    /while.*also/i,
    /meanwhile/i,
    /concurrently/i,
  ],

  // Conditional operations
  conditional: [
    /if.*then/i,
    /depending.*on/i,
    /based.*on.*result/i,
    /when.*also/i,
    /unless/i,
    /provided.*that/i,
  ],

  // Complex workflows
  complex: [
    /pipeline/i,
    /workflow/i,
    /process.*through/i,
    /multiple.*steps/i,
    /end.*to.*end/i,
    /automation/i,
    /orchestration/i,
  ],
};

// Complexity indicators
export const complexityIndicators = {
  // Temporal relationships
  temporal: {
    sequential: /first.*then|step.*by.*step|after.*that/i,
    parallel: /simultaneously|at.*same.*time|while.*also/i,
    conditional: /if.*then|depending.*on|based.*on/i,
  },

  // Data flow patterns
  dataFlow: {
    linear: /pass.*to|send.*to|forward.*to/i,
    branching: /split.*into|divide.*by|separate/i,
    merging: /combine.*with|merge.*into|join.*together/i,
  },

  // Processing patterns
  processing: {
    batch: /batch.*process|all.*at.*once/i,
    streaming: /real.*time|live.*data|continuous/i,
    iterative: /repeat.*until|loop.*through|iterate/i,
  },
};

/**
 * Quick intent recognition using pattern matching
 */
export function quickIntentRecognition(userInput: string): string | null {
  for (const [intent, patterns] of Object.entries(intentPatterns)) {
    if (patterns.some((pattern) => pattern.test(userInput))) {
      return intent;
    }
  }
  return null;
}

/**
 * Classify intent with confidence scoring
 */
export function classifyIntent(userInput: string): IntentClassification {
  const detectedIntents: string[] = [];
  const confidenceScores: Record<string, number> = {};

  // Score each intent type
  Object.entries(intentPatterns).forEach(([intent, patterns]) => {
    let score = 0;
    patterns.forEach((pattern) => {
      const matches = userInput.match(new RegExp(pattern, "gi"));
      if (matches) {
        score += matches.length * 0.2; // Weight by number of matches
      }
    });

    if (score > 0.3) {
      // Threshold for detection
      detectedIntents.push(intent);
      confidenceScores[intent] = Math.min(score, 1.0);
    }
  });

  // Determine primary intent
  const primaryIntent =
    detectedIntents.length > 0 ? detectedIntents[0] : "UNKNOWN";
  const confidence = confidenceScores[primaryIntent] || 0;

  return {
    intent: primaryIntent,
    confidence,
    reasoning: generateIntentReasoning(
      primaryIntent,
      detectedIntents,
      userInput
    ),
  };
}

/**
 * Extract entities from user input
 */
export function extractEntities(userInput: string): EntityExtraction {
  const entities: EntityExtraction = {
    urls: [],
    dataTypes: [],
    outputFormats: [],
    aiTasks: [],
    processingSteps: [],
    targetSites: [],
    dataSources: [],
  };

  // Extract URLs
  const urlPattern = /https?:\/\/[^\s]+/gi;
  const urls = userInput.match(urlPattern);
  if (urls) {
    entities.urls = urls;
  }

  // Extract data types
  const dataTypePatterns = [
    { pattern: /json/i, type: "json" },
    { pattern: /csv/i, type: "csv" },
    { pattern: /pdf/i, type: "pdf" },
    { pattern: /text/i, type: "text" },
    { pattern: /xml/i, type: "xml" },
    { pattern: /yaml/i, type: "yaml" },
  ];

  dataTypePatterns.forEach(({ pattern, type }) => {
    if (pattern.test(userInput)) {
      entities.dataTypes.push(type);
    }
  });

  // Extract AI tasks
  const aiTaskPatterns = [
    { pattern: /summarize/i, task: "summarize" },
    { pattern: /analyze/i, task: "analyze" },
    { pattern: /classify/i, task: "classify" },
    { pattern: /translate/i, task: "translate" },
    { pattern: /generate/i, task: "generate" },
    { pattern: /extract.*key.*points/i, task: "extract_key_points" },
    { pattern: /sentiment.*analysis/i, task: "sentiment_analysis" },
  ];

  aiTaskPatterns.forEach(({ pattern, task }) => {
    if (pattern.test(userInput)) {
      entities.aiTasks.push(task);
    }
  });

  // Extract processing steps
  const processingStepPatterns = [
    { pattern: /scrape/i, step: "scrape" },
    { pattern: /extract/i, step: "extract" },
    { pattern: /transform/i, step: "transform" },
    { pattern: /convert/i, step: "convert" },
    { pattern: /filter/i, step: "filter" },
    { pattern: /sort/i, step: "sort" },
    { pattern: /validate/i, step: "validate" },
  ];

  processingStepPatterns.forEach(({ pattern, step }) => {
    if (pattern.test(userInput)) {
      entities.processingSteps.push(step);
    }
  });

  return entities;
}

/**
 * Analyze complexity of mixed workflows
 */
export function analyzeComplexity(
  userInput: string,
  detectedIntents: string[]
): ComplexityAnalysis {
  let complexityScore = 0;
  const detectedPatterns: string[] = [];

  // Check temporal relationships
  Object.entries(complexityIndicators.temporal).forEach(([pattern, regex]) => {
    if (regex.test(userInput)) {
      complexityScore += 0.1;
      detectedPatterns.push(`temporal:${pattern}`);
    }
  });

  // Check data flow patterns
  Object.entries(complexityIndicators.dataFlow).forEach(([pattern, regex]) => {
    if (regex.test(userInput)) {
      complexityScore += 0.1;
      detectedPatterns.push(`dataFlow:${pattern}`);
    }
  });

  // Check processing patterns
  Object.entries(complexityIndicators.processing).forEach(
    ([pattern, regex]) => {
      if (regex.test(userInput)) {
        complexityScore += 0.1;
        detectedPatterns.push(`processing:${pattern}`);
      }
    }
  );

  // Additional complexity from number of intents
  complexityScore += (detectedIntents.length - 1) * 0.2;

  // Additional complexity from mixed intent patterns
  Object.entries(mixedIntentPatterns).forEach(([category, patterns]) => {
    patterns.forEach((pattern) => {
      if (pattern.test(userInput)) {
        complexityScore += 0.05;
        detectedPatterns.push(`mixed:${category}`);
      }
    });
  });

  const level =
    complexityScore > 0.7 ? "high" : complexityScore > 0.4 ? "medium" : "low";
  const estimatedNodes = Math.max(
    3,
    detectedIntents.length + Math.floor(complexityScore * 3)
  );

  return {
    level,
    score: Math.min(complexityScore, 1.0),
    patterns: detectedPatterns,
    estimatedNodes,
  };
}

/**
 * Check if input indicates mixed intent
 */
export function isMixedIntent(
  userInput: string,
  detectedIntents: string[]
): boolean {
  if (detectedIntents.length <= 1) return false;

  // Check for explicit mixed intent indicators
  const mixedIndicators = [
    /and.*also/i,
    /then.*also/i,
    /while.*also/i,
    /pipeline/i,
    /workflow/i,
    /multiple.*steps/i,
    /end.*to.*end/i,
  ];

  return mixedIndicators.some((pattern) => pattern.test(userInput));
}

/**
 * Generate reasoning for intent classification
 */
function generateIntentReasoning(
  primaryIntent: string,
  detectedIntents: string[],
  userInput: string
): string {
  if (detectedIntents.length === 0) {
    return "No clear intent patterns detected in the input";
  }

  if (detectedIntents.length === 1) {
    return `Clear ${primaryIntent} intent detected from user input`;
  }

  if (isMixedIntent(userInput, detectedIntents)) {
    return `Mixed intent detected: ${detectedIntents.join(
      ", "
    )}. User wants to perform multiple operations in sequence or parallel`;
  }

  return `Multiple intents detected: ${detectedIntents.join(
    ", "
  )}. Primary intent: ${primaryIntent}`;
}

/**
 * Map intent to node type
 */
export function mapIntentToNodeType(intent: string): string {
  const intentToNodeMap: Record<string, string> = {
    WEB_SCRAPING: "webScraping",
    AI_ANALYSIS: "llmTask",
    DATA_PROCESSING: "structuredOutput",
    SEARCH_AND_RETRIEVAL: "similaritySearch",
    CONTENT_GENERATION: "llmTask",
  };

  return intentToNodeMap[intent] || "llmTask";
}

/**
 * Generate node label based on intent and context
 */
export function generateNodeLabel(
  intent: string,
  index: number,
  context?: string
): string {
  const labelMap: Record<string, string> = {
    WEB_SCRAPING: "Web Scraper",
    AI_ANALYSIS: "AI Analyzer",
    DATA_PROCESSING: "Data Processor",
    SEARCH_AND_RETRIEVAL: "Similarity Search",
    CONTENT_GENERATION: "Content Generator",
  };

  const baseLabel = labelMap[intent] || "AI Task";

  if (index > 0) {
    return `${baseLabel} ${index + 1}`;
  }

  return baseLabel;
}
