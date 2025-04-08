import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import Logo from '../components/Logo';
import AnimatedBackground from '../components/AnimatedBackground';

interface SplashScreenProps {}

const SplashScreen: React.FC<SplashScreenProps> = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  
  // Ensure the component is fully mounted before starting animations
  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);
  
  // Handle navigation after animation completes
  useEffect(() => {
    if (animationComplete) {
      const navigateTimer = setTimeout(() => {
        navigate('/admin/qrcode');
      }, 500);
      return () => clearTimeout(navigateTimer);
    }
  }, [animationComplete, navigate]);
  
  useEffect(() => {
    if (!loaded) return;
    
    // Timeline for the splash screen animation
    const tl = gsap.timeline({
      onComplete: () => {
        setAnimationComplete(true);
      }
    });
    
    // Main animation sequence
    tl.from(containerRef.current, {
      duration: 0.8,
      opacity: 0, 
      ease: "power2.inOut",
    })
    .from(contentRef.current, { 
      duration: 1.2, 
      scale: 0.5, 
      opacity: 0, 
      ease: "elastic.out(1, 0.75)",
    })
    .to(contentRef.current, { 
      duration: 0.8, 
      scale: 1.2, 
      opacity: 0, 
      ease: "power2.in",
      delay: 1.8
    })
    .to(containerRef.current, { 
      duration: 0.6, 
      backgroundColor: "#5A1B09", 
      ease: "power2.inOut",
    }, "-=0.4");
    
    // Add decorative animations
    gsap.to(".decorative-element", {
      scale: 1.2,
      rotation: "+=10",
      opacity: 0.8,
      stagger: 0.05,
      duration: 2,
      ease: "sine.inOut",
      repeat: 1,
      yoyo: true,
      delay: 1
    });
    
    return () => {
      // Clean up animation
      tl.kill();
    };
  }, [loaded]);
  
  return (
    <div 
      ref={containerRef} 
      className="min-h-screen bg-accent flex flex-col items-center justify-center overflow-hidden relative transition-colors duration-500"
    >
      <div ref={contentRef} className="content-container relative z-10">
        <Logo size="large" animate={true} />
      </div>
      
      {/* Decorative background */}
      <AnimatedBackground density="high" color="accent" />
    </div>
  );
};

export default SplashScreen;
