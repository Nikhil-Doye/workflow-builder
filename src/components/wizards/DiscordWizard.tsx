import React, { useState } from "react";
import { WizardStepProps } from "../ConfigurationWizard";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
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
  Settings,
} from "lucide-react";
import { DiscordOperation } from "../../types/discord";

const DISCORD_OPERATIONS = [
  {
    id: DiscordOperation.MESSAGE,
    name: "Send Message",
    description: "Send messages to Discord channels or users",
    icon: MessageSquare,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    features: ["Text messages", "Embeds", "File attachments", "Mentions"],
  },
  {
    id: DiscordOperation.CHANNEL,
    name: "Manage Channel",
    description: "Create, modify, or manage Discord channels",
    icon: Hash,
    color: "bg-green-100 text-green-800 border-green-200",
    features: [
      "Create channels",
      "Modify settings",
      "Manage permissions",
      "Archive channels",
    ],
  },
  {
    id: DiscordOperation.USER,
    name: "Manage User",
    description: "Manage Discord users and their properties",
    icon: Users,
    color: "bg-purple-100 text-purple-800 border-purple-200",
    features: [
      "Change nicknames",
      "Get user info",
      "Manage roles",
      "Kick/ban users",
    ],
  },
  {
    id: DiscordOperation.ROLE,
    name: "Manage Role",
    description: "Create and manage Discord roles",
    icon: Shield,
    color: "bg-orange-100 text-orange-800 border-orange-200",
    features: [
      "Create roles",
      "Modify permissions",
      "Assign colors",
      "Manage hierarchy",
    ],
  },
  {
    id: DiscordOperation.REACTION,
    name: "Add Reaction",
    description: "Add or remove reactions to messages",
    icon: Heart,
    color: "bg-pink-100 text-pink-800 border-pink-200",
    features: [
      "Emoji reactions",
      "Custom emojis",
      "Bulk reactions",
      "Remove reactions",
    ],
  },
  {
    id: DiscordOperation.VOICE,
    name: "Voice Control",
    description: "Manage voice channels and connections",
    icon: Mic,
    color: "bg-indigo-100 text-indigo-800 border-indigo-200",
    features: ["Join voice", "Leave voice", "Mute/unmute", "Voice settings"],
  },
  {
    id: DiscordOperation.WEBHOOK,
    name: "Webhook",
    description: "Send messages via webhooks",
    icon: Webhook,
    color: "bg-teal-100 text-teal-800 border-teal-200",
    features: [
      "Custom webhooks",
      "Avatar settings",
      "Username override",
      "Rich embeds",
    ],
  },
];

export const DiscordWizard: React.FC<WizardStepProps> = ({
  data,
  onChange,
  onNext,
  onPrevious,
}) => {
  const [selectedOperation, setSelectedOperation] = useState<DiscordOperation>(
    data.operation || DiscordOperation.MESSAGE
  );

  const handleOperationSelect = (operation: DiscordOperation) => {
    setSelectedOperation(operation);
    onChange({
      ...data,
      operation,
    });
  };

  const handleNext = () => {
    if (selectedOperation) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full">
          <Bot className="w-8 h-8 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          Discord Integration
        </h2>
        <p className="text-gray-600 mt-2">
          Choose what type of Discord operation you want to perform
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DISCORD_OPERATIONS.map((operation) => {
          const IconComponent = operation.icon;
          const isSelected = selectedOperation === operation.id;

          return (
            <Card
              key={operation.id}
              className={`cursor-pointer transition-all duration-200 ${
                isSelected
                  ? "ring-2 ring-purple-500 bg-purple-50"
                  : "hover:shadow-md hover:border-purple-200"
              }`}
              onClick={() => handleOperationSelect(operation.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${operation.color}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold">
                      {operation.name}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {operation.description}
                    </p>
                  </div>
                  {isSelected && (
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {operation.features.map((feature, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="text-xs mr-1 mb-1"
                    >
                      {feature}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-between pt-6">
        <Button
          variant="outline"
          onClick={onPrevious}
          className="flex items-center space-x-2"
        >
          <Settings className="w-4 h-4" />
          <span>Back</span>
        </Button>

        <Button
          onClick={handleNext}
          disabled={!selectedOperation}
          className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700"
        >
          <span>Next: Configure {selectedOperation}</span>
          <CheckCircle className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
