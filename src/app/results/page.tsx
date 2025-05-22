"use client";

import Link from "next/link";
import { useTestResults } from "@/context/TestResultsContext";
import { ReactionTimeResult, ScooterReadinessResult } from "@/types";

export default function ResultsPage() {
  const { results, clearResults } = useTestResults();
  
  // Форматирование даты для отображения
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("ru");
  };
  
  // Рендер результатов теста реакции
  const renderReactionTimeResult = (result: ReactionTimeResult) => {
    return (
      <div className="mb-4 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold">{result.testName}</h3>
        <p className="text-sm text-gray-500">
          Пройден: {formatDate(result.timestamp)}
        </p>
        <div className="mt-2">
          <p>Среднее время реакции: <span className="font-semibold">{result.averageReactionTime} мс</span></p>
          
          <div className="mt-2">
            <p className="text-sm font-medium">Все попытки:</p>
            <ul className="text-sm">
              {result.attempts.map((time, idx) => (
                <li key={idx}>
                  Попытка {idx + 1}: {time} мс
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };
  
  // Рендер результатов теста готовности к поездке на самокате
  const renderScooterReadinessResult = (result: ScooterReadinessResult) => {
    // Определение цвета для рекомендации
    const getRecommendationColor = () => {
      if (result.recommendation.includes("Лучше выбрать другой транспорт")) {
        return "text-red-600";
      } else if (result.recommendation.includes("с осторожностью")) {
        return "text-orange-500";
      } else {
        return "text-green-600";
      }
    };
    
    return (
      <div className="mb-4 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold">{result.testName}</h3>
        <p className="text-sm text-gray-500">
          Пройден: {formatDate(result.timestamp)}
        </p>
        
        <div className="mt-3 p-3 bg-gray-50 rounded-md">
          <p className={`text-lg font-bold ${getRecommendationColor()}`}>
            {result.recommendation}
          </p>
          
          {result.suggestedSpeed && (
            <p className="mt-1">
              Рекомендуемая скорость: <span className="font-semibold">{result.suggestedSpeed} км/ч</span>
            </p>
          )}
          
          {result.safetyTip && (
            <p className="mt-1 text-sm italic">
              {result.safetyTip}
            </p>
          )}
        </div>
        
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="p-2 border rounded text-center">
            <p className="text-xs text-gray-500">Реакция</p>
            <p className="text-sm font-semibold">{result.averageReactionTime} мс</p>
          </div>
          <div className="p-2 border rounded text-center">
            <p className="text-xs text-gray-500">Точность</p>
            <p className="text-sm font-semibold">{result.accuracy.toFixed(1)}%</p>
          </div>
          <div className="p-2 border rounded text-center">
            <p className="text-xs text-gray-500">Решения</p>
            <p className="text-sm font-semibold">{result.decisionScore.toFixed(1)}%</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-6">
          <Link href="/" className="text-blue-500 hover:underline">
            ← Назад на главную
          </Link>
        </div>
        
        {/* <h1 className="text-3xl font-bold mb-4">Результаты тестов</h1> */}
        
        {results.length === 0 ? (
          <p className="text-center py-8 text-gray-500">
            У вас пока нет пройденных тестов. Пройдите тесты из главного меню.
          </p>
        ) : (
          <>
            <div className="mb-6">
              <p>
                Всего пройдено тестов: <span className="font-semibold">{results.length}</span>
              </p>
            </div>
            
            <div className="mb-6">
              {results.map((result, index) => {
                if (result.testId === "reaction-time") {
                  return (
                    <div key={index}>
                      {renderReactionTimeResult(result as ReactionTimeResult)}
                    </div>
                  );
                } else if (result.testId === "scooter-readiness") {
                  return (
                    <div key={index}>
                      {renderScooterReadinessResult(result as ScooterReadinessResult)}
                    </div>
                  );
                }
                return <div key={index}>Неизвестный тип теста</div>;
              })}
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={clearResults}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Очистить все результаты
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 