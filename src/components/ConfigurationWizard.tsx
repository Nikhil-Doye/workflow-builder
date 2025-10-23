import React, { useState, useEffect } from "react";
import { NodeData, NodeType } from "../types";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Lightbulb,
  Target,
  Zap,
  Settings,
  HelpCircle,
} from "lucide-react";

interface WizardStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<WizardStepProps>;
  validation?: (data: any) => boolean;
  helpText?: string;
}

export interface WizardStepProps {
  data: any;
  onChange: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
  canProceed: boolean;
}

interface ConfigurationWizardProps {
  nodeType: NodeType;
  initialData: Partial<NodeData>;
  onComplete: (data: NodeData) => void;
  onCancel: () => void;
}

// Import specific wizard components
import { DataInputWizard } from "./wizards/DataInputWizard";
import { WebScrapingWizard } from "./wizards/WebScrapingWizard";
import { LLMTaskWizard } from "./wizards/LLMTaskWizard";
import { DataOutputWizard } from "./wizards/DataOutputWizard";
import { EmbeddingWizard } from "./wizards/EmbeddingWizard";
import { SimilaritySearchWizard } from "./wizards/SimilaritySearchWizard";
import { StructuredOutputWizard } from "./wizards/StructuredOutputWizard";
import { DiscordWizard } from "./wizards/DiscordWizard";

const WIZARD_STEPS: Record<NodeType, WizardStep[]> = {
  dataInput: [
    {
      id: "data-type",
      title: "Choose Data Type",
      description: "What kind of data will this node provide?",
      component: DataInputWizard,
      validation: (data) => !!data.dataType,
      helpText:
        "Select the format of data you want to input into your workflow",
    },
  ],
  webScraping: [
    {
      id: "url-config",
      title: "Website Configuration",
      description: "Configure the website you want to scrape",
      component: WebScrapingWizard,
      validation: (data) => !!data.url,
      helpText: "Enter the URL of the website you want to extract content from",
    },
  ],
  llmTask: [
    {
      id: "task-config",
      title: "AI Task Setup",
      description: "Configure what you want the AI to do",
      component: LLMTaskWizard,
      validation: (data) => !!data.prompt,
      helpText: "Describe the task you want the AI to perform on your data",
    },
  ],
  dataOutput: [
    {
      id: "output-config",
      title: "Output Configuration",
      description: "How should the results be formatted?",
      component: DataOutputWizard,
      validation: (data) => !!data.format,
      helpText:
        "Choose how you want the workflow results to be formatted and saved",
    },
  ],
  embeddingGenerator: [
    {
      id: "embedding-config",
      title: "Embedding Settings",
      description: "Configure text embedding generation",
      component: EmbeddingWizard,
      validation: (data) => !!data.model,
      helpText: "Configure how text will be converted to vector embeddings",
    },
  ],
  similaritySearch: [
    {
      id: "search-config",
      title: "Search Configuration",
      description: "Set up similarity search parameters",
      component: SimilaritySearchWizard,
      validation: (data) => !!data.vectorStore,
      helpText:
        "Configure how similar content will be found in your vector database",
    },
  ],
  structuredOutput: [
    {
      id: "structure-config",
      title: "Output Structure",
      description: "Define the structure for your data",
      component: StructuredOutputWizard,
      validation: (data) => !!data.schema,
      helpText: "Define how your data should be structured and formatted",
    },
  ],
  // Unified database node
  database: [
    {
      id: "database-config",
      title: "Database Operation",
      description: "Configure your database operation",
      component: DataInputWizard, // Placeholder - will be replaced with DatabaseWizard
      validation: (data: any) => !!data.operation && !!data.connectionId,
      helpText: "Set up your database operation parameters",
    },
  ],
  // Slack integration
  slack: [
    {
      id: "slack-config",
      title: "Slack Integration",
      description: "Configure your Slack integration",
      component: DataInputWizard, // Placeholder - will be replaced with SlackWizard
      validation: (data: any) => !!data.operation && !!data.botToken,
      helpText: "Set up your Slack operation parameters",
    },
  ],
  // Discord integration
  discord: [
    {
      id: "discord-config",
      title: "Discord Integration",
      description: "Configure your Discord integration",
      component: DiscordWizard,
      validation: (data: any) => !!data.operation && !!data.botToken,
      helpText: "Set up your Discord operation parameters",
    },
  ],
};

export const ConfigurationWizard: React.FC<ConfigurationWizardProps> = ({
  nodeType,
  initialData,
  onComplete,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState(initialData);
  const [showHelp, setShowHelp] = useState(false);

  const steps = WIZARD_STEPS[nodeType] || [];
  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const canProceed = currentStepData?.validation
    ? currentStepData.validation(wizardData)
    : true;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete the wizard
      const finalData: NodeData = {
        id: initialData.id || `node-${Date.now()}`,
        type: nodeType,
        label: initialData.label || getDefaultLabel(nodeType),
        status: "idle",
        config: wizardData.config || {},
        inputs: initialData.inputs || [],
        outputs: initialData.outputs || [],
      };
      onComplete(finalData);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDataChange = (newData: any) => {
    setWizardData((prev) => ({
      ...prev,
      ...newData,
    }));
  };

  const getDefaultLabel = (type: NodeType): string => {
    const labels: Record<NodeType, string> = {
      dataInput: "Data Input",
      webScraping: "Web Scraper",
      llmTask: "AI Assistant",
      dataOutput: "Data Output",
      embeddingGenerator: "Embedding Generator",
      similaritySearch: "Similarity Search",
      structuredOutput: "Structured Output",
      database: "Database Operations",
      slack: "Slack Integration",
      discord: "Discord Integration",
    };
    return labels[type] || "New Node";
  };

  if (!currentStepData) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">
          No configuration wizard available for this node type.
        </p>
        <Button onClick={onCancel} className="mt-4">
          Cancel
        </Button>
      </div>
    );
  }

  const StepComponent = currentStepData.component;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Configure {getDefaultLabel(nodeType)}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHelp(!showHelp)}
            >
              <HelpCircle className="w-4 h-4 mr-1" />
              Help
            </Button>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Help Panel */}
      {showHelp && currentStepData.helpText && (
        <div className="bg-blue-50 border-b border-blue-200 p-4">
          <div className="flex items-start space-x-2">
            <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-900">Help</h4>
              <p className="text-sm text-blue-700 mt-1">
                {currentStepData.helpText}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="flex-1 p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>{currentStepData.title}</span>
            </CardTitle>
            <p className="text-gray-600">{currentStepData.description}</p>
          </CardHeader>
          <CardContent>
            <StepComponent
              data={wizardData}
              onChange={handleDataChange}
              onNext={handleNext}
              onPrevious={handlePrevious}
              isFirst={currentStep === 0}
              isLast={currentStep === steps.length - 1}
              canProceed={canProceed}
            />
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          <div className="flex items-center space-x-2">
            {!canProceed && (
              <Badge
                variant="outline"
                className="text-yellow-600 border-yellow-200"
              >
                <Settings className="w-3 h-3 mr-1" />
                Complete required fields
              </Badge>
            )}

            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Complete
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
