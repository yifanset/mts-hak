"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TestResult } from '@/types';

interface TestResultsContextType {
  results: TestResult[];
  addResult: (result: TestResult) => void;
  clearResults: () => void;
}

// Maximum number of results to store
const MAX_RESULTS_COUNT = 50;

const TestResultsContext = createContext<TestResultsContextType | undefined>(undefined);

export function TestResultsProvider({ children }: { children: ReactNode }) {
  const [results, setResults] = useState<TestResult[]>([]);
  
  // При загрузке приложения загружаем результаты из localStorage
  useEffect(() => {
    try {
      const savedResults = localStorage.getItem('testResults');
      if (savedResults) {
        const parsedResults = JSON.parse(savedResults);
        setResults(Array.isArray(parsedResults) ? parsedResults : []);
      }
    } catch (e) {
      console.error('Failed to load saved test results', e);
    }
  }, []);
  
  // При изменении результатов сохраняем их в localStorage
  useEffect(() => {
    // Skip saving if results is empty
    if (results.length === 0) return;
    
    try {
      // Limit the number of results to prevent localStorage quota issues
      const limitedResults = results.slice(-MAX_RESULTS_COUNT);
      
      // Try to save to localStorage
      localStorage.setItem('testResults', JSON.stringify(limitedResults));
      
      // If we needed to limit results, update state
      if (limitedResults.length < results.length) {
        setResults(limitedResults);
      }
    } catch (e) {
      // Handle quota exceeded error
      console.error('Failed to save test results to localStorage', e);
      
      // If storage error occurred, try to save fewer results
      if (results.length > 1) {
        try {
          // Try saving half the results
          const reducedResults = results.slice(-Math.floor(results.length / 2));
          localStorage.setItem('testResults', JSON.stringify(reducedResults));
          setResults(reducedResults);
        } catch {
          // If still failing, just keep the most recent result
          try {
            const singleResult = [results[results.length - 1]];
            localStorage.setItem('testResults', JSON.stringify(singleResult));
            setResults(singleResult);
          } catch {
            // If all saving attempts fail, just keep the results in memory
            console.error('Unable to save any test results to localStorage');
          }
        }
      }
    }
  }, [results]);
  
  // Добавление результата теста
  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, { ...result, timestamp: Date.now() }]);
  };
  
  // Очистка всех результатов
  const clearResults = () => {
    setResults([]);
    try {
      localStorage.removeItem('testResults');
    } catch (e) {
      console.error('Failed to clear test results from localStorage', e);
    }
  };
  
  return (
    <TestResultsContext.Provider value={{ results, addResult, clearResults }}>
      {children}
    </TestResultsContext.Provider>
  );
}

// Хук для использования контекста результатов
export function useTestResults() {
  const context = useContext(TestResultsContext);
  if (context === undefined) {
    throw new Error('useTestResults must be used within a TestResultsProvider');
  }
  return context;
} 