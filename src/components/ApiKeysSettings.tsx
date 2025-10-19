import React, { useState, useEffect } from "react";
import { Key, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";

interface ApiKeysSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiKeysSettings: React.FC<ApiKeysSettingsProps> = ({
  isOpen,
  onClose,
}) => {
  const [pineconeApiKey, setPineconeApiKey] = useState("");
  const [pineconeEnvironment, setPineconeEnvironment] =
    useState("us-east-1-aws");
  const [deepseekApiKey, setDeepseekApiKey] = useState("");
  const [firecrawlApiKey, setFirecrawlApiKey] = useState("");
  const [showPineconeKey, setShowPineconeKey] = useState(false);
  const [showDeepseekKey, setShowDeepseekKey] = useState(false);
  const [showFirecrawlKey, setShowFirecrawlKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load existing API keys on component mount
  useEffect(() => {
    setPineconeApiKey(localStorage.getItem("pinecone_api_key") || "");
    setPineconeEnvironment(
      localStorage.getItem("pinecone_environment") || "us-east-1-aws"
    );
    setDeepseekApiKey(localStorage.getItem("deepseek_api_key") || "");
    setFirecrawlApiKey(localStorage.getItem("firecrawl_api_key") || "");
  }, []);

  const handleSave = async () => {
    setIsLoading(true);

    try {
      // Save to localStorage
      localStorage.setItem("pinecone_api_key", pineconeApiKey);
      localStorage.setItem("pinecone_environment", pineconeEnvironment);
      localStorage.setItem("deepseek_api_key", deepseekApiKey);
      localStorage.setItem("firecrawl_api_key", firecrawlApiKey);

      // Test Pinecone API key if provided
      if (pineconeApiKey && pineconeApiKey !== "your_pinecone_api_key_here") {
        try {
          const response = await fetch(
            `https://${pineconeEnvironment}.pinecone.io/actions/whoami`,
            {
              method: "GET",
              headers: {
                "Api-Key": pineconeApiKey,
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            throw new Error(`Pinecone API test failed: ${response.status}`);
          }
        } catch (error) {
          toast.error(
            `Pinecone API key test failed: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
          setIsLoading(false);
          return;
        }
      }

      toast.success("API keys saved successfully!");
      onClose();
    } catch (error) {
      toast.error("Failed to save API keys");
      console.error("Error saving API keys:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setPineconeApiKey("");
    setDeepseekApiKey("");
    setFirecrawlApiKey("");
    toast.success("API keys cleared");
  };

  const getApiKeyStatus = (key: string) => {
    if (
      !key ||
      key === "your_pinecone_api_key_here" ||
      key === "your_deepseek_api_key_here" ||
      key === "your_firecrawl_api_key_here"
    ) {
      return { status: "missing", icon: AlertCircle, color: "text-red-500" };
    }
    return { status: "configured", icon: CheckCircle, color: "text-green-500" };
  };

  const ApiKeyField = ({
    label,
    value,
    onChange,
    show,
    setShow,
    placeholder,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    show: boolean;
    setShow: (show: boolean) => void;
    placeholder: string;
  }) => {
    const { status, icon: StatusIcon, color } = getApiKeyStatus(value);

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
          <div className="flex items-center space-x-2">
            <StatusIcon className={`w-4 h-4 ${color}`} />
            <span className={`text-xs ${color}`}>
              {status === "configured" ? "Configured" : "Not configured"}
            </span>
          </div>
        </div>
        <div className="relative">
          <Input
            type={show ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="pr-20"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {show ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] p-0 flex flex-col">
        <DialogHeader className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <Key className="w-6 h-6 text-blue-600" />
            <DialogTitle className="text-2xl font-bold text-gray-900">
              API Keys Configuration
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 p-6 overflow-y-auto min-h-0">
          <div className="space-y-8">
            {/* Pinecone Configuration */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Key className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Pinecone Configuration
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Required for similarity search and vector operations. Get your
                API key from{" "}
                <a
                  href="https://pinecone.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  pinecone.io
                </a>
              </p>
              <div className="space-y-4">
                <ApiKeyField
                  label="API Key"
                  value={pineconeApiKey}
                  onChange={setPineconeApiKey}
                  show={showPineconeKey}
                  setShow={setShowPineconeKey}
                  placeholder="Enter your Pinecone API key"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Environment
                  </label>
                  <select
                    value={pineconeEnvironment}
                    onChange={(e) => setPineconeEnvironment(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="us-east-1-aws">us-east-1-aws</option>
                    <option value="us-west-2-aws">us-west-2-aws</option>
                    <option value="eu-west-1-aws">eu-west-1-aws</option>
                    <option value="ap-southeast-1-aws">
                      ap-southeast-1-aws
                    </option>
                    <option value="ap-northeast-1-aws">
                      ap-northeast-1-aws
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* DeepSeek Configuration */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Key className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  DeepSeek Configuration
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Required for LLM tasks and prompt optimization. Get your API key
                from{" "}
                <a
                  href="https://platform.deepseek.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  platform.deepseek.com
                </a>
              </p>
              <ApiKeyField
                label="API Key"
                value={deepseekApiKey}
                onChange={setDeepseekApiKey}
                show={showDeepseekKey}
                setShow={setShowDeepseekKey}
                placeholder="Enter your DeepSeek API key"
              />
            </div>

            {/* Firecrawl Configuration */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Key className="w-4 h-4 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Firecrawl Configuration
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Required for web scraping operations. Get your API key from{" "}
                <a
                  href="https://firecrawl.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  firecrawl.dev
                </a>
              </p>
              <ApiKeyField
                label="API Key"
                value={firecrawlApiKey}
                onChange={setFirecrawlApiKey}
                show={showFirecrawlKey}
                setShow={setShowFirecrawlKey}
                placeholder="Enter your Firecrawl API key"
              />
            </div>

            {/* Help Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Need Help?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• All API keys are stored locally in your browser</li>
                <li>
                  • Keys are not sent to any external servers except the
                  respective APIs
                </li>
                <li>
                  • You can clear all keys at any time using the "Clear All"
                  button
                </li>
                <li>• Pinecone API key will be tested when you save</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex justify-between items-center w-full">
            <Button onClick={handleClear} variant="outline" className="text-sm">
              Clear All
            </Button>
            <div className="flex space-x-3">
              <Button onClick={onClose} variant="secondary" className="text-sm">
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="text-sm"
              >
                {isLoading ? "Saving..." : "Save API Keys"}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
