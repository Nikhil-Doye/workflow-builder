import { Tool, ToolRegistry as IToolRegistry } from "../../types/tools";

export class ToolRegistry implements IToolRegistry {
  private tools = new Map<string, Tool>();

  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
    console.log(`Registered tool: ${tool.name}`);
  }

  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  unregisterTool(name: string): void {
    this.tools.delete(name);
    console.log(`Unregistered tool: ${name}`);
  }

  getToolsByCategory(category: string): Tool[] {
    // For now, return all tools. In the future, we can add categories
    return this.getAllTools();
  }

  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  clear(): void {
    this.tools.clear();
    console.log("Cleared all tools from registry");
  }
}

// Global tool registry instance
export const toolRegistry = new ToolRegistry();
