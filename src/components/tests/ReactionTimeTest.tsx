"use client";

import { useState, useEffect, useRef } from "react";
import { TestComponentProps } from "@/types";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Состояния теста
type TestState = "select-age" | "idle" | "waiting" | "ready" | "measuring" | "completed";

// Define the specific structure of results this test will produce
interface ReactionTimeTestResults {
  reactionTime: number;
  attempts: number[];
}

// Update props to use TestComponentProps with generic type parameter
interface ReactionTimeTestProps extends TestComponentProps<ReactionTimeTestResults> {
  onComplete: (results: ReactionTimeTestResults) => void;
}

// Основной компонент теста времени реакции
export default function ReactionTimeTest({ onComplete }: ReactionTimeTestProps) {
  const [state, setState] = useState<TestState>("select-age");
  const [category, setCategory] = useState<"young" | "adult" | "senior" | null>(null);
  const [attempts, setAttempts] = useState<number[]>([]);
  const [averageTime, setAverageTime] = useState<number | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<number>(0);
  const totalAttempts = 3;
  const startTimeRef = useRef<number | null>(null);
  const waitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Пороговые значения времени реакции для разных возрастных категорий
  const thresholds: Record<string, number> = {
    young: 500,
    adult: 550,
    senior: 600,
  };

  // Хранение самокатов
  const [scooters, setScooters] = useState<React.ReactNode[]>([]);
  
  // Генерация самокатов только на клиенте после первого рендера
  useEffect(() => {
    const generatedScooters = [...Array(15)].map((_, i) => {
      const left = Math.random() * 100;
      const delay = Math.random() * 5;
      const rotate = Math.random() * 360;
      return (
        <Image
          key={i}
          src="/scooters.svg"
          alt="Scooter"
          width={60}
          height={60}
          style={{
            position: "absolute",
            top: "-80px",
            left: `${left}%`,
            opacity: 0.15,
            transform: `rotate(${rotate}deg)`,
            animation: `flyDown 8s linear infinite`,
            animationDelay: `${delay}s`,
            pointerEvents: "none",
          }}
        />
      );
    });
    setScooters(generatedScooters);
  }, []);

  useEffect(() => {
    if (state === "ready") {
      const delay = Math.random() * 2000 + 1000;
      waitTimerRef.current = setTimeout(() => {
        startTimeRef.current = Date.now();
        setState("measuring");
      }, delay);
    }
  }, [state]);

  useEffect(() => {
    return () => {
      if (waitTimerRef.current) {
        clearTimeout(waitTimerRef.current);
      }
    };
  }, []);

  const handleClick = () => {
    if (state === "idle") {
      setState("ready");
    } else if (state === "measuring" && startTimeRef.current) {
      const reaction = Date.now() - startTimeRef.current;
      const updatedAttempts = [...attempts, reaction];
      setAttempts(updatedAttempts);
      setCurrentAttempt(currentAttempt + 1);

      if (updatedAttempts.length >= totalAttempts) {
        finishTest(updatedAttempts);
      } else {
        setState("ready");
      }
    } else if (state === "ready") {
      setState("waiting");
      setTimeout(() => setState("ready"), 1000);
    }
  };

  const finishTest = (finalAttempts: number[]) => {
    if (waitTimerRef.current) {
      clearTimeout(waitTimerRef.current);
    }
    const avg = Math.round(finalAttempts.reduce((a, b) => a + b) / finalAttempts.length);
    setAverageTime(avg);
    setState("completed");
    onComplete({ reactionTime: avg, attempts: finalAttempts });
  };

  const resetTest = () => {
    setState("select-age");
    setCategory(null);
    setAttempts([]);
    setCurrentAttempt(0);
    setAverageTime(null);
  };

  const exitTest = () => {
    if (waitTimerRef.current) {
      clearTimeout(waitTimerRef.current);
    }
    router.push("/");
  };

  const getRecommendation = (time: number) => {
    if (!category) return "";
    const limit = thresholds[category];
    return time <= limit ? "✅ Можно ехать" : "⚠️ Лучше выбрать другой транспорт";
  };

  const handleAgeSelect = (ageCategory: "young" | "adult" | "senior") => {
    setCategory(ageCategory);
    setState("idle");
  };

  return (
    <div className="test-overlay">
      {scooters}

      <div className="test-modal" onClick={handleClick}>
        {state === "select-age" && (
          <div className="age-select">
            <h2>Сколько вам лет?</h2>
            <button onClick={() => handleAgeSelect("young")}>18–30</button>
            <button onClick={() => handleAgeSelect("adult")}>31–45</button>
            <button onClick={() => handleAgeSelect("senior")}>46+</button>
          </div>
        )}
        {state === "idle" && <p>Нажмите, чтобы начать тест на реакцию</p>}
        {state === "waiting" && <p>Слишком рано! Попробуйте ещё раз...</p>}
        {state === "ready" && <p>Приготовьтесь...</p>}
        {state === "measuring" && <p>ЖМИ!</p>}
        {state === "completed" && (
          <div>
            <h2>Тест завершён</h2>
            <p>Среднее время: <strong>{averageTime} мс</strong></p>
            <p>{getRecommendation(averageTime!)}</p>
            <p>Попытки: {attempts.join(", ")} мс</p>
            <div className="buttons">
              <button onClick={resetTest}>Пройти снова</button>
              <button onClick={() => router.push("/")}>Продолжить</button>
            </div>
          </div>
        )}
      </div>

      {/* Кнопка выхода, видимая на всех экранах кроме результата */}
      {state !== "completed" && (
        <button className="exit-button" onClick={exitTest}>
          Выйти
        </button>
      )}

      <style jsx>{`
        .test-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(6px);
          z-index: 1000;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .test-modal {
          position: relative;
          width: 600px;
          min-height: 400px;
          padding: 30px;
          background: linear-gradient(135deg, #6b46c1, #b794f4);
          border-radius: 24px;
          color: white;
          z-index: 1001;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          text-align: center;
          cursor: pointer;
        }

        .test-modal h2 {
          font-size: 24px;
        }

        .test-modal p {
          font-size: 18px;
        }

        .age-select {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }

        button {
          background-color: transparent;
          border: 1px solid white;
          padding: 10px 20px;
          border-radius: 12px;
          color: white;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        button:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }

        .exit-button {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1002;
          background-color: rgba(255, 255, 255, 0.2);
          border: 1px solid white;
          padding: 8px 16px;
          border-radius: 8px;
          color: white;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .exit-button:hover {
          background-color: rgba(255, 255, 255, 0.4);
        }

        @keyframes flyDown {
          0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 0.3;
          }
          100% {
            transform: translateY(110vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
} 