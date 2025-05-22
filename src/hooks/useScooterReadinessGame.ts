import { useState, useEffect, useRef } from "react";

// Типы элементов, появляющихся в тесте
export type ElementType = 'pedestrian' | 'trafficLight' | 'pothole' | 'car' | 'bike' | 'bonus';

// Интерфейс для игрового элемента
export interface GameElement {
  id: string;
  type: ElementType;
  position: { x: number; y: number };
  action: 'tap' | 'avoid'; // что нужно сделать - нажать или избегать
  appearTime: number; // время появления элемента от начала теста (может быть timestamp)
  visible: boolean;
  clicked?: boolean; // To track if an element was clicked for animation/scoring
  lifespan: number; // How long the element stays visible
}

// Define the specific result type for this test
export interface ScooterReadinessTestResults {
  averageReactionTime: number;
  accuracy: number;
  decisionScore: number;
  recommendation: string;
  suggestedSpeed?: number;
  safetyTip?: string;
  noInteraction?: boolean; // Добавляем флаг отсутствия взаимодействия
}

// Настройки игры
export interface GameConfig {
  testDuration: number; // Длительность теста в секундах
  totalElements: number; // Общее количество элементов
  tapProbability: number; // Вероятность элемента 'tap' (0-1)
  reactionTimeThreshold: number; // Порог для времени реакции (мс)
  accuracyThreshold: number; // Порог для точности (%)
  decisionScoreThreshold: number; // Порог для принятия решений (%)
  bonusElementLifespan: number; // Время жизни бонусных элементов (мс)
  regularElementLifespan: [number, number]; // Мин и макс время жизни обычных элементов [мин, макс] (мс)
}

// Настройки по умолчанию
const defaultGameConfig: GameConfig = {
  testDuration: 10,
  totalElements: 15,
  tapProbability: 0.5, // Изменено с 0.7 на 0.5 для соотношения 50/50 элементов "tap" и "avoid"
  reactionTimeThreshold: 1500,
  accuracyThreshold: 75,
  decisionScoreThreshold: 50,
  bonusElementLifespan: 1500,
  regularElementLifespan: [2000, 3000],
};

export const useScooterReadinessGame = (
  onComplete: (results: ScooterReadinessTestResults) => void,
  customConfig?: Partial<GameConfig>
) => {
  // Объединяем настройки по умолчанию с пользовательскими
  const config = { ...defaultGameConfig, ...customConfig };
  
  // Состояния теста
  const [testState, setTestState] = useState<'idle' | 'countdown' | 'running' | 'completed'>('idle');
  const [countdown, setCountdown] = useState<number>(3);
  const [gameElements, setGameElements] = useState<GameElement[]>([]);
  const [activeTimers, setActiveTimers] = useState<NodeJS.Timeout[]>([]);
  const [score, setScore] = useState<{
    correct: number;
    incorrect: number;
    missed: number;
    reactionTimes: number[];
  }>({
    correct: 0,
    incorrect: 0,
    missed: 0,
    reactionTimes: [],
  });
  const [finalResults, setFinalResults] = useState<ScooterReadinessTestResults | null>(null);
  const [fieldSize, setFieldSize] = useState({ width: 300, height: 400 });
  const [timeLeft, setTimeLeft] = useState<number>(config.testDuration);

  // Refs
  const startTimeRef = useRef<number | null>(null);
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const uiUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const testIdRef = useRef<string>("");
  const activeTimersRef = useRef<NodeJS.Timeout[]>([]);
  const hasInteractedRef = useRef<boolean>(false); // Используем ref вместо state для мгновенного обновления
  const scoreRef = useRef({
    correct: 0,
    incorrect: 0,
    missed: 0,
    reactionTimes: [] as number[],
  });

  // Установка размера игрового поля в зависимости от размеров экрана
  useEffect(() => {
    const updateFieldSize = () => {
      const width = Math.min(window.innerWidth - 40, 500);
      const height = Math.min(window.innerHeight - 200, 600);
      setFieldSize({ width, height });
    };

    updateFieldSize();
    window.addEventListener('resize', updateFieldSize);
    return () => window.removeEventListener('resize', updateFieldSize);
  }, []);

  // Синхронизируем состояние и ref
  useEffect(() => {
    activeTimersRef.current = activeTimers;
  }, [activeTimers]);
  
  // Синхронизируем score со scoreRef
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      cleanupAllTimers();
    };
  }, []);
  
  // Следим за изменением timeLeft и завершаем тест, если время вышло
  useEffect(() => {
    if (testState === 'running' && timeLeft <= 0) {
      console.log("Time's up! Ending test...");
      endTest();
    }
  }, [timeLeft, testState]);

  // Очистка всех таймеров и состояний
  function cleanupAllTimers() {
    // Очистка таймеров элементов
    activeTimersRef.current.forEach(clearTimeout);
    setActiveTimers([]);
    
    // Очистка игровых таймеров
    if (gameTimerRef.current) {
      clearInterval(gameTimerRef.current);
      gameTimerRef.current = null;
    }
    
    if (uiUpdateTimerRef.current) {
      clearInterval(uiUpdateTimerRef.current);
      uiUpdateTimerRef.current = null;
    }
    
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }

  // Функция для полного сброса состояния теста
  function resetTestState() {
    // Генерируем уникальный ID для этого запуска теста
    testIdRef.current = `test-${Date.now()}`;
    
    // Сбрасываем время начала
    startTimeRef.current = null;
    
    // Сбрасываем флаг взаимодействия
    hasInteractedRef.current = false;
    
    // Сбрасываем счет
    scoreRef.current = {
      correct: 0,
      incorrect: 0,
      missed: 0,
      reactionTimes: [],
    };
    setScore({
      correct: 0,
      incorrect: 0,
      missed: 0,
      reactionTimes: [],
    });
    
    // Очищаем игровые элементы
    setGameElements([]);
    
    // Сбрасываем результаты
    setFinalResults(null);
    
    // Сбрасываем таймер
    setTimeLeft(config.testDuration);
    
    // Сбрасываем обратный отсчет
    setCountdown(3);
    
    // Очистка всех таймеров
    cleanupAllTimers();
  }

  // Проверка пропущенных элементов и управление видимостью
  function updateVisibleElements() {
    if (testState !== 'running' || !startTimeRef.current) return;
    const currentTime = Date.now();

    setGameElements(prevElements => {
      let missedCountIncrement = 0;
      const updatedElements = prevElements.map(element => {
        if (!element.visible || element.clicked) return element;

        const timeSinceAppeared = currentTime - element.appearTime;

        if (timeSinceAppeared > element.lifespan) {
          if (element.action === 'tap') {
            missedCountIncrement++;
          }
          return { ...element, visible: false };
        }
        return element;
      });

      if (missedCountIncrement > 0) {
        console.log(`Missed ${missedCountIncrement} elements`);
        if (testState === 'running') { // Проверяем, что тест все еще выполняется
          scoreRef.current.missed += missedCountIncrement;
          setScore(prevScore => ({ ...prevScore, missed: prevScore.missed + missedCountIncrement }));
        }
      }
      return updatedElements;
    });
  }
  
  // Обработка нажатия на элемент
  function handleElementClick(clickedElement: GameElement) {
    console.log("Element clicked:", clickedElement);
    
    if (!startTimeRef.current) {
      console.log("Click ignored: startTimeRef is null");
      return;
    }
    
    if (!clickedElement.visible) {
      console.log("Click ignored: element not visible");
      return;
    }
    
    if (clickedElement.clicked) {
      console.log("Click ignored: element already clicked");
      return;
    }
    
    const clickTime = Date.now();
    const reactionTime = clickTime - clickedElement.appearTime;
    
    console.log(`Processing click: action=${clickedElement.action}, reactionTime=${reactionTime}ms`);
    
    // Устанавливаем флаг взаимодействия немедленно через ref
    hasInteractedRef.current = true;
    console.log("Setting hasInteractedRef to true", hasInteractedRef.current);
    
    // Обновляем только элементы для UI
    setGameElements(prev => 
      prev.map(el => el.id === clickedElement.id ? { ...el, visible: false, clicked: true } : el)
    );
    
    // Обновляем ТОЛЬКО счет через ref
    if (clickedElement.action === 'tap') {
      scoreRef.current.correct += 1;
      scoreRef.current.reactionTimes.push(reactionTime);
    } else {
      scoreRef.current.incorrect += 1;
    }
    
    // Обновляем UI на основе текущего значения ref
    setScore({...scoreRef.current});
    
    console.log("Updated score (ref):", scoreRef.current);
  }

  // Генерация игровых элементов с гарантированным балансом элементов tap/avoid
  function generateGameElements() {
    const totalElements = config.totalElements;
    const targetTapElements = Math.floor(totalElements * config.tapProbability);
    
    let elements: GameElement[] = [];
    let tapElementsCount = 0;
    
    const elementTypes: ElementType[] = ['pedestrian', 'trafficLight', 'pothole', 'car', 'bike', 'bonus'];
    
    // Минимальное расстояние между элементами (предотвращает наложение)
    const minDistance = 70; // px
    
    // Функция для проверки, не перекрывается ли новая позиция с существующими элементами
    const isPositionValid = (pos: {x: number, y: number}, existingElements: GameElement[]): boolean => {
      for (const element of existingElements) {
        const distance = Math.sqrt(
          Math.pow(pos.x - element.position.x, 2) + 
          Math.pow(pos.y - element.position.y, 2)
        );
        if (distance < minDistance) {
          return false; // Позиция слишком близко к существующему элементу
        }
      }
      return true; // Позиция допустима
    };
    
    // Создаем элементы, контролируя баланс tap/avoid
    for (let i = 0; i < totalElements; i++) {
      const type = elementTypes[Math.floor(Math.random() * elementTypes.length)];
      
      // Определяем, должен ли этот элемент быть "tap" или "avoid"
      // Бонусы всегда "tap", для остальных решаем на основе текущего баланса
      let action: 'tap' | 'avoid';
      
      if (type === 'bonus') {
        action = 'tap';
      } else {
        // Если еще не достигли целевого количества элементов "tap"
        // И это последний шанс добавить "tap" элемент, или мы случайно выбрали "tap"
        const remainingElements = totalElements - i;
        const remainingTapNeeded = targetTapElements - tapElementsCount;
        
        if (remainingTapNeeded > 0 && (remainingTapNeeded >= remainingElements || Math.random() < remainingTapNeeded / remainingElements)) {
          action = 'tap';
        } else {
          action = 'avoid';
        }
      }
      
      // Считаем элементы "tap"
      if (action === 'tap') {
        tapElementsCount++;
      }
      
      // Генерируем валидную позицию, которая не перекрывается с существующими элементами
      // Максимальное количество попыток, чтобы избежать бесконечного цикла при малом поле
      const maxAttempts = 30;
      let position = {
        x: Math.floor(Math.random() * (fieldSize.width - 60)) + 20, // +20 для отступа от краев
        y: Math.floor(Math.random() * (fieldSize.height - 100)) + 20 // +20, -100 для отступа от краев
      };
      let attempts = 0;
      let positionValid = false;
      
      while (!positionValid && attempts < maxAttempts) {
        position = {
          x: Math.floor(Math.random() * (fieldSize.width - 60)) + 20, // +20 для отступа от краев
          y: Math.floor(Math.random() * (fieldSize.height - 100)) + 20 // +20, -100 для отступа от краев
        };
        
        positionValid = isPositionValid(position, elements);
        attempts++;
      }
      
      // Равномерно распределяем время появления
      const appearTime = Math.floor((i / totalElements) * (config.testDuration * 0.85) * 1000); // Оставляем запас в конце
      const lifespan = type === 'bonus' 
        ? config.bonusElementLifespan 
        : config.regularElementLifespan[0] + Math.random() * (config.regularElementLifespan[1] - config.regularElementLifespan[0]);
      
      elements.push({
        id: `element-${Date.now()}-${i}`,
        type,
        position,
        action,
        appearTime,
        visible: false,
        lifespan,
      });
    }
    
    // Перемешиваем элементы для разнообразия их появления
    elements = shuffleArray(elements);
    
    setGameElements(elements);
    
    // Запускаем таймеры для появления элементов
    const newTimers: NodeJS.Timeout[] = [];
    elements.forEach(element => {
      const timer = setTimeout(() => {
        setGameElements(prev => 
          prev.map(el => el.id === element.id ? { ...el, visible: true, appearTime: Date.now() } : el)
        );
      }, element.appearTime - (Date.now() - (startTimeRef.current || Date.now())));
      newTimers.push(timer);
    });
    
    setActiveTimers(prev => {
      const updatedTimers = [...prev, ...newTimers];
      activeTimersRef.current = updatedTimers;
      return updatedTimers;
    });
  }
  
  // Функция для перемешивания массива
  function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  // Завершение теста
  function endTest() {
    // Проверяем, не был ли тест уже завершен
    if (testState === 'completed') {
      return; // Предотвращаем повторное выполнение
    }
    
    // Перед завершением, делаем финальную проверку на пропущенные элементы
    // Это гарантирует, что мы посчитаем все пропущенные элементы до конца теста
    const calculateMissedCount = () => {
      const currentTime = Date.now();
      let missedCount = 0;
      
      gameElements.forEach(element => {
        // Считаем только видимые, некликнутые элементы, которые нужно было нажать
        if (element.visible && !element.clicked && element.action === 'tap') {
          missedCount++;
        }
        
        // Также проверяем элементы, которые не успели стать невидимыми, но уже истекли
        if (element.visible && !element.clicked && 
            (currentTime - element.appearTime) > element.lifespan && 
            element.action === 'tap') {
          missedCount++;
        }
      });
      
      return missedCount;
    };
    
    // Получаем количество пропущенных элементов
    const missedCount = calculateMissedCount();
    
    // Обновляем счет с учетом пропущенных элементов через ref
    scoreRef.current.missed += missedCount > 0 ? missedCount : 0;
    
    // Обновляем состояние счета для UI
    const updatedScore = {
      ...scoreRef.current
    };
    setScore(updatedScore);
    
    // Очищаем все таймеры
    cleanupAllTimers();
    
    // Устанавливаем состояние на "завершено"
    setTestState('completed');
    
    console.log("Finishing test with hasInteractedRef:", hasInteractedRef.current);
    console.log("Final score for calculation:", updatedScore);
    
    // Check if user interacted at all - используем ref для надежности
    const userInteracted = hasInteractedRef.current || updatedScore.reactionTimes.length > 0;
    console.log("User interaction detected:", userInteracted);
    
    // Вычисляем результаты, используя обновленный счет
    const averageReactionTime = updatedScore.reactionTimes.length > 0
      ? Math.round(updatedScore.reactionTimes.reduce((sum, time) => sum + time, 0) / updatedScore.reactionTimes.length)
      : 0;
    
    const totalResponses = updatedScore.correct + updatedScore.incorrect;
    const accuracy = totalResponses > 0 
      ? Math.round((updatedScore.correct / totalResponses) * 100) 
      : 0;
    
    // Расчет общего балла за принятие решений - считаем сколько правильных решений сделал пользователь
    const totalPossible = updatedScore.correct + updatedScore.incorrect + updatedScore.missed;
    const decisionScore = totalPossible > 0 
      ? Math.round((updatedScore.correct / totalPossible) * 100) 
      : 0;

    /* 
    СЦЕНАРИИ ПРОХОЖДЕНИЯ ТЕСТА И ИХ ОБРАБОТКА:
    
    1. Пользователь не взаимодействует с тестом вообще:
       - hasInteracted = false
       - Рекомендация: "Тест не пройден"
       - Специальное сообщение о необходимости реагировать на элементы
       - noInteraction = true
    
    2. Пользователь взаимодействует, но показывает плохие результаты:
       a) Если среднее время реакции >= reactionTimeThreshold (1500мс)
       b) ИЛИ точность < accuracyThreshold (75%)
       c) ИЛИ оценка принятия решений < decisionScoreThreshold (50%)
       - Рекомендация: "Лучше выбрать другой транспорт / пойти пешком"
    
    3. Пользователь взаимодействует и показывает хорошие, но не отличные результаты:
       a) Среднее время реакции > 400мс ИЛИ точность < 90% ИЛИ оценка принятия решений < 70%
       b) НО при этом проходит базовые пороги (2a, 2b, 2c выше)
       - Рекомендация: "Можно ехать"
       - Предлагаемая скорость: 15 км/ч
       - Совет о соблюдении осторожности
    
    4. Пользователь взаимодействует и показывает отличные результаты:
       a) Среднее время реакции <= 400мс И точность >= 90% И оценка принятия решений >= 70%
       - Рекомендация: "Можно ехать"
       - Предлагаемая скорость: 20 км/ч
       - Позитивный совет
    
    Важные метрики:
    - Время реакции: среднее время между появлением элемента "tap" и нажатием на него
    - Точность: процент правильных действий (нажатие на "tap", избегание "avoid") среди всех взаимодействий
    - Оценка принятия решений: процент правильных действий среди всех возможных (включая пропущенные)
    */
    
    // Логирование для диагностики
    console.log("Test Results:", {
      hasInteracted: userInteracted,
      averageReactionTime,
      accuracy,
      decisionScore,
      reactionTimeThreshold: config.reactionTimeThreshold,
      accuracyThreshold: config.accuracyThreshold,
      decisionScoreThreshold: config.decisionScoreThreshold,
      reactionTimeFail: !userInteracted || averageReactionTime >= config.reactionTimeThreshold,
      accuracyFail: accuracy < config.accuracyThreshold,
      decisionScoreFail: decisionScore < config.decisionScoreThreshold
    });

    // Определение рекомендации на основе рассчитанных значений
    let recommendation: string;
    let suggestedSpeed: number | undefined = undefined;
    let safetyTip: string | undefined = undefined;
    let noInteraction = false;

    // Improved recommendation logic
    if (!userInteracted) {
      // Специальная обработка случая отсутствия взаимодействия
      recommendation = "Тест не пройден";
      safetyTip = "Вы не взаимодействовали с элементами теста. Пожалуйста, попробуйте снова и реагируйте на появляющиеся элементы.";
      noInteraction = true;
      
      console.log("Recommendation: No interaction detected");
    } else if (averageReactionTime >= config.reactionTimeThreshold || 
        accuracy < config.accuracyThreshold || decisionScore < config.decisionScoreThreshold) {
      recommendation = "Лучше выбрать другой транспорт / пойти пешком";
      
      console.log("Recommendation: Cannot ride", {
        hasInteracted: userInteracted,
        averageReactionTime,
        reactionTimeThreshold: config.reactionTimeThreshold,
        accuracyCheck: accuracy < config.accuracyThreshold,
        decisionScoreCheck: decisionScore < config.decisionScoreThreshold
      });
    } else {
      recommendation = "Можно ехать";
      // Определяем рекомендованную скорость и совет в зависимости от результатов, если ехать можно
      if (averageReactionTime > 400 || accuracy < 90 || decisionScore < 70) {
        suggestedSpeed = 15; // км/ч
        safetyTip = "Соблюдайте осторожность, ваша реакция немного замедлена. Безопасной поездки!";
      } else {
        suggestedSpeed = 20; // км/ч или максимально разрешенная
        safetyTip = "Отличная готовность! Наслаждайтесь поездкой и помните о ПДД.";
      }
      console.log("Recommendation: Can ride", {
        averageReactionTime,
        reactionTimeThreshold: config.reactionTimeThreshold,
        suggestedSpeed,
        safetyTip
      });
    }
    
    const resultsToDisplay: ScooterReadinessTestResults = {
      averageReactionTime,
      accuracy,
      decisionScore,
      recommendation,
      suggestedSpeed,
      safetyTip,
      noInteraction
    };
    
    // Установка финальных результатов и вызов callback'а
    setFinalResults(resultsToDisplay);
    onComplete(resultsToDisplay);
  }

  // Запуск игрового цикла
  function startGameLoop() {
    const currentTestId = testIdRef.current;
    
    // Устанавливаем состояние на "выполняется"
    setTestState('running');
    
    // Записываем время начала
    startTimeRef.current = Date.now();
    // Вычисляем точное время окончания теста
    const endTime = startTimeRef.current + (config.testDuration * 1000);
    
    // Сбрасываем таймер
    setTimeLeft(config.testDuration);

    // Генерируем последовательность элементов
    generateGameElements();

    // Запускаем игровой таймер для обновления timeLeft и проверки конца теста
    gameTimerRef.current = setInterval(() => {
      // Проверяем, не изменился ли ID теста
      if (currentTestId !== testIdRef.current) {
        if (gameTimerRef.current) {
          clearInterval(gameTimerRef.current);
          gameTimerRef.current = null;
        }
        return;
      }
      
      const now = Date.now();
      // Вычисляем оставшееся время на основе фиксированного времени окончания
      const remainingMs = endTime - now;
      const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
      
      // Обновляем отображаемое время
      setTimeLeft(remainingSec);

      // Если время вышло, завершаем тест
      if (remainingMs <= 0) {
        console.log("Timer interval: Time's up!");
        // Сначала очищаем таймер
        if (gameTimerRef.current) {
          clearInterval(gameTimerRef.current);
          gameTimerRef.current = null;
        }
        // Затем завершаем тест
        endTest();
      }
    }, 500); // Обновляем чаще для плавности

    // Запускаем таймер для обновления UI элементов (анимации, исчезновение)
    uiUpdateTimerRef.current = setInterval(() => {
      // Проверяем, не изменился ли ID теста
      if (currentTestId !== testIdRef.current) {
        if (uiUpdateTimerRef.current) {
          clearInterval(uiUpdateTimerRef.current);
          uiUpdateTimerRef.current = null;
        }
        return;
      }
      
      updateVisibleElements();
    }, 50); // Уменьшаем интервал с 100 до 50 мс для более частых проверок
  }

  // Функция для начала теста
  function startTest() {
    // Полностью сбрасываем состояние теста
    resetTestState();
    
    // Устанавливаем состояние на обратный отсчет
    setTestState('countdown');
    
    // Запускаем обратный отсчет
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          startGameLoop();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  return {
    testState,
    countdown,
    gameElements,
    score,
    finalResults,
    fieldSize,
    timeLeft,
    handleElementClick,
    startTest
  };
}; 