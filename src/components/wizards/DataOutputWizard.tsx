import React, { useState } from "react";
import { WizardStepProps } from "../ConfigurationWizard";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Download,
  FileText,
  FileSpreadsheet,
  Database,
  CheckCircle,
  Settings,
  File,
} from "lucide-react";

const OUTPUT_FORMATS = [
  {
    id: "json",
    name: "JSON",
    description: "Structured data format",
    icon: Database,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    useCases: ["API responses", "Structured data", "Configuration files"],
  },
  {
    id: "text",
    name: "Plain Text",
    description: "Simple text output",
    icon: FileText,
    color: "bg-green-100 text-green-800 border-green-200",
    useCases: ["Reports", "Summaries", "Notes"],
  },
  {
    id: "csv",
    name: "CSV Spreadsheet",
    description: "Comma-separated values",
    icon: FileSpreadsheet,
    color: "bg-purple-100 text-purple-800 border-purple-200",
    useCases: ["Data analysis", "Import to Excel", "Database import"],
  },
  {
    id: "html",
    name: "HTML",
    description: "Web page format",
    icon: File,
    color: "bg-orange-100 text-orange-800 border-orange-200",
    useCases: ["Web pages", "Email templates", "Reports"],
  },
];

export const DataOutputWizard: React.FC<WizardStepProps> = ({
  data,
  onChange,
  onNext,
  onPrevious,
  isFirst,
  isLast,
  canProceed,
}) => {
  const [format, setFormat] = useState(data.format || "json");
  const [filename, setFilename] = useState(data.filename || "");
  const [includeMetadata, setIncludeMetadata] = useState(
    data.includeMetadata ?? true
  );

  const updateConfig = (updates: any) => {
    onChange({
      config: {
        ...data.config,
        ...updates,
      },
    });
  };

  React.useEffect(() => {
    updateConfig({
      format,
      filename: filename || getDefaultFilename(format),
      includeMetadata,
    });
  }, [format, filename, includeMetadata]);

  const getDefaultFilename = (format: string) => {
    const defaults: Record<string, string> = {
      json: "output.json",
      text: "output.txt",
      csv: "output.csv",
      html: "output.html",
    };
    return defaults[format] || "output.json";
  };

  const getFormatIcon = (formatId: string) => {
    const format = OUTPUT_FORMATS.find((f) => f.id === formatId);
    return format?.icon || FileText;
  };

  return (
    <div className="space-y-6">
      {/* Output Format Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Choose Output Format
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          How should the workflow results be formatted and saved?
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {OUTPUT_FORMATS.map((formatOption) => {
            const Icon = formatOption.icon;
            const isSelected = format === formatOption.id;

            return (
              <Card
                key={formatOption.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  isSelected
                    ? "ring-2 ring-blue-500 bg-blue-50"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => setFormat(formatOption.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${formatOption.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {formatOption.name}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatOption.description}
                      </p>
                      <div className="mt-2">
                        <div className="flex flex-wrap gap-1">
                          {formatOption.useCases.map((useCase, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {useCase}
                            </Badge>
                          ))}
                        </div>
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

      {/* File Configuration */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          File Settings
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filename
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder={getDefaultFilename(format)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilename(getDefaultFilename(format))}
              >
                Reset
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              The name of the output file (without extension)
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="includeMetadata"
              checked={includeMetadata}
              onChange={(e) => setIncludeMetadata(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label
              htmlFor="includeMetadata"
              className="text-sm font-medium text-gray-700"
            >
              Include execution metadata
            </label>
          </div>
          <p className="text-xs text-gray-500 ml-7">
            Adds timestamp, execution time, and other metadata to the output
          </p>
        </div>
      </div>

      {/* Format-Specific Settings */}
      {format === "json" && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            JSON Settings
          </h3>
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">
              JSON Output Features:
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Structured data with proper formatting</li>
              <li>• Easy to parse and process programmatically</li>
              <li>• Supports nested objects and arrays</li>
              <li>• Includes data types and validation</li>
            </ul>
          </div>
        </div>
      )}

      {format === "csv" && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            CSV Settings
          </h3>
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">
              CSV Output Features:
            </h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Compatible with Excel and Google Sheets</li>
              <li>• Easy to import into databases</li>
              <li>• Supports large datasets efficiently</li>
              <li>• Includes headers for easy identification</li>
            </ul>
          </div>
        </div>
      )}

      {format === "html" && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            HTML Settings
          </h3>
          <div className="bg-orange-50 rounded-lg p-4">
            <h4 className="font-medium text-orange-900 mb-2">
              HTML Output Features:
            </h4>
            <ul className="text-sm text-orange-800 space-y-1">
              <li>• Ready for web display</li>
              <li>• Supports styling and formatting</li>
              <li>• Can include tables, lists, and links</li>
              <li>• Compatible with email clients</li>
            </ul>
          </div>
        </div>
      )}

      {/* Preview */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Output Preview</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>
            <strong>Format:</strong>{" "}
            {OUTPUT_FORMATS.find((f) => f.id === format)?.name}
          </p>
          <p>
            <strong>Filename:</strong> {filename || getDefaultFilename(format)}.
            {format}
          </p>
          <p>
            <strong>Metadata:</strong>{" "}
            {includeMetadata ? "Included" : "Not included"}
          </p>
        </div>
      </div>
    </div>
  );
};
