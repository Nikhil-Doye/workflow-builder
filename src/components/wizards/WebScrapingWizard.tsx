import React, { useState } from "react";
import { WizardStepProps } from "../ConfigurationWizard";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Globe,
  Settings,
  Filter,
  Clock,
  CheckCircle,
  ExternalLink,
  Eye,
  Code,
} from "lucide-react";

const OUTPUT_FORMATS = [
  { id: "markdown", name: "Markdown", description: "Clean, formatted text" },
  { id: "html", name: "HTML", description: "Raw HTML content" },
  { id: "text", name: "Plain Text", description: "Simple text only" },
  { id: "summary", name: "Summary", description: "AI-generated summary" },
  { id: "links", name: "Links Only", description: "Extract all links" },
  { id: "images", name: "Images", description: "Extract image URLs" },
];

const COMMON_SELECTORS = [
  { name: "Main Content", selector: "main, article, .content, .post" },
  { name: "Headings", selector: "h1, h2, h3, h4, h5, h6" },
  { name: "Paragraphs", selector: "p" },
  { name: "Lists", selector: "ul, ol, li" },
  { name: "Links", selector: "a" },
  { name: "Images", selector: "img" },
];

export const WebScrapingWizard: React.FC<WizardStepProps> = ({
  data,
  onChange,
  onNext,
  onPrevious,
  isFirst,
  isLast,
  canProceed,
}) => {
  const [url, setUrl] = useState(data.url || "");
  const [formats, setFormats] = useState<string[]>(
    data.formats || ["markdown"]
  );
  const [onlyMainContent, setOnlyMainContent] = useState(
    data.onlyMainContent ?? true
  );
  const [includeSelectors, setIncludeSelectors] = useState(
    data.includeTags || ""
  );
  const [excludeSelectors, setExcludeSelectors] = useState(
    data.excludeTags || ""
  );
  const [maxLength, setMaxLength] = useState(data.maxLength || 2000);
  const [waitTime, setWaitTime] = useState(data.waitFor || 0);

  const handleFormatToggle = (formatId: string) => {
    setFormats((prev) =>
      prev.includes(formatId)
        ? prev.filter((f) => f !== formatId)
        : [...prev, formatId]
    );
  };

  const handleSelectorAdd = (selector: string) => {
    const current = includeSelectors ? includeSelectors.split(",") : [];
    if (!current.includes(selector)) {
      const newSelectors = [...current, selector].join(",");
      setIncludeSelectors(newSelectors);
    }
  };

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
      url,
      formats,
      onlyMainContent,
      includeTags: includeSelectors,
      excludeTags: excludeSelectors,
      maxLength,
      waitFor: waitTime,
    });
  }, [
    url,
    formats,
    onlyMainContent,
    includeSelectors,
    excludeSelectors,
    maxLength,
    waitTime,
  ]);

  return (
    <div className="space-y-6">
      {/* URL Configuration */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Website URL</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target URL
            </label>
            <div className="flex space-x-2">
              <div className="flex-1">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(url, "_blank")}
                disabled={!url}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <p>Enter the URL of the website you want to scrape content from.</p>
          </div>
        </div>
      </div>

      {/* Output Format Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Output Format
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Choose how you want the content to be formatted
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {OUTPUT_FORMATS.map((format) => {
            const isSelected = formats.includes(format.id);
            return (
              <Card
                key={format.id}
                className={`cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "ring-2 ring-blue-500 bg-blue-50"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => handleFormatToggle(format.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-3 h-3 rounded-full border-2 ${
                        isSelected
                          ? "bg-blue-500 border-blue-500"
                          : "border-gray-300"
                      }`}
                    >
                      {isSelected && (
                        <CheckCircle className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{format.name}</h4>
                      <p className="text-xs text-gray-600">
                        {format.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Content Filtering */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Content Filtering
        </h3>

        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="onlyMainContent"
              checked={onlyMainContent}
              onChange={(e) => setOnlyMainContent(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label
              htmlFor="onlyMainContent"
              className="text-sm font-medium text-gray-700"
            >
              Extract only main content (recommended)
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Include specific elements (optional)
            </label>
            <input
              type="text"
              value={includeSelectors}
              onChange={(e) => setIncludeSelectors(e.target.value)}
              placeholder="e.g., .content, .article, h1, h2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              CSS selectors to include specific elements
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exclude elements (optional)
            </label>
            <input
              type="text"
              value={excludeSelectors}
              onChange={(e) => setExcludeSelectors(e.target.value)}
              placeholder="e.g., .ads, .sidebar, .footer"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              CSS selectors to exclude unwanted elements
            </p>
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Advanced Settings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Content Length
            </label>
            <input
              type="number"
              value={maxLength}
              onChange={(e) => setMaxLength(Number(e.target.value))}
              min="100"
              max="10000"
              step="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Limit content length (characters)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wait Time (seconds)
            </label>
            <input
              type="number"
              value={waitTime / 1000}
              onChange={(e) => setWaitTime(Number(e.target.value) * 1000)}
              min="0"
              max="30"
              step="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Wait for dynamic content to load
            </p>
          </div>
        </div>
      </div>

      {/* Common Selectors Helper */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Quick Selectors</h4>
        <div className="flex flex-wrap gap-2">
          {COMMON_SELECTORS.map((selector, index) => (
            <Badge
              key={index}
              variant="outline"
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => handleSelectorAdd(selector.selector)}
            >
              {selector.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Preview */}
      {url && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">
            Configuration Preview
          </h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <strong>URL:</strong> {url}
            </p>
            <p>
              <strong>Formats:</strong> {formats.join(", ")}
            </p>
            <p>
              <strong>Main Content Only:</strong>{" "}
              {onlyMainContent ? "Yes" : "No"}
            </p>
            {includeSelectors && (
              <p>
                <strong>Include:</strong> {includeSelectors}
              </p>
            )}
            {excludeSelectors && (
              <p>
                <strong>Exclude:</strong> {excludeSelectors}
              </p>
            )}
            <p>
              <strong>Max Length:</strong> {maxLength} characters
            </p>
            {waitTime > 0 && (
              <p>
                <strong>Wait Time:</strong> {waitTime / 1000}s
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
