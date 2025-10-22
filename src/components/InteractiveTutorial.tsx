import React, { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import {
  Play,
  Pause,
  SkipForward,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Target,
  Lightbulb,
  Zap,
  Settings,
  X,
} from "lucide-react";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  action: "click" | "drag" | "type" | "wait" | "info";
  target?: string;
  content?: string;
  position?: "top" | "bottom" | "left" | "right";
  highlight?: boolean;
  autoAdvance?: boolean;
  delay?: number;
}

interface InteractiveTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  workflowNodes?: any[];
  workflowEdges?: any[];
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to AI Workflow Builder!",
    description:
      "Let's create your first workflow together. This tutorial will guide you through the basics.",
    action: "info",
    position: "top",
  },
  {
    id: "add-input",
    title: "Step 1: Add a Data Input Node",
    description:
      "First, let's add a node that will provide data to your workflow. Click on the 'Data Input' node in the library.",
    action: "click",
    target: "[data-node-type='dataInput']",
    position: "right",
    highlight: true,
  },
  {
    id: "configure-input",
    title: "Configure the Input Node",
    description:
      "Now let's configure what type of data this node will provide. Click on the node you just added.",
    action: "click",
    target: "[data-node-id*='dataInput']",
    position: "top",
    highlight: true,
  },
  {
    id: "add-ai",
    title: "Step 2: Add an AI Assistant Node",
    description:
      "Great! Now let's add an AI node to process the data. Drag the 'AI Assistant' node from the library.",
    action: "drag",
    target: "[data-node-type='llmTask']",
    position: "right",
    highlight: true,
  },
  {
    id: "connect-nodes",
    title: "Step 3: Connect the Nodes",
    description:
      "Now let's connect the nodes so data flows from input to AI processing. Drag from the output of the first node to the input of the second.",
    action: "drag",
    target: "[data-node-id*='dataInput'] .react-flow__handle-bottom",
    position: "top",
    highlight: true,
  },
  {
    id: "add-output",
    title: "Step 4: Add an Output Node",
    description:
      "Finally, let's add an output node to save the results. Add a 'Data Output' node and connect it to the AI node.",
    action: "click",
    target: "[data-node-type='dataOutput']",
    position: "right",
    highlight: true,
  },
  {
    id: "test-workflow",
    title: "Step 5: Test Your Workflow",
    description:
      "Perfect! Now let's test your workflow. Click the 'Run Test' button to see it in action.",
    action: "click",
    target: "[data-test-button]",
    position: "top",
    highlight: true,
  },
  {
    id: "complete",
    title: "Congratulations!",
    description:
      "You've successfully created your first AI workflow! You can now explore more advanced features and create complex workflows.",
    action: "info",
    position: "top",
  },
];

export const InteractiveTutorial: React.FC<InteractiveTutorialProps> = ({
  isOpen,
  onClose,
  onComplete,
  workflowNodes = [],
  workflowEdges = [],
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [tutorialData, setTutorialData] = useState({
    hasInputNode: false,
    hasAINode: false,
    hasOutputNode: false,
    hasConnections: false,
    hasTested: false,
  });

  const overlayRef = useRef<HTMLDivElement>(null);
  const currentStepData = TUTORIAL_STEPS[currentStep];
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

  // Monitor workflow state for tutorial progress
  useEffect(() => {
    if (!isOpen) return;

    const hasInputNode = workflowNodes.some(
      (node) => node.type === "dataInput"
    );
    const hasAINode = workflowNodes.some((node) => node.type === "llmTask");
    const hasOutputNode = workflowNodes.some(
      (node) => node.type === "dataOutput"
    );
    const hasConnections = workflowEdges.length > 0;

    setTutorialData({
      hasInputNode,
      hasAINode,
      hasOutputNode,
      hasConnections,
      hasTested: false, // This would need to be tracked from execution
    });
  }, [workflowNodes, workflowEdges, isOpen]);

  // Auto-advance tutorial based on user actions
  useEffect(() => {
    if (!isOpen || !isPlaying) return;

    const stepId = currentStepData.id;

    // Check if current step is completed
    if (stepId === "add-input" && tutorialData.hasInputNode) {
      advanceStep();
    } else if (stepId === "add-ai" && tutorialData.hasAINode) {
      advanceStep();
    } else if (stepId === "add-output" && tutorialData.hasOutputNode) {
      advanceStep();
    } else if (stepId === "connect-nodes" && tutorialData.hasConnections) {
      advanceStep();
    }
  }, [tutorialData, currentStep, isPlaying, isOpen]);

  const advanceStep = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
      setCompletedSteps((prev) => new Set([...prev, currentStepData.id]));
    } else {
      completeTutorial();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const completeTutorial = () => {
    setIsPlaying(false);
    onComplete();
  };

  const startTutorial = () => {
    setIsPlaying(true);
    setCurrentStep(0);
    setCompletedSteps(new Set());
  };

  const pauseTutorial = () => {
    setIsPlaying(false);
  };

  const skipStep = () => {
    advanceStep();
  };

  const getStepStatus = (stepIndex: number) => {
    if (completedSteps.has(TUTORIAL_STEPS[stepIndex].id)) {
      return "completed";
    } else if (stepIndex === currentStep) {
      return "current";
    } else {
      return "pending";
    }
  };

  const getHighlightStyle = () => {
    if (!currentStepData.target || !currentStepData.highlight) return {};

    const element = document.querySelector(currentStepData.target);
    if (!element) return {};

    const rect = element.getBoundingClientRect();
    return {
      position: "absolute" as const,
      top: rect.top - 4,
      left: rect.left - 4,
      width: rect.width + 8,
      height: rect.height + 8,
      border: "2px solid #3b82f6",
      borderRadius: "8px",
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      zIndex: 1000,
      pointerEvents: "none" as const,
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-4xl mx-4">
        {/* Tutorial Overlay */}
        {isPlaying && currentStepData.highlight && (
          <div
            ref={overlayRef}
            className="fixed inset-0 pointer-events-none"
            style={getHighlightStyle()}
          />
        )}

        {/* Tutorial Card */}
        <Card className="relative z-10">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Play className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    Interactive Tutorial
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Step {currentStep + 1} of {TUTORIAL_STEPS.length}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="mt-4">
              <Progress value={progress} className="h-2" />
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Current Step Content */}
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {currentStepData.title}
              </h3>
              <p className="text-gray-600 mb-4">
                {currentStepData.description}
              </p>
            </div>

            {/* Step Indicators */}
            <div className="flex justify-center space-x-2">
              {TUTORIAL_STEPS.map((_, index) => {
                const status = getStepStatus(index);
                return (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full ${
                      status === "completed"
                        ? "bg-green-500"
                        : status === "current"
                        ? "bg-blue-500"
                        : "bg-gray-300"
                    }`}
                  />
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center space-x-3">
              {!isPlaying ? (
                <Button
                  onClick={startTutorial}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Tutorial
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={pauseTutorial}>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                  <Button variant="outline" onClick={skipStep}>
                    <SkipForward className="w-4 h-4 mr-2" />
                    Skip Step
                  </Button>
                </>
              )}
            </div>

            {/* Progress Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">
                Tutorial Progress
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle
                    className={`w-4 h-4 ${
                      tutorialData.hasInputNode
                        ? "text-green-500"
                        : "text-gray-400"
                    }`}
                  />
                  <span>Added Input Node</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle
                    className={`w-4 h-4 ${
                      tutorialData.hasAINode
                        ? "text-green-500"
                        : "text-gray-400"
                    }`}
                  />
                  <span>Added AI Node</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle
                    className={`w-4 h-4 ${
                      tutorialData.hasOutputNode
                        ? "text-green-500"
                        : "text-gray-400"
                    }`}
                  />
                  <span>Added Output Node</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle
                    className={`w-4 h-4 ${
                      tutorialData.hasConnections
                        ? "text-green-500"
                        : "text-gray-400"
                    }`}
                  />
                  <span>Connected Nodes</span>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={previousStep}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="flex space-x-2">
                <Button variant="outline" onClick={onClose}>
                  Exit Tutorial
                </Button>
                {currentStep === TUTORIAL_STEPS.length - 1 ? (
                  <Button
                    onClick={completeTutorial}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete
                  </Button>
                ) : (
                  <Button
                    onClick={advanceStep}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
