import React, { useState, useEffect } from "react";
import {
  LabelDependencyManager,
  LabelChangeImpact,
  LabelDependency,
} from "../utils/labelDependencyManager";
import { Workflow } from "../types";

interface LabelChangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newLabel: string, updateReferences: boolean) => void;
  nodeId: string;
  oldLabel: string;
  newLabel: string;
  workflow: Workflow;
}

export const LabelChangeDialog: React.FC<LabelChangeDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  nodeId,
  oldLabel,
  newLabel,
  workflow,
}) => {
  const [impact, setImpact] = useState<LabelChangeImpact | null>(null);
  const [updateReferences, setUpdateReferences] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (isOpen && oldLabel !== newLabel) {
      setIsAnalyzing(true);
      
      // Analyze the impact of the label change
      const analysis = LabelDependencyManager.analyzeLabelChangeImpact(
        workflow,
        nodeId,
        oldLabel,
        newLabel
      );
      
      setImpact(analysis);
      setUpdateReferences(analysis.hasDependencies);
      setIsAnalyzing(false);
    }
  }, [isOpen, nodeId, oldLabel, newLabel, workflow]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(newLabel, updateReferences);
    onClose();
  };

  const renderDependencyList = (dependencies: LabelDependency[]) => {
    return (
      <div className="space-y-2">
        {dependencies.map((dep, index) => (
          <div key={index} className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <div className="font-medium text-yellow-800">
              Node: {dep.nodeLabel}
            </div>
            <div className="text-sm text-yellow-700 mt-1">
              References:
            </div>
            <ul className="text-sm text-yellow-600 mt-1 space-y-1">
              {dep.references.map((ref, refIndex) => (
                <li key={refIndex} className="flex items-center">
                  <span className="font-mono bg-yellow-100 px-2 py-1 rounded text-xs mr-2">
                    {ref.fullReference}
                  </span>
                  <span className="text-gray-600">in {ref.context}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Change Node Label
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4">
            <div className="text-sm text-gray-600 mb-2">
              Changing label from <span className="font-mono bg-gray-100 px-2 py-1 rounded">{oldLabel}</span> to <span className="font-mono bg-blue-100 px-2 py-1 rounded">{newLabel}</span>
            </div>
          </div>

          {isAnalyzing ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Analyzing dependencies...</span>
            </div>
          ) : impact ? (
            <div className="space-y-4">
              {impact.hasDependencies ? (
                <div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center mb-2">
                      <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium text-red-800">Breaking Changes Detected</span>
                    </div>
                    <p className="text-red-700 text-sm">
                      This change will break {impact.dependencies.length} variable reference(s) in other nodes.
                    </p>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-medium text-gray-900 mb-2">Affected References:</h3>
                    {renderDependencyList(impact.dependencies)}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="updateReferences"
                        checked={updateReferences}
                        onChange={(e) => setUpdateReferences(e.target.checked)}
                        className="mt-1 mr-3"
                      />
                      <div>
                        <label htmlFor="updateReferences" className="font-medium text-blue-800">
                          Automatically update all variable references
                        </label>
                        <p className="text-blue-700 text-sm mt-1">
                          This will replace all {{oldLabel.property}} references with {{newLabel.property}} in the affected nodes.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium text-green-800">No Breaking Changes</span>
                  </div>
                  <p className="text-green-700 text-sm mt-1">
                    This label change is safe and won't affect any variable references.
                  </p>
                </div>
              )}

              {impact.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">Warnings:</h4>
                  <ul className="text-yellow-700 text-sm space-y-1">
                    {impact.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {impact.suggestions.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Suggestions:</h4>
                  <ul className="text-blue-700 text-sm space-y-1">
                    {impact.suggestions.map((suggestion, index) => (
                      <li key={index}>• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {impact?.hasDependencies ? "Update Label & References" : "Update Label"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
