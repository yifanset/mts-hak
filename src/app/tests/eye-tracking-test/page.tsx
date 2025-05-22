"use client";

import { useRouter } from "next/navigation";
import TestPageLayout from "@/components/layout/TestPageLayout";
import EyeTrackingTest from "@/components/tests/EyeTrackingTest";
import { useTestResults } from "@/context/TestResultsContext";
import { EyeTrackingTestResult, TestComponentProps } from "@/types";
import { getTestConfigById } from "@/app/tests/testConfig";
import React, { useState } from 'react';

const TEST_ID = "eye-tracking-test";

export default function EyeTrackingTestPage() {
  const router = useRouter();
  const { addResult } = useTestResults();
  const [showResultsScreen, setShowResultsScreen] = useState(false);
  const [testOutcome, setTestOutcome] = useState<{
    hits: number;
    avgTime: number | null;
    recommendation: string;
    fallbackModeUsed?: boolean;
  } | null>(null);

  const testConfig = getTestConfigById(TEST_ID);

  if (!testConfig) {
    return (
      <div>
        <h1>Error: Test Configuration Not Found</h1>
        <p>Could not find configuration for test ID: {TEST_ID}</p>
      </div>
    );
  }

  const { name: TEST_NAME, instructions, instructionTitle } = testConfig;

  // Define the type for the test results
  type EyeTrackingTestResults = {
    totalAttempts: number;
    preciseHits: number;
    reactionTimes: number[];
    averageReactionTime: number | null;
    fallbackModeUsed: boolean;
  };
  
  const handleTestComplete: TestComponentProps<EyeTrackingTestResults>['onComplete'] = (results) => {
    const testResultData: EyeTrackingTestResult = {
      testId: TEST_ID,
      testName: TEST_NAME,
      timestamp: Date.now(),
      ...results,
    };
    addResult(testResultData);
    console.log("Eye Tracking Test completed with results:", testResultData);

    // Determine recommendation based on criteria
    const canRide = results.preciseHits >= 2 && 
                    (results.averageReactionTime !== null && results.averageReactionTime < 600);
    
    setTestOutcome({
        hits: results.preciseHits,
        avgTime: results.averageReactionTime,
        recommendation: canRide ? "✅ Можно ехать" : "⚠️ Лучше выбрать другой транспорт",
        fallbackModeUsed: results.fallbackModeUsed
    });
    setShowResultsScreen(true);
  };

  if (showResultsScreen && testOutcome) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '20px',
        background: 'linear-gradient(to bottom right, #ffffff, #e6e6fa, #d8bfd8, #6a0dad)', // Similar gradient
      }}>
        <h1 style={{ fontSize: '2.5rem', color: '#6a0dad', marginBottom: '30px' }}>
          Тест завершён
        </h1>
        
        {testOutcome.fallbackModeUsed && (
          <div style={{ 
            backgroundColor: '#FEFED5', 
            padding: '10px 15px', 
            borderRadius: '5px', 
            marginBottom: '20px',
            maxWidth: '500px',
            fontSize: '0.9rem'
          }}>
            <p>Примечание: Тест был пройден в режиме использования мыши вместо отслеживания взгляда.</p>
          </div>
        )}
        
        <div style={{ fontSize: '1.2rem', color: '#333', marginBottom: '15px' }}>
          Точных попаданий: {testOutcome.hits} из 3
        </div>
        <div style={{ fontSize: '1.2rem', color: '#333', marginBottom: '30px' }}>
          Среднее время реакции: {testOutcome.avgTime ? `${testOutcome.avgTime.toFixed(0)} мс` : 'N/A'}
        </div>
        <p style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: testOutcome.recommendation.startsWith('✅') ? 'green' : 'orange',
          marginBottom: '40px',
        }}>
          {testOutcome.recommendation}
        </p>
        <button
          onClick={() => router.push('/')} // Navigate to home or test selection
          style={{
            padding: '15px 30px',
            fontSize: '1.1rem',
            color: 'white',
            backgroundColor: '#6a0dad',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease',
          }}
           onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#5e0b9a'}
           onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6a0dad'}
        >
          Вернуться на главную
        </button>
      </div>
    );
  }

  return (
    <TestPageLayout
      title={TEST_NAME}
      instructions={instructions}
      instructionTitle={instructionTitle}
    >
      <EyeTrackingTest onComplete={handleTestComplete} />
    </TestPageLayout>
  );
} 