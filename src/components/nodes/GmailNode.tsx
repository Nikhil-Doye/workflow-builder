import React from "react";
import { NodeData } from "../../types";
import { GmailOperation } from "../../types/gmail";
import { NodeProps } from "reactflow";
import {
  Mail,
  Send,
  Eye,
  Reply,
  Forward,
  FileText,
  Tag,
  Search,
  Paperclip,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

interface GmailNodeProps extends NodeProps {
  data: NodeData;
}

const operationIcons: Record<GmailOperation, React.ComponentType<any>> = {
  [GmailOperation.SEND]: Send,
  [GmailOperation.READ]: Eye,
  [GmailOperation.REPLY]: Reply,
  [GmailOperation.FORWARD]: Forward,
  [GmailOperation.DRAFT]: FileText,
  [GmailOperation.LABEL]: Tag,
  [GmailOperation.SEARCH]: Search,
  [GmailOperation.ATTACHMENT]: Paperclip,
};

const operationLabels: Record<GmailOperation, string> = {
  [GmailOperation.SEND]: "Send Email",
  [GmailOperation.READ]: "Read Email",
  [GmailOperation.REPLY]: "Reply to Email",
  [GmailOperation.FORWARD]: "Forward Email",
  [GmailOperation.DRAFT]: "Manage Draft",
  [GmailOperation.LABEL]: "Manage Label",
  [GmailOperation.SEARCH]: "Search Emails",
  [GmailOperation.ATTACHMENT]: "Handle Attachment",
};

export const GmailNode: React.FC<GmailNodeProps> = ({ data, selected }) => {
  const operation = data.config?.operation as GmailOperation;
  const IconComponent = operation ? operationIcons[operation] : Mail;
  const operationLabel = operation
    ? operationLabels[operation]
    : "Gmail Operation";

  const getStatusColor = () => {
    if (data.status === "success") return "text-green-600";
    if (data.status === "error") return "text-red-600";
    if (data.status === "running") return "text-blue-600";
    return "text-gray-600";
  };

  const getPreviewData = () => {
    if (!data.config) return null;

    switch (operation) {
      case GmailOperation.SEND:
        return {
          to: data.config.to || "No recipient",
          subject: data.config.subject || "No subject",
        };
      case GmailOperation.READ:
        return {
          messageId: data.config.messageId || "No message ID",
          query: data.config.query || "No query",
        };
      case GmailOperation.REPLY:
        return {
          replyTo: data.config.replyToMessageId || "No reply target",
          subject: data.config.subject || "No subject",
        };
      case GmailOperation.FORWARD:
        return {
          messageId: data.config.messageId || "No message ID",
          to: data.config.to || "No recipient",
        };
      case GmailOperation.DRAFT:
        return {
          draftId: data.config.draftId || "New draft",
          subject: data.config.subject || "No subject",
        };
      case GmailOperation.LABEL:
        return {
          labelName: data.config.labelName || "No label name",
          labelId: data.config.labelId || "No label ID",
        };
      case GmailOperation.SEARCH:
        return {
          query: data.config.searchQuery || "No search query",
          maxResults: data.config.maxResults || "Default",
        };
      case GmailOperation.ATTACHMENT:
        return {
          messageId: data.config.messageId || "No message ID",
          attachmentId: data.config.attachmentId || "No attachment ID",
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
          ? "border-red-500 shadow-lg"
          : "border-red-200 hover:border-red-300"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
            <IconComponent className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {data.label || "Gmail Integration"}
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
