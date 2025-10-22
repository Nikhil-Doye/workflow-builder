import React, { useState } from "react";
import { WizardStepProps } from "../ConfigurationWizard";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Settings,
  Database,
  Target,
  CheckCircle,
  Code,
  FileText,
} from "lucide-react";

const SCHEMA_TEMPLATES = [
  {
    id: "person",
    name: "Person Information",
    description: "Extract personal details",
    schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Full name" },
        email: { type: "string", description: "Email address" },
        phone: { type: "string", description: "Phone number" },
        age: { type: "number", description: "Age in years" },
      },
      required: ["name", "email"],
    },
  },
  {
    id: "product",
    name: "Product Information",
    description: "Extract product details",
    schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Product name" },
        price: { type: "number", description: "Price in USD" },
        description: { type: "string", description: "Product description" },
        category: { type: "string", description: "Product category" },
        inStock: { type: "boolean", description: "Availability" },
      },
      required: ["name", "price"],
    },
  },
  {
    id: "article",
    name: "Article Summary",
    description: "Extract article information",
    schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Article title" },
        summary: { type: "string", description: "Article summary" },
        author: { type: "string", description: "Author name" },
        publishDate: { type: "string", description: "Publication date" },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Article tags",
        },
      },
      required: ["title", "summary"],
    },
  },
  {
    id: "custom",
    name: "Custom Schema",
    description: "Define your own structure",
    schema: null,
  },
];

export const StructuredOutputWizard: React.FC<WizardStepProps> = ({
  data,
  onChange,
  onNext,
  onPrevious,
  isFirst,
  isLast,
  canProceed,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState(
    data.schema ? "custom" : "person"
  );
  const [customSchema, setCustomSchema] = useState(data.schema || "");
  const [model, setModel] = useState(data.model || "deepseek-chat");

  const updateConfig = (updates: any) => {
    onChange({
      config: {
        ...data.config,
        ...updates,
      },
    });
  };

  React.useEffect(() => {
    const schema =
      selectedTemplate === "custom"
        ? customSchema
        : SCHEMA_TEMPLATES.find((t) => t.id === selectedTemplate)?.schema;

    updateConfig({
      schema,
      model,
    });
  }, [selectedTemplate, customSchema, model]);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (templateId !== "custom") {
      const template = SCHEMA_TEMPLATES.find((t) => t.id === templateId);
      if (template?.schema) {
        setCustomSchema(JSON.stringify(template.schema, null, 2));
      }
    }
  };

  const validateJSON = (jsonString: string) => {
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  };

  const isValidSchema =
    selectedTemplate === "custom" ? validateJSON(customSchema) : true;

  return (
    <div className="space-y-6">
      {/* Schema Template Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Choose Output Structure
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          How should the AI structure the output data?
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SCHEMA_TEMPLATES.map((template) => {
            const isSelected = selectedTemplate === template.id;

            return (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  isSelected
                    ? "ring-2 ring-blue-500 bg-blue-50"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => handleTemplateSelect(template.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Database className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {template.name}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {template.description}
                      </p>
                      {template.schema && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            {
                              Object.keys(template.schema.properties || {})
                                .length
                            }{" "}
                            fields
                          </Badge>
                        </div>
                      )}
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

      {/* Schema Configuration */}
      {selectedTemplate && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Schema Definition
          </h3>

          {selectedTemplate === "custom" ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  JSON Schema
                </label>
                <textarea
                  value={customSchema}
                  onChange={(e) => setCustomSchema(e.target.value)}
                  placeholder='{\n  "type": "object",\n  "properties": {\n    "field1": { "type": "string" },\n    "field2": { "type": "number" }\n  }\n}'
                  className={`w-full h-64 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm ${
                    customSchema && !isValidSchema
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300"
                  }`}
                />
                {customSchema && !isValidSchema && (
                  <p className="text-xs text-red-600 mt-1">
                    Invalid JSON format. Please check your syntax.
                  </p>
                )}
              </div>

              <div className="bg-blue-50 rounded-lg p-3">
                <h4 className="font-medium text-blue-900 mb-2">Schema Help:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Use "type": "object" for the root</li>
                  <li>• Define "properties" for each field</li>
                  <li>
                    • Specify "type" for each property (string, number, boolean,
                    array)
                  </li>
                  <li>• Add "description" for field explanations</li>
                  <li>• Use "required" array for mandatory fields</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">
                {SCHEMA_TEMPLATES.find((t) => t.id === selectedTemplate)?.name}{" "}
                Schema
              </h4>
              <pre className="text-sm text-gray-700 overflow-x-auto">
                {JSON.stringify(
                  SCHEMA_TEMPLATES.find((t) => t.id === selectedTemplate)
                    ?.schema,
                  null,
                  2
                )}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Model Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">AI Model</h3>
        <div className="space-y-3">
          <Card className="cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Settings className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">DeepSeek Chat</h4>
                  <p className="text-sm text-gray-600">
                    Optimized for structured output generation
                  </p>
                </div>
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Schema Preview */}
      {isValidSchema && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Schema Preview</h4>
          <div className="text-sm text-gray-600">
            <p>
              <strong>Type:</strong> Structured JSON output
            </p>
            <p>
              <strong>Template:</strong>{" "}
              {SCHEMA_TEMPLATES.find((t) => t.id === selectedTemplate)?.name}
            </p>
            <p>
              <strong>Validation:</strong> {isValidSchema ? "Valid" : "Invalid"}
            </p>
          </div>
        </div>
      )}

      {/* Example Output */}
      {isValidSchema && selectedTemplate !== "custom" && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Example Output</h4>
          <div className="text-sm text-blue-800">
            <p>
              The AI will structure data according to your schema. For example:
            </p>
            <pre className="mt-2 bg-white p-2 rounded border text-xs overflow-x-auto">
              {JSON.stringify(
                SCHEMA_TEMPLATES.find((t) => t.id === selectedTemplate)
                  ?.schema === SCHEMA_TEMPLATES[0].schema
                  ? {
                      name: "John Doe",
                      email: "john@example.com",
                      phone: "555-1234",
                      age: 30,
                    }
                  : SCHEMA_TEMPLATES.find((t) => t.id === selectedTemplate)
                      ?.schema === SCHEMA_TEMPLATES[1].schema
                  ? {
                      name: "Laptop",
                      price: 999.99,
                      description: "High-performance laptop",
                      category: "Electronics",
                      inStock: true,
                    }
                  : {
                      title: "AI Article",
                      summary: "About artificial intelligence",
                      author: "Jane Smith",
                      publishDate: "2024-01-15",
                      tags: ["AI", "Technology"],
                    },
                null,
                2
              )}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
