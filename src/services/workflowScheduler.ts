export interface ScheduleConfig {
  id: string;
  workflowId: string;
  name: string;
  description?: string;
  enabled: boolean;
  trigger: ScheduleTrigger;
  settings: ScheduleSettings;
  createdAt: Date;
  updatedAt: Date;
  lastRun?: Date;
  nextRun?: Date;
  runCount: number;
  status: "active" | "paused" | "error";
  error?: string;
}

export interface ScheduleTrigger {
  type: "cron" | "interval" | "webhook" | "event";
  config: CronConfig | IntervalConfig | WebhookConfig | EventConfig;
}

export interface CronConfig {
  expression: string; // e.g., "0 9 * * 1-5" for weekdays at 9 AM
  timezone?: string;
}

export interface IntervalConfig {
  value: number;
  unit: "minutes" | "hours" | "days" | "weeks";
}

export interface WebhookConfig {
  url: string;
  secret?: string;
  method?: "GET" | "POST" | "PUT";
  headers?: Record<string, string>;
}

export interface EventConfig {
  eventType: string;
  conditions?: Record<string, any>;
}

export interface ScheduleSettings {
  maxRetries?: number;
  retryDelay?: number; // in milliseconds
  timeout?: number; // in milliseconds
  parallel?: boolean;
  notifyOnSuccess?: boolean;
  notifyOnError?: boolean;
  notificationEmail?: string;
  webhookUrl?: string;
}

export interface ScheduleExecution {
  id: string;
  scheduleId: string;
  workflowId: string;
  status: "running" | "completed" | "failed" | "cancelled";
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  result?: any;
  error?: string;
  retryCount: number;
  triggerData?: any;
}

class WorkflowScheduler {
  private schedules: Map<string, ScheduleConfig> = new Map();
  private executions: Map<string, ScheduleExecution> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private webhookHandlers: Map<string, (data: any) => void> = new Map();

  constructor() {
    this.loadSchedules();
    this.startScheduler();
  }

  // Schedule Management
  async createSchedule(
    schedule: Omit<
      ScheduleConfig,
      "id" | "createdAt" | "updatedAt" | "runCount" | "status"
    >
  ): Promise<string> {
    const id = `schedule_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const newSchedule: ScheduleConfig = {
      ...schedule,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      runCount: 0,
      status: "active",
    };

    this.schedules.set(id, newSchedule);
    this.scheduleNextRun(newSchedule);
    this.saveSchedules();
    return id;
  }

  async updateSchedule(
    id: string,
    updates: Partial<ScheduleConfig>
  ): Promise<boolean> {
    const schedule = this.schedules.get(id);
    if (!schedule) return false;

    const updatedSchedule = {
      ...schedule,
      ...updates,
      updatedAt: new Date(),
    };

    this.schedules.set(id, updatedSchedule);

    // Reschedule if trigger changed
    if (updates.trigger || updates.enabled !== undefined) {
      this.clearSchedule(id);
      if (updatedSchedule.enabled && updatedSchedule.status === "active") {
        this.scheduleNextRun(updatedSchedule);
      }
    }

    this.saveSchedules();
    return true;
  }

  async deleteSchedule(id: string): Promise<boolean> {
    const schedule = this.schedules.get(id);
    if (!schedule) return false;

    this.clearSchedule(id);
    this.schedules.delete(id);
    this.saveSchedules();
    return true;
  }

  getSchedule(id: string): ScheduleConfig | undefined {
    return this.schedules.get(id);
  }

  getAllSchedules(): ScheduleConfig[] {
    return Array.from(this.schedules.values());
  }

  getSchedulesByWorkflow(workflowId: string): ScheduleConfig[] {
    return Array.from(this.schedules.values()).filter(
      (s) => s.workflowId === workflowId
    );
  }

  // Execution Management
  async executeSchedule(
    scheduleId: string,
    triggerData?: any
  ): Promise<string> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      throw new Error("Schedule not found");
    }

    const executionId = `exec_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const execution: ScheduleExecution = {
      id: executionId,
      scheduleId,
      workflowId: schedule.workflowId,
      status: "running",
      startedAt: new Date(),
      retryCount: 0,
      triggerData,
    };

    this.executions.set(executionId, execution);

    try {
      // For now, we'll simulate workflow execution
      // In a real implementation, this would trigger the actual workflow execution
      console.log(`Executing scheduled workflow: ${schedule.workflowId}`);

      // Simulate execution time
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update execution status
      execution.status = "completed";
      execution.completedAt = new Date();
      execution.duration =
        execution.completedAt.getTime() - execution.startedAt.getTime();

      // Update schedule
      schedule.runCount++;
      schedule.lastRun = new Date();
      this.schedules.set(scheduleId, schedule);

      // Schedule next run
      this.scheduleNextRun(schedule);
    } catch (error) {
      execution.status = "failed";
      execution.error =
        error instanceof Error ? error.message : "Unknown error";
      execution.completedAt = new Date();
      execution.duration =
        execution.completedAt.getTime() - execution.startedAt.getTime();

      // Handle retries
      if (
        schedule.settings.maxRetries &&
        execution.retryCount < schedule.settings.maxRetries
      ) {
        execution.retryCount++;
        execution.status = "running";
        execution.startedAt = new Date();

        // Schedule retry
        setTimeout(() => {
          this.executeSchedule(scheduleId, triggerData);
        }, schedule.settings.retryDelay || 5000);
      }
    }

    this.executions.set(executionId, execution);
    this.saveExecutions();
    return executionId;
  }

  getExecution(id: string): ScheduleExecution | undefined {
    return this.executions.get(id);
  }

  getExecutionsBySchedule(scheduleId: string): ScheduleExecution[] {
    return Array.from(this.executions.values()).filter(
      (e) => e.scheduleId === scheduleId
    );
  }

  getExecutionsByWorkflow(workflowId: string): ScheduleExecution[] {
    return Array.from(this.executions.values()).filter(
      (e) => e.workflowId === workflowId
    );
  }

  // Webhook Management
  registerWebhookHandler(
    scheduleId: string,
    handler: (data: any) => void
  ): void {
    this.webhookHandlers.set(scheduleId, handler);
  }

  unregisterWebhookHandler(scheduleId: string): void {
    this.webhookHandlers.delete(scheduleId);
  }

  async handleWebhook(scheduleId: string, data: any): Promise<void> {
    const handler = this.webhookHandlers.get(scheduleId);
    if (handler) {
      handler(data);
    }

    // Execute the schedule
    await this.executeSchedule(scheduleId, data);
  }

  // Private Methods
  private scheduleNextRun(schedule: ScheduleConfig): void {
    if (!schedule.enabled || schedule.status !== "active") return;

    this.clearSchedule(schedule.id);

    let nextRun: Date | null = null;

    switch (schedule.trigger.type) {
      case "cron":
        nextRun = this.calculateNextCronRun(
          schedule.trigger.config as CronConfig
        );
        break;
      case "interval":
        nextRun = this.calculateNextIntervalRun(
          schedule.trigger.config as IntervalConfig
        );
        break;
      case "webhook":
      case "event":
        // These are event-driven, no scheduling needed
        return;
      default:
        return;
    }

    if (nextRun) {
      const delay = nextRun.getTime() - Date.now();
      if (delay > 0) {
        const timer = setTimeout(() => {
          this.executeSchedule(schedule.id);
        }, delay);

        this.timers.set(schedule.id, timer);
        schedule.nextRun = nextRun;
        this.schedules.set(schedule.id, schedule);
      }
    }
  }

  private clearSchedule(scheduleId: string): void {
    const timer = this.timers.get(scheduleId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(scheduleId);
    }
  }

  private calculateNextCronRun(config: CronConfig): Date | null {
    // Simple cron parser - in production, use a proper cron library
    const now = new Date();
    const [minute, hour] = config.expression.split(" ");

    // This is a simplified implementation
    // In production, use a library like 'node-cron' or 'cron-parser'
    const nextRun = new Date(now);
    nextRun.setMinutes(parseInt(minute) || 0);
    nextRun.setHours(parseInt(hour) || 0);
    nextRun.setSeconds(0);
    nextRun.setMilliseconds(0);

    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    return nextRun;
  }

  private calculateNextIntervalRun(config: IntervalConfig): Date {
    const now = new Date();
    const intervalMs = this.getIntervalMs(config.value, config.unit);
    return new Date(now.getTime() + intervalMs);
  }

  private getIntervalMs(value: number, unit: string): number {
    const multipliers = {
      minutes: 60 * 1000,
      hours: 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000,
      weeks: 7 * 24 * 60 * 60 * 1000,
    };
    return value * (multipliers[unit as keyof typeof multipliers] || 1000);
  }

  private startScheduler(): void {
    // Check for schedules every minute
    setInterval(() => {
      this.checkSchedules();
    }, 60000);
  }

  private checkSchedules(): void {
    const now = new Date();
    for (const schedule of this.schedules.values()) {
      if (
        schedule.nextRun &&
        schedule.nextRun <= now &&
        schedule.enabled &&
        schedule.status === "active"
      ) {
        this.executeSchedule(schedule.id);
      }
    }
  }

  private loadSchedules(): void {
    try {
      const stored = localStorage.getItem("workflow_schedules");
      if (stored) {
        const schedules = JSON.parse(stored);
        schedules.forEach((schedule: ScheduleConfig) => {
          this.schedules.set(schedule.id, {
            ...schedule,
            createdAt: new Date(schedule.createdAt),
            updatedAt: new Date(schedule.updatedAt),
            lastRun: schedule.lastRun ? new Date(schedule.lastRun) : undefined,
            nextRun: schedule.nextRun ? new Date(schedule.nextRun) : undefined,
          });
        });
      }
    } catch (error) {
      console.error("Error loading schedules:", error);
    }
  }

  private saveSchedules(): void {
    try {
      const schedules = Array.from(this.schedules.values());
      localStorage.setItem("workflow_schedules", JSON.stringify(schedules));
    } catch (error) {
      console.error("Error saving schedules:", error);
    }
  }

  private loadExecutions(): void {
    try {
      const stored = localStorage.getItem("schedule_executions");
      if (stored) {
        const executions = JSON.parse(stored);
        executions.forEach((execution: ScheduleExecution) => {
          this.executions.set(execution.id, {
            ...execution,
            startedAt: new Date(execution.startedAt),
            completedAt: execution.completedAt
              ? new Date(execution.completedAt)
              : undefined,
          });
        });
      }
    } catch (error) {
      console.error("Error loading executions:", error);
    }
  }

  private saveExecutions(): void {
    try {
      const executions = Array.from(this.executions.values());
      localStorage.setItem("schedule_executions", JSON.stringify(executions));
    } catch (error) {
      console.error("Error saving executions:", error);
    }
  }
}

export const workflowScheduler = new WorkflowScheduler();
