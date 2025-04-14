import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface TimerProps {
  duration: number;
  onComplete?: () => void;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'accent';
  label?: string;
  timerEnd?: number;
}

export const Timer: React.FC<TimerProps> = ({
  duration,
  onComplete,
  size = 'md',
  color = 'primary',
  label,
  timerEnd
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (isPaused) return;

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTimeRef.current) / 1000);
      const remaining = Math.max(0, duration - elapsed);
      setTimeLeft(remaining);

      if (remaining === 0) {
        onComplete?.();
      } else {
        timerRef.current = setTimeout(updateTimer, 100);
      }
    };

    timerRef.current = setTimeout(updateTimer, 100);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [duration, onComplete, isPaused]);

  // Sync with game timer if provided
  useEffect(() => {
    if (timerEnd) {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((timerEnd - now) / 1000));
      setTimeLeft(remaining);
      startTimeRef.current = Date.now() - (duration - remaining) * 1000;
    }
  }, [timerEnd, duration]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl'
  };

  const colorClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    accent: 'text-accent'
  };

  const progress = (timeLeft / duration) * 100;

  return (
    <div className="flex flex-col items-center gap-2">
      {label && (
        <span className="text-sm font-medium text-gray-500">{label}</span>
      )}
      <div className="relative">
        <motion.div
          className={cn(
            'font-bold font-basteleur',
            sizeClasses[size],
            colorClasses[color]
          )}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {formatTime(timeLeft)}
        </motion.div>
      </div>
    </div>
  );
}; 