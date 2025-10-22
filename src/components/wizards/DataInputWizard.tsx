import React, { useState } from "react";
import { WizardStepProps } from "../ConfigurationWizard";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  FileText,
  Globe,
  Database,
  FileSpreadsheet,
  File,
  Upload,
  Link,
  CheckCircle,
} from "lucide-react";

const DATA_TYPES = [
  {
    id: "text",
    name: "Text Document",
    description: "Plain text or document content",
    icon: FileText,
    examples: ["Email content", "Article text", "Notes", "Description"],
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    id: "url",
    name: "Website URL",
    description: "Link to a website to scrape",
    icon: Globe,
    examples: ["https://example.com", "News article URL", "Product page"],
    color: "bg-green-100 text-green-800 border-green-200",
  },
  {
    id: "csv",
    name: "CSV Spreadsheet",
    description: "Comma-separated values data",
    icon: FileSpreadsheet,
    examples: ["Customer list", "Product catalog", "Sales data"],
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
  {
    id: "json",
    name: "JSON Data",
    description: "Structured JSON format",
    icon: Database,
    examples: ["API response", "Configuration file", "Structured data"],
    color: "bg-orange-100 text-orange-800 border-orange-200",
  },
  {
    id: "pdf",
    name: "PDF Document",
    description: "PDF file to extract text from",
    icon: File,
    examples: ["Invoice", "Report", "Manual", "Contract"],
    color: "bg-red-100 text-red-800 border-red-200",
  },
];

export const DataInputWizard: React.FC<WizardStepProps> = ({
  data,
  onChange,
  onNext,
  onPrevious,
  isFirst,
  isLast,
  canProceed,
}) => {
  const [selectedType, setSelectedType] = useState(data.dataType || "");
  const [sampleData, setSampleData] = useState(data.defaultValue || "");

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    onChange({
      dataType: typeId,
      config: {
        ...data.config,
        dataType: typeId,
      },
    });
  };

  const handleSampleDataChange = (value: string) => {
    setSampleData(value);
    onChange({
      defaultValue: value,
      config: {
        ...data.config,
        defaultValue: value,
      },
    });
  };

  const getSamplePlaceholder = (typeId: string) => {
    const placeholders: Record<string, string> = {
      text: "Enter your text content here...",
      url: "https://example.com",
      csv: "Name,Email,Phone\nJohn Doe,john@example.com,555-1234",
      json: '{"name": "John Doe", "email": "john@example.com"}',
      pdf: "Upload a PDF file or paste PDF content here...",
    };
    return placeholders[typeId] || "";
  };

  const getSampleExamples = (typeId: string) => {
    const type = DATA_TYPES.find((t) => t.id === typeId);
    return type?.examples || [];
  };

  return (
    <div className="space-y-6">
      {/* Data Type Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          What type of data will you provide?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DATA_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;

            return (
              <Card
                key={type.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  isSelected
                    ? "ring-2 ring-blue-500 bg-blue-50"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => handleTypeSelect(type.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${type.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{type.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {type.description}
                      </p>
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          Examples:{" "}
                          {getSampleExamples(type.id).slice(0, 2).join(", ")}
                        </Badge>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Sample Data Input */}
      {selectedType && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Provide sample data (optional)
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            This helps test your workflow. You can change this later.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sample Data
              </label>
              <textarea
                value={sampleData}
                onChange={(e) => handleSampleDataChange(e.target.value)}
                placeholder={getSamplePlaceholder(selectedType)}
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            {getSampleExamples(selectedType).length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Examples:
                </p>
                <div className="flex flex-wrap gap-2">
                  {getSampleExamples(selectedType).map((example, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSampleDataChange(example)}
                    >
                      {example}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview */}
      {selectedType && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Preview</h4>
          <div className="text-sm text-gray-600">
            <p>
              <strong>Type:</strong>{" "}
              {DATA_TYPES.find((t) => t.id === selectedType)?.name}
            </p>
            {sampleData && (
              <p>
                <strong>Sample:</strong> {sampleData.substring(0, 100)}
                {sampleData.length > 100 ? "..." : ""}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
