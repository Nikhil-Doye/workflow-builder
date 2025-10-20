import {
  ParsedIntent,
  MixedIntentAnalysis,
  WorkflowStructure,
  ValidationResult,
} from "../types";
import { naturalLanguageToWorkflowService } from "./naturalLanguageToWorkflowService";

export class CopilotService {
  /**
   * Parse natural language input and generate workflow structure
   */
  async parseNaturalLanguage(userInput: string): Promise<ParsedIntent> {
    // Delegate to centralized service
    return naturalLanguageToWorkflowService.parseNaturalLanguage(userInput);
  }

  /**
   * Analyze mixed intent workflows
   */
  async analyzeMixedIntent(userInput: string): Promise<MixedIntentAnalysis> {
    return naturalLanguageToWorkflowService.analyzeMixedIntent(userInput);
  }

  /**
   * Generate workflow from mixed intent analysis
   */
  async generateMixedWorkflow(
    mixedAnalysis: MixedIntentAnalysis,
    userInput: string
  ): Promise<WorkflowStructure> {
    return naturalLanguageToWorkflowService.generateMixedWorkflow(
      mixedAnalysis,
      userInput
    );
  }

  /**
   * Validate generated workflow
   */
  validateWorkflow(
    workflow: WorkflowStructure,
    originalInput: string
  ): ValidationResult {
    return naturalLanguageToWorkflowService.validateWorkflow(
      workflow,
      originalInput
    );
  }

  /**
   * Validate mixed workflow
   */
  validateMixedWorkflow(
    workflow: WorkflowStructure,
    originalInput: string
  ): ValidationResult {
    return naturalLanguageToWorkflowService.validateMixedWorkflow(
      workflow,
      originalInput
    );
  }

  /**
   * Get improvement suggestions
   */
  getImprovementSuggestions(workflow: WorkflowStructure): string[] {
    return naturalLanguageToWorkflowService.getImprovementSuggestions(workflow);
  }

  /**
   * Generate contextual suggestions based on current workflow
   */
  async generateContextualSuggestions(
    currentWorkflow: WorkflowStructure | null,
    userInput: string
  ): Promise<string[]> {
    return naturalLanguageToWorkflowService.generateContextualSuggestions(
      currentWorkflow,
      userInput
    );
  }

  /**
   * Learn from user modifications
   */
  learnFromModifications(
    originalWorkflow: WorkflowStructure,
    modifiedWorkflow: WorkflowStructure,
    userFeedback?: string
  ): void {
    return naturalLanguageToWorkflowService.learnFromModifications(
      originalWorkflow,
      modifiedWorkflow,
      userFeedback
    );
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    return naturalLanguageToWorkflowService.clearCache();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return naturalLanguageToWorkflowService.getCacheStats();
  }
}

// Export singleton instance
export const copilotService = new CopilotService();
