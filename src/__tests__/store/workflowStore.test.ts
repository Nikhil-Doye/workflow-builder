import { renderHook, act } from "@testing-library/react";
import { useWorkflowStore } from "../../store/workflowStore";
import { Workflow, WorkflowNode, WorkflowEdge } from "../../types";

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

describe("WorkflowStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);

    // Reset the store state before each test
    const { result } = renderHook(() => useWorkflowStore());
    act(() => {
      result.current.clearAllWorkflows();
    });
  });

  describe("Node Type Validation", () => {
    it("should add node with valid type", () => {
      const { result } = renderHook(() => useWorkflowStore());

      act(() => {
        result.current.createWorkflow("Test Workflow");
        result.current.addNode("llmTask", { x: 100, y: 100 });
      });

      expect(result.current.currentWorkflow?.nodes).toHaveLength(1);
      expect(result.current.currentWorkflow?.nodes[0].type).toBe("llmTask");
      expect(result.current.currentWorkflow?.nodes[0].data.label).toBe(
        "LLM Task"
      );
    });

    it("should reject invalid node type", () => {
      const { result } = renderHook(() => useWorkflowStore());
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      act(() => {
        result.current.createWorkflow("Test Workflow");
        result.current.addNode("invalidType", { x: 100, y: 100 });
      });

      expect(result.current.currentWorkflow?.nodes).toHaveLength(0);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid node type: "invalidType"'),
        expect.any(String)
      );

      consoleErrorSpy.mockRestore();
    });

    it("should accept all valid node types", () => {
      const { result } = renderHook(() => useWorkflowStore());

      const validTypes = [
        "webScraping",
        "structuredOutput",
        "embeddingGenerator",
        "similaritySearch",
        "llmTask",
        "dataInput",
        "dataOutput",
        "database",
        "slack",
        "discord",
        "gmail",
      ];

      act(() => {
        result.current.createWorkflow("Test Workflow");
        validTypes.forEach((type, index) => {
          result.current.addNode(type, { x: index * 150, y: 100 });
        });
      });

      expect(result.current.currentWorkflow?.nodes).toHaveLength(
        validTypes.length
      );
    });
  });

  describe("Position Collision Detection", () => {
    it("should place node at requested position if no collision", () => {
      const { result } = renderHook(() => useWorkflowStore());

      act(() => {
        result.current.createWorkflow("Test Workflow");
        result.current.addNode("llmTask", { x: 100, y: 100 });
      });

      expect(result.current.currentWorkflow?.nodes[0].position).toEqual({
        x: 100,
        y: 100,
      });
    });

    it("should resolve position collision automatically", () => {
      const { result } = renderHook(() => useWorkflowStore());
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

      act(() => {
        result.current.createWorkflow("Test Workflow");
        // Add first node
        result.current.addNode("llmTask", { x: 100, y: 100 });
        // Try to add second node at same position
        result.current.addNode("dataInput", { x: 100, y: 100 });
      });

      expect(result.current.currentWorkflow?.nodes).toHaveLength(2);

      const node1Pos = result.current.currentWorkflow?.nodes[0].position;
      const node2Pos = result.current.currentWorkflow?.nodes[1].position;

      // Positions should be different
      expect(node1Pos).not.toEqual(node2Pos);

      // Should have logged collision detection
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Position collision detected")
      );

      consoleLogSpy.mockRestore();
    });

    it("should handle multiple collisions", () => {
      const { result } = renderHook(() => useWorkflowStore());

      act(() => {
        result.current.createWorkflow("Test Workflow");
        // Add multiple nodes at similar positions
        result.current.addNode("llmTask", { x: 100, y: 100 });
        result.current.addNode("dataInput", { x: 105, y: 105 });
        result.current.addNode("dataOutput", { x: 110, y: 110 });
      });

      expect(result.current.currentWorkflow?.nodes).toHaveLength(3);

      // All nodes should have unique positions
      const positions = result.current.currentWorkflow?.nodes.map(
        (n) => `${n.position.x},${n.position.y}`
      );
      const uniquePositions = new Set(positions);
      expect(uniquePositions.size).toBe(3);
    });

    it("should allow nodes far apart without collision", () => {
      const { result } = renderHook(() => useWorkflowStore());
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

      act(() => {
        result.current.createWorkflow("Test Workflow");
        result.current.addNode("llmTask", { x: 100, y: 100 });
        result.current.addNode("dataInput", { x: 300, y: 100 }); // 200px apart
      });

      // No collision should be logged for nodes far apart
      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        expect.stringContaining("Position collision detected")
      );

      consoleLogSpy.mockRestore();
    });
  });

  describe("Workflow Management", () => {
    it("should create a new workflow", () => {
      const { result } = renderHook(() => useWorkflowStore());

      act(() => {
        result.current.createWorkflow("Test Workflow");
      });

      expect(result.current.workflows).toHaveLength(1);
      expect(result.current.workflows[0].name).toBe("Test Workflow");
      expect(result.current.currentWorkflow).toBe(result.current.workflows[0]);
    });

    it("should load workflows from localStorage", () => {
      const mockWorkflows = [
        {
          id: "workflow-1",
          name: "Saved Workflow",
          nodes: [],
          edges: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockWorkflows));

      const { result } = renderHook(() => useWorkflowStore());

      expect(result.current.workflows).toHaveLength(1);
      expect(result.current.workflows[0].name).toBe("Saved Workflow");
    });

    it("should update workflow", () => {
      const { result } = renderHook(() => useWorkflowStore());

      act(() => {
        result.current.createWorkflow("Original Name");
      });

      const workflowId = result.current.currentWorkflow!.id;

      act(() => {
        result.current.updateWorkflow(workflowId, { name: "Updated Name" });
      });

      expect(result.current.currentWorkflow!.name).toBe("Updated Name");
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it("should delete workflow", () => {
      const { result } = renderHook(() => useWorkflowStore());

      act(() => {
        result.current.createWorkflow("Workflow 1");
        result.current.createWorkflow("Workflow 2");
      });

      const workflowId = result.current.workflows[0].id;

      act(() => {
        result.current.deleteWorkflow(workflowId);
      });

      expect(result.current.workflows).toHaveLength(1);
      expect(result.current.workflows[0].name).toBe("Workflow 2");
    });
  });

  describe("Node Management", () => {
    it("should add a node", () => {
      const { result } = renderHook(() => useWorkflowStore());

      act(() => {
        result.current.createWorkflow("Test Workflow");
        result.current.addNode("dataInput", { x: 100, y: 100 });
      });

      expect(result.current.currentWorkflow!.nodes).toHaveLength(1);
      expect(result.current.currentWorkflow!.nodes[0].type).toBe("dataInput");
      expect(result.current.currentWorkflow!.nodes[0].data.id).toBe(
        result.current.currentWorkflow!.nodes[0].id
      );
    });

    it("should update a node", () => {
      const { result } = renderHook(() => useWorkflowStore());

      act(() => {
        result.current.createWorkflow("Test Workflow");
        result.current.addNode("dataInput", { x: 100, y: 100 });
      });

      const nodeId = result.current.currentWorkflow!.nodes[0].id;

      act(() => {
        result.current.updateNode(nodeId, { label: "Updated Label" });
      });

      expect(result.current.currentWorkflow!.nodes[0].data.label).toBe(
        "Updated Label"
      );
    });

    it("should delete a node", () => {
      const { result } = renderHook(() => useWorkflowStore());

      act(() => {
        result.current.createWorkflow("Test Workflow");
        result.current.addNode("dataInput", { x: 100, y: 100 });
        result.current.addNode("llmTask", { x: 200, y: 200 });
      });

      const nodeId = result.current.currentWorkflow!.nodes[0].id;

      act(() => {
        result.current.deleteNode(nodeId);
      });

      expect(result.current.currentWorkflow!.nodes).toHaveLength(1);
      expect(result.current.currentWorkflow!.nodes[0].type).toBe("llmTask");
    });

    it("should validate unique node labels", () => {
      const { result } = renderHook(() => useWorkflowStore());

      act(() => {
        result.current.createWorkflow("Test Workflow");
        result.current.addNode("dataInput", { x: 100, y: 100 });
        result.current.addNode("llmTask", { x: 200, y: 200 });
      });

      const firstNodeId = result.current.currentWorkflow!.nodes[0].id;
      const secondNodeId = result.current.currentWorkflow!.nodes[1].id;

      act(() => {
        result.current.updateNode(firstNodeId, { label: "Test Label" });
        result.current.updateNode(secondNodeId, { label: "Test Label" });
      });

      // Should warn about duplicate labels
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Node label "Test Label" already exists')
      );
    });
  });

  describe("Edge Management", () => {
    it("should add an edge", () => {
      const { result } = renderHook(() => useWorkflowStore());

      act(() => {
        result.current.createWorkflow("Test Workflow");
        result.current.addNode("dataInput", { x: 100, y: 100 });
        result.current.addNode("llmTask", { x: 200, y: 200 });
      });

      const sourceId = result.current.currentWorkflow!.nodes[0].id;
      const targetId = result.current.currentWorkflow!.nodes[1].id;

      act(() => {
        result.current.addEdge(sourceId, targetId);
      });

      expect(result.current.currentWorkflow!.edges).toHaveLength(1);
      expect(result.current.currentWorkflow!.edges[0].source).toBe(sourceId);
      expect(result.current.currentWorkflow!.edges[0].target).toBe(targetId);
    });

    it("should delete an edge", () => {
      const { result } = renderHook(() => useWorkflowStore());

      act(() => {
        result.current.createWorkflow("Test Workflow");
        result.current.addNode("dataInput", { x: 100, y: 100 });
        result.current.addNode("llmTask", { x: 200, y: 200 });
      });

      const sourceId = result.current.currentWorkflow!.nodes[0].id;
      const targetId = result.current.currentWorkflow!.nodes[1].id;

      act(() => {
        result.current.addEdge(sourceId, targetId);
      });

      const edgeId = result.current.currentWorkflow!.edges[0].id;

      act(() => {
        result.current.deleteEdge(edgeId);
      });

      expect(result.current.currentWorkflow!.edges).toHaveLength(0);
    });
  });

  describe("ID Migration", () => {
    it("should migrate deterministic IDs to UUIDs", () => {
      const mockWorkflow = {
        id: "workflow-1",
        name: "Test Workflow",
        nodes: [
          { id: "node-0", data: { id: "node-0", label: "Input Node" } },
          { id: "node-1", data: { id: "node-1", label: "Process Node" } },
        ],
        edges: [{ id: "edge-0", source: "node-0", target: "node-1" }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockWorkflow]));

      const { result } = renderHook(() => useWorkflowStore());

      const workflow = result.current.workflows[0];

      // Check that deterministic IDs were migrated to UUIDs
      expect(workflow.nodes[0].id).not.toMatch(/^node-\d+$/);
      expect(workflow.nodes[1].id).not.toMatch(/^node-\d+$/);
      expect(workflow.nodes[0].data.id).toBe(workflow.nodes[0].id);
      expect(workflow.nodes[1].data.id).toBe(workflow.nodes[1].id);

      // Check that edges reference the new UUIDs
      expect(workflow.edges[0].source).toBe(workflow.nodes[0].id);
      expect(workflow.edges[0].target).toBe(workflow.nodes[1].id);
    });

    it("should not migrate already migrated workflows", () => {
      const mockWorkflow = {
        id: "workflow-1",
        name: "Test Workflow",
        nodes: [
          { id: "uuid-1", data: { id: "uuid-1", label: "Input Node" } },
          { id: "uuid-2", data: { id: "uuid-2", label: "Process Node" } },
        ],
        edges: [{ id: "edge-uuid", source: "uuid-1", target: "uuid-2" }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockWorkflow]));

      const { result } = renderHook(() => useWorkflowStore());

      const workflow = result.current.workflows[0];

      // Should remain unchanged
      expect(workflow.nodes[0].id).toBe("uuid-1");
      expect(workflow.nodes[1].id).toBe("uuid-2");
      expect(workflow.edges[0].source).toBe("uuid-1");
      expect(workflow.edges[0].target).toBe("uuid-2");
    });
  });

  describe("Execution", () => {
    it("should execute workflow", async () => {
      const { result } = renderHook(() => useWorkflowStore());

      act(() => {
        result.current.createWorkflow("Test Workflow");
        result.current.addNode("dataInput", { x: 100, y: 100 });
      });

      // Mock the execution engine
      const mockExecuteWorkflow = jest.fn().mockResolvedValue({
        id: "exec-1",
        status: "completed",
        results: new Map(),
      });

      // Replace the execution engine with mock
      jest.doMock("../../services/executionEngine", () => ({
        executionEngine: {
          executeWorkflow: mockExecuteWorkflow,
        },
      }));

      await act(async () => {
        await result.current.executeWorkflow("test input");
      });

      expect(mockExecuteWorkflow).toHaveBeenCalled();
    });
  });
});
