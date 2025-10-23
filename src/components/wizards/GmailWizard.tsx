import React, { useState } from "react";
import { WizardStepProps } from "../ConfigurationWizard";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
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
  Settings,
} from "lucide-react";
import { GmailOperation } from "../../types/gmail";

const GMAIL_OPERATIONS = [
  {
    id: GmailOperation.SEND,
    name: "Send Email",
    description: "Send emails with attachments and rich content",
    icon: Send,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    features: ["Rich HTML", "Attachments", "CC/BCC", "Threading"],
  },
  {
    id: GmailOperation.READ,
    name: "Read Email",
    description: "Read emails and message threads",
    icon: Eye,
    color: "bg-green-100 text-green-800 border-green-200",
    features: ["Message content", "Headers", "Attachments", "Thread view"],
  },
  {
    id: GmailOperation.REPLY,
    name: "Reply to Email",
    description: "Reply to specific email messages",
    icon: Reply,
    color: "bg-purple-100 text-purple-800 border-purple-200",
    features: ["Thread replies", "Rich content", "Attachments", "Auto-reply"],
  },
  {
    id: GmailOperation.FORWARD,
    name: "Forward Email",
    description: "Forward emails to other recipients",
    icon: Forward,
    color: "bg-orange-100 text-orange-800 border-orange-200",
    features: [
      "Multiple recipients",
      "Add comments",
      "Preserve formatting",
      "Thread context",
    ],
  },
  {
    id: GmailOperation.DRAFT,
    name: "Manage Draft",
    description: "Create, edit, and manage email drafts",
    icon: FileText,
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    features: ["Save drafts", "Edit drafts", "Send drafts", "Draft templates"],
  },
  {
    id: GmailOperation.LABEL,
    name: "Manage Label",
    description: "Create and manage Gmail labels",
    icon: Tag,
    color: "bg-pink-100 text-pink-800 border-pink-200",
    features: [
      "Create labels",
      "Color coding",
      "Nested labels",
      "Auto-labeling",
    ],
  },
  {
    id: GmailOperation.SEARCH,
    name: "Search Emails",
    description: "Search emails with advanced filters",
    icon: Search,
    color: "bg-indigo-100 text-indigo-800 border-indigo-200",
    features: ["Advanced search", "Filters", "Date ranges", "Custom queries"],
  },
  {
    id: GmailOperation.ATTACHMENT,
    name: "Handle Attachment",
    description: "Download and manage email attachments",
    icon: Paperclip,
    color: "bg-teal-100 text-teal-800 border-teal-200",
    features: [
      "Download files",
      "File info",
      "Multiple formats",
      "Batch processing",
    ],
  },
];

export const GmailWizard: React.FC<WizardStepProps> = ({
  data,
  onChange,
  onNext,
  onPrevious,
}) => {
  const [selectedOperation, setSelectedOperation] = useState<GmailOperation>(
    data.operation || GmailOperation.SEND
  );

  const handleOperationSelect = (operation: GmailOperation) => {
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
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
          <Mail className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Gmail Integration</h2>
        <p className="text-gray-600 mt-2">
          Choose what type of Gmail operation you want to perform
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {GMAIL_OPERATIONS.map((operation) => {
          const IconComponent = operation.icon;
          const isSelected = selectedOperation === operation.id;

          return (
            <Card
              key={operation.id}
              className={`cursor-pointer transition-all duration-200 ${
                isSelected
                  ? "ring-2 ring-red-500 bg-red-50"
                  : "hover:shadow-md hover:border-red-200"
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
                    <CheckCircle className="w-5 h-5 text-red-600" />
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
          className="flex items-center space-x-2 bg-red-600 hover:bg-red-700"
        >
          <span>Next: Configure {selectedOperation}</span>
          <CheckCircle className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
