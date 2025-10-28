// Import variable substitution utilities
import { substituteVariables, NodeOutput } from "../utils/variableSubstitution";
import {
  executionEventBus,
  ExecutionStartEvent,
  NodeStartEvent,
  NodeProgressEvent,
  NodeCompleteEvent,
  ExecutionCompleteEvent,
  ExecutionErrorEvent,
} from "./executionEventBus";
import { workflowValidationEngine } from "./workflowValidationEngine";
import {
  mapWithConcurrencySettled,
  ConcurrencyLimiter,
} from "./concurrencyLimiter";

export interface ExecutionContext {
  nodeId: string;
  nodeType: string;
  config: Record<string, any>;
  inputs: Map<string, any>;
  outputs: Map<string, any>;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  error?: string;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  retryCount: number;
  maxRetries: number;
}

export interface ExecutionPlan {
  id: string;
  workflowId: string;
  nodes: ExecutionContext[];
  edges: Array<{ from: string; to: string; condition?: string }>;
  executionMode: "sequential" | "parallel" | "conditional";
  parallelGroups: string[][];
  conditions: Map<string, string>;
  status: "pending" | "running" | "completed" | "failed" | "paused";
  startTime?: Date;
  endTime?: Date;
  totalDuration?: number;
  results: Map<string, any>;
  errors: Map<string, string>;
}

export interface ConditionalBranch {
  nodeId: string;
  condition: string;
  truePath: string[];
  falsePath: string[];
  elsePath?: string[];
}

export interface ParallelGroup {
  id: string;
  nodes: string[];
  maxConcurrency?: number;
  waitForAll: boolean;
  continueOnError: boolean;
}

export class ExecutionEngine {
  private activeExecutions: Map<string, ExecutionPlan> = new Map();
  private executionHistory: ExecutionPlan[] = [];
  private maxConcurrentExecutions = 10;
  private defaultTimeout = 300000; // 5 minutes

  // Validate node types before execution
  private validateNodeTypes(nodes: any[]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const supportedTypes = new Set([
      "dataInput",
      "dataOutput",
      "webScraping",
      "llmTask",
      "database",
      "slack",
      "discord",
      "gmail",
      "structuredOutput",
      "embeddingGenerator",
      "similaritySearch",
    ]);

    nodes.forEach((node, index) => {
      if (!node.type) {
        errors.push(
          `Node at index ${index} (id: ${
            node.id || "unknown"
          }) has no type specified`
        );
      } else if (!supportedTypes.has(node.type)) {
        errors.push(
          `Node "${node.data?.label || node.id}" has unsupported type: "${
            node.type
          }". ` + `Supported types: ${Array.from(supportedTypes).join(", ")}`
        );
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Main execution methods
  async executeWorkflow(
    workflowId: string,
    nodes: any[],
    edges: any[],
    options: {
      mode?: "sequential" | "parallel" | "conditional";
      maxConcurrency?: number;
      timeout?: number;
      retryPolicy?: {
        maxRetries: number;
        retryDelay: number;
        backoffMultiplier: number;
      };
    } = {},
    onNodeUpdate?: (
      nodeId: string,
      status: string,
      data?: any,
      error?: string
    ) => void
  ): Promise<ExecutionPlan> {
    const executionId = `exec_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    console.log(`Starting workflow execution:`, {
      executionId,
      workflowId,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      options,
    });

    // Emit execution start event
    const executionStartEvent: ExecutionStartEvent = {
      type: "execution:start",
      executionId,
      workflowId,
      timestamp: new Date(),
      nodeCount: nodes.length,
      executionMode: (options.mode || "sequential") as
        | "sequential"
        | "parallel"
        | "conditional",
    };
    executionEventBus.emit(executionStartEvent);

    // Validate node types before execution
    const nodeTypeValidation = this.validateNodeTypes(nodes);
    if (!nodeTypeValidation.isValid) {
      const errorMessage = `Invalid node types detected:\n${nodeTypeValidation.errors.join(
        "\n"
      )}`;
      console.error(
        "[ExecutionEngine] Node type validation failed:",
        nodeTypeValidation.errors
      );

      // Emit validation error event
      const validationErrorEvent: ExecutionErrorEvent = {
        type: "execution:error",
        executionId,
        stage: "validation",
        error: errorMessage,
        timestamp: new Date(),
      };
      executionEventBus.emit(validationErrorEvent);

      throw new Error(errorMessage);
    }

    // Validate workflow before execution
    try {
      // Use comprehensive validation engine
      const validationResult = workflowValidationEngine.validate(nodes, edges);
      if (!validationResult.isValid) {
        // Collect all error messages
        const errorMessages = validationResult.errors
          .map((issue) => `${issue.message} - ${issue.suggestion}`)
          .join("; ");
        throw new Error(`Workflow validation failed: ${errorMessages}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown validation error";
      console.error("Workflow validation failed:", errorMessage);

      // Emit validation error event
      const validationErrorEvent: ExecutionErrorEvent = {
        type: "execution:error",
        executionId,
        stage: "validation",
        error: errorMessage,
        timestamp: new Date(),
      };
      executionEventBus.emit(validationErrorEvent);

      // Create a failed execution plan
      const failedPlan: ExecutionPlan = {
        id: executionId,
        workflowId,
        nodes: [],
        edges: [],
        executionMode: options.mode || "sequential",
        parallelGroups: [],
        conditions: new Map(),
        status: "failed",
        startTime: new Date(),
        endTime: new Date(),
        totalDuration: 0,
        results: new Map(),
        errors: new Map([["validation", errorMessage]]),
      };

      // Notify about validation failure
      if (onNodeUpdate) {
        onNodeUpdate("validation", "error", null, errorMessage);
      }

      // Store the failed execution plan
      this.activeExecutions.set(executionId, failedPlan);
      this.executionHistory.push(failedPlan);

      return failedPlan;
    }

    const plan = this.createExecutionPlan(workflowId, nodes, edges, options);
    plan.id = executionId;

    this.activeExecutions.set(executionId, plan);

    try {
      await this.executePlan(plan, onNodeUpdate, executionId);
      plan.status = "completed";

      // Emit execution complete event
      const executionCompleteEvent: ExecutionCompleteEvent = {
        type: "execution:complete",
        executionId,
        workflowId,
        status: "success",
        totalDuration: plan.totalDuration || 0,
        completedNodes: plan.nodes.filter((n) => n.status === "completed")
          .length,
        failedNodes: plan.nodes.filter((n) => n.status === "failed").length,
        results: plan.results,
        errors: plan.errors,
        timestamp: new Date(),
      };
      executionEventBus.emit(executionCompleteEvent);
    } catch (error) {
      plan.status = "failed";
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      plan.errors.set("root", errorMessage);

      // Emit execution error event
      const executionErrorEvent: ExecutionErrorEvent = {
        type: "execution:error",
        executionId,
        stage: "execution",
        error: errorMessage,
        timestamp: new Date(),
      };
      executionEventBus.emit(executionErrorEvent);

      // Emit execution complete event with failure status
      const executionCompleteEvent: ExecutionCompleteEvent = {
        type: "execution:complete",
        executionId,
        workflowId,
        status: "failed",
        totalDuration: plan.totalDuration || 0,
        completedNodes: plan.nodes.filter((n) => n.status === "completed")
          .length,
        failedNodes: plan.nodes.filter((n) => n.status === "failed").length,
        results: plan.results,
        errors: plan.errors,
        timestamp: new Date(),
      };
      executionEventBus.emit(executionCompleteEvent);
    } finally {
      plan.endTime = new Date();
      plan.totalDuration =
        plan.endTime.getTime() - (plan.startTime?.getTime() || 0);
      this.executionHistory.push(plan);
      this.activeExecutions.delete(executionId);
    }

    return plan;
  }

  // Create execution plan based on workflow structure
  private createExecutionPlan(
    workflowId: string,
    nodes: any[],
    edges: any[],
    options: any
  ): ExecutionPlan {
    // Create node label to ID mapping for variable substitution
    const nodeLabelToId = this.createNodeLabelToIdMapping(nodes);

    const executionNodes: ExecutionContext[] = nodes.map((node) => ({
      nodeId: node.id,
      nodeType: node.data?.type || node.type,
      config: node.data?.config || node.config || {},
      inputs: new Map(),
      outputs: new Map(),
      status: "pending",
      retryCount: 0,
      maxRetries: options.retryPolicy?.maxRetries || 3,
    }));

    console.log("Creating execution plan:", {
      workflowId,
      nodeCount: nodes.length,
      executionNodes: executionNodes.map((n) => ({
        id: n.nodeId,
        type: n.nodeType,
      })),
      edges: edges.map((e) => ({ from: e.source, to: e.target })),
      nodeLabelToId: Array.from(nodeLabelToId.entries()),
    });

    const executionEdges = edges.map((edge) => ({
      from: edge.source,
      to: edge.target,
      condition: edge.condition,
    }));

    // Analyze workflow structure to determine execution mode
    const executionMode = this.determineExecutionMode(
      nodes,
      edges,
      options.mode
    );
    const parallelGroups = this.createParallelGroups(
      nodes,
      edges,
      executionMode
    );
    const conditions = this.extractConditions(edges);

    // Build plan object
    const plan: ExecutionPlan = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workflowId,
      nodes: executionNodes,
      edges: executionEdges,
      executionMode,
      parallelGroups: parallelGroups.map((g) => g.nodes),
      conditions,
      status: "pending",
      results: new Map(),
      errors: new Map(),
    };

    // Attach node label mapping for variable substitution
    (plan as any).nodeLabelToId = nodeLabelToId;

    return plan;
  }

  // Determine the best execution mode
  private determineExecutionMode(
    nodes: any[],
    edges: any[],
    requestedMode?: string
  ): "sequential" | "parallel" | "conditional" {
    if (requestedMode) return requestedMode as any;

    // Check for conditional branches
    const hasConditions = edges.some((edge) => edge.condition);
    if (hasConditions) return "conditional";

    // Check for parallel opportunities
    const hasParallelPaths = this.hasParallelExecutionPaths(nodes, edges);
    if (hasParallelPaths) return "parallel";

    return "sequential";
  }

  // Check if workflow has parallel execution opportunities
  private hasParallelExecutionPaths(nodes: any[], edges: any[]): boolean {
    // Simple heuristic: if there are multiple nodes with no dependencies on each other
    const nodeIds = new Set(nodes.map((n) => n.id));
    const dependencies = new Map<string, Set<string>>();

    // Build dependency graph
    edges.forEach((edge) => {
      if (!dependencies.has(edge.target)) {
        dependencies.set(edge.target, new Set());
      }
      dependencies.get(edge.target)!.add(edge.source);
    });

    // Find nodes that can run in parallel (no dependencies between them)
    const independentGroups = this.findIndependentNodeGroups(
      nodeIds,
      dependencies
    );
    return independentGroups.length > 1;
  }

  // Find groups of nodes that can run independently
  private findIndependentNodeGroups(
    nodeIds: Set<string>,
    dependencies: Map<string, Set<string>>
  ): string[][] {
    const visited = new Set<string>();
    const groups: string[][] = [];

    for (const nodeId of nodeIds) {
      if (visited.has(nodeId)) continue;

      const group = this.getIndependentGroup(nodeId, dependencies, visited);
      if (group.length > 1) {
        groups.push(group);
      }
    }

    return groups;
  }

  private getIndependentGroup(
    startNode: string,
    dependencies: Map<string, Set<string>>,
    visited: Set<string>
  ): string[] {
    const group: string[] = [];
    const queue = [startNode];

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (visited.has(nodeId)) continue;

      visited.add(nodeId);
      group.push(nodeId);

      // Find nodes that depend on this node
      for (const [dependent, deps] of dependencies) {
        if (deps.has(nodeId) && !visited.has(dependent)) {
          queue.push(dependent);
        }
      }
    }

    return group;
  }

  // Create parallel execution groups
  private createParallelGroups(
    nodes: any[],
    edges: any[],
    mode: string
  ): ParallelGroup[] {
    if (mode !== "parallel") return [];

    const groups: ParallelGroup[] = [];
    const nodeIds = new Set(nodes.map((n) => n.id));
    const dependencies = new Map<string, Set<string>>();

    // Build dependency graph
    edges.forEach((edge) => {
      if (!dependencies.has(edge.target)) {
        dependencies.set(edge.target, new Set());
      }
      dependencies.get(edge.target)!.add(edge.source);
    });

    // Find independent groups
    const independentGroups = this.findIndependentNodeGroups(
      nodeIds,
      dependencies
    );

    independentGroups.forEach((group, index) => {
      groups.push({
        id: `group_${index}`,
        nodes: group,
        waitForAll: true,
        continueOnError: false,
      });
    });

    return groups;
  }

  // Extract conditions from edges
  private extractConditions(edges: any[]): Map<string, string> {
    const conditions = new Map<string, string>();

    edges.forEach((edge) => {
      if (edge.condition) {
        conditions.set(`${edge.source}_${edge.target}`, edge.condition);
      }
    });

    return conditions;
  }

  // Execute the execution plan
  private async executePlan(
    plan: ExecutionPlan,
    onNodeUpdate?: (
      nodeId: string,
      status: string,
      data?: any,
      error?: string
    ) => void,
    executionId: string
  ): Promise<void> {
    plan.status = "running";
    plan.startTime = new Date();

    switch (plan.executionMode) {
      case "sequential":
        await this.executeSequential(plan, onNodeUpdate, executionId);
        break;
      case "parallel":
        await this.executeParallel(plan, onNodeUpdate, executionId);
        break;
      case "conditional":
        await this.executeConditional(plan, onNodeUpdate, executionId);
        break;
      default:
        throw new Error(`Unsupported execution mode: ${plan.executionMode}`);
    }
  }

  // Sequential execution
  private async executeSequential(
    plan: ExecutionPlan,
    onNodeUpdate?: (
      nodeId: string,
      status: string,
      data?: any,
      error?: string
    ) => void,
    executionId: string
  ): Promise<void> {
    const executionOrder = this.getExecutionOrder(plan.nodes, plan.edges);

    console.log("Execution order:", executionOrder);
    console.log(
      "Plan nodes:",
      plan.nodes.map((n) => ({ id: n.nodeId, type: n.nodeType }))
    );
    console.log("Plan edges:", plan.edges);

    // If no execution order is determined (e.g., no edges), execute all nodes in order
    const nodesToExecute =
      executionOrder.length > 0
        ? executionOrder
        : plan.nodes.map((n) => n.nodeId);
    console.log("Nodes to execute:", nodesToExecute);

    for (const nodeId of nodesToExecute) {
      const context = plan.nodes.find((n) => n.nodeId === nodeId);
      if (!context) continue;

      try {
        await this.executeNode(context, plan, onNodeUpdate, executionId);
      } catch (error) {
        context.status = "failed";
        context.error =
          error instanceof Error ? error.message : "Unknown error";
        plan.errors.set(nodeId, context.error);

        // Notify about the error
        if (onNodeUpdate) {
          onNodeUpdate(nodeId, "failed", undefined, context.error);
        }

        // Decide whether to continue or stop
        if (!this.shouldContinueOnError(plan, nodeId)) {
          throw error;
        }
      }
    }
  }

  // Parallel execution
  private async executeParallel(
    plan: ExecutionPlan,
    onNodeUpdate?: (
      nodeId: string,
      status: string,
      data?: any,
      error?: string
    ) => void,
    executionId: string
  ): Promise<void> {
    const parallelGroups = this.createParallelGroups(
      plan.nodes,
      plan.edges,
      "parallel"
    );

    // Get the max concurrency from the plan or use default
    const maxConcurrency =
      (plan as any).maxConcurrency || this.maxConcurrentExecutions;

    // Execute groups in parallel with concurrency limiting
    const groupFunctions = parallelGroups.map(
      (group) => () =>
        this.executeParallelGroup(group, plan, onNodeUpdate, executionId)
    );

    await mapWithConcurrencySettled(
      groupFunctions,
      (fn) => fn(),
      maxConcurrency
    );
  }

  // Execute a parallel group
  private async executeParallelGroup(
    group: ParallelGroup,
    plan: ExecutionPlan,
    onNodeUpdate?: (
      nodeId: string,
      status: string,
      data?: any,
      error?: string
    ) => void,
    executionId: string
  ): Promise<void> {
    const maxConcurrency =
      group.maxConcurrency ||
      (plan as any).maxConcurrency ||
      this.maxConcurrentExecutions;

    const nodeExecutionFunctions = group.nodes.map((nodeId) => {
      return async () => {
        const context = plan.nodes.find((n) => n.nodeId === nodeId);
        if (!context) return Promise.resolve();
        return this.executeNode(context, plan, onNodeUpdate, executionId);
      };
    });

    if (group.waitForAll) {
      // Execute all nodes with concurrency limiting
      await mapWithConcurrencySettled(
        nodeExecutionFunctions,
        (fn) => fn(),
        maxConcurrency
      );
    } else {
      // Execute with concurrency limiting and return first result
      const promises = nodeExecutionFunctions.map((fn) =>
        (async () => {
          try {
            return await fn();
          } catch (error) {
            return error;
          }
        })()
      );

      // Use Promise.race with limited concurrency
      const limiter = new ConcurrencyLimiter(maxConcurrency);
      const limitedPromises = promises.map((p) => limiter.run(() => p));
      await Promise.race(limitedPromises);
    }
  }

  // Conditional execution
  private async executeConditional(
    plan: ExecutionPlan,
    onNodeUpdate?: (
      nodeId: string,
      status: string,
      data?: any,
      error?: string
    ) => void,
    executionId: string
  ): Promise<void> {
    const executionOrder = this.getExecutionOrder(plan.nodes, plan.edges);
    const visited = new Set<string>();

    for (const nodeId of executionOrder) {
      if (visited.has(nodeId)) continue;

      const context = plan.nodes.find((n) => n.nodeId === nodeId);
      if (!context) continue;

      try {
        await this.executeNode(context, plan, onNodeUpdate, executionId);
        visited.add(nodeId);

        // Check for conditional branches
        const branches = this.getConditionalBranches(nodeId, plan);
        if (branches.length > 0) {
          await this.executeConditionalBranches(
            branches,
            plan,
            visited,
            onNodeUpdate,
            executionId
          );
        }
      } catch (error) {
        context.status = "failed";
        context.error =
          error instanceof Error ? error.message : "Unknown error";
        plan.errors.set(nodeId, context.error);

        // Notify about the error
        if (onNodeUpdate) {
          onNodeUpdate(nodeId, "failed", undefined, context.error);
        }
      }
    }
  }

  // Get conditional branches for a node
  private getConditionalBranches(
    nodeId: string,
    plan: ExecutionPlan
  ): ConditionalBranch[] {
    const branches: ConditionalBranch[] = [];

    plan.edges
      .filter((edge) => edge.from === nodeId && edge.condition)
      .forEach((edge) => {
        const truePath = this.getPathFromNode(edge.to, plan, true);
        const falsePath = this.getPathFromNode(edge.to, plan, false);

        branches.push({
          nodeId: edge.to,
          condition: edge.condition!,
          truePath,
          falsePath,
        });
      });

    return branches;
  }

  // Execute conditional branches
  private async executeConditionalBranches(
    branches: ConditionalBranch[],
    plan: ExecutionPlan,
    visited: Set<string>,
    onNodeUpdate?: (
      nodeId: string,
      status: string,
      data?: any,
      error?: string
    ) => void,
    executionId: string
  ): Promise<void> {
    for (const branch of branches) {
      const shouldExecuteTrue = await this.evaluateCondition(
        branch.condition,
        plan
      );

      const pathToExecute = shouldExecuteTrue
        ? branch.truePath
        : branch.falsePath;

      for (const nodeId of pathToExecute) {
        if (visited.has(nodeId)) continue;

        const context = plan.nodes.find((n) => n.nodeId === nodeId);
        if (!context) continue;

        try {
          await this.executeNode(context, plan, onNodeUpdate, executionId);
          visited.add(nodeId);
        } catch (error) {
          context.status = "failed";
          context.error =
            error instanceof Error ? error.message : "Unknown error";
          plan.errors.set(nodeId, context.error);

          // Notify about the error
          if (onNodeUpdate) {
            onNodeUpdate(nodeId, "failed", undefined, context.error);
          }
        }
      }
    }
  }

  // Evaluate a condition
  private async evaluateCondition(
    condition: string,
    plan: ExecutionPlan
  ): Promise<boolean> {
    // Simple condition evaluation using Function constructor (safer than eval)
    // In production, use a proper expression evaluator library
    try {
      // Replace variables with actual values
      let evaluatedCondition = condition;

      // Replace ${nodeId.output} with actual values
      const variablePattern = /\$\{([^.]+)\.([^}]+)\}/g;
      evaluatedCondition = evaluatedCondition.replace(
        variablePattern,
        (match, nodeId, outputKey) => {
          const context = plan.nodes.find((n) => n.nodeId === nodeId);
          if (context && context.outputs.has(outputKey)) {
            return JSON.stringify(context.outputs.get(outputKey));
          }
          return "null";
        }
      );

      // Evaluate the condition using Function constructor (safer than eval)
      // This creates a function in a controlled scope
      // eslint-disable-next-line no-new-func
      const evaluateExpression = new Function("return " + evaluatedCondition);
      return evaluateExpression();
    } catch (error) {
      console.error("Error evaluating condition:", error);
      return false;
    }
  }

  // Get path from a node
  private getPathFromNode(
    startNode: string,
    plan: ExecutionPlan,
    isTruePath: boolean
  ): string[] {
    const path: string[] = [];
    const visited = new Set<string>();
    const queue = [startNode];

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (visited.has(nodeId)) continue;

      visited.add(nodeId);
      path.push(nodeId);

      // Find next nodes
      const nextEdges = plan.edges.filter((edge) => edge.from === nodeId);
      nextEdges.forEach((edge) => {
        if (!visited.has(edge.to)) {
          queue.push(edge.to);
        }
      });
    }

    return path;
  }

  // Create node label to ID mapping for variable substitution
  private createNodeLabelToIdMapping(nodes: any[]): Map<string, string> {
    const labelToId = new Map<string, string>();

    nodes.forEach((node) => {
      if (node.data && node.data.label) {
        const label = node.data.label.trim();
        if (label) {
          labelToId.set(label, node.id);
        }
      }
    });

    return labelToId;
  }

  // Apply variable substitution to node configuration
  private applyVariableSubstitution(
    config: Record<string, any>,
    plan: ExecutionPlan,
    nodeLabelToId: Map<string, string>
  ): Record<string, any> {
    const substitutedConfig = { ...config };

    // Create node outputs map for substitution
    const nodeOutputs = new Map<string, NodeOutput>();
    plan.nodes.forEach((node) => {
      if (node.outputs.has("output")) {
        nodeOutputs.set(node.nodeId, {
          nodeId: node.nodeId,
          output: node.outputs.get("output"),
          data: node.outputs.get("output"),
          status: node.status,
        });
      }
    });

    // Apply substitution to string values in config
    Object.keys(substitutedConfig).forEach((key) => {
      const value = substitutedConfig[key];
      if (typeof value === "string" && value.includes("{{")) {
        substitutedConfig[key] = substituteVariables(
          value,
          nodeOutputs,
          nodeLabelToId
        );
      }
    });

    return substitutedConfig;
  }

  // Execute a single node
  private async executeNode(
    context: ExecutionContext,
    plan: ExecutionPlan,
    onNodeUpdate?: (
      nodeId: string,
      status: string,
      data?: any,
      error?: string
    ) => void,
    executionId: string
  ): Promise<void> {
    context.status = "running";
    context.startTime = new Date();

    // Emit node start event
    const nodeStartEvent: NodeStartEvent = {
      type: "node:start",
      executionId,
      nodeId: context.nodeId,
      nodeType: context.nodeType,
      timestamp: new Date(),
    };
    executionEventBus.emit(nodeStartEvent);

    // Notify that node is starting
    if (onNodeUpdate) {
      onNodeUpdate(context.nodeId, "running");
    }

    try {
      console.log(`Executing node ${context.nodeId} (${context.nodeType}):`, {
        config: context.config,
        inputs: Array.from(context.inputs.entries()),
      });

      // Apply variable substitution to node configuration
      const nodeLabelToId = (plan as any).nodeLabelToId || new Map();
      const substitutedConfig = this.applyVariableSubstitution(
        context.config,
        plan,
        nodeLabelToId
      );

      // Update context with substituted configuration
      context.config = substitutedConfig;

      console.log(`Applied variable substitution for node ${context.nodeId}:`, {
        originalConfig: context.config,
        substitutedConfig: substitutedConfig,
      });

      // Import the appropriate node processor with error handling
      let processor;
      try {
        processor = await this.getNodeProcessor(context.nodeType);
      } catch (processorError) {
        // Processor resolution failed - provide detailed error
        const errorMessage =
          processorError instanceof Error
            ? processorError.message
            : "Unknown processor resolution error";

        throw new Error(
          `Cannot execute node "${context.nodeId}" (type: ${context.nodeType}): ${errorMessage}\n\n` +
            `Possible causes:\n` +
            `- Node type "${context.nodeType}" is invalid or unsupported\n` +
            `- Processor file is missing or corrupted\n` +
            `- Workflow was created with an older version\n\n` +
            `To fix this issue:\n` +
            `1. Check if the node type is valid\n` +
            `2. Remove the node and re-add it from the node library\n` +
            `3. Contact support if the issue persists`
        );
      }

      // Validate processor is a function
      if (typeof processor !== "function") {
        throw new Error(
          `Invalid processor for node "${context.nodeId}" (type: ${context.nodeType}): ` +
            `Processor is not a function. This indicates a corrupted processor module.`
        );
      }

      // Execute the node
      const result = await processor(context, plan);

      console.log(`Node ${context.nodeId} completed successfully:`, {
        result: result,
        duration: context.duration,
      });

      // Store the result
      context.outputs.set("output", result);
      context.status = "completed";
      context.endTime = new Date();
      context.duration =
        context.endTime.getTime() - context.startTime.getTime();

      // Store in plan results
      plan.results.set(context.nodeId, result);

      // Emit node complete event
      const nodeCompleteEvent: NodeCompleteEvent = {
        type: "node:complete",
        executionId,
        nodeId: context.nodeId,
        nodeType: context.nodeType,
        result: result,
        duration: context.duration || 0,
        timestamp: new Date(),
      };
      executionEventBus.emit(nodeCompleteEvent);

      // Notify that node completed successfully
      if (onNodeUpdate) {
        onNodeUpdate(context.nodeId, "completed", result);
      }
    } catch (error) {
      context.status = "failed";
      context.error = error instanceof Error ? error.message : "Unknown error";
      context.endTime = new Date();
      context.duration =
        context.endTime.getTime() - context.startTime.getTime();

      // Emit node error event
      const nodeErrorEvent: ExecutionErrorEvent = {
        type: "node:error",
        executionId,
        nodeId: context.nodeId,
        nodeType: context.nodeType,
        error: context.error || "Unknown error",
        timestamp: new Date(),
      };
      executionEventBus.emit(nodeErrorEvent);

      // Notify about the error
      if (onNodeUpdate) {
        onNodeUpdate(context.nodeId, "failed", undefined, context.error);
      }

      // Handle retries
      if (context.retryCount < context.maxRetries) {
        context.retryCount++;
        context.status = "pending";

        // Wait before retry
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, context.retryCount) * 1000)
        );

        // Retry execution
        return this.executeNode(context, plan, onNodeUpdate, executionId);
      }

      throw error;
    }
  }

  // Get node processor based on type with robust error handling
  private async getNodeProcessor(nodeType: string): Promise<any> {
    console.log(
      `[ExecutionEngine] Loading processor for node type: ${nodeType}`
    );

    // Registry of supported node types and their processor paths
    const processorRegistry: Record<string, string> = {
      dataInput: "./processors/dataInputProcessor",
      dataOutput: "./processors/dataOutputProcessor",
      webScraping: "./processors/webScrapingProcessor",
      llmTask: "./processors/llmProcessor",
      database: "./processors/unifiedDatabaseProcessor",
      slack: "./processors/slackProcessor",
      discord: "./processors/discordProcessor",
      gmail: "./processors/gmailProcessor",
      structuredOutput: "./processors/structuredOutputProcessor",
      embeddingGenerator: "./processors/embeddingProcessor",
      similaritySearch: "./processors/similarityProcessor",
    };

    try {
      // Check if node type is supported
      const processorPath = processorRegistry[nodeType];

      if (processorPath) {
        // Attempt to import the specific processor
        try {
          const processor = await import(processorPath);

          if (!processor || !processor.default) {
            throw new Error(
              `Processor module for "${nodeType}" exists but does not export a default function`
            );
          }

          console.log(
            `[ExecutionEngine] ✓ Successfully loaded processor for: ${nodeType}`
          );
          return processor.default;
        } catch (importError) {
          console.error(
            `[ExecutionEngine] Failed to import processor for "${nodeType}":`,
            importError
          );

          throw new Error(
            `Failed to load processor for node type "${nodeType}". ` +
              `This may be due to a missing or corrupted processor file. ` +
              `Error: ${
                importError instanceof Error
                  ? importError.message
                  : String(importError)
              }`
          );
        }
      } else {
        // Unsupported/unknown node type - use default processor
        console.warn(
          `[ExecutionEngine] ⚠ Unknown node type: "${nodeType}". ` +
            `Supported types: ${Object.keys(processorRegistry).join(", ")}`
        );

        try {
          const defaultProcessor = await import(
            "./processors/defaultProcessor"
          );

          if (!defaultProcessor || !defaultProcessor.default) {
            throw new Error("Default processor is not available");
          }

          console.log(
            `[ExecutionEngine] Using default processor for: ${nodeType}`
          );
          return defaultProcessor.default;
        } catch (defaultImportError) {
          console.error(
            `[ExecutionEngine] Critical: Failed to load default processor:`,
            defaultImportError
          );

          throw new Error(
            `Critical error: Cannot load default processor for unknown node type "${nodeType}". ` +
              `This indicates a system configuration issue. ` +
              `Error: ${
                defaultImportError instanceof Error
                  ? defaultImportError.message
                  : String(defaultImportError)
              }`
          );
        }
      }
    } catch (error) {
      // Re-throw with enhanced context if not already a processor error
      if (error instanceof Error && error.message.includes("processor")) {
        throw error;
      }

      throw new Error(
        `Unexpected error while resolving processor for node type "${nodeType}": ` +
          `${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Get execution order for sequential execution
  private getExecutionOrder(nodes: ExecutionContext[], edges: any[]): string[] {
    const nodeIds = nodes.map((n) => n.nodeId);
    const dependencies = new Map<string, Set<string>>();
    const inDegree = new Map<string, number>();

    // Initialize
    nodeIds.forEach((id) => {
      dependencies.set(id, new Set());
      inDegree.set(id, 0);
    });

    // Build dependency graph
    edges.forEach((edge) => {
      dependencies.get(edge.from)!.add(edge.to);
      inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
    });

    // Check for circular dependencies before topological sort
    const circularDeps = this.detectCircularDependencies(nodeIds, edges);
    if (circularDeps.length > 0) {
      throw new Error(
        `Circular dependencies detected in workflow: ${circularDeps.join(
          ", "
        )}. ` +
          "Please remove circular connections between nodes before executing the workflow."
      );
    }

    // Topological sort
    const queue: string[] = [];
    const result: string[] = [];

    // Find nodes with no dependencies
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeId);
      }
    });

    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      // Process dependencies
      dependencies.get(current)!.forEach((dependent) => {
        const newDegree = (inDegree.get(dependent) || 0) - 1;
        inDegree.set(dependent, newDegree);

        if (newDegree === 0) {
          queue.push(dependent);
        }
      });
    }

    // Verify all nodes are included in the result
    if (result.length !== nodeIds.length) {
      const missingNodes = nodeIds.filter((id) => !result.includes(id));
      throw new Error(
        `Unable to determine execution order for all nodes. ` +
          `Missing nodes: ${missingNodes.join(", ")}. ` +
          "This may indicate disconnected components or invalid workflow structure."
      );
    }

    return result;
  }

  // Detect circular dependencies in the workflow
  private detectCircularDependencies(
    nodeIds: string[],
    edges: any[]
  ): string[] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const circularDeps: string[] = [];

    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) {
        return true;
      }

      if (visited.has(nodeId)) {
        return false;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);

      // Find outgoing edges from this node
      const outgoingEdges = edges.filter((edge) => edge.from === nodeId);
      for (const edge of outgoingEdges) {
        if (hasCycle(edge.to)) {
          circularDeps.push(`${nodeId} -> ${edge.to}`);
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    // Check each node for cycles
    for (const nodeId of nodeIds) {
      if (!visited.has(nodeId)) {
        hasCycle(nodeId);
      }
    }

    return circularDeps;
  }

  // Check if execution should continue on error
  private shouldContinueOnError(plan: ExecutionPlan, nodeId: string): boolean {
    // Check if this is a critical node
    const criticalNodes = ["dataInput", "dataOutput"];
    const context = plan.nodes.find((n) => n.nodeId === nodeId);

    if (context && criticalNodes.includes(context.nodeType)) {
      return false;
    }

    return true;
  }

  // Get execution status
  getExecutionStatus(executionId: string): ExecutionPlan | undefined {
    return (
      this.activeExecutions.get(executionId) ||
      this.executionHistory.find((e) => e.id === executionId)
    );
  }

  // Get all active executions
  getActiveExecutions(): ExecutionPlan[] {
    return Array.from(this.activeExecutions.values());
  }

  // Get execution history
  getExecutionHistory(): ExecutionPlan[] {
    return this.executionHistory;
  }

  // Cancel execution
  async cancelExecution(executionId: string): Promise<boolean> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) return false;

    execution.status = "paused";
    execution.endTime = new Date();
    execution.totalDuration =
      execution.endTime.getTime() - (execution.startTime?.getTime() || 0);

    this.executionHistory.push(execution);
    this.activeExecutions.delete(executionId);

    return true;
  }

  // Get execution statistics
  getExecutionStats(): {
    totalExecutions: number;
    activeExecutions: number;
    completedExecutions: number;
    failedExecutions: number;
    averageDuration: number;
  } {
    const allExecutions = [
      ...this.activeExecutions.values(),
      ...this.executionHistory,
    ];

    return {
      totalExecutions: allExecutions.length,
      activeExecutions: this.activeExecutions.size,
      completedExecutions: allExecutions.filter((e) => e.status === "completed")
        .length,
      failedExecutions: allExecutions.filter((e) => e.status === "failed")
        .length,
      averageDuration:
        allExecutions
          .filter((e) => e.totalDuration)
          .reduce((sum, e) => sum + (e.totalDuration || 0), 0) /
          allExecutions.length || 0,
    };
  }
}

export const executionEngine = new ExecutionEngine();
