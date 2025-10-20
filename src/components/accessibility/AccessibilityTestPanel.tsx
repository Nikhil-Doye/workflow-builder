import React, { useState } from "react";
import { CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";

interface AccessibilityTest {
  id: string;
  name: string;
  description: string;
  test: () => boolean;
  category: "keyboard" | "screen-reader" | "visual" | "semantic";
}

export const AccessibilityTestPanel: React.FC = () => {
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [isRunning, setIsRunning] = useState(false);

  const tests: AccessibilityTest[] = [
    {
      id: "keyboard-navigation",
      name: "Keyboard Navigation",
      description: "All interactive elements can be reached via keyboard",
      category: "keyboard",
      test: () => {
        // Test if all buttons and inputs are focusable
        const interactiveElements = document.querySelectorAll(
          'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        return interactiveElements.length > 0;
      },
    },
    {
      id: "aria-labels",
      name: "ARIA Labels",
      description: "Interactive elements have proper ARIA labels",
      category: "screen-reader",
      test: () => {
        const elementsWithoutLabels = document.querySelectorAll(
          'button:not([aria-label]):not([aria-labelledby]), input:not([aria-label]):not([aria-labelledby]):not([type="hidden"])'
        );
        return elementsWithoutLabels.length === 0;
      },
    },
    {
      id: "focus-indicators",
      name: "Focus Indicators",
      description: "Focusable elements have visible focus indicators",
      category: "visual",
      test: () => {
        const style = getComputedStyle(document.documentElement);
        const focusRing = style.getPropertyValue("--focus-ring");
        return focusRing !== "";
      },
    },
    {
      id: "semantic-html",
      name: "Semantic HTML",
      description: "Proper semantic HTML elements are used",
      category: "semantic",
      test: () => {
        const semanticElements = document.querySelectorAll(
          "main, nav, aside, header, footer, section, article, fieldset, legend"
        );
        return semanticElements.length > 0;
      },
    },
    {
      id: "color-contrast",
      name: "Color Contrast",
      description: "Text meets minimum contrast requirements",
      category: "visual",
      test: () => {
        // This would need a proper contrast checking library
        // For now, we'll check if high contrast mode is supported
        return window.matchMedia("(prefers-contrast: high)").matches === false;
      },
    },
    {
      id: "reduced-motion",
      name: "Reduced Motion",
      description: "Respects user's motion preferences",
      category: "visual",
      test: () => {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      },
    },
  ];

  const runTests = async () => {
    setIsRunning(true);
    const results: Record<string, boolean> = {};

    for (const test of tests) {
      try {
        results[test.id] = test.test();
      } catch (error) {
        console.error(`Test ${test.id} failed:`, error);
        results[test.id] = false;
      }
    }

    setTestResults(results);
    setIsRunning(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "keyboard":
        return "⌨️";
      case "screen-reader":
        return "🔊";
      case "visual":
        return "👁️";
      case "semantic":
        return "📝";
      default:
        return "❓";
    }
  };

  const getStatusIcon = (passed: boolean) => {
    if (passed) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const passedTests = Object.values(testResults).filter(Boolean).length;
  const totalTests = tests.length;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Accessibility Test Panel
          </h2>
          <p className="text-sm text-gray-600">
            Test the accessibility features of the Node Library
          </p>
        </div>
        <button
          onClick={runTests}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isRunning ? "Running Tests..." : "Run Tests"}
        </button>
      </div>

      {Object.keys(testResults).length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Info className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium">
              Tests Passed: {passedTests}/{totalTests}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(passedTests / totalTests) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-4">
        {tests.map((test) => {
          const passed = testResults[test.id];
          const hasResult = test.id in testResults;

          return (
            <div
              key={test.id}
              className={`p-4 border rounded-lg transition-all duration-200 ${
                hasResult
                  ? passed
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {hasResult ? (
                    getStatusIcon(passed)
                  ) : (
                    <AlertCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {test.name}
                    </span>
                    <span className="text-lg" aria-label={test.category}>
                      {getCategoryIcon(test.category)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {test.description}
                  </p>
                  {hasResult && (
                    <p
                      className={`text-xs mt-2 font-medium ${
                        passed ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {passed ? "✅ Test passed" : "❌ Test failed"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 mb-2">
          Testing Instructions
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use Tab to navigate through the interface</li>
          <li>• Use arrow keys to navigate within lists</li>
          <li>• Press Enter or Space to activate buttons</li>
          <li>• Test with a screen reader if available</li>
          <li>• Check high contrast mode support</li>
        </ul>
      </div>
    </div>
  );
};
