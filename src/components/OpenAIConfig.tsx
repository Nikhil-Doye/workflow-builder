import React, { useState } from "react";
import { Key, AlertCircle, CheckCircle } from "lucide-react";

interface OpenAIConfigProps {
  onClose: () => void;
}

export const OpenAIConfig: React.FC<OpenAIConfigProps> = ({ onClose }) => {
  const [apiKey, setApiKey] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setErrorMessage("Please enter an API key");
      setValidationStatus("error");
      return;
    }

    setIsValidating(true);
    setValidationStatus("idle");

    try {
      // In a real app, you'd validate the API key with a backend service
      // For now, we'll just check if it looks like a valid OpenAI API key format
      if (apiKey.startsWith("sk-") && apiKey.length > 20) {
        // Save to localStorage for this session
        localStorage.setItem("openai_api_key", apiKey);
        setValidationStatus("success");
        setTimeout(() => {
          onClose();
          window.location.reload(); // Reload to pick up the new API key
        }, 1500);
      } else {
        setErrorMessage(
          "Invalid API key format. OpenAI API keys should start with 'sk-'"
        );
        setValidationStatus("error");
      }
    } catch (error) {
      setErrorMessage("Failed to validate API key");
      setValidationStatus("error");
    } finally {
      setIsValidating(false);
    }
  };

  const handleTest = async () => {
    if (!apiKey.trim()) {
      setErrorMessage("Please enter an API key first");
      setValidationStatus("error");
      return;
    }

    setIsValidating(true);
    setValidationStatus("idle");

    try {
      // Test the API key by making a simple call
      const response = await fetch("https://api.openai.com/v1/models", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setValidationStatus("success");
        setErrorMessage("");
      } else {
        setErrorMessage("API key is invalid or has insufficient permissions");
        setValidationStatus("error");
      }
    } catch (error) {
      setErrorMessage(
        "Failed to test API key. Please check your internet connection."
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
              OpenAI API Configuration
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
              To use real AI responses, you need to configure your OpenAI API
              key. Get your API key from{" "}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800"
              >
                OpenAI Platform
              </a>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              OpenAI API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
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
            <p>• It's only used to make requests to OpenAI's API</p>
            <p>• You can change it anytime by reopening this dialog</p>
          </div>
        </div>
      </div>
    </div>
  );
};
