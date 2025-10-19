/**
 * Advanced Prompt Optimization Service
 * Generates context-aware, domain-specific prompts for AI Task Nodes
 */

export interface NodeContext {
  dataType: string;
  previousNodes: string[];
  intent: string;
  domain?: string;
  workflowType?: string;
  availableData: Map<string, any>;
}

export interface PromptPerformance {
  quality: number; // 1-10 scale
  relevance: number; // 1-10 scale
  completeness: number; // 1-10 scale
  userSatisfaction?: number; // 1-10 scale
  executionTime?: number; // milliseconds
}

export interface PromptRefinement {
  type:
    | "add_context"
    | "add_examples"
    | "improve_instructions"
    | "adjust_format";
  description: string;
  implementation: string;
}

export interface DomainPromptTemplate {
  role: string;
  context: string;
  instructions: string;
  examples?: string[];
  outputFormat: string;
  chainOfThought?: boolean;
}

export class PromptOptimizer {
  private promptHistory = new Map<string, PromptPerformance>();
  private domainTemplates = new Map<string, DomainPromptTemplate>();
  private fewShotExamples = new Map<string, any[]>();

  constructor() {
    this.initializeDomainTemplates();
    this.initializeFewShotExamples();
  }

  /**
   * Generate an optimized prompt for an AI Task Node
   */
  generateOptimizedPrompt(
    userIntent: string,
    entities: any,
    nodeContext: NodeContext,
    availableData: Map<string, any>
  ): string {
    const promptBuilder = new PromptBuilder();

    // Determine the appropriate domain and task type
    const domain = this.determineDomain(userIntent, entities, nodeContext);
    const taskType = this.determineTaskType(userIntent, entities);

    // Add role and context
    const role = this.determineRole(userIntent, entities, domain);
    promptBuilder.addRole(role);

    // Add domain-specific context
    const context = this.buildContext(
      userIntent,
      entities,
      nodeContext,
      domain
    );
    promptBuilder.addContext(context);

    // Add specific instructions
    const instructions = this.generateInstructions(
      userIntent,
      entities,
      taskType,
      domain
    );
    promptBuilder.addInstructions(instructions);

    // Add few-shot examples if available
    const examples = this.getRelevantExamples(taskType, domain);
    if (examples.length > 0) {
      promptBuilder.addExamples(examples);
    }

    // Add chain-of-thought if needed
    if (this.shouldUseChainOfThought(taskType, entities)) {
      promptBuilder.addChainOfThought();
    }

    // Add output format requirements
    const outputFormat = this.determineOutputFormat(
      userIntent,
      entities,
      taskType
    );
    promptBuilder.addOutputFormat(outputFormat);

    // Add available data context
    const dataContext = this.buildDataContext(availableData, nodeContext);
    promptBuilder.addDataContext(dataContext);

    return promptBuilder.build();
  }

  /**
   * Determine the appropriate domain for the prompt
   */
  private determineDomain(
    userIntent: string,
    entities: any,
    nodeContext: NodeContext
  ): string {
    // Check for specific domain indicators
    if (
      entities.dataTypes?.includes("resume") ||
      entities.dataTypes?.includes("cv")
    ) {
      return "jobApplication";
    }

    if (
      entities.dataTypes?.includes("financial") ||
      userIntent.toLowerCase().includes("financial")
    ) {
      return "financial";
    }

    if (
      entities.dataTypes?.includes("legal") ||
      userIntent.toLowerCase().includes("legal")
    ) {
      return "legal";
    }

    if (
      entities.dataTypes?.includes("medical") ||
      userIntent.toLowerCase().includes("medical")
    ) {
      return "medical";
    }

    if (
      entities.dataTypes?.includes("technical") ||
      userIntent.toLowerCase().includes("technical")
    ) {
      return "technical";
    }

    if (nodeContext.workflowType === "content_analysis") {
      return "contentAnalysis";
    }

    return "general";
  }

  /**
   * Determine the specific task type
   */
  private determineTaskType(userIntent: string, entities: any): string {
    const tasks = entities.aiTasks || [];

    if (tasks.includes("summarize")) return "summarize";
    if (tasks.includes("analyze")) return "analyze";
    if (tasks.includes("extract")) return "extract";
    if (tasks.includes("classify")) return "classify";
    if (tasks.includes("generate")) return "generate";
    if (tasks.includes("translate")) return "translate";
    if (tasks.includes("sentiment")) return "sentiment";
    if (tasks.includes("compare")) return "compare";

    // Fallback based on intent
    if (userIntent.toLowerCase().includes("summarize")) return "summarize";
    if (userIntent.toLowerCase().includes("analyze")) return "analyze";
    if (userIntent.toLowerCase().includes("extract")) return "extract";

    return "process";
  }

  /**
   * Determine the appropriate role for the AI
   */
  private determineRole(
    userIntent: string,
    entities: any,
    domain: string
  ): string {
    const domainRoles: Record<string, string> = {
      jobApplication: "expert career counselor and resume analyst",
      financial: "senior financial analyst and investment advisor",
      legal: "experienced legal counsel and document analyst",
      medical: "medical professional and clinical analyst",
      technical: "senior software engineer and technical architect",
      contentAnalysis: "content strategist and digital marketing expert",
      general: "expert data analyst and business consultant",
    };

    return domainRoles[domain] || domainRoles.general;
  }

  /**
   * Build context-aware information
   */
  private buildContext(
    userIntent: string,
    entities: any,
    nodeContext: NodeContext,
    domain: string
  ): string {
    const contextParts = [];

    // Add data type context
    if (nodeContext.dataType) {
      contextParts.push(`Data Type: ${nodeContext.dataType}`);
    }

    // Add domain-specific context
    if (domain !== "general") {
      contextParts.push(`Domain: ${domain}`);
    }

    // Add workflow context
    if (nodeContext.previousNodes.length > 0) {
      contextParts.push(
        `Previous Processing: ${nodeContext.previousNodes.join(" → ")}`
      );
    }

    // Add entity context
    if (entities.urls?.length > 0) {
      contextParts.push(`Source URLs: ${entities.urls.join(", ")}`);
    }

    if (entities.dataTypes?.length > 0) {
      contextParts.push(`Data Types: ${entities.dataTypes.join(", ")}`);
    }

    return contextParts.join("\n");
  }

  /**
   * Generate specific instructions based on task type and domain
   */
  private generateInstructions(
    userIntent: string,
    entities: any,
    taskType: string,
    domain: string
  ): string {
    const template = this.domainTemplates.get(domain);
    if (template) {
      return template.instructions;
    }

    // Fallback to task-specific instructions
    const taskInstructions: Record<string, string> = {
      summarize:
        "Provide a clear, concise summary that captures the key points and main insights.",
      analyze:
        "Conduct a thorough analysis, identifying patterns, trends, and actionable insights.",
      extract:
        "Extract specific information systematically, organizing it in a structured format.",
      classify:
        "Categorize the content accurately, providing clear reasoning for each classification.",
      generate:
        "Create high-quality content that meets the specified requirements and objectives.",
      translate:
        "Provide accurate, contextually appropriate translations while preserving meaning.",
      sentiment:
        "Analyze emotional tone and sentiment with specific evidence and confidence levels.",
      compare:
        "Perform detailed comparisons highlighting similarities, differences, and implications.",
      process:
        "Process the data systematically to extract maximum value and insights.",
    };

    return taskInstructions[taskType] || taskInstructions.process;
  }

  /**
   * Get relevant few-shot examples
   */
  private getRelevantExamples(taskType: string, domain: string): any[] {
    const key = `${domain}_${taskType}`;
    return (
      this.fewShotExamples.get(key) || this.fewShotExamples.get(taskType) || []
    );
  }

  /**
   * Determine if chain-of-thought prompting should be used
   */
  private shouldUseChainOfThought(taskType: string, entities: any): boolean {
    const complexTasks = ["analyze", "compare", "classify", "sentiment"];
    return complexTasks.includes(taskType) || entities.complexity === "high";
  }

  /**
   * Determine output format requirements
   */
  private determineOutputFormat(
    userIntent: string,
    entities: any,
    taskType: string
  ): string {
    if (entities.outputFormat) {
      return entities.outputFormat;
    }

    const formatPreferences: Record<string, string> = {
      summarize:
        "Provide a clear, structured summary with key points highlighted.",
      analyze:
        "Present findings in a structured format with clear sections and actionable insights.",
      extract:
        "Organize extracted information in a logical, easy-to-read format.",
      classify:
        "Provide classifications with clear categories and supporting evidence.",
      generate:
        "Format content appropriately for the intended audience and purpose.",
      sentiment:
        "Include sentiment scores, confidence levels, and supporting evidence.",
      compare:
        "Present comparisons in a clear, side-by-side format with conclusions.",
      process: "Structure the output for maximum clarity and usability.",
    };

    return formatPreferences[taskType] || formatPreferences.process;
  }

  /**
   * Build data context from available node outputs
   */
  private buildDataContext(
    availableData: Map<string, any>,
    nodeContext: NodeContext
  ): string {
    if (availableData.size === 0) {
      return "Input data: {{input.output}}";
    }

    const dataDescriptions = [];
    for (const [nodeId, data] of availableData) {
      if (data.output) {
        dataDescriptions.push(
          `${nodeId}: ${
            typeof data.output === "string"
              ? data.output.substring(0, 100) + "..."
              : "Complex data object"
          }`
        );
      }
    }

    return `Available data:\n${dataDescriptions.join(
      "\n"
    )}\n\nPrimary input: {{input.output}}`;
  }

  /**
   * Initialize domain-specific templates
   */
  private initializeDomainTemplates(): void {
    // Job Application Domain
    this.domainTemplates.set("jobApplication", {
      role: "expert career counselor and resume analyst",
      context:
        "You are analyzing job application materials to provide career guidance and optimization recommendations.",
      instructions: `When analyzing resumes and job applications:
1. Identify key skills, experience, and achievements
2. Assess alignment with job requirements
3. Highlight strengths and areas for improvement
4. Provide specific, actionable recommendations
5. Consider industry best practices and trends`,
      examples: [
        "Resume Analysis: \"This resume shows strong technical skills but could benefit from quantifiable achievements. Consider adding metrics like 'increased efficiency by 25%' or 'managed team of 8 developers'.\"",
        'Cover Letter Review: "The cover letter effectively addresses the job requirements but could be more specific about how your experience directly relates to their needs."',
      ],
      outputFormat:
        "Provide structured analysis with clear sections: Summary, Strengths, Areas for Improvement, and Recommendations.",
      chainOfThought: true,
    });

    // Financial Domain
    this.domainTemplates.set("financial", {
      role: "senior financial analyst and investment advisor",
      context:
        "You are analyzing financial data and providing investment insights and recommendations.",
      instructions: `When analyzing financial information:
1. Examine key financial metrics and ratios
2. Identify trends and patterns in the data
3. Assess risk factors and opportunities
4. Provide data-driven insights and recommendations
5. Consider market conditions and economic factors`,
      examples: [
        'Financial Analysis: "The company shows strong revenue growth of 15% YoY, but operating margins have declined from 12% to 9%, indicating potential cost management issues."',
        'Investment Review: "Based on the P/E ratio of 18 and strong cash flow, this appears to be a solid investment opportunity, though market volatility should be considered."',
      ],
      outputFormat:
        "Present analysis with clear financial metrics, trends, and actionable recommendations.",
      chainOfThought: true,
    });

    // Content Analysis Domain
    this.domainTemplates.set("contentAnalysis", {
      role: "content strategist and digital marketing expert",
      context:
        "You are analyzing content for marketing effectiveness, SEO optimization, and audience engagement.",
      instructions: `When analyzing content:
1. Assess readability and engagement potential
2. Identify SEO opportunities and issues
3. Evaluate brand voice and messaging consistency
4. Suggest improvements for audience targeting
5. Consider content performance metrics`,
      examples: [
        "Content Review: \"The article has good structure but could benefit from more specific keywords. Consider adding 'digital transformation' and 'cloud migration' to improve SEO.\"",
        'Engagement Analysis: "The content is informative but lacks emotional hooks. Adding personal stories or case studies could increase engagement."',
      ],
      outputFormat:
        "Provide analysis with specific recommendations for content improvement and optimization.",
      chainOfThought: false,
    });

    // Technical Domain
    this.domainTemplates.set("technical", {
      role: "senior software engineer and technical architect",
      context:
        "You are analyzing technical documentation and code to provide development insights and recommendations.",
      instructions: `When analyzing technical content:
1. Evaluate code quality and best practices
2. Identify potential security vulnerabilities
3. Assess scalability and performance implications
4. Suggest architectural improvements
5. Consider maintainability and documentation`,
      examples: [
        'Code Review: "The function is well-structured but could benefit from error handling. Consider adding try-catch blocks for database operations."',
        'Architecture Analysis: "The microservices approach is good, but consider implementing a service mesh for better communication management."',
      ],
      outputFormat:
        "Provide technical analysis with specific recommendations for improvement and optimization.",
      chainOfThought: true,
    });
  }

  /**
   * Initialize few-shot learning examples
   */
  private initializeFewShotExamples(): void {
    // General examples
    this.fewShotExamples.set("summarize", [
      {
        input:
          "Long technical document about machine learning algorithms, neural networks, deep learning applications, and practical implementation strategies...",
        output:
          "This document explains machine learning fundamentals, covering supervised learning algorithms, neural networks, and practical applications in data science. Key topics include algorithm selection, model training, and performance optimization techniques.",
      },
    ]);

    this.fewShotExamples.set("analyze", [
      {
        input:
          "Financial report showing Q3 revenue of $2.5M, 15% growth, new product launches, customer acquisition data...",
        output:
          "Analysis shows 15% revenue growth driven by new product launches. Key insights: Q3 performance exceeded expectations, customer acquisition increased 25%, operational efficiency improved 8%. Recommendations: Continue product innovation, optimize customer onboarding process.",
      },
    ]);

    // Job application examples
    this.fewShotExamples.set("jobApplication_summarize", [
      {
        input:
          "Resume with 5 years software engineering experience, Python/JavaScript skills, team lead experience...",
        output:
          "Experienced software engineer with 5 years in full-stack development. Strong technical skills in Python and JavaScript, proven leadership experience managing development teams. Key strengths: problem-solving, team collaboration, and technical innovation.",
      },
    ]);

    // Financial examples
    this.fewShotExamples.set("financial_analyze", [
      {
        input:
          "Company financials: Revenue $10M, Expenses $7M, Net Income $3M, Debt $2M, Cash $5M...",
        output:
          "Strong financial position with 30% net margin and healthy cash reserves. Revenue growth of 20% YoY indicates good market traction. Debt-to-equity ratio of 0.2 shows conservative leverage. Recommendation: Consider strategic investments for continued growth.",
      },
    ]);
  }

  /**
   * Track prompt performance for future optimization
   */
  trackPerformance(promptId: string, performance: PromptPerformance): void {
    this.promptHistory.set(promptId, performance);
  }

  /**
   * Get performance insights for prompt optimization
   */
  getPerformanceInsights(): Map<string, PromptPerformance> {
    return new Map(this.promptHistory);
  }
}

/**
 * Prompt Builder class for constructing optimized prompts
 */
class PromptBuilder {
  private role: string = "";
  private context: string = "";
  private instructions: string = "";
  private examples: any[] = [];
  private chainOfThought: boolean = false;
  private outputFormat: string = "";
  private dataContext: string = "";

  addRole(role: string): PromptBuilder {
    this.role = `You are an ${role}.`;
    return this;
  }

  addContext(context: string): PromptBuilder {
    this.context = `Context:\n${context}`;
    return this;
  }

  addInstructions(instructions: string): PromptBuilder {
    this.instructions = `Instructions:\n${instructions}`;
    return this;
  }

  addExamples(examples: any[]): PromptBuilder {
    if (examples.length > 0) {
      this.examples = examples;
    }
    return this;
  }

  addChainOfThought(): PromptBuilder {
    this.chainOfThought = true;
    return this;
  }

  addOutputFormat(outputFormat: string): PromptBuilder {
    this.outputFormat = `Output Format:\n${outputFormat}`;
    return this;
  }

  addDataContext(dataContext: string): PromptBuilder {
    this.dataContext = dataContext;
    return this;
  }

  build(): string {
    const parts = [this.role];

    if (this.context) parts.push(this.context);
    if (this.instructions) parts.push(this.instructions);

    if (this.chainOfThought) {
      parts.push(`Please think through this step by step:
1. First, analyze the input data and identify key elements
2. Apply your expertise to process the information
3. Generate insights and conclusions
4. Format the output according to the requirements`);
    }

    if (this.examples.length > 0) {
      parts.push("Examples:");
      this.examples.forEach((example, index) => {
        parts.push(`Example ${index + 1}:`);
        parts.push(`Input: ${example.input}`);
        parts.push(`Output: ${example.output}`);
      });
    }

    if (this.outputFormat) parts.push(this.outputFormat);
    if (this.dataContext) parts.push(this.dataContext);

    return parts.join("\n\n");
  }
}

// Export singleton instance
export const promptOptimizer = new PromptOptimizer();
