import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface NumberTickerProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  delay?: number;
  easing?: string;
}

const NumberTicker: React.FC<NumberTickerProps> = ({
  value,
  duration = 2,
  prefix = '',
  suffix = '',
  className = '',
  delay = 0,
  easing = 'power2.out'
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const valueRef = useRef(0);
  const animationRef = useRef<gsap.core.Tween | null>(null);
  
  useEffect(() => {
    // Kill any existing animation
    if (animationRef.current) {
      animationRef.current.kill();
    }
    
    // Create a new animation
    animationRef.current = gsap.to(valueRef, {
      current: value,
      duration: duration,
      delay: delay,
      ease: easing,
      onUpdate: () => {
        setDisplayValue(Math.round(valueRef.current));
      }
    });
    
    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, [value, duration, delay, easing]);
  
  return (
    <span className={`number-ticker ${className}`}>
      {prefix}{displayValue}{suffix}
    </span>
  );
};

export default NumberTicker; 