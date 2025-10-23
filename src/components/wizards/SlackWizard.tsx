import React, { useState, useEffect } from "react";
import { SlackConfig, SlackOperation } from "../../types/slack";

interface SlackWizardProps {
  config: SlackConfig;
  onConfigChange: (config: SlackConfig) => void;
  onClose: () => void;
}

export const SlackWizard: React.FC<SlackWizardProps> = ({
  config,
  onConfigChange,
  onClose,
}) => {
  const [operation, setOperation] = useState<SlackOperation>(
    config.operation || "message"
  );

  // Update config when operation changes
  useEffect(() => {
    onConfigChange({
      ...config,
      operation,
    });
  }, [operation]);

  const renderOperationFields = () => {
    switch (operation) {
      case "message":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Channel or User ID
              </label>
              <input
                type="text"
                value={config.channel || ""}
                onChange={(e) =>
                  onConfigChange({ ...config, channel: e.target.value })
                }
                placeholder="#general or @username or C1234567890"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Message Text
              </label>
              <textarea
                value={config.text || ""}
                onChange={(e) =>
                  onConfigChange({ ...config, text: e.target.value })
                }
                placeholder="Hello! This is a message from the workflow."
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Username (optional)
                </label>
                <input
                  type="text"
                  value={config.username || ""}
                  onChange={(e) =>
                    onConfigChange({ ...config, username: e.target.value })
                  }
                  placeholder="Workflow Bot"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Icon Emoji (optional)
                </label>
                <input
                  type="text"
                  value={config.iconEmoji || ""}
                  onChange={(e) =>
                    onConfigChange({ ...config, iconEmoji: e.target.value })
                  }
                  placeholder=":robot_face:"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        );

      case "channel":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Channel Name
              </label>
              <input
                type="text"
                value={config.channelName || ""}
                onChange={(e) =>
                  onConfigChange({ ...config, channelName: e.target.value })
                }
                placeholder="project-alpha"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Channel Purpose
              </label>
              <input
                type="text"
                value={config.channelPurpose || ""}
                onChange={(e) =>
                  onConfigChange({ ...config, channelPurpose: e.target.value })
                }
                placeholder="Discussion about Project Alpha"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Channel Topic
              </label>
              <input
                type="text"
                value={config.channelTopic || ""}
                onChange={(e) =>
                  onConfigChange({ ...config, channelTopic: e.target.value })
                }
                placeholder="Project Alpha Updates"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPrivate"
                checked={config.isPrivate || false}
                onChange={(e) =>
                  onConfigChange({ ...config, isPrivate: e.target.checked })
                }
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label
                htmlFor="isPrivate"
                className="ml-2 block text-sm text-gray-900"
              >
                Private channel
              </label>
            </div>
          </div>
        );

      case "user":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                User ID or Email
              </label>
              <input
                type="text"
                value={config.userId || config.userEmail || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.includes("@")) {
                    onConfigChange({ ...config, userEmail: value, userId: "" });
                  } else {
                    onConfigChange({ ...config, userId: value, userEmail: "" });
                  }
                }}
                placeholder="U1234567890 or user@example.com"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div className="text-sm text-gray-500">
              Enter either a Slack user ID (U1234567890) or email address
            </div>
          </div>
        );

      case "file":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Channel (optional)
              </label>
              <input
                type="text"
                value={config.channel || ""}
                onChange={(e) =>
                  onConfigChange({ ...config, channel: e.target.value })
                }
                placeholder="#general"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                File Name
              </label>
              <input
                type="text"
                value={config.fileName || ""}
                onChange={(e) =>
                  onConfigChange({ ...config, fileName: e.target.value })
                }
                placeholder="report.txt"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                File Content
              </label>
              <textarea
                value={config.fileContent || ""}
                onChange={(e) =>
                  onConfigChange({ ...config, fileContent: e.target.value })
                }
                placeholder="File content here..."
                rows={6}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  File Type
                </label>
                <input
                  type="text"
                  value={config.fileType || ""}
                  onChange={(e) =>
                    onConfigChange({ ...config, fileType: e.target.value })
                  }
                  placeholder="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  File Title
                </label>
                <input
                  type="text"
                  value={config.fileTitle || ""}
                  onChange={(e) =>
                    onConfigChange({ ...config, fileTitle: e.target.value })
                  }
                  placeholder="Daily Report"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        );

      case "reaction":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Channel
              </label>
              <input
                type="text"
                value={config.channel || ""}
                onChange={(e) =>
                  onConfigChange({ ...config, channel: e.target.value })
                }
                placeholder="#general"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Message Timestamp
              </label>
              <input
                type="text"
                value={config.timestamp || ""}
                onChange={(e) =>
                  onConfigChange({ ...config, timestamp: e.target.value })
                }
                placeholder="1234567890.123456"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Emoji
              </label>
              <input
                type="text"
                value={config.emoji || ""}
                onChange={(e) =>
                  onConfigChange({ ...config, emoji: e.target.value })
                }
                placeholder=":thumbsup: or 👍"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
        );

      case "reminder":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Reminder Text
              </label>
              <input
                type="text"
                value={config.reminderText || ""}
                onChange={(e) =>
                  onConfigChange({ ...config, reminderText: e.target.value })
                }
                placeholder="Review the quarterly report"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Reminder Time
              </label>
              <input
                type="text"
                value={config.reminderTime || ""}
                onChange={(e) =>
                  onConfigChange({ ...config, reminderTime: e.target.value })
                }
                placeholder="tomorrow at 9am or 1234567890"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                User (optional)
              </label>
              <input
                type="text"
                value={config.reminderUser || ""}
                onChange={(e) =>
                  onConfigChange({ ...config, reminderUser: e.target.value })
                }
                placeholder="U1234567890"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Configure Slack Operation
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Bot Token */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700">
              Bot Token
            </label>
            <input
              type="password"
              value={config.botToken || ""}
              onChange={(e) =>
                onConfigChange({ ...config, botToken: e.target.value })
              }
              placeholder="xoxb-..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Get your bot token from the Slack App settings
            </p>
          </div>

          {/* Operation Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Operation Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "message", label: "Message", desc: "Send messages" },
                { value: "channel", label: "Channel", desc: "Manage channels" },
                { value: "user", label: "User", desc: "Look up users" },
                { value: "file", label: "File", desc: "Upload files" },
                { value: "reaction", label: "Reaction", desc: "Add reactions" },
                { value: "reminder", label: "Reminder", desc: "Set reminders" },
              ].map((op) => (
                <button
                  key={op.value}
                  onClick={() => setOperation(op.value as SlackOperation)}
                  className={`p-3 text-left rounded-lg border-2 transition-colors ${
                    operation === op.value
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-medium text-sm">{op.label}</div>
                  <div className="text-xs text-gray-500">{op.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Fields Based on Operation */}
          {renderOperationFields()}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
