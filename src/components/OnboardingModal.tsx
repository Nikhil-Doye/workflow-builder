import React, { useState } from "react";
import {
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  Zap,
  Globe,
  Brain,
  ArrowDownToLine,
  Key,
  Settings,
} from "lucide-react";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const steps = [
  {
    id: 1,
    title: "Welcome to AI Workflow Builder",
    description:
      "Create powerful AI automation workflows with our intuitive visual builder.",
    icon: Zap,
    content: (
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Zap className="w-8 h-8 text-white" />
        </div>
        <p className="text-gray-600">
          Connect AI models, web scraping, vector search, and data processing in
          minutes. No coding required!
        </p>
      </div>
    ),
  },
  {
    id: 2,
    title: "Drag & Drop Nodes",
    description:
      "Build workflows by dragging nodes from the library to the canvas.",
    icon: Globe,
    content: (
      <div className="space-y-4">
        <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-medium text-sm">Data Input</p>
            <p className="text-xs text-gray-600">Start your workflow</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <Globe className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-medium text-sm">Web Scraping</p>
            <p className="text-xs text-gray-600">Extract web content</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
          <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-medium text-sm">AI Task</p>
            <p className="text-xs text-gray-600">Process with AI</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <Key className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-medium text-sm">Embedding</p>
            <p className="text-xs text-gray-600">Generate vectors</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 p-3 bg-indigo-50 rounded-lg">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <Settings className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-medium text-sm">Similarity Search</p>
            <p className="text-xs text-gray-600">Find similar content</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    title: "Connect & Configure",
    description:
      "Connect nodes together and configure their settings for your needs.",
    icon: Brain,
    content: (
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-sm mb-2">Connection Tips:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Drag from output handle to input handle</li>
            <li>• Click nodes to configure settings</li>
            <li>• Use variables like {`{{input.output}}`} to pass data</li>
          </ul>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-sm mb-2">Configuration:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Set prompts for AI tasks (with optimization)</li>
            <li>• Configure URLs for web scraping</li>
            <li>• Choose output formats and schemas</li>
            <li>• Set vector search parameters</li>
            <li>• Configure embedding models</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 4,
    title: "Configure API Keys",
    description: "Set up your API keys to enable full functionality.",
    icon: Key,
    content: (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-sm mb-2">Required API Keys:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>
              • <strong>DeepSeek:</strong> For AI tasks and prompt optimization
            </li>
            <li>
              • <strong>Pinecone:</strong> For vector search and similarity
              matching
            </li>
            <li>
              • <strong>Firecrawl:</strong> For web scraping operations
            </li>
          </ul>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-sm mb-2">How to Configure:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Click "API Keys" button in the workflow toolbar</li>
            <li>• Enter your API keys in the settings modal</li>
            <li>• Keys are stored locally in your browser</li>
            <li>• Test your Pinecone API key automatically</li>
          </ul>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Get started with demo workflows or configure APIs for full
            functionality!
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 5,
    title: "Execute & Monitor",
    description: "Run your workflows and monitor execution in real-time.",
    icon: ArrowDownToLine,
    content: (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
          <h4 className="font-medium text-sm mb-2">Execution Features:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Real-time progress tracking</li>
            <li>• Step-by-step execution logs</li>
            <li>• Error handling and debugging</li>
            <li>• Export results as JSON</li>
            <li>• Prompt optimization with AI</li>
          </ul>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <h4 className="font-medium text-sm mb-2">New Features:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Vector embeddings and similarity search</li>
            <li>• Pinecone integration for vector databases</li>
            <li>• Enhanced AI prompt optimization</li>
            <li>• Improved error handling and feedback</li>
          </ul>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Ready to build your first AI workflow?
          </p>
        </div>
      </div>
    ),
  },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <currentStepData.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {currentStepData.title}
                </h2>
                <p className="text-sm text-gray-600">
                  {currentStepData.description}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                  index <= currentStep
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                    : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>
              Step {currentStep + 1} of {steps.length}
            </span>
            <span>
              {Math.round(((currentStep + 1) / steps.length) * 100)}% complete
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {currentStepData.content}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Skip tutorial
            </button>

            <div className="flex items-center space-x-3">
              {!isFirstStep && (
                <button
                  onClick={handlePrevious}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
              )}

              <button
                onClick={handleNext}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <span>{isLastStep ? "Get Started" : "Next"}</span>
                {isLastStep ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
