import { Workflow, WorkflowStructure } from "../types";
import { WorkflowImportHelper } from "./workflowImportHelper";

export const exportWorkflow = (workflow: Workflow): string => {
  const exportData = {
    ...workflow,
    exportedAt: new Date().toISOString(),
    version: "1.0.0",
  };

  return JSON.stringify(exportData, null, 2);
};

export const importWorkflow = (jsonString: string): Workflow | null => {
  try {
    const data = JSON.parse(jsonString);

    // Validate required fields
    if (
      !data.id ||
      !data.name ||
      !Array.isArray(data.nodes) ||
      !Array.isArray(data.edges)
    ) {
      throw new Error("Invalid workflow format");
    }

    // Convert date strings back to Date objects
    const workflow: Workflow = {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    };

    return workflow;
  } catch (error) {
    console.error("Failed to import workflow:", error);
    return null;
  }
};

export const importWorkflowWithValidation = (
  jsonString: string,
  options: {
    autoFix?: boolean;
    strictMode?: boolean;
    logFixes?: boolean;
  } = {}
): {
  workflow: Workflow | null;
  result: import("./workflowImportHelper").WorkflowImportResult | null;
} => {
  try {
    const data = JSON.parse(jsonString);

    // Validate required fields
    if (
      !data.id ||
      !data.name ||
      !Array.isArray(data.nodes) ||
      !Array.isArray(data.edges)
    ) {
      throw new Error("Invalid workflow format");
    }

    // Convert to WorkflowStructure for validation
    const workflowStructure: WorkflowStructure = {
      id: data.id,
      name: data.name,
      nodes: data.nodes.map((node: any) => ({
        id: node.id,
        type: node.type,
        label: node.data?.label || node.label || node.id,
        config: node.data?.config || node.config || {},
        position: node.position || { x: 0, y: 0 },
      })),
      edges: data.edges.map((edge: any) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
      })),
      topology: {
        type: "linear",
        description: "Sequential processing",
        parallelExecution: false,
      },
      complexity: data.complexity || "medium",
      estimatedExecutionTime: data.estimatedExecutionTime || 0,
    };

    // Use the import helper to validate and fix
    const importResult = WorkflowImportHelper.importWorkflow(
      workflowStructure,
      options
    );

    if (importResult.errors.length > 0) {
      console.error("Workflow import failed:", importResult.errors);
      return { workflow: null, result: importResult };
    }

    // Convert back to Workflow format
    const workflow: Workflow = {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      // Update nodes and edges with any fixes applied
      nodes: importResult.workflow.nodes.map((node, index) => ({
        id: node.id,
        type: node.type as any,
        position: node.position,
        data: {
          id: node.id,
          type: node.type as any,
          label: node.label,
          status: "idle" as const,
          config: node.config,
          inputs: [],
          outputs: [],
        },
      })),
      edges: importResult.workflow.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
      })),
    };

    // Log any fixes that were applied
    if (importResult.fixesApplied.length > 0) {
      console.log(
        "Applied workflow fixes during import:",
        importResult.fixesApplied
      );
    }

    if (importResult.warnings.length > 0) {
      console.warn("Workflow import warnings:", importResult.warnings);
    }

    return { workflow, result: importResult };
  } catch (error) {
    console.error("Failed to import workflow:", error);
    return { workflow: null, result: null };
  }
};

export const downloadWorkflow = (workflow: Workflow, filename?: string) => {
  const dataStr = exportWorkflow(workflow);
  const dataBlob = new Blob([dataStr], { type: "application/json" });

  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || `${workflow.name.replace(/\s+/g, "_")}.json`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

export const loadWorkflowFromFile = (file: File): Promise<Workflow | null> => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result as string;
      const workflow = importWorkflow(content);
      resolve(workflow);
    };

    reader.onerror = () => {
      console.error("Failed to read file");
      resolve(null);
    };

    reader.readAsText(file);
  });
};
