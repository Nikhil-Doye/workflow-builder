import React, { useState, useEffect, useCallback } from "react";
import {
  Clock,
  Play,
  Pause,
  Square,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Zap,
  Webhook,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import {
  workflowScheduler,
  ScheduleConfig,
  ScheduleExecution,
  ScheduleTrigger,
  ScheduleSettings,
  CronConfig,
  IntervalConfig,
  WebhookConfig,
  EventConfig,
} from "../services/workflowScheduler";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface WorkflowSchedulerProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId?: string;
}

export const WorkflowScheduler: React.FC<WorkflowSchedulerProps> = ({
  isOpen,
  onClose,
  workflowId,
}) => {
  const [schedules, setSchedules] = useState<ScheduleConfig[]>([]);
  const [executions, setExecutions] = useState<ScheduleExecution[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleConfig | null>(
    null
  );
  const [selectedSchedule, setSelectedSchedule] = useState<string | null>(null);
  const [executingSchedule, setExecutingSchedule] = useState<string | null>(
    null
  );

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    enabled: true,
    triggerType: "cron" as "cron" | "interval" | "webhook" | "event",
    cronExpression: "0 9 * * 1-5", // Weekdays at 9 AM
    intervalValue: 1,
    intervalUnit: "hours" as "minutes" | "hours" | "days" | "weeks",
    webhookUrl: "",
    webhookSecret: "",
    webhookMethod: "POST" as "GET" | "POST" | "PUT",
    eventType: "",
    maxRetries: 3,
    retryDelay: 5000,
    timeout: 300000, // 5 minutes
    parallel: false,
    notifyOnSuccess: false,
    notifyOnError: true,
    notificationEmail: "",
    webhookNotificationUrl: "",
  });

  const loadSchedules = useCallback(() => {
    const allSchedules = workflowId
      ? workflowScheduler.getSchedulesByWorkflow(workflowId)
      : workflowScheduler.getAllSchedules();
    setSchedules(allSchedules);
  }, [workflowId]);

  const loadExecutions = useCallback(() => {
    const allExecutions = workflowId
      ? workflowScheduler.getExecutionsByWorkflow(workflowId)
      : [];
    setExecutions(allExecutions);
  }, [workflowId]);

  useEffect(() => {
    if (isOpen) {
      loadSchedules();
      loadExecutions();
    }
  }, [isOpen, workflowId, loadSchedules, loadExecutions]);

  const handleCreateSchedule = async () => {
    try {
      const trigger: ScheduleTrigger = {
        type: formData.triggerType,
        config: getTriggerConfig(),
      };

      const settings: ScheduleSettings = {
        maxRetries: formData.maxRetries,
        retryDelay: formData.retryDelay,
        timeout: formData.timeout,
        parallel: formData.parallel,
        notifyOnSuccess: formData.notifyOnSuccess,
        notifyOnError: formData.notifyOnError,
        notificationEmail: formData.notificationEmail,
        webhookUrl: formData.webhookNotificationUrl,
      };

      await workflowScheduler.createSchedule({
        workflowId: workflowId || "",
        name: formData.name,
        description: formData.description,
        enabled: formData.enabled,
        trigger,
        settings,
      });

      loadSchedules();
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      console.error("Error creating schedule:", error);
    }
  };

  const handleUpdateSchedule = async () => {
    if (!editingSchedule) return;

    try {
      const trigger: ScheduleTrigger = {
        type: formData.triggerType,
        config: getTriggerConfig(),
      };

      const settings: ScheduleSettings = {
        maxRetries: formData.maxRetries,
        retryDelay: formData.retryDelay,
        timeout: formData.timeout,
        parallel: formData.parallel,
        notifyOnSuccess: formData.notifyOnSuccess,
        notifyOnError: formData.notifyOnError,
        notificationEmail: formData.notificationEmail,
        webhookUrl: formData.webhookNotificationUrl,
      };

      await workflowScheduler.updateSchedule(editingSchedule.id, {
        name: formData.name,
        description: formData.description,
        enabled: formData.enabled,
        trigger,
        settings,
      });

      loadSchedules();
      setEditingSchedule(null);
      resetForm();
    } catch (error) {
      console.error("Error updating schedule:", error);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this schedule?")) {
      try {
        await workflowScheduler.deleteSchedule(id);
        loadSchedules();
      } catch (error) {
        console.error("Error deleting schedule:", error);
      }
    }
  };

  const handleToggleSchedule = async (id: string, enabled: boolean) => {
    try {
      await workflowScheduler.updateSchedule(id, { enabled });
      loadSchedules();
    } catch (error) {
      console.error("Error toggling schedule:", error);
    }
  };

  const handleExecuteSchedule = async (id: string) => {
    setExecutingSchedule(id);
    try {
      await workflowScheduler.executeSchedule(id);
      loadSchedules();
      loadExecutions();
    } catch (error) {
      console.error("Error executing schedule:", error);
    } finally {
      setExecutingSchedule(null);
    }
  };

  const getTriggerConfig = ():
    | CronConfig
    | IntervalConfig
    | WebhookConfig
    | EventConfig => {
    switch (formData.triggerType) {
      case "cron":
        return {
          expression: formData.cronExpression,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
      case "interval":
        return {
          value: formData.intervalValue,
          unit: formData.intervalUnit,
        };
      case "webhook":
        return {
          url: formData.webhookUrl,
          secret: formData.webhookSecret,
          method: formData.webhookMethod,
        };
      case "event":
        return {
          eventType: formData.eventType,
        };
      default:
        return {
          expression: "0 9 * * 1-5",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      enabled: true,
      triggerType: "cron",
      cronExpression: "0 9 * * 1-5",
      intervalValue: 1,
      intervalUnit: "hours",
      webhookUrl: "",
      webhookSecret: "",
      webhookMethod: "POST",
      eventType: "",
      maxRetries: 3,
      retryDelay: 5000,
      timeout: 300000,
      parallel: false,
      notifyOnSuccess: false,
      notifyOnError: true,
      notificationEmail: "",
      webhookNotificationUrl: "",
    });
  };

  const startEdit = (schedule: ScheduleConfig) => {
    setEditingSchedule(schedule);
    setFormData({
      name: schedule.name,
      description: schedule.description || "",
      enabled: schedule.enabled,
      triggerType: schedule.trigger.type,
      cronExpression:
        schedule.trigger.type === "cron"
          ? (schedule.trigger.config as any).expression
          : "0 9 * * 1-5",
      intervalValue:
        schedule.trigger.type === "interval"
          ? (schedule.trigger.config as any).value
          : 1,
      intervalUnit:
        schedule.trigger.type === "interval"
          ? (schedule.trigger.config as any).unit
          : "hours",
      webhookUrl:
        schedule.trigger.type === "webhook"
          ? (schedule.trigger.config as any).url
          : "",
      webhookSecret:
        schedule.trigger.type === "webhook"
          ? (schedule.trigger.config as any).secret || ""
          : "",
      webhookMethod:
        schedule.trigger.type === "webhook"
          ? (schedule.trigger.config as any).method || "POST"
          : "POST",
      eventType:
        schedule.trigger.type === "event"
          ? (schedule.trigger.config as any).eventType
          : "",
      maxRetries: schedule.settings.maxRetries || 3,
      retryDelay: schedule.settings.retryDelay || 5000,
      timeout: schedule.settings.timeout || 300000,
      parallel: schedule.settings.parallel || false,
      notifyOnSuccess: schedule.settings.notifyOnSuccess || false,
      notifyOnError: schedule.settings.notifyOnError || true,
      notificationEmail: schedule.settings.notificationEmail || "",
      webhookNotificationUrl: schedule.settings.webhookUrl || "",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "paused":
        return <Pause className="w-4 h-4 text-yellow-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case "cron":
        return <Clock className="w-4 h-4" />;
      case "interval":
        return <RefreshCw className="w-4 h-4" />;
      case "webhook":
        return <Webhook className="w-4 h-4" />;
      case "event":
        return <Zap className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const getExecutionStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "running":
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case "cancelled":
        return <Square className="w-4 h-4 text-gray-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Workflow Scheduler
              </h2>
              <p className="text-sm text-gray-600">
                Schedule and automate workflow executions
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Schedule</span>
            </Button>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Schedules */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Scheduled Workflows
              </h3>
              {schedules.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">No schedules configured</p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Schedule
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {schedules.map((schedule) => (
                    <Card
                      key={schedule.id}
                      className={`p-4 transition-all duration-200 hover:shadow-md ${
                        selectedSchedule === schedule.id
                          ? "ring-2 ring-blue-500"
                          : ""
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {getTriggerIcon(schedule.trigger.type)}
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {schedule.name}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {schedule.description || "No description"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(schedule.status)}
                          <Badge
                            variant={schedule.enabled ? "default" : "secondary"}
                          >
                            {schedule.enabled ? "Active" : "Paused"}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="text-sm">
                          <span className="font-medium">Trigger:</span>{" "}
                          {schedule.trigger.type}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Runs:</span>{" "}
                          {schedule.runCount}
                        </div>
                        {schedule.lastRun && (
                          <div className="text-sm">
                            <span className="font-medium">Last run:</span>{" "}
                            {new Date(schedule.lastRun).toLocaleString()}
                          </div>
                        )}
                        {schedule.nextRun && (
                          <div className="text-sm">
                            <span className="font-medium">Next run:</span>{" "}
                            {new Date(schedule.nextRun).toLocaleString()}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleExecuteSchedule(schedule.id)}
                            disabled={executingSchedule === schedule.id}
                          >
                            {executingSchedule === schedule.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Play className="w-3 h-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleToggleSchedule(
                                schedule.id,
                                !schedule.enabled
                              )
                            }
                          >
                            {schedule.enabled ? (
                              <Pause className="w-3 h-3" />
                            ) : (
                              <Play className="w-3 h-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(schedule)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setSelectedSchedule(
                              selectedSchedule === schedule.id
                                ? null
                                : schedule.id
                            )
                          }
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Executions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Execution History
              </h3>
              {executions.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No executions yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {executions
                    .sort(
                      (a, b) => b.startedAt.getTime() - a.startedAt.getTime()
                    )
                    .slice(0, 20)
                    .map((execution) => (
                      <Card key={execution.id} className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {getExecutionStatusIcon(execution.status)}
                            <span className="text-sm font-medium">
                              {execution.status}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(execution.startedAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>
                            Duration:{" "}
                            {execution.duration
                              ? formatDuration(execution.duration)
                              : "N/A"}
                          </div>
                          {execution.error && (
                            <div className="text-red-600">
                              Error: {execution.error}
                            </div>
                          )}
                          {execution.retryCount > 0 && (
                            <div>Retries: {execution.retryCount}</div>
                          )}
                        </div>
                      </Card>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Create/Edit Schedule Dialog */}
        <Dialog
          open={showCreateDialog || !!editingSchedule}
          onOpenChange={() => {
            setShowCreateDialog(false);
            setEditingSchedule(null);
            resetForm();
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSchedule ? "Edit Schedule" : "Create New Schedule"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Schedule Name
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Daily Data Sync"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trigger Type
                  </label>
                  <Select
                    value={formData.triggerType}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, triggerType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cron">Cron Expression</SelectItem>
                      <SelectItem value="interval">Interval</SelectItem>
                      <SelectItem value="webhook">Webhook</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe what this schedule does..."
                  rows={2}
                />
              </div>

              {/* Trigger Configuration */}
              {formData.triggerType === "cron" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cron Expression
                  </label>
                  <Input
                    value={formData.cronExpression}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cronExpression: e.target.value,
                      })
                    }
                    placeholder="0 9 * * 1-5"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: minute hour day month dayOfWeek
                  </p>
                </div>
              )}

              {formData.triggerType === "interval" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Interval Value
                    </label>
                    <Input
                      type="number"
                      value={formData.intervalValue}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          intervalValue: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit
                    </label>
                    <Select
                      value={formData.intervalUnit}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, intervalUnit: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minutes">Minutes</SelectItem>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                        <SelectItem value="weeks">Weeks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {formData.triggerType === "webhook" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Webhook URL
                    </label>
                    <Input
                      value={formData.webhookUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, webhookUrl: e.target.value })
                      }
                      placeholder="https://example.com/webhook"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Method
                      </label>
                      <Select
                        value={formData.webhookMethod}
                        onValueChange={(value: any) =>
                          setFormData({ ...formData, webhookMethod: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GET">GET</SelectItem>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="PUT">PUT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Secret (Optional)
                      </label>
                      <Input
                        value={formData.webhookSecret}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            webhookSecret: e.target.value,
                          })
                        }
                        placeholder="webhook-secret"
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.triggerType === "event" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Type
                  </label>
                  <Input
                    value={formData.eventType}
                    onChange={(e) =>
                      setFormData({ ...formData, eventType: e.target.value })
                    }
                    placeholder="user.created"
                  />
                </div>
              )}

              {/* Settings */}
              <div className="border-t pt-4">
                <h4 className="text-md font-semibold text-gray-900 mb-3">
                  Execution Settings
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Retries
                    </label>
                    <Input
                      type="number"
                      value={formData.maxRetries}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxRetries: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Retry Delay (ms)
                    </label>
                    <Input
                      type="number"
                      value={formData.retryDelay}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          retryDelay: parseInt(e.target.value) || 5000,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timeout (ms)
                    </label>
                    <Input
                      type="number"
                      value={formData.timeout}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          timeout: parseInt(e.target.value) || 300000,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="border-t pt-4">
                <h4 className="text-md font-semibold text-gray-900 mb-3">
                  Notifications
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="notifyOnSuccess"
                      checked={formData.notifyOnSuccess}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notifyOnSuccess: e.target.checked,
                        })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="notifyOnSuccess"
                      className="text-sm font-medium text-gray-700"
                    >
                      Notify on success
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="notifyOnError"
                      checked={formData.notifyOnError}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notifyOnError: e.target.checked,
                        })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="notifyOnError"
                      className="text-sm font-medium text-gray-700"
                    >
                      Notify on error
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notification Email
                    </label>
                    <Input
                      value={formData.notificationEmail}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notificationEmail: e.target.value,
                        })
                      }
                      placeholder="admin@example.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  setEditingSchedule(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={
                  editingSchedule ? handleUpdateSchedule : handleCreateSchedule
                }
                disabled={!formData.name}
              >
                {editingSchedule ? "Update Schedule" : "Create Schedule"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
