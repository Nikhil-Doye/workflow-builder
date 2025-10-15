import { Workflow } from "../types";

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
