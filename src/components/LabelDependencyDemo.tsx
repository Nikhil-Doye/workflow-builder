import React, { useState } from "react";
import { LabelDependencyManager } from "../utils/labelDependencyManager";
import { Workflow, WorkflowNode } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";

interface LabelDependencyDemoProps {
  workflow: Workflow;
}

export const LabelDependencyDemo: React.FC<LabelDependencyDemoProps> = ({
  workflow,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>("");
  const [newLabel, setNewLabel] = useState<string>("");
  const [analysis, setAnalysis] = useState<any>(null);

  const handleAnalyze = () => {
    if (!selectedNodeId || !newLabel) return;

    const node = workflow.nodes.find((n) => n.id === selectedNodeId);
    if (!node) return;

    const currentLabel = node.data.label || node.id;
    const impact = LabelDependencyManager.analyzeLabelChangeImpact(
      workflow,
      selectedNodeId,
      currentLabel,
      newLabel
    );

    setAnalysis(impact);
  };

  const handleUpdateReferences = () => {
    if (!selectedNodeId || !newLabel || !analysis) return;

    const node = workflow.nodes.find((n) => n.id === selectedNodeId);
    if (!node) return;

    const currentLabel = node.data.label || node.id;
    const updatedWorkflow = LabelDependencyManager.updateLabelReferences(
      workflow,
      selectedNodeId,
      currentLabel,
      newLabel
    );

    // In a real app, you would update the workflow in the store
    console.log("Updated workflow:", updatedWorkflow);
    alert("Workflow updated! Check console for details.");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Label Dependency Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Node to Rename:
            </label>
            <select
              value={selectedNodeId}
              onChange={(e) => setSelectedNodeId(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Select a node...</option>
              {workflow.nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.data.label || node.id} ({node.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">New Label:</label>
            <Input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Enter new label..."
            />
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={!selectedNodeId || !newLabel}
          >
            Analyze Impact
          </Button>
        </CardContent>
      </Card>

      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Impact Analysis
              <Badge
                variant={analysis.hasDependencies ? "destructive" : "success"}
              >
                {analysis.hasDependencies ? "Breaking Changes" : "Safe"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.hasDependencies ? (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded p-4">
                  <h4 className="font-medium text-red-800 mb-2">
                    ⚠️ Breaking Changes Detected
                  </h4>
                  <p className="text-red-700 text-sm">
                    This change will break {analysis.dependencies.length}{" "}
                    variable reference(s)
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Affected References:</h4>
                  {analysis.dependencies.map((dep: any, index: number) => (
                    <div
                      key={index}
                      className="bg-yellow-50 border border-yellow-200 rounded p-3"
                    >
                      <div className="font-medium text-yellow-800">
                        Node: {dep.nodeLabel}
                      </div>
                      <div className="text-sm text-yellow-700 mt-1">
                        References:
                      </div>
                      <ul className="text-sm text-yellow-600 mt-1 space-y-1">
                        {dep.references.map((ref: any, refIndex: number) => (
                          <li key={refIndex} className="flex items-center">
                            <span className="font-mono bg-yellow-100 px-2 py-1 rounded text-xs mr-2">
                              {ref.fullReference}
                            </span>
                            <span className="text-gray-600">
                              in {ref.context}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <Button onClick={handleUpdateReferences} className="w-full">
                  Update Label & Fix All References
                </Button>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded p-4">
                <h4 className="font-medium text-green-800 mb-2">
                  ✅ Safe to Update
                </h4>
                <p className="text-green-700 text-sm">
                  This label change is safe and won't affect any variable
                  references.
                </p>
              </div>
            )}

            {analysis.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Warnings:</h4>
                <ul className="text-yellow-700 text-sm space-y-1">
                  {analysis.warnings.map((warning: string, index: number) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.suggestions.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <h4 className="font-medium text-blue-800 mb-2">Suggestions:</h4>
                <ul className="text-blue-700 text-sm space-y-1">
                  {analysis.suggestions.map(
                    (suggestion: string, index: number) => (
                      <li key={index}>• {suggestion}</li>
                    )
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
