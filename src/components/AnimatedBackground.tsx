import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface AnimatedBackgroundProps {
  density?: 'low' | 'medium' | 'high';
  animated?: boolean;
  color?: 'primary' | 'secondary' | 'accent';
  className?: string;
}

interface DecorativeItem {
  src: string;
  fallback?: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  rotate: number;
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  density = 'medium',
  animated = true,
  color = 'accent',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imagesFailed, setImagesFailed] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);
  
  // Define decorative elements with fallback patterns
  const decorativeItems: DecorativeItem[] = [
    { src: `${window.location.origin}/assets/dodaci/Layer_1-1.svg`, fallback: `${window.location.origin}/assets/pattern6 1.svg`, top: '10%', left: '5%', rotate: 15 },
    { src: `${window.location.origin}/assets/dodaci/Layer_1-2.svg`, fallback: `${window.location.origin}/assets/pattern7 1.svg`, top: '20%', right: '10%', rotate: -10 },
    { src: `${window.location.origin}/assets/dodaci/Layer_1-3.svg`, fallback: `${window.location.origin}/assets/pattern8 1.svg`, bottom: '15%', left: '8%', rotate: 20 },
    { src: `${window.location.origin}/assets/dodaci/Layer_1-4.svg`, fallback: `${window.location.origin}/assets/pattern11 1.svg`, bottom: '25%', right: '5%', rotate: -20 },
    { src: `${window.location.origin}/assets/dodaci/Layer_1-5.svg`, fallback: `${window.location.origin}/assets/pattern12 1.svg`, top: '40%', left: '15%', rotate: 5 },
    { src: `${window.location.origin}/assets/dodaci/Layer_1-6.svg`, fallback: `${window.location.origin}/assets/pattern-01 1.svg`, top: '60%', right: '15%', rotate: -5 },
    { src: `${window.location.origin}/assets/dodaci/Layer_1-7.svg`, fallback: `${window.location.origin}/assets/pattern-03 1.svg`, bottom: '40%', left: '25%', rotate: 15 },
    { src: `${window.location.origin}/assets/dodaci/Layer_1-8.svg`, fallback: `${window.location.origin}/assets/pattern-04 1.svg`, top: '15%', left: '35%', rotate: -15 },
    { src: `${window.location.origin}/assets/dodaci/Layer_1-9.svg`, fallback: `${window.location.origin}/assets/pattern-09 1.svg`, bottom: '10%', right: '30%', rotate: 10 },
    { src: `${window.location.origin}/assets/dodaci/Layer_1-10.svg`, fallback: `${window.location.origin}/assets/pattern-10 1.svg`, top: '30%', right: '35%', rotate: -10 },
    { src: `${window.location.origin}/assets/dodaci/Layer_1-11.svg`, fallback: `${window.location.origin}/assets/pattern-13 1.svg`, bottom: '30%', right: '20%', rotate: 0 },
    { src: `${window.location.origin}/assets/dodaci/Layer_1.svg`, fallback: `${window.location.origin}/assets/pattern-14 1.svg`, top: '5%', right: '25%', rotate: 5 },
  ];
  
  // Additional decorative patterns
  const patterns: DecorativeItem[] = [
    { src: `${window.location.origin}/assets/pattern-15 1.svg`, top: '70%', left: '18%', rotate: 8 },
    { src: `${window.location.origin}/assets/pattern-16 1.svg`, top: '45%', right: '22%', rotate: -8 },
  ];
  
  // Determine how many items to show based on density
  const itemCount = {
    low: 6,
    medium: 10,
    high: 14
  };
  
  // Determine opacity and size based on color
  const opacityClass = {
    primary: 'opacity-50',
    secondary: 'opacity-40',
    accent: 'opacity-60'
  };
  
  const sizeClass = {
    primary: 'w-16 h-16 md:w-20 md:h-20',
    secondary: 'w-14 h-14 md:w-18 md:h-18',
    accent: 'w-18 h-18 md:w-24 md:h-24'
  };
  
  // Handle image error by using fallback
  const handleImageError = (src: string) => {
    setImagesFailed(prev => ({...prev, [src]: true}));
  };
  
  // Get random items based on density
  const getRandomItems = () => {
    // Combine regular items with some patterns for more variety
    const allItems = [...decorativeItems, ...(density === 'high' ? patterns : [])];
    const shuffled = [...allItems].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, itemCount[density]);
  };
  
  // The items to display
  const itemsToShow = getRandomItems();
  
  // Preload images and set loaded state
  useEffect(() => {
    const allImages = [
      ...decorativeItems.map(item => item.src), 
      ...decorativeItems.map(item => item.fallback || '').filter(Boolean),
      ...patterns.map(item => item.src)
    ];
    
    const promises = allImages.map(src => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = src;
      });
    });
    
    Promise.all(promises).then(() => {
      setLoaded(true);
    });
  }, []);
  
  useEffect(() => {
    if (!loaded || !animated || !containerRef.current) return;
    
    // Animate decorative elements
    gsap.from(".decorative-element", {
      duration: 1.2,
      opacity: 0,
      scale: 0,
      stagger: 0.15,
      ease: "back.out(2)",
      delay: 0.5
    });
    
    // Add floating animation to elements
    gsap.utils.toArray(".decorative-element").forEach((el: any, i) => {
      gsap.to(el, {
        y: (i % 2 === 0) ? "+=20" : "-=20",
        x: (i % 3 === 0) ? "+=10" : "-=10",
        rotation: `+=${(i % 2 === 0 ? 5 : -5)}`,
        duration: 3 + i % 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: i * 0.1
      });
    });
  }, [animated, loaded]);
  
  if (!loaded) return null;
  
  return (
    <div 
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
    >
      {itemsToShow.map((item, index) => (
        <img 
          key={index}
          src={imagesFailed[item.src] ? item.fallback || item.src : item.src}
          alt=""
          className={`decorative-element absolute ${sizeClass[color]} ${opacityClass[color]}`}
          style={{
            top: item.top,
            left: item.left,
            right: item.right,
            bottom: item.bottom,
            transform: `rotate(${item.rotate}deg)`,
            filter: 'drop-shadow(0 3px 5px rgba(0, 0, 0, 0.1))'
          }}
          onError={() => handleImageError(item.src)}
        />
      ))}
    </div>
  );
};

export default AnimatedBackground; 