import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface TextRevealProps {
  text: string;
  delay?: number;
  duration?: number;
  className?: string;
  staggerChildren?: number;
  ease?: string;
  onComplete?: () => void;
}

const TextReveal: React.FC<TextRevealProps> = ({
  text,
  delay = 0,
  duration = 0.5,
  className = '',
  staggerChildren = 0.03,
  ease = 'power2.inOut',
  onComplete
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    
    // Split text into characters or words
    const chars = text.split('');
    container.innerHTML = '';
    
    // Create a span for each character
    chars.forEach(char => {
      const span = document.createElement('span');
      span.className = 'text-reveal-char';
      span.style.display = 'inline-block';
      span.style.opacity = '0';
      span.style.transform = 'translateY(20px)';
      span.innerHTML = char === ' ' ? '&nbsp;' : char;
      container.appendChild(span);
    });
    
    // Animate each character
    const elements = container.querySelectorAll('.text-reveal-char');
    const tl = gsap.timeline({
      delay: delay,
      onComplete: onComplete
    });
    
    tl.to(elements, {
      opacity: 1,
      y: 0,
      duration: duration,
      stagger: staggerChildren,
      ease: ease
    });
    
    return () => {
      tl.kill();
    };
  }, [text, delay, duration, staggerChildren, ease, onComplete]);
  
  return (
    <div
      ref={containerRef}
      className={`text-reveal ${className}`}
      aria-label={text}
    />
  );
};

export default TextReveal; 