import { useRef, useEffect } from 'react';
import gsap from 'gsap';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  animate?: boolean;
  className?: string;
  onClick?: () => void;
}

const Logo: React.FC<LogoProps> = ({
  size = 'large',
  animate = false,
  className = '',
  onClick
}) => {
  const logoRef = useRef<HTMLImageElement>(null);
  
  // Set sizes based on props
  const sizeClasses = {
    small: 'w-10 h-10',
    medium: 'w-16 h-16',
    large: 'w-64 h-64'
  };
  
  useEffect(() => {
    if (animate && logoRef.current) {
      // Initial animation
      gsap.from(logoRef.current, {
        opacity: 0,
        scale: 0.8,
        duration: 0.8,
        ease: "elastic.out(1, 0.5)"
      });
      
      // Subtle floating animation
      gsap.to(logoRef.current, {
        y: "-=10",
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    }
  }, [animate]);
  
  return (
    <div 
      className={`logo-container ${className} p-0 m-0`}
      onClick={onClick}
    >
      <img 
        ref={logoRef}
        src={`${window.location.origin}/assets/logo.svg`}
        alt="FONIS Quiz Logo" 
        className={`${sizeClasses[size]} object-contain transition-transform ${onClick ? 'cursor-pointer hover:scale-105' : ''}`}
      />
    </div>
  );
};

export default Logo; 