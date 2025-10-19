import React, { useState } from "react";
import { agentManager } from "../services/agents/AgentManager";
import { Play, CheckCircle, XCircle, Loader2, Brain, Zap } from "lucide-react";

interface TestResult {
  name: string;
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
  toolsUsed: string[];
}

export const AgentSystemDemo: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);

    const tests: Array<{ name: string; test: () => Promise<any> }> = [
      {
        name: "Basic Workflow Generation",
        test: () =>
          agentManager.processWorkflowRequest(
            "Create a workflow that scrapes a website and analyzes the content with AI"
          ),
      },
      {
        name: "Job Application Workflow",
        test: () =>
          agentManager.processWorkflowRequest(
            "Build a workflow to process job applications and match them with opportunities"
          ),
      },
      {
        name: "Suggestions Generation",
        test: () => agentManager.getSuggestions("I want to process documents"),
      },
      {
        name: "Tool Information",
        test: () =>
          Promise.resolve({ tools: agentManager.getAvailableTools() }),
      },
    ];

    const testResults: TestResult[] = [];

    for (const test of tests) {
      try {
        const startTime = Date.now();
        const result = await test.test();
        const executionTime = Date.now() - startTime;

        testResults.push({
          name: test.name,
          success: true,
          data: result,
          executionTime,
          toolsUsed: result.toolsUsed || [],
        });
      } catch (error) {
        testResults.push({
          name: test.name,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          executionTime: 0,
          toolsUsed: [],
        });
      }
    }

    setResults(testResults);
    setSessionInfo(agentManager.getSessionInfo());
    setIsRunning(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Agent System Demo
            </h2>
            <p className="text-gray-600">
              Test the new tool-based AI agent system
            </p>
          </div>
        </div>

        <div className="mb-6">
          <button
            onClick={runTests}
            disabled={isRunning}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {isRunning ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Play className="w-5 h-5" />
            )}
            <span>{isRunning ? "Running Tests..." : "Run Agent Tests"}</span>
          </button>
        </div>

        {sessionInfo && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Session Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Session ID:</span>
                <span className="ml-2 text-gray-600">
                  {sessionInfo.sessionId}
                </span>
              </div>
              <div>
                <span className="font-medium">Tools Available:</span>
                <span className="ml-2 text-gray-600">
                  {sessionInfo.toolsAvailable}
                </span>
              </div>
              <div>
                <span className="font-medium">Cache Size:</span>
                <span className="ml-2 text-gray-600">
                  {sessionInfo.cacheStats.size}
                </span>
              </div>
              <div>
                <span className="font-medium">Cache Hit Rate:</span>
                <span className="ml-2 text-gray-600">
                  {(sessionInfo.cacheStats.hitRate * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Test Results
            </h3>
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.success
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="font-medium text-gray-900">
                      {result.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>{result.executionTime}ms</span>
                    {result.toolsUsed.length > 0 && (
                      <span className="flex items-center space-x-1">
                        <Zap className="w-4 h-4" />
                        <span>{result.toolsUsed.length} tools</span>
                      </span>
                    )}
                  </div>
                </div>

                {result.error && (
                  <div className="text-red-600 text-sm mt-2">
                    Error: {result.error}
                  </div>
                )}

                {result.success && result.data && (
                  <div className="text-sm text-gray-600 mt-2">
                    {result.name.includes("Workflow") &&
                      result.data.parsedIntent && (
                        <div>
                          <p>Intent: {result.data.parsedIntent.intent}</p>
                          <p>
                            Confidence:{" "}
                            {(
                              result.data.parsedIntent.confidence * 100
                            ).toFixed(1)}
                            %
                          </p>
                          <p>
                            Nodes:{" "}
                            {
                              result.data.parsedIntent.workflowStructure.nodes
                                .length
                            }
                          </p>
                        </div>
                      )}
                    {result.name.includes("Suggestions") &&
                      Array.isArray(result.data) && (
                        <div>
                          <p>Generated {result.data.length} suggestions</p>
                          <ul className="list-disc list-inside mt-1">
                            {result.data
                              .slice(0, 3)
                              .map((suggestion: string, i: number) => (
                                <li key={i}>{suggestion}</li>
                              ))}
                          </ul>
                        </div>
                      )}
                    {result.name.includes("Tools") && result.data.tools && (
                      <div>
                        <p>Available tools: {result.data.tools.join(", ")}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
