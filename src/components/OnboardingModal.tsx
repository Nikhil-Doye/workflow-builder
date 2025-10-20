import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Zap,
  Globe,
  Brain,
  ArrowDownToLine,
  Key,
  Settings,
  X,
  RotateCcw,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { OnboardingManager } from "../utils/onboardingManager";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
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
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState(
    OnboardingManager.getPreferences()
  );

  useEffect(() => {
    if (isOpen) {
      setPreferences(OnboardingManager.getPreferences());
      // Start from the first incomplete step
      const firstIncompleteStep = steps.findIndex(
        (step) => !OnboardingManager.hasCompletedStep(step.id)
      );
      setCurrentStep(Math.max(0, firstIncompleteStep));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    // Mark current step as completed
    OnboardingManager.markStepCompleted(currentStepData.id);

    if (isLastStep) {
      OnboardingManager.markOnboardingCompleted();
      onComplete?.();
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
    OnboardingManager.optOutOfOnboarding();
    onClose();
  };

  const handleReset = () => {
    OnboardingManager.resetOnboarding();
    setCurrentStep(0);
    setPreferences(OnboardingManager.getPreferences());
  };

  const handleToggleStartup = () => {
    const newShowOnStartup = !preferences.showOnboardingOnStartup;
    if (newShowOnStartup) {
      OnboardingManager.enableOnboardingOnStartup();
    } else {
      OnboardingManager.disableOnboardingOnStartup();
    }
    setPreferences(OnboardingManager.getPreferences());
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-hidden p-0">
        {/* Header */}
        <DialogHeader className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3 flex-1">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <currentStepData.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  {currentStepData.title}
                  {OnboardingManager.hasCompletedStep(currentStepData.id) && (
                    <Check className="w-4 h-4 text-green-500" />
                  )}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600">
                  {currentStepData.description}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
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
        </DialogHeader>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {currentStepData.content}
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Onboarding Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Show onboarding on startup
                  </label>
                  <p className="text-xs text-gray-500">
                    Display this tutorial when you have no workflows
                  </p>
                </div>
                <button
                  onClick={handleToggleStartup}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences.showOnboardingOnStartup
                      ? "bg-blue-600"
                      : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences.showOnboardingOnStartup
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Reset tutorial
                  </label>
                  <p className="text-xs text-gray-500">
                    Start the tutorial from the beginning
                  </p>
                </div>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset</span>
                </Button>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  <p>
                    Progress: {OnboardingManager.getProgressPercentage()}%
                    complete
                  </p>
                  <p>
                    Completed steps: {preferences.completedSteps.length} of{" "}
                    {steps.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <DialogFooter className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between w-full">
            <Button
              onClick={handleSkip}
              variant="ghost"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Skip tutorial
            </Button>

            <div className="flex items-center space-x-3">
              {!isFirstStep && (
                <Button
                  onClick={handlePrevious}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </Button>
              )}

              <Button
                onClick={handleNext}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <span>{isLastStep ? "Get Started" : "Next"}</span>
                {isLastStep ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
