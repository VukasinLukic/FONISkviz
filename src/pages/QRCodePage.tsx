import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import gsap from 'gsap';
import TextReveal from '../components/TextReveal';
import AnimatedBackground from '../components/AnimatedBackground';
import Logo from '../components/Logo';

interface QRCodePageProps {}

const QRCodePage: React.FC<QRCodePageProps> = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const qrContainerRef = useRef<HTMLDivElement>(null);
  const gameCodeRef = useRef<HTMLDivElement>(null);
  const qrPulseRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [loaded, setLoaded] = useState(false);
  
  // Game code for the current session
  const [gameCode] = useState('FONIS123');
  
  // Full URL for joining the game
  const joinUrl = `${window.location.origin}/player?code=${gameCode}`;

  // Ensure components are loaded with a slight delay for proper animations
  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    if (!loaded) return;
    
    // GSAP animations for page elements
    const tl = gsap.timeline();
    
    tl.from(containerRef.current, { 
      duration: 0.8, 
      opacity: 0, 
      ease: "power2.inOut" 
    })
    .from(qrContainerRef.current, { 
      duration: 1, 
      scale: 0.8, 
      opacity: 0, 
      ease: "elastic.out(1, 0.5)" 
    }, "-=0.4")
    .from(gameCodeRef.current, { 
      duration: 0.8, 
      y: 30, 
      opacity: 0, 
      ease: "power2.out" 
    }, "-=0.6")
    .from(buttonRef.current, { 
      duration: 0.6, 
      scale: 0.8, 
      opacity: 0, 
      ease: "back.out(1.7)" 
    }, "-=0.2");
    
    // Add pulsing animation to highlight the QR code
    if (qrPulseRef.current) {
      gsap.to(qrPulseRef.current, {
        scale: 1.05,
        opacity: 0.4,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    }
    
    // Add attention-grabbing animation to the button
    if (buttonRef.current) {
      const buttonTl = gsap.timeline({ repeat: -1, repeatDelay: 3 });
      
      buttonTl.to(buttonRef.current, {
        scale: 1.05,
        duration: 0.5,
        ease: "power1.inOut",
        repeat: 3,
        yoyo: true
      })
      .to(buttonRef.current, {
        boxShadow: "0 0 12px 4px rgba(211, 83, 34, 0.6)",
        duration: 0.8,
        ease: "sine.inOut",
        repeat: 1,
        yoyo: true
      }, "-=2");
    }
    
    return () => {
      tl.kill();
      gsap.killTweensOf(qrPulseRef.current);
      gsap.killTweensOf(buttonRef.current);
    };
  }, [loaded, gameCode]);
  
  const handleGoToLobby = () => {
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        opacity: 0,
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: () => {
          navigate('/admin/lobby');
        }
      });
    } else {
      navigate('/admin/lobby');
    }
  };
  
  if (!loaded) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-accent border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-primary flex flex-col items-center justify-center relative overflow-hidden px-4"
    >
      {/* Logo at top */}
      <div className="absolute top-6 left-6">
        <Logo size="small" onClick={() => navigate('/admin')} />
      </div>
      
      {/* Heading */}
      <div className="mb-8">
        <TextReveal
          text="Join FONIS Quiz"
          className="text-4xl md:text-5xl font-bold text-accent font-basteleur"
          duration={0.8}
          delay={0.3}
        />
      </div>
      
      {/* QR Code Container with Frame */}
      <div
        ref={qrContainerRef}
        className="qr-frame relative bg-accent p-6 rounded-lg mb-8 shadow-lg shadow-secondary/20"
      >
        {/* Pulsing highlight effect */}
        <div 
          ref={qrPulseRef}
          className="absolute inset-0 bg-secondary rounded-lg -z-10 opacity-0"
        ></div>
        
        {/* Corner decorations */}
        <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-secondary rounded-tl-md"></div>
        <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-secondary rounded-tr-md"></div>
        <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-secondary rounded-bl-md"></div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-secondary rounded-br-md"></div>
        
        {/* QR Code */}
        <div className="bg-white p-4 rounded-md shadow-inner">
          <QRCode 
            value={joinUrl}
            size={256}
            level="H"
            fgColor="#5A1B09"
            bgColor="#FFFFFF"
          />
        </div>
      </div>
      
      {/* Game Code */}
      <div 
        ref={gameCodeRef}
        className="game-code-container mb-8 text-center"
      >
        <h2 className="text-xl font-semibold text-accent mb-2">
          Game Code
        </h2>
        <div className="game-code bg-secondary px-8 py-3 rounded-md text-3xl font-bold tracking-wider font-caviar text-white shadow-md">
          {gameCode}
        </div>
      </div>
      
      {/* Instructions */}
      <div className="mb-8 max-w-md text-center">
        <TextReveal
          text="Skenirajte QR kod svojim mobilnim uređajem"
          className="text-center text-accent mb-1"
          duration={0.6}
          delay={1.2}
          staggerChildren={0.02}
        />
        <TextReveal
          text="da biste se pridružili kvizu"
          className="text-center text-accent mb-1 opacity-90"
          duration={0.6}
          delay={1.6}
          staggerChildren={0.02}
        />
      </div>
      
      {/* Button */}
      <button 
        ref={buttonRef}
        className="lobby-button bg-secondary hover:bg-secondary/90 text-white font-bold py-4 px-12 rounded-md transition-all duration-300 flex items-center justify-center shadow-md text-lg"
        onClick={handleGoToLobby}
      >
        GO TO LOBBY
        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </button>
      
      {/* Connected players indicator */}
      <div className="mt-6 flex items-center text-accent">
        <div className="h-2 w-2 rounded-full bg-highlight animate-pulse mr-2"></div>
        <span className="text-sm opacity-80">4 teams connected</span>
      </div>
      
      {/* Decorative background */}
      <AnimatedBackground density="medium" color="primary" />
    </div>
  );
};

export default QRCodePage; 