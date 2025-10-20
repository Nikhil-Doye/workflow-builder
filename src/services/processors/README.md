# Processor System with Enhanced Diagnostics

This directory contains the enhanced processor system with comprehensive diagnostics for unsupported node types, improved error handling, and better developer experience.

## Overview

The processor system has been enhanced to provide:

- **Warning logging** for unsupported node types
- **Comprehensive diagnostics** with suggestions for alternatives
- **Workflow validation** that flags unsupported types
- **Processor registry** for tracking supported/deprecated/experimental types
- **No-op result status** for fallback processing

## Key Components

### 1. ProcessorRegistry

Central registry for tracking node type support status.

```typescript
import { ProcessorRegistry } from "./ProcessorRegistry";

// Check if a node type is supported
const isSupported = ProcessorRegistry.isSupported("llmTask");

// Get node type status
const status = ProcessorRegistry.getNodeTypeStatus("deprecatedType");
// Returns: { supported: true, deprecated: true, experimental: false, status: 'deprecated' }

// Get similar types for suggestions
const alternatives = ProcessorRegistry.getSimilarTypes("unsupportedType");
// Returns: ['dataInput', 'dataOutput']
```

### 2. Enhanced DefaultProcessor

The default processor now provides comprehensive diagnostics and warnings.

```typescript
import defaultProcessor from "./defaultProcessor";

const result = await defaultProcessor(context, plan);

// Result includes:
// - warning: Warning message for unsupported/deprecated types
// - diagnostics: Detailed status and suggestions
// - metadata: Execution timing and fallback usage info
```

**Example Result:**

```typescript
{
  input: "test data",
  output: "test data", // Pass-through behavior
  type: "default",
  success: true,
  warning: "Node type 'unsupportedType' is not supported. Using fallback processor.",
  diagnostics: {
    nodeType: "unsupportedType",
    status: "unsupported",
    similarTypes: ["dataInput", "dataOutput"],
    suggestion: "Consider using one of these supported types: dataInput, dataOutput"
  },
  metadata: {
    executionTime: 15,
    timestamp: new Date(),
    fallbackUsed: true
  }
}
```

### 3. Workflow Validation

Enhanced workflow validator now checks for unsupported node types.

```typescript
import { validateWorkflowStructure } from "../utils/workflowValidator";

const validation = validateWorkflowStructure(workflow, input);

// Validation now includes node type checks:
// - Issues for unsupported types
// - Warnings for deprecated types
// - Suggestions for alternatives
```

### 4. Node Type Diagnostics

Utility functions for comprehensive node type analysis.

```typescript
import {
  generateNodeTypeDiagnostics,
  getNodeTypeSummary,
} from "../utils/nodeTypeDiagnostics";

// Generate comprehensive diagnostics
const report = generateNodeTypeDiagnostics(workflow);
// Returns: { totalNodes, supportedNodes, deprecatedNodes, unsupportedNodes, diagnostics, recommendations }

// Get quick summary
const summary = getNodeTypeSummary(workflow);
// Returns: { hasIssues, issueCount, warningCount, summary }
```

## Node Type Status Levels

### Supported ✅

- Fully supported node types
- Have dedicated processors
- No warnings or issues

### Deprecated ⚠️

- Still supported but marked for removal
- Generates warnings in validation
- Suggests migration alternatives

### Experimental 🧪

- New or experimental features
- May have limited functionality
- API may change in future versions

### Unsupported ❌

- Not supported by the system
- Uses fallback processor
- Generates errors in validation

## Usage Examples

### 1. Basic Processor Usage

```typescript
// The execution engine automatically handles unsupported types
const result = await executionEngine.executeWorkflow(workflow);

// Check if any nodes used fallback processing
const fallbackNodes = result.nodes.filter(
  (node) => node.result?.metadata?.fallbackUsed === true
);
```

### 2. Workflow Validation

```typescript
import { validateWorkflowStructure } from "../utils/workflowValidator";

const workflow = {
  nodes: [
    { id: "node-1", type: "dataInput", label: "Input", config: {} },
    { id: "node-2", type: "unsupportedType", label: "Unsupported", config: {} },
    { id: "node-3", type: "deprecatedType", label: "Deprecated", config: {} },
  ],
  edges: [],
  complexity: "medium",
};

const validation = validateWorkflowStructure(workflow, "test input");

console.log(validation.issues);
// [
//   "Node 2 (Unsupported) uses unsupported node type: unsupportedType",
//   "Node 3 (Deprecated) uses deprecated node type: deprecatedType"
// ]

console.log(validation.suggestions);
// [
//   "Consider replacing 'unsupportedType' with one of these supported types: dataInput, dataOutput",
//   "Consider migrating 'deprecatedType' to: llmTask"
// ]
```

### 3. Node Type Diagnostics

```typescript
import { generateNodeTypeDiagnostics } from "../utils/nodeTypeDiagnostics";

const report = generateNodeTypeDiagnostics(workflow);

console.log(`Total nodes: ${report.totalNodes}`);
console.log(`Supported: ${report.supportedNodes}`);
console.log(`Unsupported: ${report.unsupportedNodes}`);
console.log(`Deprecated: ${report.deprecatedNodes}`);
console.log(`Experimental: ${report.experimentalNodes}`);

// Review diagnostics for each node
report.diagnostics.forEach((diagnostic) => {
  if (diagnostic.severity === "error") {
    console.error(`❌ ${diagnostic.nodeType}: ${diagnostic.warning}`);
    console.log(`   Suggestion: ${diagnostic.suggestion}`);
  } else if (diagnostic.severity === "warning") {
    console.warn(`⚠️ ${diagnostic.nodeType}: ${diagnostic.warning}`);
    console.log(`   Suggestion: ${diagnostic.suggestion}`);
  }
});
```

### 4. Adding New Node Types

```typescript
import { ProcessorRegistry } from "./ProcessorRegistry";

// Register a new supported type
ProcessorRegistry.registerType("newNodeType");

// Register an experimental type
ProcessorRegistry.registerType("experimentalType", { experimental: true });

// Mark a type as deprecated
ProcessorRegistry.markAsDeprecated("oldNodeType");
```

## Console Output

The enhanced system provides detailed console output for debugging:

```
[DefaultProcessor] Node type 'unsupportedType' is not supported. Using fallback processor. {
  nodeType: 'unsupportedType',
  nodeId: 'node-2',
  executionId: 'plan-123',
  suggestion: 'Consider using one of these supported types: dataInput, dataOutput',
  similarTypes: ['dataInput', 'dataOutput']
}
```

## Testing

Comprehensive tests are included for all components:

```bash
# Run processor tests
npm test src/__tests__/processors/defaultProcessor.test.ts

# Run diagnostics tests
npm test src/__tests__/utils/nodeTypeDiagnostics.test.ts
```

## Migration Guide

### For Existing Workflows

1. **Check validation results** for any unsupported node types
2. **Review warnings** for deprecated types
3. **Update node types** based on suggestions
4. **Test workflows** to ensure they still work as expected

### For New Workflows

1. **Use supported node types** from the registry
2. **Validate workflows** before execution
3. **Handle fallback cases** in your application logic
4. **Monitor console output** for warnings

## Best Practices

1. **Always validate workflows** before execution
2. **Handle fallback results** gracefully in your UI
3. **Provide user feedback** for unsupported types
4. **Keep node types up-to-date** to avoid deprecation warnings
5. **Test with mixed node types** to ensure compatibility

## Future Enhancements

- **Auto-migration tools** for deprecated types
- **Visual indicators** in the UI for node type status
- **Performance metrics** for fallback processing
- **Custom processor registration** at runtime
- **Node type compatibility checking** between connected nodes
