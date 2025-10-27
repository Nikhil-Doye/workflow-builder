import React, { useEffect, useRef, useState } from "react";
import {
  executionEventBus,
  ExecutionEvent,
  NodeCompleteEvent,
  NodeStartEvent,
} from "../services/executionEventBus";
import {
  ChevronDown,
  ChevronUp,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Download,
  Trash2,
} from "lucide-react";

interface LogEntry {
  timestamp: Date;
  level: "info" | "success" | "warning" | "error";
  message: string;
  nodeId?: string;
  nodeLabel?: string;
  event?: ExecutionEvent;
}

interface ExecutionLoggerProps {
  executionId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ExecutionLogger: React.FC<ExecutionLoggerProps> = ({
  executionId,
  isOpen,
  onClose,
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEvent = (event: ExecutionEvent) => {
      const newLog: LogEntry = {
        timestamp: event.timestamp,
        event,
        level: "info",
        message: "",
      };

      switch (event.type) {
        case "execution:start":
          newLog.message = `Workflow execution started (${event.executionMode} mode, ${event.nodeCount} nodes)`;
          newLog.level = "info";
          break;
        case "node:start":
          newLog.message = `Node started`;
          newLog.nodeId = event.nodeId;
          newLog.nodeLabel = event.nodeLabel;
          newLog.level = "info";
          break;
        case "node:progress":
          newLog.message = `${event.message} (${event.progress}%)`;
          newLog.nodeId = event.nodeId;
          newLog.level = "info";
          break;
        case "node:complete":
          const completeEvent = event as NodeCompleteEvent;
          if (completeEvent.status === "success") {
            newLog.message = `Node completed successfully (${completeEvent.duration}ms)`;
            newLog.level = "success";
          } else if (completeEvent.status === "failed") {
            newLog.message = `Node failed: ${completeEvent.error}`;
            newLog.level = "error";
          } else {
            newLog.message = `Node ${completeEvent.status}`;
            newLog.level = "warning";
          }
          newLog.nodeId = event.nodeId;
          break;
        case "execution:complete":
          newLog.message = `Workflow execution ${event.status} (${event.totalDuration}ms, ${event.completedNodes} completed, ${event.failedNodes} failed)`;
          newLog.level = event.status === "success" ? "success" : "error";
          break;
        case "execution:error":
          newLog.message = `Error during ${event.stage}: ${event.error}`;
          newLog.nodeId = event.nodeId;
          newLog.level = "error";
          break;
      }

      setLogs((prev) => [...prev, newLog]);
    };

    if (executionId) {
      unsubscribeRef.current = executionEventBus.subscribeToExecution(
        executionId,
        handleEvent
      );
    } else {
      // Subscribe to all events if no specific execution ID
      unsubscribeRef.current = () => {};
      const unsubscribers = [
        executionEventBus.subscribe("execution:start", handleEvent),
        executionEventBus.subscribe("node:start", handleEvent),
        executionEventBus.subscribe("node:progress", handleEvent),
        executionEventBus.subscribe("node:complete", handleEvent),
        executionEventBus.subscribe("execution:complete", handleEvent),
        executionEventBus.subscribe("execution:error", handleEvent),
      ];
      unsubscribeRef.current = () => {
        unsubscribers.forEach((unsub) => unsub());
      };
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [isOpen, executionId]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logsContainerRef.current) {
      logsContainerRef.current.scrollTop =
        logsContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const downloadLogs = () => {
    const logsText = logs
      .map(
        (log) =>
          `[${log.timestamp.toISOString()}] [${log.level.toUpperCase()}] ${
            log.nodeLabel ? `(${log.nodeLabel}) ` : ""
          }${log.message}`
      )
      .join("\n");

    const blob = new Blob([logsText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `execution-logs-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />;
      case "warning":
        return <Clock className="w-4 h-4 text-yellow-500 flex-shrink-0" />;
      default:
        return <Zap className="w-4 h-4 text-blue-500 flex-shrink-0" />;
    }
  };

  const getLogBgColor = (level: string) => {
    switch (level) {
      case "success":
        return "bg-green-50 border-l-4 border-green-500";
      case "error":
        return "bg-red-50 border-l-4 border-red-500";
      case "warning":
        return "bg-yellow-50 border-l-4 border-yellow-500";
      default:
        return "bg-blue-50 border-l-4 border-blue-500";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 right-0 w-full lg:w-96 bg-white border-l border-t border-gray-200 shadow-2xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Execution Logs</h3>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
            {logs.length}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1 rounded transition-colors ${
              autoScroll
                ? "bg-blue-100 text-blue-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
            title={autoScroll ? "Disable auto-scroll" : "Enable auto-scroll"}
          >
            <Clock className="w-4 h-4" />
          </button>
          <button
            onClick={downloadLogs}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Download logs"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={clearLogs}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Clear logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Logs Container */}
      {!isCollapsed && (
        <div
          ref={logsContainerRef}
          className="flex-1 overflow-y-auto bg-gray-50 font-mono text-xs"
          style={{ minHeight: "200px", maxHeight: "400px" }}
        >
          {logs.length === 0 ? (
            <div className="p-4 text-gray-500 text-center">
              <p>No logs yet. Execute a workflow to see logs here.</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`p-2 rounded transition-colors ${getLogBgColor(
                    log.level
                  )}`}
                >
                  <div className="flex items-start space-x-2">
                    {getLogIcon(log.level)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                        <span className="text-gray-500">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                        {log.nodeLabel && (
                          <span className="bg-white/60 px-2 py-0.5 rounded text-gray-700 font-semibold">
                            {log.nodeLabel}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 mt-0.5 break-words">
                        {log.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
