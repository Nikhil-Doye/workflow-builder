// Event types for execution lifecycle
export interface ExecutionStartEvent {
  type: "execution:start";
  executionId: string;
  workflowId: string;
  timestamp: Date;
  nodeCount: number;
  executionMode: "sequential" | "parallel" | "conditional";
}

export interface NodeStartEvent {
  type: "node:start";
  executionId: string;
  nodeId: string;
  nodeType: string;
  nodeLabel?: string;
  timestamp: Date;
  config?: Record<string, any>;
}

export interface NodeProgressEvent {
  type: "node:progress";
  executionId: string;
  nodeId: string;
  progress: number; // 0-100
  message: string;
  timestamp: Date;
}

export interface NodeCompleteEvent {
  type: "node:complete";
  executionId: string;
  nodeId: string;
  nodeType?: string;
  status?: "success" | "failed" | "skipped";
  output?: any;
  result?: any;
  error?: string;
  duration: number; // milliseconds
  timestamp: Date;
  retryCount?: number;
}

export interface ExecutionCompleteEvent {
  type: "execution:complete";
  executionId: string;
  workflowId: string;
  status: "success" | "failed" | "cancelled";
  totalDuration: number; // milliseconds
  completedNodes: number;
  failedNodes: number;
  results: Map<string, any>;
  errors: Map<string, string>;
  timestamp: Date;
}

export interface ExecutionErrorEvent {
  type: "execution:error" | "node:error";
  executionId: string;
  stage?: "validation" | "planning" | "execution";
  error: string;
  nodeId?: string;
  nodeType?: string;
  timestamp: Date;
}

export type ExecutionEvent =
  | ExecutionStartEvent
  | NodeStartEvent
  | NodeProgressEvent
  | NodeCompleteEvent
  | ExecutionCompleteEvent
  | ExecutionErrorEvent;

type EventListener<T extends ExecutionEvent = ExecutionEvent> = (
  event: T
) => void;

/**
 * ExecutionEventBus - Centralized event emitter for workflow execution events
 * Provides real-time feedback on execution progress to all subscribers
 */
export class ExecutionEventBus {
  private listeners: Map<ExecutionEvent["type"], Set<EventListener>> =
    new Map();
  private eventHistory: ExecutionEvent[] = [];
  private maxHistorySize = 1000;
  private activeExecutions: Set<string> = new Set();

  /**
   * Subscribe to a specific execution event type
   */
  subscribe<T extends ExecutionEvent>(
    eventType: T["type"],
    listener: EventListener<T>
  ): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    const listeners = this.listeners.get(eventType)!;
    listeners.add(listener as EventListener);

    // Return unsubscribe function
    return () => {
      listeners.delete(listener as EventListener);
    };
  }

  /**
   * Subscribe to all events from a specific execution
   */
  subscribeToExecution(
    executionId: string,
    listener: EventListener
  ): () => void {
    const eventTypes: ExecutionEvent["type"][] = [
      "execution:start",
      "node:start",
      "node:progress",
      "node:complete",
      "execution:complete",
      "execution:error",
    ];

    const unsubscribers = eventTypes.map((eventType) =>
      this.subscribe(eventType, (event: any) => {
        if (event.executionId === executionId) {
          listener(event);
        }
      })
    );

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }

  /**
   * Emit an execution event
   */
  emit(event: ExecutionEvent): void {
    // Track active executions
    if (event.type === "execution:start") {
      this.activeExecutions.add(event.executionId);
    } else if (event.type === "execution:complete") {
      this.activeExecutions.delete(event.executionId);
    }

    // Store in history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Emit to listeners
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          console.error("Error in event listener:", error);
        }
      });
    }

    // Log important events
    if (
      event.type === "execution:start" ||
      event.type === "execution:complete" ||
      event.type === "execution:error" ||
      (event.type === "node:complete" && event.status !== "success")
    ) {
      console.log(`[ExecutionEventBus] ${event.type}`, event);
    }
  }

  /**
   * Get event history filtered by type or execution
   */
  getHistory(filter?: {
    executionId?: string;
    eventType?: ExecutionEvent["type"];
    limit?: number;
  }): ExecutionEvent[] {
    let history = [...this.eventHistory];

    if (filter?.executionId) {
      history = history.filter((e) => e.executionId === filter.executionId);
    }

    if (filter?.eventType) {
      history = history.filter((e) => e.type === filter.eventType);
    }

    if (filter?.limit) {
      history = history.slice(-filter.limit);
    }

    return history;
  }

  /**
   * Get active execution IDs
   */
  getActiveExecutions(): string[] {
    return Array.from(this.activeExecutions);
  }

  /**
   * Check if execution is active
   */
  isExecutionActive(executionId: string): boolean {
    return this.activeExecutions.has(executionId);
  }

  /**
   * Clear event history (useful for testing or cleanup)
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Unsubscribe from all listeners
   */
  clear(): void {
    this.listeners.clear();
    this.eventHistory = [];
    this.activeExecutions.clear();
  }
}

// Singleton instance
export const executionEventBus = new ExecutionEventBus();
