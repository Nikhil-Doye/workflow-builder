import React, { useState } from "react";
import { useWorkflowStore } from "../store/workflowStore";
import { Play, FileText, Download, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";

export const TestingPanel: React.FC = () => {
  const { currentWorkflow, executeWorkflow, isExecuting, executionResults } =
    useWorkflowStore();
  const [testInput, setTestInput] = useState("");
  const [testResults, setTestResults] = useState<any>(null);

  const sampleInputs = [
    {
      name: "Simple Text",
      data: "Hello, this is a test input for the workflow.",
    },
    {
      name: "JSON Data",
      data: JSON.stringify(
        { message: "Test data", timestamp: new Date().toISOString() },
        null,
        2
      ),
    },
    {
      name: "URL",
      data: "https://example.com",
    },
    {
      name: "CSV Data",
      data: "name,age,city\nJohn,30,New York\nJane,25,San Francisco",
    },
  ];

  const handleTestExecution = async () => {
    if (!currentWorkflow) return;

    setTestResults(null);
    await executeWorkflow(testInput);

    // Collect all results
    const results = currentWorkflow.nodes.map((node) => ({
      nodeId: node.id,
      nodeLabel: node.data.label,
      status: executionResults[node.id]?.status || "idle",
      data: executionResults[node.id]?.data,
      error: executionResults[node.id]?.error,
    }));

    setTestResults(results);
  };

  const handleLoadSample = (sample: any) => {
    setTestInput(sample.data);
  };

  const handleExportResults = () => {
    if (!testResults) return;

    const dataStr = JSON.stringify(testResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `workflow_test_results_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const handleClearResults = () => {
    setTestResults(null);
    setTestInput("");
  };

  if (!currentWorkflow) return null;

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Testing Panel
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Input
            </label>
            <textarea
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Enter test data or use sample inputs below..."
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sample Inputs
            </label>
            <div className="space-y-2">
              {sampleInputs.map((sample, index) => (
                <Button
                  key={index}
                  onClick={() => handleLoadSample(sample)}
                  variant="ghost"
                  className="w-full justify-start p-2 text-sm"
                >
                  {sample.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={handleTestExecution}
              disabled={isExecuting}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Run Test
            </Button>

            <Button
              onClick={handleClearResults}
              variant="secondary"
              title="Clear results"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {testResults ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-700">
                Test Results
              </h4>
              <Button
                onClick={handleExportResults}
                variant="secondary"
                size="sm"
                className="text-xs"
              >
                <Download className="w-3 h-3 mr-1" />
                Export
              </Button>
            </div>

            <div className="space-y-3">
              {testResults.map((result: any, index: number) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    result.status === "success"
                      ? "bg-green-50 border-green-200"
                      : result.status === "error"
                      ? "bg-red-50 border-red-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {result.nodeLabel}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        result.status === "success"
                          ? "bg-green-100 text-green-800"
                          : result.status === "error"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {result.status}
                    </span>
                  </div>

                  {result.error && (
                    <div className="text-xs text-red-600 mb-2 p-2 bg-red-100 rounded">
                      {result.error}
                    </div>
                  )}

                  {result.data && (
                    <details className="text-xs">
                      <summary className="cursor-pointer font-medium text-gray-700 mb-1">
                        View Output
                      </summary>
                      <pre className="p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600">
              Run a test to see execution results
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
