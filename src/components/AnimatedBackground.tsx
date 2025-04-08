import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

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
    const count = density === 'low' ? 8 : density === 'medium' ? 15 : 25;
    const elements: DecorationElement[] = [];
    
    for (let i = 0; i < count; i++) {
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
  }, [density]);
  
  return (
    <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
      {decorations.map((decoration) => (
        <motion.div
          key={decoration.id}
          className="absolute"
          style={{
            top: decoration.y,
            left: decoration.x,
            width: decoration.size,
            height: decoration.size
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
            alt="Decoration" 
            className="w-full h-full object-contain"
            style={{ 
              filter: color !== 'primary' ? 
                `hue-rotate(${
                  color === 'secondary' ? '20deg' : 
                  color === 'accent' ? '60deg' : 
                  color === 'highlight' ? '120deg' : 
                  color === 'special' ? '180deg' : '0deg'
                })` : 'none' 
            }}
          />
        </motion.div>
      ))}
    </div>
  );
};

export default AnimatedBackground; 