export interface OnboardingPreferences {
  hasSeenOnboarding: boolean;
  hasOptedOut: boolean;
  lastShownVersion: string;
  showOnboardingOnStartup: boolean;
  completedSteps: number[];
}

const ONBOARDING_VERSION = "1.0.0";
const STORAGE_KEY = "onboardingPreferences";

export class OnboardingManager {
  /**
   * Get current onboarding preferences from localStorage
   */
  static getPreferences(): OnboardingPreferences {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          hasSeenOnboarding: parsed.hasSeenOnboarding || false,
          hasOptedOut: parsed.hasOptedOut || false,
          lastShownVersion: parsed.lastShownVersion || "0.0.0",
          showOnboardingOnStartup: parsed.showOnboardingOnStartup !== false, // Default to true
          completedSteps: parsed.completedSteps || [],
        };
      }
    } catch (error) {
      console.warn("Failed to parse onboarding preferences:", error);
    }

    // Return default preferences
    return {
      hasSeenOnboarding: false,
      hasOptedOut: false,
      lastShownVersion: "0.0.0",
      showOnboardingOnStartup: true,
      completedSteps: [],
    };
  }

  /**
   * Save onboarding preferences to localStorage
   */
  static savePreferences(preferences: Partial<OnboardingPreferences>): void {
    try {
      const current = this.getPreferences();
      const updated = { ...current, ...preferences };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.warn("Failed to save onboarding preferences:", error);
    }
  }

  /**
   * Check if onboarding should be shown
   */
  static shouldShowOnboarding(workflowCount: number = 0): boolean {
    const prefs = this.getPreferences();

    // Don't show if user has opted out
    if (prefs.hasOptedOut) {
      return false;
    }

    // Show if user hasn't seen onboarding and has no workflows
    if (!prefs.hasSeenOnboarding && workflowCount === 0) {
      return true;
    }

    // Show if user wants to see onboarding on startup
    if (prefs.showOnboardingOnStartup && workflowCount === 0) {
      return true;
    }

    // Show if there's a new version of onboarding
    if (this.isNewVersionAvailable()) {
      return true;
    }

    return false;
  }

  /**
   * Mark onboarding as completed
   */
  static markOnboardingCompleted(completedSteps: number[] = []): void {
    this.savePreferences({
      hasSeenOnboarding: true,
      hasOptedOut: false,
      lastShownVersion: ONBOARDING_VERSION,
      completedSteps,
    });
  }

  /**
   * Opt out of onboarding
   */
  static optOutOfOnboarding(): void {
    this.savePreferences({
      hasOptedOut: true,
      hasSeenOnboarding: true,
    });
  }

  /**
   * Reset onboarding preferences (for testing or user request)
   */
  static resetOnboarding(): void {
    this.savePreferences({
      hasSeenOnboarding: false,
      hasOptedOut: false,
      lastShownVersion: "0.0.0",
      showOnboardingOnStartup: true,
      completedSteps: [],
    });
  }

  /**
   * Enable onboarding on startup
   */
  static enableOnboardingOnStartup(): void {
    this.savePreferences({
      showOnboardingOnStartup: true,
      hasOptedOut: false,
    });
  }

  /**
   * Disable onboarding on startup
   */
  static disableOnboardingOnStartup(): void {
    this.savePreferences({
      showOnboardingOnStartup: false,
    });
  }

  /**
   * Check if a new version of onboarding is available
   */
  static isNewVersionAvailable(): boolean {
    const prefs = this.getPreferences();
    return prefs.lastShownVersion !== ONBOARDING_VERSION;
  }

  /**
   * Get onboarding progress percentage
   */
  static getProgressPercentage(): number {
    const prefs = this.getPreferences();
    const totalSteps = 6; // Assuming 6 steps in onboarding
    return Math.round((prefs.completedSteps.length / totalSteps) * 100);
  }

  /**
   * Check if user has completed a specific step
   */
  static hasCompletedStep(stepId: number): boolean {
    const prefs = this.getPreferences();
    return prefs.completedSteps.includes(stepId);
  }

  /**
   * Mark a specific step as completed
   */
  static markStepCompleted(stepId: number): void {
    const prefs = this.getPreferences();
    if (!prefs.completedSteps.includes(stepId)) {
      this.savePreferences({
        completedSteps: [...prefs.completedSteps, stepId],
      });
    }
  }

  /**
   * Get onboarding status for display
   */
  static getStatus(): {
    hasSeenOnboarding: boolean;
    hasOptedOut: boolean;
    isNewVersionAvailable: boolean;
    progressPercentage: number;
    showOnStartup: boolean;
  } {
    const prefs = this.getPreferences();
    return {
      hasSeenOnboarding: prefs.hasSeenOnboarding,
      hasOptedOut: prefs.hasOptedOut,
      isNewVersionAvailable: this.isNewVersionAvailable(),
      progressPercentage: this.getProgressPercentage(),
      showOnStartup: prefs.showOnboardingOnStartup,
    };
  }
}
