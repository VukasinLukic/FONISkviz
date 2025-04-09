import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface CircularProgressBarProps {
  value: number; // 0 to 100
  maxValue?: number;
  currentStep?: number;
  totalSteps?: number;
  size?: number;
  strokeWidth?: number;
  backgroundColor?: string;
  progressColor?: string;
  textColor?: string;
  className?: string;
  showLabel?: boolean;
}

const CircularProgressBar: React.FC<CircularProgressBarProps> = ({
  value,
  maxValue = 100,
  currentStep = 1,
  totalSteps = 8,
  size = 80,
  strokeWidth = 8,
  backgroundColor = '#FCE4BC',
  progressColor = '#D35322',
  textColor = '#5A1B09',
  className = '',
  showLabel = true
}) => {
  const progressRef = useRef<SVGCircleElement>(null);
  const valueRef = useRef<{ current: number }>({ current: 0 });
  const textRef = useRef<SVGTextElement>(null);
  
  const normalizedValue = (value / maxValue) * 100;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const dash = (circumference * normalizedValue) / 100;
  const center = size / 2;
  
  useEffect(() => {
    if (!progressRef.current) return;
    
    // Animate the progress
    gsap.to(progressRef.current, {
      strokeDashoffset: circumference - dash,
      duration: 1.5,
      ease: 'power2.inOut'
    });
    
    // Animate the number
    if (textRef.current) {
      gsap.to(valueRef.current, {
        current: currentStep,
        duration: 1.2,
        ease: 'power2.out',
        onUpdate: () => {
          if (textRef.current) {
            textRef.current.textContent = `${Math.round(valueRef.current.current)}/${totalSteps}`;
          }
        }
      });
    }
  }, [value, circumference, dash, currentStep, totalSteps]);
  
  return (
    <div className={`circular-progress-container ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="circular-progress"
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          className="progress-bg"
        />
        
        {/* Progress circle */}
        <circle
          ref={progressRef}
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          strokeLinecap="round"
          className="progress-indicator"
          transform={`rotate(-90 ${center} ${center})`}
        />
        
        {/* Text label */}
        {showLabel && (
          <text
            ref={textRef}
            x={center}
            y={center + 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={textColor}
            fontSize={size / 5}
            fontWeight="bold"
            className="progress-text"
          >
            {currentStep}/{totalSteps}
          </text>
        )}
      </svg>
    </div>
  );
};

export default CircularProgressBar; 