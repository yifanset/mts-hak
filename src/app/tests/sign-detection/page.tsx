"use client";

import TestPageLayout from "@/components/layout/TestPageLayout";
import { getTestConfigById } from "@/app/tests/testConfig";
import { useTestResults } from "@/context/TestResultsContext";
import { TestResult } from "@/types";
import SignDetectionTest from "@/components/tests/SignDetectionTest";

const TEST_ID = "sign-detection";

export default function SignDetectionPage() {
  const { addResult } = useTestResults();
  const testConfig = getTestConfigById(TEST_ID);

  const handleTestComplete = (result: {
    reactionTime: number;
    isCorrect: boolean;
  }) => {
    if (!testConfig) return;
    
    const testResult: TestResult = {
      testId: TEST_ID,
      testName: testConfig.name,
      timestamp: Date.now(),
      reactionTimes: [result.reactionTime],
      averageReactionTime: result.reactionTime,
      passed: result.isCorrect,
    };
    addResult(testResult);
  };

  if (!testConfig) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-[#7e21cd] mb-4">Ошибка: Конфигурация теста не найдена</h1>
        <p className="text-gray-700">Не удалось найти конфигурацию для теста с ID: {TEST_ID}</p>
      </div>
    );
  }

  return (
    <TestPageLayout
      title={testConfig.name}
      instructions={testConfig.instructions}
      instructionTitle={testConfig.instructionTitle}
    >
      <SignDetectionTest onComplete={handleTestComplete} />
    </TestPageLayout>
  );
}