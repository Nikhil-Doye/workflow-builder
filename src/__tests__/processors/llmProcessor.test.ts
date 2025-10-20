import llmProcessor from '../../services/processors/llmProcessor';
import { ExecutionContext, ExecutionPlan } from '../../services/executionEngine';

// Mock dependencies
jest.mock('../../services/openaiService', () => ({
  callOpenAI: jest.fn(),
}));

jest.mock('../../utils/variableSubstitution', () => ({
  substituteVariables: jest.fn(),
}));

describe('LLM Processor', () => {
  let mockCallOpenAI: jest.MockedFunction<any>;
  let mockSubstituteVariables: jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockCallOpenAI = require('../../services/openaiService').callOpenAI;
    mockSubstituteVariables = require('../../utils/variableSubstitution').substituteVariables;
  });

  describe('Basic Processing', () => {
    it('should process text with basic prompt', async () => {
      const context: ExecutionContext = {
        nodeId: 'node-1',
        nodeType: 'llmTask',
        config: {
          prompt: 'Analyze this text: {{input}}',
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
        },
        inputs: new Map([['input', 'Hello world']]),
        outputs: new Map(),
        status: 'pending',
        retryCount: 0,
        maxRetries: 3,
      };

      const plan: ExecutionPlan = {
        id: 'plan-1',
        workflowId: 'workflow-1',
        nodes: [context],
        edges: [],
        executionMode: 'sequential',
        parallelGroups: [],
        conditions: new Map(),
        status: 'running',
        results: new Map(),
        errors: new Map(),
      };

      mockCallOpenAI.mockResolvedValue({
        content: 'Analysis: The text "Hello world" is a common greeting.',
        usage: { total_tokens: 50 },
      });

      mockSubstituteVariables.mockReturnValue('Analyze this text: Hello world');

      const result = await llmProcessor(context, plan);

      expect(result.success).toBe(true);
      expect(result.output).toBe('Analysis: The text "Hello world" is a common greeting.');
      expect(result.model).toBe('gpt-3.5-turbo');
      expect(mockCallOpenAI).toHaveBeenCalledWith(
        'Analyze this text: Hello world',
        {
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 1000,
        }
      );
    });

    it('should use default model when not specified', async () => {
      const context: ExecutionContext = {
        nodeId: 'node-1',
        nodeType: 'llmTask',
        config: {
          prompt: 'Simple prompt',
        },
        inputs: new Map(),
        outputs: new Map(),
        status: 'pending',
        retryCount: 0,
        maxRetries: 3,
      };

      const plan: ExecutionPlan = {
        id: 'plan-1',
        workflowId: 'workflow-1',
        nodes: [context],
        edges: [],
        executionMode: 'sequential',
        parallelGroups: [],
        conditions: new Map(),
        status: 'running',
        results: new Map(),
        errors: new Map(),
      };

      mockCallOpenAI.mockResolvedValue({
        content: 'Response',
        usage: { total_tokens: 10 },
      });

      mockSubstituteVariables.mockReturnValue('Simple prompt');

      await llmProcessor(context, plan);

      expect(mockCallOpenAI).toHaveBeenCalledWith(
        'Simple prompt',
        {
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 1000,
        }
      );
    });

    it('should fall back to input data when no prompt provided', async () => {
      const context: ExecutionContext = {
        nodeId: 'node-1',
        nodeType: 'llmTask',
        config: {},
        inputs: new Map([['input', 'Fallback input data']]),
        outputs: new Map(),
        status: 'pending',
        retryCount: 0,
        maxRetries: 3,
      };

      const plan: ExecutionPlan = {
        id: 'plan-1',
        workflowId: 'workflow-1',
        nodes: [context],
        edges: [],
        executionMode: 'sequential',
        parallelGroups: [],
        conditions: new Map(),
        status: 'running',
        results: new Map(),
        errors: new Map(),
      };

      mockCallOpenAI.mockResolvedValue({
        content: 'Processed: Fallback input data',
        usage: { total_tokens: 20 },
      });

      mockSubstituteVariables.mockReturnValue('Fallback input data');

      const result = await llmProcessor(context, plan);

      expect(result.input).toBe('Fallback input data');
      expect(result.output).toBe('Processed: Fallback input data');
    });
  });

  describe('Variable Substitution', () => {
    it('should apply variable substitution to prompts', async () => {
      const context: ExecutionContext = {
        nodeId: 'node-1',
        nodeType: 'llmTask',
        config: {
          prompt: 'Process {{node-0.output}} and {{node-1.data}}',
        },
        inputs: new Map(),
        outputs: new Map(),
        status: 'pending',
        retryCount: 0,
        maxRetries: 3,
      };

      const plan: ExecutionPlan = {
        id: 'plan-1',
        workflowId: 'workflow-1',
        nodes: [context],
        edges: [],
        executionMode: 'sequential',
        parallelGroups: [],
        conditions: new Map(),
        status: 'running',
        results: new Map(),
        errors: new Map(),
      };

      // Mock node label to ID mapping
      (plan as any).nodeLabelToId = new Map([
        ['node-0', 'uuid-1'],
        ['node-1', 'uuid-2'],
      ]);

      mockCallOpenAI.mockResolvedValue({
        content: 'Processed with variables',
        usage: { total_tokens: 30 },
      });

      mockSubstituteVariables.mockReturnValue('Process data1 and data2');

      await llmProcessor(context, plan);

      expect(mockSubstituteVariables).toHaveBeenCalledWith(
        'Process {{node-0.output}} and {{node-1.data}}',
        expect.any(Map),
        expect.any(Map)
      );
    });

    it('should skip substitution when prompt has no variables', async () => {
      const context: ExecutionContext = {
        nodeId: 'node-1',
        nodeType: 'llmTask',
        config: {
          prompt: 'Simple prompt without variables',
        },
        inputs: new Map(),
        outputs: new Map(),
        status: 'pending',
        retryCount: 0,
        maxRetries: 3,
      };

      const plan: ExecutionPlan = {
        id: 'plan-1',
        workflowId: 'workflow-1',
        nodes: [context],
        edges: [],
        executionMode: 'sequential',
        parallelGroups: [],
        conditions: new Map(),
        status: 'running',
        results: new Map(),
        errors: new Map(),
      };

      mockCallOpenAI.mockResolvedValue({
        content: 'Response',
        usage: { total_tokens: 10 },
      });

      mockSubstituteVariables.mockReturnValue('Simple prompt without variables');

      await llmProcessor(context, plan);

      expect(mockSubstituteVariables).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle OpenAI API errors', async () => {
      const context: ExecutionContext = {
        nodeId: 'node-1',
        nodeType: 'llmTask',
        config: {
          prompt: 'Test prompt',
        },
        inputs: new Map(),
        outputs: new Map(),
        status: 'pending',
        retryCount: 0,
        maxRetries: 3,
      };

      const plan: ExecutionPlan = {
        id: 'plan-1',
        workflowId: 'workflow-1',
        nodes: [context],
        edges: [],
        executionMode: 'sequential',
        parallelGroups: [],
        conditions: new Map(),
        status: 'running',
        results: new Map(),
        errors: new Map(),
      };

      mockCallOpenAI.mockRejectedValue(new Error('API rate limit exceeded'));
      mockSubstituteVariables.mockReturnValue('Test prompt');

      await expect(llmProcessor(context, plan)).rejects.toThrow(
        'LLM processing failed: API rate limit exceeded'
      );
    });

    it('should handle variable substitution errors', async () => {
      const context: ExecutionContext = {
        nodeId: 'node-1',
        nodeType: 'llmTask',
        config: {
          prompt: 'Process {{invalid.variable}}',
        },
        inputs: new Map(),
        outputs: new Map(),
        status: 'pending',
        retryCount: 0,
        maxRetries: 3,
      };

      const plan: ExecutionPlan = {
        id: 'plan-1',
        workflowId: 'workflow-1',
        nodes: [context],
        edges: [],
        executionMode: 'sequential',
        parallelGroups: [],
        conditions: new Map(),
        status: 'running',
        results: new Map(),
        errors: new Map(),
      };

      mockSubstituteVariables.mockImplementation(() => {
        throw new Error('Variable substitution failed');
      });

      await expect(llmProcessor(context, plan)).rejects.toThrow(
        'LLM processing failed: Variable substitution failed'
      );
    });

    it('should handle empty response from OpenAI', async () => {
      const context: ExecutionContext = {
        nodeId: 'node-1',
        nodeType: 'llmTask',
        config: {
          prompt: 'Test prompt',
        },
        inputs: new Map(),
        outputs: new Map(),
        status: 'pending',
        retryCount: 0,
        maxRetries: 3,
      };

      const plan: ExecutionPlan = {
        id: 'plan-1',
        workflowId: 'workflow-1',
        nodes: [context],
        edges: [],
        executionMode: 'sequential',
        parallelGroups: [],
        conditions: new Map(),
        status: 'running',
        results: new Map(),
        errors: new Map(),
      };

      mockCallOpenAI.mockResolvedValue({
        content: '',
        usage: { total_tokens: 0 },
      });

      mockSubstituteVariables.mockReturnValue('Test prompt');

      const result = await llmProcessor(context, plan);

      expect(result.success).toBe(true);
      expect(result.output).toBe('');
    });
  });

  describe('Configuration Options', () => {
    it('should use custom temperature and max tokens', async () => {
      const context: ExecutionContext = {
        nodeId: 'node-1',
        nodeType: 'llmTask',
        config: {
          prompt: 'Test prompt',
          model: 'gpt-4',
          temperature: 0.9,
          maxTokens: 2000,
        },
        inputs: new Map(),
        outputs: new Map(),
        status: 'pending',
        retryCount: 0,
        maxRetries: 3,
      };

      const plan: ExecutionPlan = {
        id: 'plan-1',
        workflowId: 'workflow-1',
        nodes: [context],
        edges: [],
        executionMode: 'sequential',
        parallelGroups: [],
        conditions: new Map(),
        status: 'running',
        results: new Map(),
        errors: new Map(),
      };

      mockCallOpenAI.mockResolvedValue({
        content: 'Response',
        usage: { total_tokens: 100 },
      });

      mockSubstituteVariables.mockReturnValue('Test prompt');

      await llmProcessor(context, plan);

      expect(mockCallOpenAI).toHaveBeenCalledWith(
        'Test prompt',
        {
          model: 'gpt-4',
          temperature: 0.9,
          maxTokens: 2000,
        }
      );
    });
  });
});
