import { OnboardingManager } from "../../utils/onboardingManager";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("OnboardingManager", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe("getPreferences", () => {
    it("should return default preferences when no stored data", () => {
      const prefs = OnboardingManager.getPreferences();

      expect(prefs).toEqual({
        hasSeenOnboarding: false,
        hasOptedOut: false,
        lastShownVersion: "0.0.0",
        showOnboardingOnStartup: true,
        completedSteps: [],
      });
    });

    it("should return stored preferences when available", () => {
      const storedPrefs = {
        hasSeenOnboarding: true,
        hasOptedOut: false,
        lastShownVersion: "1.0.0",
        showOnboardingOnStartup: false,
        completedSteps: [1, 2, 3],
      };

      localStorageMock.setItem(
        "onboardingPreferences",
        JSON.stringify(storedPrefs)
      );

      const prefs = OnboardingManager.getPreferences();
      expect(prefs).toEqual(storedPrefs);
    });

    it("should handle corrupted localStorage data gracefully", () => {
      localStorageMock.setItem("onboardingPreferences", "invalid json");

      const prefs = OnboardingManager.getPreferences();
      expect(prefs).toEqual({
        hasSeenOnboarding: false,
        hasOptedOut: false,
        lastShownVersion: "0.0.0",
        showOnboardingOnStartup: true,
        completedSteps: [],
      });
    });
  });

  describe("savePreferences", () => {
    it("should save preferences to localStorage", () => {
      const prefs = {
        hasSeenOnboarding: true,
        hasOptedOut: false,
        lastShownVersion: "1.0.0",
        showOnboardingOnStartup: true,
        completedSteps: [1, 2],
      };

      OnboardingManager.savePreferences(prefs);

      const stored = JSON.parse(
        localStorageMock.getItem("onboardingPreferences") || "{}"
      );
      expect(stored).toEqual(prefs);
    });

    it("should merge with existing preferences", () => {
      // Set initial preferences
      const initialPrefs = {
        hasSeenOnboarding: false,
        hasOptedOut: false,
        lastShownVersion: "0.0.0",
        showOnboardingOnStartup: true,
        completedSteps: [],
      };
      localStorageMock.setItem(
        "onboardingPreferences",
        JSON.stringify(initialPrefs)
      );

      // Update only some fields
      OnboardingManager.savePreferences({
        hasSeenOnboarding: true,
        completedSteps: [1, 2],
      });

      const stored = JSON.parse(
        localStorageMock.getItem("onboardingPreferences") || "{}"
      );
      expect(stored).toEqual({
        hasSeenOnboarding: true,
        hasOptedOut: false,
        lastShownVersion: "0.0.0",
        showOnboardingOnStartup: true,
        completedSteps: [1, 2],
      });
    });
  });

  describe("shouldShowOnboarding", () => {
    it("should show onboarding for first-time users with no workflows", () => {
      const shouldShow = OnboardingManager.shouldShowOnboarding(0);
      expect(shouldShow).toBe(true);
    });

    it("should not show onboarding if user has opted out", () => {
      OnboardingManager.optOutOfOnboarding();
      const shouldShow = OnboardingManager.shouldShowOnboarding(0);
      expect(shouldShow).toBe(false);
    });

    it("should not show onboarding if user has workflows", () => {
      const shouldShow = OnboardingManager.shouldShowOnboarding(1);
      expect(shouldShow).toBe(false);
    });

    it("should show onboarding if user wants to see it on startup", () => {
      OnboardingManager.enableOnboardingOnStartup();
      const shouldShow = OnboardingManager.shouldShowOnboarding(0);
      expect(shouldShow).toBe(true);
    });

    it("should not show onboarding if user disabled startup option", () => {
      OnboardingManager.markOnboardingCompleted();
      OnboardingManager.disableOnboardingOnStartup();
      const shouldShow = OnboardingManager.shouldShowOnboarding(0);
      expect(shouldShow).toBe(false);
    });
  });

  describe("markOnboardingCompleted", () => {
    it("should mark onboarding as completed", () => {
      OnboardingManager.markOnboardingCompleted([1, 2, 3]);

      const prefs = OnboardingManager.getPreferences();
      expect(prefs.hasSeenOnboarding).toBe(true);
      expect(prefs.hasOptedOut).toBe(false);
      expect(prefs.lastShownVersion).toBe("1.0.0");
      expect(prefs.completedSteps).toEqual([1, 2, 3]);
    });
  });

  describe("optOutOfOnboarding", () => {
    it("should opt out of onboarding", () => {
      OnboardingManager.optOutOfOnboarding();

      const prefs = OnboardingManager.getPreferences();
      expect(prefs.hasOptedOut).toBe(true);
      expect(prefs.hasSeenOnboarding).toBe(true);
    });
  });

  describe("resetOnboarding", () => {
    it("should reset all onboarding preferences", () => {
      // Set some preferences first
      OnboardingManager.markOnboardingCompleted([1, 2, 3]);
      OnboardingManager.disableOnboardingOnStartup();

      // Reset
      OnboardingManager.resetOnboarding();

      const prefs = OnboardingManager.getPreferences();
      expect(prefs).toEqual({
        hasSeenOnboarding: false,
        hasOptedOut: false,
        lastShownVersion: "0.0.0",
        showOnboardingOnStartup: true,
        completedSteps: [],
      });
    });
  });

  describe("enableOnboardingOnStartup", () => {
    it("should enable onboarding on startup", () => {
      OnboardingManager.disableOnboardingOnStartup();
      OnboardingManager.enableOnboardingOnStartup();

      const prefs = OnboardingManager.getPreferences();
      expect(prefs.showOnboardingOnStartup).toBe(true);
      expect(prefs.hasOptedOut).toBe(false);
    });
  });

  describe("disableOnboardingOnStartup", () => {
    it("should disable onboarding on startup", () => {
      OnboardingManager.disableOnboardingOnStartup();

      const prefs = OnboardingManager.getPreferences();
      expect(prefs.showOnboardingOnStartup).toBe(false);
    });
  });

  describe("isNewVersionAvailable", () => {
    it("should detect new version when last shown version is different", () => {
      OnboardingManager.savePreferences({ lastShownVersion: "0.9.0" });

      const isNew = OnboardingManager.isNewVersionAvailable();
      expect(isNew).toBe(true);
    });

    it("should not detect new version when versions match", () => {
      OnboardingManager.savePreferences({ lastShownVersion: "1.0.0" });

      const isNew = OnboardingManager.isNewVersionAvailable();
      expect(isNew).toBe(false);
    });
  });

  describe("getProgressPercentage", () => {
    it("should calculate progress percentage correctly", () => {
      OnboardingManager.savePreferences({ completedSteps: [1, 2, 3] });

      const progress = OnboardingManager.getProgressPercentage();
      expect(progress).toBe(50); // 3 out of 6 steps = 50%
    });

    it("should return 0 when no steps completed", () => {
      OnboardingManager.savePreferences({ completedSteps: [] });

      const progress = OnboardingManager.getProgressPercentage();
      expect(progress).toBe(0);
    });

    it("should return 100 when all steps completed", () => {
      OnboardingManager.savePreferences({ completedSteps: [1, 2, 3, 4, 5, 6] });

      const progress = OnboardingManager.getProgressPercentage();
      expect(progress).toBe(100);
    });
  });

  describe("hasCompletedStep", () => {
    it("should return true for completed steps", () => {
      OnboardingManager.savePreferences({ completedSteps: [1, 3, 5] });

      expect(OnboardingManager.hasCompletedStep(1)).toBe(true);
      expect(OnboardingManager.hasCompletedStep(3)).toBe(true);
      expect(OnboardingManager.hasCompletedStep(5)).toBe(true);
    });

    it("should return false for incomplete steps", () => {
      OnboardingManager.savePreferences({ completedSteps: [1, 3, 5] });

      expect(OnboardingManager.hasCompletedStep(2)).toBe(false);
      expect(OnboardingManager.hasCompletedStep(4)).toBe(false);
      expect(OnboardingManager.hasCompletedStep(6)).toBe(false);
    });
  });

  describe("markStepCompleted", () => {
    it("should mark a step as completed", () => {
      OnboardingManager.savePreferences({ completedSteps: [1, 2] });
      OnboardingManager.markStepCompleted(3);

      const prefs = OnboardingManager.getPreferences();
      expect(prefs.completedSteps).toEqual([1, 2, 3]);
    });

    it("should not duplicate completed steps", () => {
      OnboardingManager.savePreferences({ completedSteps: [1, 2, 3] });
      OnboardingManager.markStepCompleted(2);

      const prefs = OnboardingManager.getPreferences();
      expect(prefs.completedSteps).toEqual([1, 2, 3]);
    });
  });

  describe("getStatus", () => {
    it("should return comprehensive status information", () => {
      OnboardingManager.savePreferences({
        hasSeenOnboarding: true,
        hasOptedOut: false,
        lastShownVersion: "0.9.0",
        showOnboardingOnStartup: true,
        completedSteps: [1, 2, 3],
      });

      const status = OnboardingManager.getStatus();

      expect(status).toEqual({
        hasSeenOnboarding: true,
        hasOptedOut: false,
        isNewVersionAvailable: true,
        progressPercentage: 50,
        showOnStartup: true,
      });
    });
  });
});
