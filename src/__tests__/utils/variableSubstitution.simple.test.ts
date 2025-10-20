import { substituteVariables, NodeOutput } from '../../utils/variableSubstitution';

describe('Variable Substitution - Simple Tests', () => {
  it('should substitute basic variables', () => {
    const template = 'Hello {{node1.output}}';
    const nodeOutputs = new Map<string, NodeOutput>([
      ['node1', { nodeId: 'node1', output: 'World', data: 'World' }],
    ]);

    const result = substituteVariables(template, nodeOutputs);

    expect(result).toBe('Hello World');
  });

  it('should handle missing nodes gracefully', () => {
    const template = 'Hello {{missingNode.output}}';
    const nodeOutputs = new Map<string, NodeOutput>();

    const result = substituteVariables(template, nodeOutputs);

    expect(result).toBe('Hello {{missingNode.output}}');
  });

  it('should handle empty template', () => {
    const template = '';
    const nodeOutputs = new Map<string, NodeOutput>();

    const result = substituteVariables(template, nodeOutputs);

    expect(result).toBe('');
  });

  it('should handle null template', () => {
    const template = null as any;
    const nodeOutputs = new Map<string, NodeOutput>();

    const result = substituteVariables(template, nodeOutputs);

    expect(result).toBe(null);
  });
});
