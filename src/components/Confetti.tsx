import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface ConfettiProps {
  count?: number;
  duration?: number;
  active?: boolean;
}

const Confetti: React.FC<ConfettiProps> = ({ 
  count = 100, 
  duration = 3,
  active = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!active || !containerRef.current) return;
    
    const container = containerRef.current;
    const confettiElements: HTMLElement[] = [];
    const colors = ['#D35322', '#FCE4BC', '#BFC330', '#C40B61', '#5A1B09'];
    
    // Create confetti pieces
    for (let i = 0; i < count; i++) {
      const element = document.createElement('div');
      element.className = 'confetti-piece';
      element.style.position = 'absolute';
      element.style.width = `${Math.random() * 10 + 5}px`;
      element.style.height = `${Math.random() * 10 + 5}px`;
      element.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
      element.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      element.style.top = '0';
      element.style.left = `${Math.random() * 100}%`;
      element.style.opacity = '1';
      
      container.appendChild(element);
      confettiElements.push(element);
      
      // Animate each piece
      gsap.to(element, {
        y: container.clientHeight,
        x: `+=${(Math.random() - 0.5) * 200}`,
        rotation: Math.random() * 360,
        opacity: 0,
        duration: Math.random() * duration + 1,
        ease: 'power2.out',
        onComplete: () => {
          if (container.contains(element)) {
            container.removeChild(element);
          }
        }
      });
    }
    
    return () => {
      // Clean up any remaining confetti elements
      confettiElements.forEach(element => {
        if (container.contains(element)) {
          container.removeChild(element);
        }
      });
    };
  }, [count, duration, active]);
  
  return (
    <div
      ref={containerRef}
      className="confetti-container absolute inset-0 pointer-events-none overflow-hidden z-50"
    />
  );
};

export default Confetti; 