import React from "react";
import { NodeData } from "../../types";
import { DiscordOperation } from "../../types/discord";
import { NodeProps } from "reactflow";
import {
  MessageSquare,
  Hash,
  Users,
  Shield,
  Heart,
  Mic,
  Webhook,
  Bot,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

interface DiscordNodeProps extends NodeProps {
  data: NodeData;
}

const operationIcons: Record<DiscordOperation, React.ComponentType<any>> = {
  [DiscordOperation.MESSAGE]: MessageSquare,
  [DiscordOperation.CHANNEL]: Hash,
  [DiscordOperation.USER]: Users,
  [DiscordOperation.ROLE]: Shield,
  [DiscordOperation.REACTION]: Heart,
  [DiscordOperation.VOICE]: Mic,
  [DiscordOperation.WEBHOOK]: Webhook,
};

const operationLabels: Record<DiscordOperation, string> = {
  [DiscordOperation.MESSAGE]: "Send Message",
  [DiscordOperation.CHANNEL]: "Manage Channel",
  [DiscordOperation.USER]: "Manage User",
  [DiscordOperation.ROLE]: "Manage Role",
  [DiscordOperation.REACTION]: "Add Reaction",
  [DiscordOperation.VOICE]: "Voice Control",
  [DiscordOperation.WEBHOOK]: "Webhook",
};

export const DiscordNode: React.FC<DiscordNodeProps> = ({ data, selected }) => {
  const operation = data.config?.operation as DiscordOperation;
  const IconComponent = operation ? operationIcons[operation] : Bot;
  const operationLabel = operation
    ? operationLabels[operation]
    : "Discord Operation";

  const getStatusColor = () => {
    if (data.status === "success") return "text-green-600";
    if (data.status === "error") return "text-red-600";
    if (data.status === "running") return "text-blue-600";
    return "text-gray-600";
  };

  const getPreviewData = () => {
    if (!data.config) return null;

    switch (operation) {
      case DiscordOperation.MESSAGE:
        return {
          channel: data.config.channelId
            ? `#${data.config.channelId}`
            : "No channel",
          message: data.config.message || "No message",
        };
      case DiscordOperation.CHANNEL:
        return {
          name: data.config.channelName || "No name",
          type: data.config.channelType || "text",
        };
      case DiscordOperation.USER:
        return {
          user: data.config.userId || "No user",
          nickname: data.config.nickname || "No nickname",
        };
      case DiscordOperation.ROLE:
        return {
          role: data.config.roleName || "No role",
          color: data.config.roleColor || "#000000",
        };
      case DiscordOperation.REACTION:
        return {
          emoji: data.config.emoji || "👍",
          message: data.config.messageId || "No message",
        };
      case DiscordOperation.VOICE:
        return {
          channel: data.config.voiceChannelId || "No channel",
          action: data.config.action || "join",
        };
      case DiscordOperation.WEBHOOK:
        return {
          name: data.config.webhookName || "No name",
          url: data.config.webhookUrl ? "Configured" : "No URL",
        };
      default:
        return null;
    }
  };

  const preview = getPreviewData();

  return (
    <div
      className={`bg-white border-2 rounded-lg shadow-sm transition-all duration-200 ${
        selected
          ? "border-indigo-500 shadow-lg"
          : "border-indigo-200 hover:border-indigo-300"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <IconComponent className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {data.label || "Discord Integration"}
            </h3>
            <p className="text-xs text-gray-500">{operationLabel}</p>
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

      {/* Content */}
      <div className="px-4 pb-4">
        <div className="space-y-2">
          {/* Operation Details */}
          <div className="text-xs text-gray-600">
            {preview && (
              <div className="space-y-1">
                {Object.entries(preview).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-500 capitalize">{key}:</span>
                    <span className="text-gray-700 truncate ml-2">
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status Display */}
          {data.status && (
            <div className={`text-xs font-medium ${getStatusColor()}`}>
              {data.status === "success" && "✓ Completed"}
              {data.status === "error" && "✗ Failed"}
              {data.status === "running" && "⏳ Running"}
              {data.status === "idle" && "⏸ Ready"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
