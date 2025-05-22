"use client";

import TestPageLayout from "@/components/layout/TestPageLayout";
import ReactionTimeTest from "@/components/tests/ReactionTimeTest";
import { useTestResults } from "@/context/TestResultsContext";
import { ReactionTimeResult, TestComponentProps } from "@/types";
import { getTestConfigById } from "@/app/tests/testConfig";

const TEST_ID = "reaction-time";

export default function ReactionTimePage() {
  const { addResult } = useTestResults();

  // Fetch test configuration
  const testConfig = getTestConfigById(TEST_ID);

  if (!testConfig) {
    // This should ideally be a more user-friendly error page or a redirect
    // For development, an error is clear.
    // In a production app, consider using notFound() from next/navigation if applicable
    // or rendering a dedicated error component.
    return (
      <div>
        <h1>Error: Test Configuration Not Found</h1>
        <p>Could not find configuration for test ID: {TEST_ID}</p>
      </div>
    );
  }

  // Destructure after the check
  const { name: TEST_NAME, instructions, instructionTitle } = testConfig;

  // Define the type for the test results
  type ReactionTimeTestResults = {
    reactionTime: number;
    attempts: number[];
  };

  const handleTestComplete: TestComponentProps<ReactionTimeTestResults>['onComplete'] = (results) => {
    const testResultData: ReactionTimeResult = {
      testId: TEST_ID,
      testName: TEST_NAME, // TEST_NAME is now guaranteed to be defined
      timestamp: Date.now(),
      reactionTimes: results.attempts,
      averageTime: results.reactionTime,
      averageReactionTime: results.reactionTime, // For compatibility with the results page
      attempts: results.attempts, // For compatibility with the results page
    };
    addResult(testResultData);
    console.log("Reaction Time Test completed with results:", testResultData);
    // router.push("/results"); // Uncomment if you want to redirect
  };

  return (
    <TestPageLayout
      title={TEST_NAME} // Guaranteed to be defined
      instructions={instructions} // Guaranteed to be defined
      instructionTitle={instructionTitle} // Pass instructionTitle (it can be undefined, TestPageLayout handles it)
    >
      <ReactionTimeTest onComplete={handleTestComplete} />
    </TestPageLayout>
  );
} 