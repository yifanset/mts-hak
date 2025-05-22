"use client";

import { TestComponentProps } from "@/types"; 
import { useScooterReadinessGame, ScooterReadinessTestResults, GameElement, GameConfig } from "@/hooks/useScooterReadinessGame";

// Define the UrentColors interface
interface UrentColors {
  primary: string;
  primaryLight?: string;
  primaryDark?: string;
  secondary?: string;
  accent: string;
  safe: string;
  warning?: string;
  danger: string;
  background: string;
  cardBackground: string;
  darkText: string;
  lightText: string;
  elementShadow?: string;
}

// Update props to use TestComponentProps with the specific result type
interface ScooterReadinessTestProps extends TestComponentProps<ScooterReadinessTestResults> {
  onComplete: (results: ScooterReadinessTestResults) => void;
  urentColors?: UrentColors; // Make it optional
  gameConfig?: Partial<GameConfig>; // Добавляем возможность настройки игры
}

export default function ScooterReadinessTest({ 
  onComplete, 
  urentColors: customColors,
  gameConfig 
}: ScooterReadinessTestProps) {
  // Default and custom colors merge
  const defaultColors: UrentColors = {
    primary: '#7e21cd', // Main purple for MTS Urent
    primaryLight: '#b06ae9', // Lighter purple
    primaryDark: '#5f0f9f', // Darker purple
    secondary: '#fc0065', // Same as accent for now
    accent: '#fc0065', // MTS accent color
    safe: '#00c853', // Green for safe actions
    warning: '#ffc107', // Yellow for warnings
    danger: '#ff3d00', // Red for danger/errors
    background: '#f7e5ff', // Light purple background
    cardBackground: '#FFFFFF',
    darkText: '#171717',
    lightText: '#FFFFFF',
    elementShadow: 'rgba(0, 0, 0, 0.15)'
  };

  // Merge custom colors with defaults if provided
  const colors: UrentColors = customColors ? { ...defaultColors, ...customColors } : defaultColors;

  // Используем хук для управления игрой
  const {
    testState,
    countdown,
    gameElements,
    score,
    finalResults,
    fieldSize,
    timeLeft,
    handleElementClick,
    startTest
  } = useScooterReadinessGame(onComplete, gameConfig);

  // Визуальное представление элементов
  function renderGameElement(element: GameElement) {
    if (!element.visible) return null;
    
    const getElementVisuals = (type: string, action: 'tap' | 'avoid') => {
      // Определяем визуальные характеристики элементов
      const visuals: Record<string, { icon: string; bgColor: string; size: string; border?: string; shadow?: string }> = {
        pedestrian: { 
          icon: '🚶', 
          bgColor: action === 'tap' ? 'linear-gradient(135deg, #00d664, #00a43d)' : 'linear-gradient(135deg, #ff5530, #e02800)', 
          size: '55px',
          border: action === 'tap' ? '2px solid #00c853' : '2px solid #ff3d00',
          shadow: '0 6px 15px rgba(0, 0, 0, 0.2)'
        },
        trafficLight: { 
          icon: '🚦', 
          bgColor: action === 'tap' ? 'linear-gradient(135deg, #00d664, #00a43d)' : 'linear-gradient(135deg, #ff5530, #e02800)', 
          size: '60px',
          border: action === 'tap' ? '2px solid #00c853' : '2px solid #ff3d00',
          shadow: '0 6px 15px rgba(0, 0, 0, 0.2)'
        },
        pothole: { 
          icon: '🕳️', 
          bgColor: action === 'tap' ? 'linear-gradient(135deg, #00d664, #00a43d)' : 'linear-gradient(135deg, #ff5530, #e02800)', 
          size: '50px',
          border: action === 'tap' ? '2px solid #00c853' : '2px solid #ff3d00',
          shadow: '0 6px 15px rgba(0, 0, 0, 0.2)'
        },
        car: { 
          icon: '🚗', 
          bgColor: action === 'tap' ? 'linear-gradient(135deg, #00d664, #00a43d)' : 'linear-gradient(135deg, #ff5530, #e02800)', 
          size: '65px',
          border: action === 'tap' ? '2px solid #00c853' : '2px solid #ff3d00',
          shadow: '0 6px 15px rgba(0, 0, 0, 0.2)'
        },
        bike: { 
          icon: '🚲', 
          bgColor: action === 'tap' ? 'linear-gradient(135deg, #00d664, #00a43d)' : 'linear-gradient(135deg, #ff5530, #e02800)', 
          size: '60px',
          border: action === 'tap' ? '2px solid #00c853' : '2px solid #ff3d00',
          shadow: '0 6px 15px rgba(0, 0, 0, 0.2)'
        },
        bonus: { 
          icon: '⭐', 
          bgColor: 'linear-gradient(135deg, #ffce3a, #ff9500)', 
          size: '55px',
          border: '2px solid #ffab00',
          shadow: '0 6px 15px rgba(255, 165, 0, 0.3)'
        } // Bonus всегда tap
      };
      return visuals[type];
    };
    
    const visual = getElementVisuals(element.type, element.action);

    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${element.position.x}px`,
      top: `${element.position.y}px`,
      width: visual.size,
      height: visual.size,
      background: visual.bgColor,
      color: colors.lightText,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      cursor: 'pointer',
      fontSize: parseInt(visual.size) / 2 + 'px', // Динамический размер шрифта
      transition: 'transform 0.2s ease-out, opacity 0.3s ease-out',
      boxShadow: visual.shadow || `0 4px 10px ${colors.elementShadow}`,
      border: visual.border,
      transform: element.visible ? 'scale(1)' : 'scale(0.5)',
      opacity: element.visible ? 1 : 0,
      userSelect: 'none', // Предотвратить выделение текста/иконки
      zIndex: 2,
    };
    
    return (
      <div
        key={element.id}
        style={style}
        onClick={() => handleElementClick(element)}
        role="button" // Accessibility
        aria-label={`Игровой элемент ${element.type} ${element.action === 'tap' ? 'нажмите' : 'избегайте'}`}
      >
        {visual.icon}
      </div>
    );
  }

  // Отображение компонента в зависимости от состояния
  function renderContent() {
    switch (testState) {
      case 'idle':
        return (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <h2 
              className="text-4xl font-bold mb-4 text-transparent bg-clip-text" 
              style={{ backgroundImage: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark || colors.primary})` }}
            >
              Тест &ldquo;Street Ready&rdquo;
            </h2>
            <p className="mb-6 text-lg" style={{ color: colors.darkText }}>
              Проверьте свою готовность к безопасной поездке на самокате Urent!
            </p>
            <div 
              className="mb-8 p-6 rounded-xl shadow-lg border border-purple-100"
              style={{ background: 'linear-gradient(to bottom right, white, #fbf5ff)' }}
            >
              <p className="text-base" style={{ color: colors.darkText }}>
                Нажимайте на <span className="font-semibold px-2 py-1 rounded-full" style={{ color: colors.lightText, backgroundColor: colors.safe }}>зеленые</span> и 
                <span className="font-semibold px-2 py-1 rounded-full mx-1" style={{ color: colors.lightText, background: 'linear-gradient(135deg, #ffce3a, #ff9500)' }}>желтые (бонусные)</span> элементы.
                <br/>
                Не трогайте <span className="font-semibold px-2 py-1 rounded-full" style={{ color: colors.lightText, backgroundColor: colors.danger }}>красные</span> элементы.
                <br/>
                Действуйте быстро и точно! Удачи!
              </p>
            </div>
            <button
              onClick={startTest}
              className="px-8 py-3 text-lg font-semibold rounded-lg hover:opacity-90 transition-all transform hover:scale-105 shadow-lg"
              style={{ 
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`, 
                color: colors.lightText 
              }}
            >
              Начать проверку
            </button>
          </div>
        );
        
      case 'countdown':
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-purple-200 opacity-30 animate-ping"></div>
              <p className="text-7xl font-bold relative z-10" style={{ color: colors.primary }}>{countdown}</p>
            </div>
            <p className="mt-4 text-xl font-medium" style={{ color: colors.darkText }}>Приготовьтесь...</p>
          </div>
        );
        
      case 'running':
        return (
          <div className="relative w-full h-full">
            <div 
              className="absolute top-3 right-3 text-lg font-semibold px-4 py-2 rounded-full shadow-md z-10"
              style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`, color: colors.lightText }}
            >
              <span role="timer" aria-live="polite">Время: {timeLeft}с</span>
            </div>
            {/* Городской фон для игрового поля */}
            <div className="absolute inset-0 bg-opacity-20 z-0" style={{
              backgroundImage: "url('https://img.freepik.com/free-vector/city-streets-concept-illustration_114360-8746.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'brightness(0.9) opacity(0.2)'
            }}></div>
            {/* Дорога */}
            <div className="absolute left-1/2 top-0 bottom-0 w-3/5 -translate-x-1/2 bg-gray-300 z-1">
              <div className="absolute left-1/2 top-0 bottom-0 w-[10px] -translate-x-1/2 bg-white z-1" 
                   style={{backgroundImage: 'linear-gradient(to bottom, white 50%, transparent 50%)', backgroundSize: '10px 30px'}}></div>
            </div>
            {gameElements.map(element => renderGameElement(element))}
          </div>
        );
        
      case 'completed':
        const avgReactionTimeDisplay = score.reactionTimes.length > 0
          ? Math.round(score.reactionTimes.reduce((sum, time) => sum + time, 0) / score.reactionTimes.length)
          : "N/A";

        return (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text" style={{ 
              backgroundImage: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})` 
            }}>Тест завершен!</h2>
            <div className="mb-6 text-left bg-white p-6 rounded-xl shadow-xl w-full max-w-md" style={{ color: colors.darkText }}>
              <h3 className="text-2xl font-semibold mb-4 text-center" style={{color: colors.primary}}>Ваши результаты:</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Правильные нажатия</p>
                  <p className="text-2xl font-bold" style={{color: colors.safe}}>{score.correct}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Ошибочные нажатия</p>
                  <p className="text-2xl font-bold" style={{color: colors.danger}}>{score.incorrect}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Пропущенные элементы</p>
                  <p className="text-2xl font-bold" style={{color: colors.primary}}>{score.missed}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Время реакции</p>
                  <p className="text-2xl font-bold" style={{color: colors.primary}}>{avgReactionTimeDisplay} <span className="text-sm font-normal">мс</span></p>
                </div>
              </div>
              
              {finalResults && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="rounded-lg p-4 mb-3" style={{ 
                    background: finalResults.recommendation === "Можно ехать" 
                      ? 'linear-gradient(135deg, #e7f7ed, #d1f6dd)'
                      : 'linear-gradient(135deg, #fbecec, #fad4d4)' 
                  }}>
                    <p 
                      className="text-xl font-bold text-center"
                      style={{ color: finalResults.recommendation === "Можно ехать" ? '#00a03c' : '#e03131' }}
                    >
                      {finalResults.recommendation}
                    </p>
                  </div>
                  
                  {finalResults.suggestedSpeed !== undefined && (
                    <div className="flex items-center justify-center mb-2">
                      <div className="bg-gray-100 rounded-full px-4 py-1 flex items-center">
                        <span className="font-medium mr-1">Рекомендуемая скорость:</span>
                        <span className="text-lg font-bold" style={{color: colors.primary}}>{finalResults.suggestedSpeed} км/ч</span>
                      </div>
                    </div>
                  )}
                  
                  {finalResults.safetyTip && (
                    <p className="text-sm mt-2 bg-gray-50 p-3 rounded-lg" style={{ color: colors.darkText }}>
                      <span className="font-bold">Совет: </span>
                      {finalResults.safetyTip}
                    </p>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={startTest}
              className="px-8 py-3 text-lg font-semibold rounded-lg hover:opacity-90 transition-all transform hover:scale-105 shadow-lg"
              style={{ 
                background: `linear-gradient(135deg, ${colors.secondary}, #d4005a)`, 
                color: colors.lightText 
              }}
            >
              Пройти еще раз
            </button>
          </div>
        );
    }
  }

  return (
    <div className="border rounded-xl shadow-xl w-full overflow-hidden" style={{ 
      background: `linear-gradient(135deg, ${colors.background}, #f0dffb)`,
      border: '1px solid rgba(126, 33, 205, 0.2)'
    }}>
      <div 
        className="relative rounded-lg overflow-hidden"
        style={{
          width: '100%',
          height: `${fieldSize.height}px`,
          maxWidth: `${fieldSize.width}px`,
          margin: '0 auto',
          backgroundColor: '#E0E7FF', // Light blue/lavender background for the game area
        }}
      >
        {renderContent()}
      </div>
    </div>
  );
} 