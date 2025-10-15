import React, { useState } from "react";
import { Key, AlertCircle, CheckCircle } from "lucide-react";

interface OpenAIConfigProps {
  onClose: () => void;
}

export const OpenAIConfig: React.FC<OpenAIConfigProps> = ({ onClose }) => {
  const [apiKey, setApiKey] = useState("");
  const [firecrawlApiKey, setFirecrawlApiKey] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSave = async () => {
    if (!apiKey.trim() && !firecrawlApiKey.trim()) {
      setErrorMessage("Please enter at least one API key");
      setValidationStatus("error");
      return;
    }

    setIsValidating(true);
    setValidationStatus("idle");

    try {
      let hasValidKey = false;

      // Validate AI API key (DeepSeek/OpenAI)
      if (apiKey.trim()) {
        if (apiKey.startsWith("sk-") && apiKey.length > 20) {
          localStorage.setItem("deepseek_api_key", apiKey);
          localStorage.setItem("openai_api_key", apiKey);
          hasValidKey = true;
        } else {
          setErrorMessage(
            "Invalid AI API key format. API keys should start with 'sk-'"
          );
          setValidationStatus("error");
          setIsValidating(false);
          return;
        }
      }

      // Validate Firecrawl API key
      if (firecrawlApiKey.trim()) {
        if (firecrawlApiKey.startsWith("fc-") && firecrawlApiKey.length > 20) {
          localStorage.setItem("firecrawl_api_key", firecrawlApiKey);
          hasValidKey = true;
        } else {
          setErrorMessage(
            "Invalid Firecrawl API key format. API keys should start with 'fc-'"
          );
          setValidationStatus("error");
          setIsValidating(false);
          return;
        }
      }

      if (hasValidKey) {
        setValidationStatus("success");
        setTimeout(() => {
          onClose();
          window.location.reload(); // Reload to pick up the new API keys
        }, 1500);
      }
    } catch (error) {
      setErrorMessage("Failed to validate API keys");
      setValidationStatus("error");
    } finally {
      setIsValidating(false);
    }
  };

  const handleTest = async () => {
    if (!apiKey.trim() && !firecrawlApiKey.trim()) {
      setErrorMessage("Please enter at least one API key to test");
      setValidationStatus("error");
      return;
    }

    setIsValidating(true);
    setValidationStatus("idle");

    try {
      let aiKeyValid = false;
      let firecrawlKeyValid = false;

      // Test AI API key if provided
      if (apiKey.trim()) {
        let response = await fetch("https://api.deepseek.com/v1/models", {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        });

        // If DeepSeek fails, try OpenAI
        if (!response.ok) {
          response = await fetch("https://api.openai.com/v1/models", {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
          });
        }

        aiKeyValid = response.ok;
      }

      // Test Firecrawl API key if provided
      if (firecrawlApiKey.trim()) {
        try {
          const response = await fetch("https://api.firecrawl.dev/v0/scrape", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${firecrawlApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: "https://example.com",
              formats: ["markdown"],
            }),
          });
          firecrawlKeyValid = response.ok;
        } catch (error) {
          firecrawlKeyValid = false;
        }
      }

      if (aiKeyValid || firecrawlKeyValid) {
        setValidationStatus("success");
        setErrorMessage("");
      } else {
        setErrorMessage(
          "One or more API keys are invalid or have insufficient permissions"
        );
        setValidationStatus("error");
      }
    } catch (error) {
      setErrorMessage(
        "Failed to test API keys. Please check your internet connection."
      );
      setValidationStatus("error");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              API Configuration
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              Configure your API keys to enable full functionality. You need at
              least one API key:
            </p>
            <ul className="text-xs text-blue-700 mt-2 space-y-1">
              <li>
                • <strong>AI API Key:</strong> For LLM tasks and structured
                output
              </li>
              <li>
                • <strong>Firecrawl API Key:</strong> For web scraping
                functionality
              </li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              AI API Key (DeepSeek or OpenAI)
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-... (DeepSeek or OpenAI key)"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <div className="text-xs text-gray-500 mt-1">
              Get your key from{" "}
              <a
                href="https://platform.deepseek.com/api_keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800"
              >
                DeepSeek
              </a>{" "}
              or{" "}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800"
              >
                OpenAI
              </a>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Firecrawl API Key (for Web Scraping)
            </label>
            <input
              type="password"
              value={firecrawlApiKey}
              onChange={(e) => setFirecrawlApiKey(e.target.value)}
              placeholder="fc-... (Firecrawl API key)"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <div className="text-xs text-gray-500 mt-1">
              Get your key from{" "}
              <a
                href="https://firecrawl.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800"
              >
                Firecrawl
              </a>
            </div>
          </div>

          {validationStatus === "error" && (
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{errorMessage}</span>
            </div>
          )}

          {validationStatus === "success" && (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">API key is valid!</span>
            </div>
          )}

          <div className="flex space-x-2">
            <button
              onClick={handleTest}
              disabled={isValidating || !apiKey.trim()}
              className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isValidating ? "Testing..." : "Test Key"}
            </button>
            <button
              onClick={handleSave}
              disabled={isValidating || !apiKey.trim()}
              className="flex-1 px-3 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isValidating ? "Saving..." : "Save & Use"}
            </button>
          </div>

          <div className="text-xs text-gray-500">
            <p>• Your API key is stored locally in your browser</p>
            <p>• It's used to make requests to DeepSeek or OpenAI APIs</p>
            <p>• You can change it anytime by reopening this dialog</p>
          </div>
        </div>
      </div>
    </div>
  );
};
