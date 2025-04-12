import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

interface AnimatedBackgroundProps {
  density?: 'low' | 'medium' | 'high';
  color?: 'primary' | 'secondary' | 'accent' | 'highlight' | 'special';
}

interface DecorationElement {
  id: number;
  src: string;
  x: string;
  y: string;
  size: number;
  rotate: number;
  delay: number;
  duration: number;
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  density = 'medium',
  color = 'primary'
}) => {
  const [decorations, setDecorations] = useState<DecorationElement[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Browser detection for optimizations
  const isIE = /*@cc_on!@*/false || !!(document as any).documentMode;
  const isEdge = !isIE && !!((window as any).StyleMedia);
  const isFirefox = typeof (window as any).InstallTrigger !== 'undefined';
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  // Define decorative elements
  const decorativeElements = [
    '/assets/dodaci/Layer_1-1.svg',
    '/assets/dodaci/Layer_1-2.svg',
    '/assets/dodaci/Layer_1-3.svg',
    '/assets/dodaci/Layer_1-4.svg',
    '/assets/dodaci/Layer_1-5.svg',
    '/assets/dodaci/Layer_1-6.svg',
    '/assets/dodaci/Layer_1-7.svg',
    '/assets/dodaci/Layer_1-8.svg',
    '/assets/dodaci/Layer_1-9.svg',
    '/assets/dodaci/Layer_1-10.svg',
    '/assets/dodaci/Layer_1-11.svg',
    '/assets/dodaci/Layer_1.svg'
  ];
  
  // Generate random decorations
  useEffect(() => {
    // Adjust quantity based on browser and performance capabilities
    let adjustedCount = density === 'low' ? 8 : density === 'medium' ? 15 : 25;
    
    // Reduce elements for older browsers or Safari which has some animation performance issues
    if (isIE || isEdge) {
      adjustedCount = Math.floor(adjustedCount * 0.5); // 50% reduction for IE/Edge
    } else if (isSafari) {
      adjustedCount = Math.floor(adjustedCount * 0.7); // 30% reduction for Safari
    }
    
    const elements: DecorationElement[] = [];
    
    for (let i = 0; i < adjustedCount; i++) {
      const randomElement = decorativeElements[Math.floor(Math.random() * decorativeElements.length)];
      elements.push({
        id: i,
        src: randomElement,
        x: `${Math.random() * 100}%`,
        y: `${Math.random() * 100}%`,
        size: Math.random() * 60 + 20, // 20-80px
        rotate: Math.random() * 360,
        delay: Math.random() * 5,
        duration: Math.random() * 20 + 10 // 10-30s
      });
    }
    
    setDecorations(elements);
    
    // Just set decorations to empty instead of manually removing DOM elements
    return () => {
      // Clean up by unmounting via state rather than direct DOM manipulation
      setDecorations([]);
    };
  }, [density, isIE, isEdge, isSafari]);
  
  // Get appropriate filter value for color
  const getColorFilter = (colorName: string) => {
    switch (colorName) {
      case 'secondary': return 'hue-rotate(20deg)';
      case 'accent': return 'hue-rotate(60deg)';
      case 'highlight': return 'hue-rotate(120deg)';
      case 'special': return 'hue-rotate(180deg)';
      default: return 'none';
    }
  };
  
  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 overflow-hidden z-0 pointer-events-none"
      style={{ willChange: 'transform' }} // Hint to browser for optimization
    >
      {decorations.map((decoration) => (
        <motion.div
          key={decoration.id}
          className="absolute"
          style={{
            top: decoration.y,
            left: decoration.x,
            width: decoration.size,
            height: decoration.size,
            willChange: 'transform, opacity' // Better performance hint
          }}
          initial={{ opacity: 0, scale: 0, rotate: decoration.rotate }}
          animate={{ 
            opacity: [0, 0.7, 0.5, 0.7], 
            scale: [0, 1, 0.9, 1],
            rotate: [decoration.rotate, decoration.rotate + 360]
          }}
          transition={{
            opacity: { 
              duration: decoration.duration / 4, 
              times: [0, 0.2, 0.5, 1],
              repeat: Infinity,
              repeatType: 'reverse',
              delay: decoration.delay
            },
            scale: {
              duration: decoration.duration / 3,
              times: [0, 0.3, 0.7, 1],
              repeat: Infinity,
              repeatType: 'reverse', 
              delay: decoration.delay
            },
            rotate: {
              duration: decoration.duration,
              repeat: Infinity,
              ease: 'linear',
              delay: decoration.delay
            }
          }}
        >
          <img 
            src={decoration.src} 
            alt=""
            aria-hidden="true"
            className="w-full h-full object-contain"
            style={{ 
              filter: color !== 'primary' ? getColorFilter(color) : 'none',
              // Force hardware acceleration for Safari
              transform: isSafari ? 'translateZ(0)' : 'none',
              // Add vendor prefixes if needed
              WebkitFilter: color !== 'primary' ? getColorFilter(color) : 'none'
            }}
            // Preload important images for better performance
            loading="lazy"
            onError={(e) => {
              // Fallback for image loading errors
              const target = e.currentTarget;
              target.style.display = 'none';
            }}
          />
        </motion.div>
      ))}
    </div>
  );
};

export default AnimatedBackground; 