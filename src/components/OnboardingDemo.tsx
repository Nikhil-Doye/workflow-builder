import React, { useState, useEffect } from "react";
import { OnboardingManager } from "../utils/onboardingManager";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  Eye,
  EyeOff,
  Settings,
  HelpCircle,
  AlertCircle,
} from "lucide-react";

export const OnboardingDemo: React.FC = () => {
  const [status, setStatus] = useState(OnboardingManager.getStatus());
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Update status when component mounts
    setStatus(OnboardingManager.getStatus());
  }, []);

  const handleReset = () => {
    OnboardingManager.resetOnboarding();
    setStatus(OnboardingManager.getStatus());
  };

  const handleToggleStartup = () => {
    if (status.showOnStartup) {
      OnboardingManager.disableOnboardingOnStartup();
    } else {
      OnboardingManager.enableOnboardingOnStartup();
    }
    setStatus(OnboardingManager.getStatus());
  };

  const handleOptOut = () => {
    OnboardingManager.optOutOfOnboarding();
    setStatus(OnboardingManager.getStatus());
  };

  const handleMarkCompleted = () => {
    OnboardingManager.markOnboardingCompleted([1, 2, 3, 4, 5, 6]);
    setStatus(OnboardingManager.getStatus());
  };

  const handleShowOnboarding = () => {
    setShowOnboarding(true);
  };

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
    setStatus(OnboardingManager.getStatus());
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Onboarding System Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Overview */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Current Status</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Has seen onboarding:
                  </span>
                  <Badge
                    variant={status.hasSeenOnboarding ? "success" : "secondary"}
                  >
                    {status.hasSeenOnboarding ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Has opted out:</span>
                  <Badge
                    variant={status.hasOptedOut ? "destructive" : "secondary"}
                  >
                    {status.hasOptedOut ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Show on startup:
                  </span>
                  <Badge
                    variant={status.showOnStartup ? "success" : "secondary"}
                  >
                    {status.showOnStartup ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    New version available:
                  </span>
                  <Badge
                    variant={
                      status.isNewVersionAvailable ? "destructive" : "secondary"
                    }
                  >
                    {status.isNewVersionAvailable ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Progress:</span>
                  <Badge variant="info">{status.progressPercentage}%</Badge>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Actions</h3>
              <div className="space-y-2">
                <Button
                  onClick={handleShowOnboarding}
                  className="w-full flex items-center gap-2"
                  variant="default"
                >
                  <HelpCircle className="w-4 h-4" />
                  Show Tutorial
                </Button>

                <Button
                  onClick={handleToggleStartup}
                  className="w-full flex items-center gap-2"
                  variant="outline"
                >
                  {status.showOnStartup ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      Disable Startup
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      Enable Startup
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleMarkCompleted}
                  className="w-full flex items-center gap-2"
                  variant="outline"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Completed
                </Button>

                <Button
                  onClick={handleOptOut}
                  className="w-full flex items-center gap-2"
                  variant="outline"
                >
                  <XCircle className="w-4 h-4" />
                  Opt Out
                </Button>

                <Button
                  onClick={handleReset}
                  className="w-full flex items-center gap-2"
                  variant="destructive"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset All
                </Button>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Tutorial Progress
              </span>
              <span className="text-sm text-gray-500">
                {status.progressPercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${status.progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Enhanced Features
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Persistent opt-out status with localStorage</li>
              <li>• Progress tracking across sessions</li>
              <li>• Version detection for new tutorial content</li>
              <li>• Settings panel with startup preferences</li>
              <li>• Easy re-access from navigation</li>
              <li>• Step-by-step completion tracking</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Onboarding Modal would be rendered here in a real app */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <CardHeader>
              <CardTitle>Onboarding Modal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                This would show the actual OnboardingModal component with all
                its enhanced features.
              </p>
              <Button onClick={handleOnboardingClose} className="w-full">
                Close Demo
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
