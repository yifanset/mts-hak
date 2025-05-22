"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { TestComponentProps } from "@/types";

// Define the specific structure of results this test will produce
interface PeripheralVisionTestSpecificResults {
  noticedCount: number;
  averageReactionTimeMs: number | null;
  missedCount: number;
  correctPresses: number;
  totalStimuli: number;
}

// Extend TestComponentProps to specify the exact results type for onComplete
interface PeripheralVisionTestProps extends TestComponentProps<PeripheralVisionTestSpecificResults> {
  onComplete: (results: PeripheralVisionTestSpecificResults) => void;
}

type TestStage = "intro" | "testing" | "results";
type StimulusSide = "left" | "right" | null;

const TOTAL_STIMULI = 3;
const TEST_DURATION_MS = 10000; // User prompt says 10 seconds for 3 stimuli
const STIMULUS_TIMEOUT_MS = 1000; // 1 second to react
const MIN_STIMULUS_DELAY = 1000; // Minimum delay between stimuli in ms
const MAX_STIMULUS_DELAY = 2500; // Maximum delay between stimuli in ms

const PeripheralVisionTest: React.FC<PeripheralVisionTestProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<TestStage>("intro");
  const [results, setResults] = useState<PeripheralVisionTestSpecificResults | null>(null);

  // Testing state
  const [stimulusSide, setStimulusSide] = useState<StimulusSide>(null);
  const [stimulusVisible, setStimulusVisible] = useState(false);
  const [stimuliCount, setStimuliCount] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [missedCount, setMissedCount] = useState(0);
  const [correctPresses, setCorrectPresses] = useState(0);
  
  // Use refs for values that shouldn't trigger re-renders
  const stimulusAppearTime = useRef<number | null>(null);
  const stimulusTimer = useRef<NodeJS.Timeout | null>(null);
  const nextStimulusTimer = useRef<NodeJS.Timeout | null>(null);
  const testEndTimer = useRef<NodeJS.Timeout | null>(null);
  const isTestActive = useRef(false);
  const currentStimuliCount = useRef(0);
  
  // Memoize callback functions to prevent unnecessary re-creations
  const getRandomSide = useCallback((): "left" | "right" => {
    return Math.random() > 0.5 ? "left" : "right";
  }, []);

  // Clear all timers to prevent memory leaks
  const clearAllTimers = useCallback(() => {
    if (stimulusTimer.current) {
      clearTimeout(stimulusTimer.current);
      stimulusTimer.current = null;
    }
    if (nextStimulusTimer.current) {
      clearTimeout(nextStimulusTimer.current);
      nextStimulusTimer.current = null;
    }
    if (testEndTimer.current) {
      clearTimeout(testEndTimer.current);
      testEndTimer.current = null;
    }
  }, []);

  const showStimulus = useCallback(() => {
    if (currentStimuliCount.current >= TOTAL_STIMULI || !isTestActive.current) {
      return;
    }

    const side = getRandomSide();
    setStimulusSide(side);
    setStimulusVisible(true);
    stimulusAppearTime.current = performance.now();
    
    // Increment the current stimulus count
    currentStimuliCount.current++; 
    // Update the displayed count to match the current stimulus number
    setStimuliCount(currentStimuliCount.current);
    console.log(`Showing stimulus #${currentStimuliCount.current} on ${side} side`);

    // Set timer for missed stimulus
    if (stimulusTimer.current) {
      clearTimeout(stimulusTimer.current);
    }
    
    stimulusTimer.current = setTimeout(() => {
      if (!isTestActive.current) return;
      
      console.log("Stimulus missed (timeout)");
      setStimulusVisible(false);
      setStimulusSide(null);
      setMissedCount(prev => prev + 1);
      
      // Don't increment the count here, as we've already counted this stimulus
      console.log(`Stimulus missed. Count: ${currentStimuliCount.current}/${TOTAL_STIMULI}`);
      
      if (currentStimuliCount.current < TOTAL_STIMULI) {
        scheduleNextStimulus();
      } else {
        finishTest();
      }
    }, STIMULUS_TIMEOUT_MS);
  }, [getRandomSide]);

  // Function to schedule the next stimulus with a random delay
  const scheduleNextStimulus = useCallback(() => {
    if (!isTestActive.current || currentStimuliCount.current >= TOTAL_STIMULI) {
      return;
    }
    
    // Clear any existing timers
    if (nextStimulusTimer.current) {
      clearTimeout(nextStimulusTimer.current);
    }
    
    // Random delay between MIN and MAX
    const delay = Math.floor(Math.random() * (MAX_STIMULUS_DELAY - MIN_STIMULUS_DELAY) + MIN_STIMULUS_DELAY);
    const nextStimulusNumber = currentStimuliCount.current + 1;
    console.log(`Scheduling next stimulus #${nextStimulusNumber} in ${delay}ms`);
    
    nextStimulusTimer.current = setTimeout(() => {
      if (isTestActive.current) {
        showStimulus();
      }
    }, delay);
  }, [showStimulus]);

  // Handle key press events
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (stage !== "testing" || !stimulusVisible || !stimulusSide || !isTestActive.current) {
      return;
    }

    let pressedCorrect = false;
    if (event.key === "ArrowLeft" && stimulusSide === "left") {
      pressedCorrect = true;
    } else if (event.key === "ArrowRight" && stimulusSide === "right") {
      pressedCorrect = true;
    }

    console.log(`Key press: ${event.key}, correct: ${pressedCorrect}`);

    if (pressedCorrect && stimulusAppearTime.current) {
      const rt = performance.now() - stimulusAppearTime.current;
      setReactionTimes(prev => [...prev, rt]);
      setCorrectPresses(prev => prev + 1);
      console.log(`Correct press registered, reaction time: ${rt}ms`);
    }
    
    // Common logic for any keypress during stimulus visibility
    if (stimulusTimer.current) {
      clearTimeout(stimulusTimer.current);
    }
    
    setStimulusVisible(false);
    setStimulusSide(null);
    
    // Don't increment the count here, already done in showStimulus
    console.log(`Current stimuli count: ${currentStimuliCount.current}/${TOTAL_STIMULI}`);
    
    if (currentStimuliCount.current < TOTAL_STIMULI) {
      scheduleNextStimulus();
    } else {
      // All stimuli shown, finish after a short delay
      setTimeout(() => {
        if (isTestActive.current) {
          finishTest();
        }
      }, 500);
    }
  }, [stage, stimulusVisible, stimulusSide, scheduleNextStimulus]);

  // Handle click on the sides of the screen as an alternative to keyboard
  const handleScreenClick = useCallback((clickedSide: "left" | "right") => {
    if (stage !== "testing" || !stimulusVisible || !stimulusSide || !isTestActive.current) {
      return;
    }

    console.log(`Screen clicked on ${clickedSide} side, stimulus on ${stimulusSide} side`);
    
    const pressedCorrect = clickedSide === stimulusSide;
    console.log(`Click correct: ${pressedCorrect}`);

    if (pressedCorrect && stimulusAppearTime.current) {
      const rt = performance.now() - stimulusAppearTime.current;
      setReactionTimes(prev => [...prev, rt]);
      setCorrectPresses(prev => prev + 1);
      console.log(`Correct click registered, reaction time: ${rt}ms`);
    }
    
    // Common logic for any click during stimulus visibility
    if (stimulusTimer.current) {
      clearTimeout(stimulusTimer.current);
    }
    
    setStimulusVisible(false);
    setStimulusSide(null);
    
    // Don't increment the count here, already done in showStimulus
    console.log(`Current stimuli count: ${currentStimuliCount.current}/${TOTAL_STIMULI}`);
    
    if (currentStimuliCount.current < TOTAL_STIMULI) {
      scheduleNextStimulus();
    } else {
      // All stimuli shown, finish after a short delay
      setTimeout(() => {
        if (isTestActive.current) {
          finishTest();
        }
      }, 500);
    }
  }, [stage, stimulusVisible, stimulusSide, scheduleNextStimulus]);

  // Set up the test when it starts
  useEffect(() => {
    if (stage === "testing") {
      console.log("Test stage started, adding event listeners");
      isTestActive.current = true;
      currentStimuliCount.current = 0;
      
      // Add event listener for keyboard
      window.addEventListener("keydown", handleKeyPress);
      
      // Show first stimulus after a delay
      const startDelay = 1000;
      console.log(`Showing first stimulus in ${startDelay}ms`);
      
      const timer = setTimeout(() => {
        if (isTestActive.current) {
          showStimulus();
        }
      }, startDelay);
      
      // Set up test end timer as a safety
      testEndTimer.current = setTimeout(() => {
        console.log("Test time limit reached");
        if (isTestActive.current && stage === "testing") {
          finishTest();
        }
      }, TEST_DURATION_MS + 3000); // Extra buffer
      
      // Cleanup function
      return () => {
        console.log("Cleaning up test stage");
        window.removeEventListener("keydown", handleKeyPress);
        clearTimeout(timer);
        clearAllTimers();
        isTestActive.current = false;
        
        // Make sure all state is reset properly
        setStimulusSide(null);
        setStimulusVisible(false);
        currentStimuliCount.current = 0;
      };
    }
  }, [stage, handleKeyPress, showStimulus, clearAllTimers]);

  // Start the test
  const startTest = () => {
    console.log("Starting test");
    clearAllTimers();
    
    // Reset all state
    setStimuliCount(0);
    setReactionTimes([]);
    setMissedCount(0);
    setCorrectPresses(0);
    setStimulusSide(null);
    setStimulusVisible(false);
    currentStimuliCount.current = 0;
    
    // Start the test
    setStage("testing");
  };

  // Finish the test and calculate results
  const finishTest = useCallback(() => {
    if (stage !== "testing" || !isTestActive.current) {
      return;
    }
    
    console.log("Finishing test");
    isTestActive.current = false;
    clearAllTimers();

    const avgRt = reactionTimes.length > 0 
      ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length 
      : null;
      
    const finalResults: PeripheralVisionTestSpecificResults = {
      noticedCount: correctPresses,
      averageReactionTimeMs: avgRt,
      missedCount: missedCount + (TOTAL_STIMULI - currentStimuliCount.current),
      correctPresses: correctPresses,
      totalStimuli: TOTAL_STIMULI,
    };
    
    console.log("Test results:", finalResults);
    setResults(finalResults);
    setStage("results");
    onComplete(finalResults);
  }, [stage, reactionTimes, correctPresses, missedCount, onComplete, clearAllTimers]);

  const urentPurple = "#6a0dad";

  // Intro screen
  if (stage === "intro") {
    return (
      <div style={{
        background: "linear-gradient(to bottom right, white, #e0c7f2)",
        minHeight: "300px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        textAlign: "center",
        fontFamily: "sans-serif",
        borderRadius: "12px",
      }}>
        <h2 style={{ fontSize: "24px", color: urentPurple, marginBottom: "15px" }}>
          Внимание! Сейчас вы пройдёте тест на периферийное зрение.
        </h2>
        <p style={{ fontSize: "16px", color: "#333", marginBottom: "30px", maxWidth: "400px" }}>
          Ваша задача — смотреть в центр экрана, и как только сбоку появится круг, нажать в ту же сторону.
        </p>
        <button
          onClick={startTest}
          style={{
            backgroundColor: urentPurple,
            color: "white",
            border: "none",
            padding: "12px 25px",
            borderRadius: "25px",
            fontSize: "18px",
            cursor: "pointer",
            transition: "background-color 0.3s ease",
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#5e0b9a"}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = urentPurple}
        >
          Начать тест
        </button>
      </div>
    );
  }

  // Testing screen
  if (stage === "testing") {
    return (
      <div style={{
        position: "relative",
        width: "100%",
        minHeight: "300px",
        backgroundColor: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "12px",
        border: `1px solid ${urentPurple}`,
        overflow: "hidden",
        fontFamily: "sans-serif",
      }}>
        {/* Left side clickable area */}
        <div 
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "50%",
            height: "100%",
            cursor: "pointer",
          }}
          onClick={() => handleScreenClick("left")}
        />
        
        {/* Right side clickable area */}
        <div 
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            width: "50%",
            height: "100%",
            cursor: "pointer",
          }}
          onClick={() => handleScreenClick("right")}
        />

        {/* Fixation Point */}
        <div style={{
          width: "10px",
          height: "10px",
          backgroundColor: urentPurple,
          borderRadius: "50%",
          zIndex: 2,
        }} />

        {/* Stimulus */}
        {stimulusVisible && stimulusSide && (
          <div 
            className="stimulus-circle"
            style={{
              position: "absolute",
              top: "50%",
              ...(stimulusSide === "left" ? { left: "20px" } : { right: "20px" }),
              transform: "translateY(-50%)",
              width: "40px",
              height: "40px",
              backgroundColor: urentPurple,
              borderRadius: "50%",
              opacity: 0.7,
              zIndex: 1,
            }} 
          />
        )}

        <style jsx>{`
          .stimulus-circle {
            animation: fadeInGrow 0.3s forwards, subtlePulse 1s infinite 0.3s;
          }
          
          @keyframes fadeInGrow {
            from { 
              opacity: 0; 
              transform: translateY(-50%) scale(0.5); 
            }
            to { 
              opacity: 0.7; 
              transform: translateY(-50%) scale(1); 
            }
          }
          
          @keyframes subtlePulse {
            0%, 100% { 
              opacity: 0.7; 
            }
            50% { 
              opacity: 0.5; 
            }
          }
        `}</style>

        <div style={{ position: 'absolute', top: '10px', right: '10px', color: urentPurple }}>
           Стимулы: {stimuliCount}/{TOTAL_STIMULI}
        </div>
      </div>
    );
  }

  // Results screen
  if (stage === "results" && results) {
    const outcomeMessage = (results.noticedCount / results.totalStimuli) >= 0.66 ? // e.g. at least 2 out of 3
      "✅ Тест пройден! Можно ехать" :
      "⚠️ Рекомендуем выбрать другой транспорт";

    return (
      <div style={{
        background: "white",
        minHeight: "300px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        textAlign: "center",
        fontFamily: "sans-serif",
        borderRadius: "12px",
        border: `1px solid ${urentPurple}`,
      }}>
        <h2 style={{ fontSize: "24px", color: urentPurple, marginBottom: "20px" }}>Результаты теста</h2>
        <p style={{ fontSize: "18px", margin: "8px 0" }}>Замечено стимулов: {results.noticedCount} из {results.totalStimuli}</p>
        <p style={{ fontSize: "18px", margin: "8px 0" }}>
          Среднее время реакции: {results.averageReactionTimeMs ? `${results.averageReactionTimeMs.toFixed(0)} мс` : "N/A"}
        </p>
        <p style={{ fontSize: "18px", margin: "8px 0" }}>Пропущено стимулов: {results.missedCount}</p>
        <p style={{ fontSize: "20px", color: urentPurple, marginTop: "25px", fontWeight: "bold" }}>
          {outcomeMessage}
        </p>
      </div>
    );
  }

  return <div>Loading Test...</div>;
};

export default PeripheralVisionTest; 