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

    const plan = this.createExecutionPlan(workflowId, nodes, edges, options);
    plan.id = executionId;

    this.activeExecutions.set(executionId, plan);

    try {
      await this.executePlan(plan, onNodeUpdate);
      plan.status = "completed";
    } catch (error) {
      plan.status = "failed";
      plan.errors.set(
        "root",
        error instanceof Error ? error.message : "Unknown error"
      );
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

    return {
      id: "",
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
    ) => void
  ): Promise<void> {
    plan.status = "running";
    plan.startTime = new Date();

    switch (plan.executionMode) {
      case "sequential":
        await this.executeSequential(plan, onNodeUpdate);
        break;
      case "parallel":
        await this.executeParallel(plan, onNodeUpdate);
        break;
      case "conditional":
        await this.executeConditional(plan, onNodeUpdate);
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
    ) => void
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
        await this.executeNode(context, plan, onNodeUpdate);
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
    ) => void
  ): Promise<void> {
    const parallelGroups = this.createParallelGroups(
      plan.nodes,
      plan.edges,
      "parallel"
    );

    // Execute groups in parallel
    const groupPromises = parallelGroups.map((group) =>
      this.executeParallelGroup(group, plan, onNodeUpdate)
    );

    await Promise.allSettled(groupPromises);
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
    ) => void
  ): Promise<void> {
    const nodePromises = group.nodes.map((nodeId) => {
      const context = plan.nodes.find((n) => n.nodeId === nodeId);
      if (!context) return Promise.resolve();

      return this.executeNode(context, plan, onNodeUpdate);
    });

    if (group.waitForAll) {
      await Promise.allSettled(nodePromises);
    } else {
      await Promise.race(nodePromises);
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
    ) => void
  ): Promise<void> {
    const executionOrder = this.getExecutionOrder(plan.nodes, plan.edges);
    const visited = new Set<string>();

    for (const nodeId of executionOrder) {
      if (visited.has(nodeId)) continue;

      const context = plan.nodes.find((n) => n.nodeId === nodeId);
      if (!context) continue;

      try {
        await this.executeNode(context, plan, onNodeUpdate);
        visited.add(nodeId);

        // Check for conditional branches
        const branches = this.getConditionalBranches(nodeId, plan);
        if (branches.length > 0) {
          await this.executeConditionalBranches(
            branches,
            plan,
            visited,
            onNodeUpdate
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
    ) => void
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
          await this.executeNode(context, plan, onNodeUpdate);
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

  // Execute a single node
  private async executeNode(
    context: ExecutionContext,
    plan: ExecutionPlan,
    onNodeUpdate?: (
      nodeId: string,
      status: string,
      data?: any,
      error?: string
    ) => void
  ): Promise<void> {
    context.status = "running";
    context.startTime = new Date();

    // Notify that node is starting
    if (onNodeUpdate) {
      onNodeUpdate(context.nodeId, "running");
    }

    try {
      console.log(`Executing node ${context.nodeId} (${context.nodeType}):`, {
        config: context.config,
        inputs: Array.from(context.inputs.entries()),
      });

      // Import the appropriate node processor
      const processor = await this.getNodeProcessor(context.nodeType);

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
        return this.executeNode(context, plan, onNodeUpdate);
      }

      throw error;
    }
  }

  // Get node processor based on type
  private async getNodeProcessor(nodeType: string): Promise<any> {
    console.log(`Loading processor for node type: ${nodeType}`);

    // Import the appropriate processor
    switch (nodeType) {
      case "dataInput":
        return (await import("./processors/dataInputProcessor")).default;
      case "dataOutput":
        return (await import("./processors/dataOutputProcessor")).default;
      case "webScraping":
        return (await import("./processors/webScrapingProcessor")).default;
      case "llmTask":
        return (await import("./processors/llmProcessor")).default;
      case "databaseQuery":
        return (await import("./processors/databaseProcessor")).default;
      case "structuredOutput":
        return (await import("./processors/structuredOutputProcessor")).default;
      case "embeddingGenerator":
        return (await import("./processors/embeddingProcessor")).default;
      case "similaritySearch":
        return (await import("./processors/similarityProcessor")).default;
      default:
        console.log(`Using default processor for unknown type: ${nodeType}`);
        return (await import("./processors/defaultProcessor")).default;
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

    return result;
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
