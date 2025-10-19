import React, { useState, useEffect, useRef, useCallback } from "react";
import { useWorkflowStore } from "../store/workflowStore";
import { ValidationResult } from "../types";
import {
  MessageCircle,
  Send,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  X,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";

interface CopilotPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  type: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  data?: any;
}

export const CopilotPanel: React.FC<CopilotPanelProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    generateWorkflowFromDescription,
    getCopilotSuggestions,
    validateGeneratedWorkflow,
    currentWorkflow,
  } = useWorkflowStore();

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const loadSuggestions = useCallback(async () => {
    try {
      const newSuggestions = await getCopilotSuggestions();
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error("Error loading suggestions:", error);
    }
  }, [getCopilotSuggestions]);

  // Load initial suggestions
  useEffect(() => {
    if (isOpen) {
      loadSuggestions();
    }
  }, [isOpen, currentWorkflow, loadSuggestions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);

    try {
      // Add processing message
      const processingMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "🤖 Analyzing your request and generating workflow...",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, processingMessage]);

      // Generate workflow
      await generateWorkflowFromDescription(userMessage.content);

      // Get validation results
      const validationResult = await validateGeneratedWorkflow();
      setValidation(validationResult);

      // Add success message
      const successMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        type: "assistant",
        content: `✅ Workflow generated successfully! I've created a ${
          validationResult?.complexity || "medium"
        } complexity workflow with ${
          currentWorkflow?.nodes.length || 0
        } nodes.`,
        timestamp: new Date(),
        data: { validation: validationResult },
      };
      setMessages((prev) => [...prev, successMessage]);

      // Load new suggestions
      await loadSuggestions();
    } catch (error) {
      console.error("Error generating workflow:", error);

      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        type: "assistant",
        content: `❌ Sorry, I couldn't generate the workflow. ${
          error instanceof Error
            ? error.message
            : "Please try again with a different description."
        }`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setValidation(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                AI Copilot
              </h2>
              <p className="text-sm text-gray-600">
                Describe your workflow in natural language
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title={showPreview ? "Hide preview" : "Show preview"}
            >
              {showPreview ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={clearChat}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Clear chat"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Welcome to AI Copilot
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Describe what you want your workflow to do, and I'll help
                    you build it!
                  </p>

                  {/* Quick Suggestions */}
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500 mb-3">
                      Try these examples:
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {suggestions.slice(0, 3).map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.type === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-4 rounded-2xl ${
                        message.type === "user"
                          ? "bg-blue-500 text-white"
                          : message.type === "system"
                          ? "bg-gray-100 text-gray-700"
                          : "bg-gray-50 text-gray-900"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      {message.data?.validation && (
                        <div className="mt-3 p-3 bg-white rounded-lg border">
                          <div className="flex items-center space-x-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium">
                              Validation Results
                            </span>
                          </div>
                          <div className="text-xs space-y-1">
                            <p>
                              Complexity: {message.data.validation.complexity}
                            </p>
                            <p>
                              Issues: {message.data.validation.issues.length}
                            </p>
                            <p>
                              Suggestions:{" "}
                              {message.data.validation.suggestions.length}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      <span className="text-sm text-gray-600">
                        Processing...
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <form onSubmit={handleSubmit} className="flex space-x-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe your workflow... (e.g., 'scrape a website and analyze the content')"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  disabled={isProcessing}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isProcessing}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Preview Panel */}
          {showPreview && (
            <div className="w-80 border-l border-gray-200 bg-gray-50 p-6 overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Workflow Preview
              </h3>

              {currentWorkflow ? (
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Current Workflow
                    </h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Name: {currentWorkflow.name}</p>
                      <p>Nodes: {currentWorkflow.nodes.length}</p>
                      <p>Connections: {currentWorkflow.edges.length}</p>
                    </div>
                  </div>

                  {validation && (
                    <div className="bg-white rounded-lg p-4 border">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Validation
                      </h4>
                      <div className="text-sm space-y-2">
                        <div className="flex items-center space-x-2">
                          {validation.isValid ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          )}
                          <span
                            className={
                              validation.isValid
                                ? "text-green-700"
                                : "text-yellow-700"
                            }
                          >
                            {validation.isValid ? "Valid" : "Has Issues"}
                          </span>
                        </div>
                        {validation.issues.length > 0 && (
                          <div>
                            <p className="text-red-600 font-medium">Issues:</p>
                            <ul className="text-red-600 text-xs list-disc list-inside">
                              {validation.issues.map((issue, index) => (
                                <li key={index}>{issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="bg-white rounded-lg p-4 border">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Suggestions
                    </h4>
                    <div className="space-y-2">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full text-left p-2 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">
                    No workflow generated yet. Start a conversation to see the
                    preview!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
