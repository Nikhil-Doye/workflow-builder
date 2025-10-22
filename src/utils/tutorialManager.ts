/**
 * Tutorial Manager - Handles interactive tutorial state and progress
 */

export interface TutorialState {
  isActive: boolean;
  currentStep: number;
  completedSteps: string[];
  skippedSteps: string[];
  startTime: number;
  endTime?: number;
  userActions: TutorialAction[];
}

export interface TutorialAction {
  stepId: string;
  action: string;
  timestamp: number;
  success: boolean;
  data?: any;
}

export interface TutorialProgress {
  stepsCompleted: number;
  totalSteps: number;
  completionRate: number;
  timeSpent: number;
  userEngagement: number;
}

class TutorialManager {
  private static instance: TutorialManager;
  private state: TutorialState;
  private listeners: ((state: TutorialState) => void)[] = [];

  private constructor() {
    this.state = {
      isActive: false,
      currentStep: 0,
      completedSteps: [],
      skippedSteps: [],
      startTime: 0,
      userActions: [],
    };
  }

  static getInstance(): TutorialManager {
    if (!TutorialManager.instance) {
      TutorialManager.instance = new TutorialManager();
    }
    return TutorialManager.instance;
  }

  /**
   * Start a new tutorial session
   */
  startTutorial(): void {
    this.state = {
      isActive: true,
      currentStep: 0,
      completedSteps: [],
      skippedSteps: [],
      startTime: Date.now(),
      userActions: [],
    };
    this.notifyListeners();
  }

  /**
   * Complete the current tutorial
   */
  completeTutorial(): void {
    this.state.isActive = false;
    this.state.endTime = Date.now();
    this.saveTutorialData();
    this.notifyListeners();
  }

  /**
   * Skip the current step
   */
  skipStep(stepId: string): void {
    if (!this.state.skippedSteps.includes(stepId)) {
      this.state.skippedSteps.push(stepId);
    }
    this.nextStep();
  }

  /**
   * Mark a step as completed
   */
  completeStep(stepId: string, action?: string, data?: any): void {
    if (!this.state.completedSteps.includes(stepId)) {
      this.state.completedSteps.push(stepId);
    }

    this.recordAction(stepId, action || "complete", true, data);
    this.nextStep();
  }

  /**
   * Move to the next step
   */
  nextStep(): void {
    this.state.currentStep += 1;
    this.notifyListeners();
  }

  /**
   * Move to the previous step
   */
  previousStep(): void {
    if (this.state.currentStep > 0) {
      this.state.currentStep -= 1;
      this.notifyListeners();
    }
  }

  /**
   * Record a user action
   */
  recordAction(
    stepId: string,
    action: string,
    success: boolean,
    data?: any
  ): void {
    this.state.userActions.push({
      stepId,
      action,
      timestamp: Date.now(),
      success,
      data,
    });
  }

  /**
   * Check if a step is completed
   */
  isStepCompleted(stepId: string): boolean {
    return this.state.completedSteps.includes(stepId);
  }

  /**
   * Check if a step was skipped
   */
  isStepSkipped(stepId: string): boolean {
    return this.state.skippedSteps.includes(stepId);
  }

  /**
   * Get current tutorial state
   */
  getState(): TutorialState {
    return { ...this.state };
  }

  /**
   * Get tutorial progress
   */
  getProgress(): TutorialProgress {
    const totalSteps = 8; // Total number of tutorial steps
    const stepsCompleted = this.state.completedSteps.length;
    const timeSpent = this.state.endTime
      ? this.state.endTime - this.state.startTime
      : Date.now() - this.state.startTime;

    // Calculate user engagement based on actions taken
    const totalActions = this.state.userActions.length;
    const successfulActions = this.state.userActions.filter(
      (a) => a.success
    ).length;
    const userEngagement =
      totalActions > 0 ? (successfulActions / totalActions) * 100 : 0;

    return {
      stepsCompleted,
      totalSteps,
      completionRate: (stepsCompleted / totalSteps) * 100,
      timeSpent,
      userEngagement,
    };
  }

  /**
   * Subscribe to tutorial state changes
   */
  subscribe(listener: (state: TutorialState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.state));
  }

  /**
   * Save tutorial data to localStorage
   */
  private saveTutorialData(): void {
    const tutorialData = {
      ...this.state,
      completedAt: new Date().toISOString(),
      progress: this.getProgress(),
    };

    localStorage.setItem("tutorialData", JSON.stringify(tutorialData));
  }

  /**
   * Load tutorial data from localStorage
   */
  loadTutorialData(): any {
    const data = localStorage.getItem("tutorialData");
    return data ? JSON.parse(data) : null;
  }

  /**
   * Reset tutorial data
   */
  resetTutorial(): void {
    localStorage.removeItem("tutorialData");
    this.state = {
      isActive: false,
      currentStep: 0,
      completedSteps: [],
      skippedSteps: [],
      startTime: 0,
      userActions: [],
    };
    this.notifyListeners();
  }

  /**
   * Check if user has completed tutorial before
   */
  hasCompletedTutorial(): boolean {
    const data = this.loadTutorialData();
    return data && data.progress && data.progress.completionRate >= 80;
  }

  /**
   * Get tutorial recommendations based on user behavior
   */
  getRecommendations(): string[] {
    const progress = this.getProgress();
    const recommendations: string[] = [];

    if (progress.completionRate < 50) {
      recommendations.push("Try the interactive tutorial to learn the basics");
    } else if (progress.completionRate < 80) {
      recommendations.push("Complete the tutorial to unlock advanced features");
    } else if (progress.userEngagement < 70) {
      recommendations.push("Explore different node types and configurations");
    } else {
      recommendations.push("You're ready to create complex workflows!");
    }

    return recommendations;
  }
}

export const tutorialManager = TutorialManager.getInstance();
