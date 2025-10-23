import React from "react";
import { NodeData } from "../../types";
import { SlackOperation } from "../../types/slack";
import {
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Hash,
  User,
  FileText,
  Smile,
  Bell,
  Users,
} from "lucide-react";

interface SlackNodeProps {
  data: NodeData;
  selected: boolean;
}

export const SlackNode: React.FC<SlackNodeProps> = ({ data, selected }) => {
  // Get operation display info
  const getOperationInfo = () => {
    const operation = data.config?.operation as SlackOperation;
    const operationIcons: Record<SlackOperation, React.ComponentType<any>> = {
      message: MessageSquare,
      channel: Hash,
      user: User,
      file: FileText,
      reaction: Smile,
      reminder: Bell,
    };

    const operationLabels: Record<SlackOperation, string> = {
      message: "Message",
      channel: "Channel",
      user: "User",
      file: "File",
      reaction: "Reaction",
      reminder: "Reminder",
    };

    return {
      icon: operationIcons[operation] || MessageSquare,
      label: operationLabels[operation] || "Slack",
    };
  };

  const operationInfo = getOperationInfo();
  const OperationIcon = operationInfo.icon;

  // Enhanced data for display
  const getDisplayData = () => {
    const operation = data.config?.operation;
    const baseData = {
      operation: operation || "Not configured",
      channel: data.config?.channel || "No channel",
      text: data.config?.text || "No message",
    };

    switch (operation) {
      case "message":
        return {
          ...baseData,
          channel: data.config?.channel || "No channel",
          text: data.config?.text || "No message",
        };
      case "channel":
        return {
          ...baseData,
          channel: data.config?.channelName || "No channel name",
          text: data.config?.channelPurpose || "No purpose",
        };
      case "user":
        return {
          ...baseData,
          channel: data.config?.userId || data.config?.userEmail || "No user",
          text: "User lookup",
        };
      case "file":
        return {
          ...baseData,
          channel: data.config?.channel || "No channel",
          text: data.config?.fileName || "No file name",
        };
      case "reaction":
        return {
          ...baseData,
          channel: data.config?.channel || "No channel",
          text: data.config?.emoji || "No emoji",
        };
      case "reminder":
        return {
          ...baseData,
          channel: data.config?.reminderUser || "No user",
          text: data.config?.reminderText || "No reminder text",
        };
      default:
        return baseData;
    }
  };

  const displayData = getDisplayData();

  // Custom status display for Slack operations
  const getStatusDisplay = () => {
    if (data.status === "success" && data.outputs && data.outputs.length > 0) {
      const output = data.outputs[0];
      if (output.channelId) {
        return (
          <div className="text-xs text-green-600">
            Sent to #{output.channelId}
          </div>
        );
      }
      if (output.messageTs) {
        return (
          <div className="text-xs text-green-600">
            Message sent at{" "}
            {new Date(output.messageTs * 1000).toLocaleTimeString()}
          </div>
        );
      }
      if (output.userId) {
        return (
          <div className="text-xs text-green-600">User: {output.userId}</div>
        );
      }
    }
    return null;
  };

  return (
    <div className="group min-w-[240px] bg-purple-50 rounded-2xl border-2 border-purple-200 shadow-lg transition-all duration-300 transform hover:scale-105">
      {/* Top Handle */}
      <div className="w-4 h-4 border-2 border-white bg-gray-400 hover:bg-gray-500 transition-colors rounded-full absolute -top-2 left-1/2 transform -translate-x-1/2" />

      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <OperationIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                {data.label || "Slack"}
              </h3>
              <p className="text-xs text-gray-500">{operationInfo.label}</p>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center space-x-2">
            {data.status === "running" && (
              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-blue-100">
                <Clock className="w-3 h-3 text-blue-500 animate-spin" />
              </div>
            )}
            {data.status === "success" && (
              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-green-100">
                <CheckCircle className="w-3 h-3 text-green-500" />
              </div>
            )}
            {data.status === "error" && (
              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-red-100">
                <XCircle className="w-3 h-3 text-red-500" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        <div className="space-y-2">
          {/* Operation Details */}
          <div className="text-xs text-gray-600">
            <div className="font-medium">
              Operation: {displayData.operation}
            </div>
            <div className="text-gray-500">Channel: {displayData.channel}</div>
            <div className="text-gray-500 truncate">
              {displayData.text.length > 30
                ? `${displayData.text.substring(0, 30)}...`
                : displayData.text}
            </div>
          </div>

          {/* Status Display */}
          {getStatusDisplay()}

          {/* Configuration Preview */}
          {data.config?.botToken && (
            <div className="text-xs text-gray-500">
              Bot Token: {data.config.botToken.substring(0, 8)}...
            </div>
          )}

          {/* Error Display */}
          {data.status === "error" && data.error && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
              Error: {data.error}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Handle */}
      <div className="w-4 h-4 border-2 border-white bg-gray-400 hover:bg-gray-500 transition-colors rounded-full absolute -bottom-2 left-1/2 transform -translate-x-1/2" />
    </div>
  );
};
