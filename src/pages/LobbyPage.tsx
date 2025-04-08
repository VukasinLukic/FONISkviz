import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import CircularProgressBar from '../components/CircularProgressBar';
import Logo from '../components/Logo';
import AnimatedBackground from '../components/AnimatedBackground';

interface Team {
  id: string;
  name: string;
  mascot: number;
  readyToPlay: boolean;
}

interface LobbyPageProps {}

const LobbyPage: React.FC<LobbyPageProps> = () => {
  const navigate = useNavigate();
  const [gameTime, setGameTime] = useState(290); // 4:50 in seconds
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [gameCode] = useState('FONIS123'); // Game code for the current session
  const [teams, setTeams] = useState<Team[]>([
    { id: '1', name: 'Team Awesome', mascot: 1, readyToPlay: true },
    { id: '2', name: 'Quiz Masters', mascot: 3, readyToPlay: true },
    { id: '3', name: 'Brain Storm', mascot: 7, readyToPlay: true },
    { id: '4', name: 'Smart Pandas', mascot: 4, readyToPlay: true }
  ]);
  const [loaded, setLoaded] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const teamsGridRef = useRef<HTMLDivElement>(null);
  
  // Format time as MM:SS
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  // Ensure components are loaded with a slight delay for proper animations
  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);
  
  // Timer effect
  useEffect(() => {
    if (!loaded) return;
    
    const timer = setInterval(() => {
      setGameTime((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [loaded]);
  
  // GSAP animation
  useEffect(() => {
    if (!loaded) return;
    
    // Initial animation
    const tl = gsap.timeline();
    
    tl.from(containerRef.current, {
      duration: 0.8,
      opacity: 0,
      ease: "power2.inOut"
    })
    .from(".lobby-header", {
      duration: 0.6,
      y: -30,
      opacity: 0,
      ease: "back.out(1.7)"
    }, "-=0.4")
    .from(timeRef.current, {
      duration: 0.6,
      scale: 0.8,
      opacity: 0,
      ease: "power2.out"
    }, "-=0.3")
    .from(controlsRef.current, {
      duration: 0.6,
      y: 20,
      opacity: 0,
      ease: "back.out(1.7)"
    }, "-=0.3")
    .from(teamsGridRef.current, {
      duration: 0.8,
      opacity: 0,
      ease: "power2.inOut"
    }, "-=0.4")
    .from(".team-card", {
      duration: 0.8,
      scale: 0.9,
      opacity: 0,
      stagger: 0.15,
      ease: "elastic.out(1, 0.5)"
    }, "-=0.6")
    .from(".control-button", {
      duration: 0.5,
      y: 20,
      opacity: 0,
      stagger: 0.1,
      ease: "back.out(1.7)"
    }, "-=0.7")
    .from(".waiting-text", {
      duration: 0.6,
      opacity: 0,
      ease: "power2.inOut"
    }, "-=0.3")
    .from(".game-code-display", {
      duration: 0.6,
      opacity: 0,
      y: 20,
      ease: "power2.out"
    }, "-=0.4")
    .from(".progress-indicator", {
      duration: 0.6,
      scale: 0.8,
      opacity: 0,
      ease: "back.out(1.7)"
    }, "-=0.3");
    
    // Pulse animation for the timer
    gsap.to(timeRef.current, {
      scale: 1.05,
      duration: 0.5,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut"
    });

    // Subtle hover effect for team cards
    gsap.utils.toArray(".team-card").forEach((card: any) => {
      card.addEventListener("mouseenter", () => {
        gsap.to(card, { 
          scale: 1.02, 
          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
          duration: 0.2 
        });
      });
      
      card.addEventListener("mouseleave", () => {
        gsap.to(card, { 
          scale: 1, 
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
          duration: 0.2 
        });
      });
    });
    
    // Add pulsing animation to Start Game button
    const startButton = document.querySelector(".control-button.bg-highlight") as HTMLElement;
    if (startButton) {
      const startBtnTl = gsap.timeline({ repeat: -1, repeatDelay: 5 });
      
      startBtnTl.to(startButton, {
        scale: 1.05,
        duration: 0.5,
        ease: "power1.inOut",
        repeat: 2,
        yoyo: true
      })
      .to(startButton, {
        boxShadow: "0 0 12px 4px rgba(191, 195, 48, 0.6)",
        duration: 0.8,
        ease: "sine.inOut",
        repeat: 1,
        yoyo: true
      }, "-=1.5");
    }
    
    return () => {
      tl.kill();
      gsap.killTweensOf(timeRef.current);
      gsap.killTweensOf(".team-card");
      gsap.killTweensOf(".control-button.bg-highlight");
    };
  }, [loaded]);
  
  const handleStartGame = () => {
    gsap.to(containerRef.current, {
      opacity: 0,
      duration: 0.5,
      ease: "power2.inOut",
      onComplete: () => {
        navigate('/admin/category');
      }
    });
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
      className="min-h-screen bg-primary flex flex-col px-6 py-8 relative overflow-hidden"
    >
      {/* Logo at top */}
      <div className="absolute top-6 left-6">
        <Logo size="small" onClick={() => navigate('/admin')} />
      </div>

      {/* Header with quiz name and timer */}
      <div className="lobby-header flex justify-between items-center mb-12 mt-6">
        <h1 className="text-4xl font-bold text-accent font-mainstay">FONIS Quiz</h1>
        <div 
          ref={timeRef} 
          className="timer bg-secondary bg-opacity-90 text-white px-6 py-2 rounded-md text-2xl font-bold shadow-md"
        >
          {formatTime(gameTime)}
        </div>
      </div>
      
      {/* Control buttons and progress */}
      <div ref={controlsRef} className="flex justify-between items-center mb-8">
        <div className="progress-indicator flex items-center bg-accent bg-opacity-30 p-2 rounded-lg">
          <CircularProgressBar
            value={12.5 * currentQuestion}
            currentStep={currentQuestion}
            totalSteps={8}
            size={60}
            showLabel={true}
          />
          <span className="ml-3 text-accent font-semibold">Question {currentQuestion}/8</span>
        </div>
        
        <div className="control-buttons flex gap-4">
          <button 
            className="control-button bg-special hover:bg-opacity-90 text-white py-2 px-6 rounded-md font-bold transition-all duration-300 shadow-md flex items-center"
            onClick={() => {}}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset
          </button>
          <button 
            className="control-button bg-highlight hover:bg-opacity-90 text-white py-2 px-6 rounded-md font-bold transition-all duration-300 shadow-md flex items-center"
            onClick={handleStartGame}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Start Game
          </button>
        </div>
      </div>
      
      {/* Team cards grid */}
      <div ref={teamsGridRef} className="teams-grid grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {teams.map(team => (
          <div
            key={team.id}
            className="team-card bg-accent rounded-lg p-5 flex items-center shadow-md transition-all duration-300 hover:shadow-lg border-l-4 border-secondary"
          >
            <div className="mascot-container bg-primary bg-opacity-20 rounded-full p-3 mr-4 shadow-inner">
              <img 
                src={`${window.location.origin}/assets/maskota${team.mascot} 1.svg`}
                alt={`Mascot for ${team.name}`}
                className="w-14 h-14"
                onError={(e) => {
                  // Fallback if mascot image fails to load
                  e.currentTarget.src = `${window.location.origin}/assets/logo.svg`;
                }}
              />
            </div>
            <div className="team-info flex-1">
              <h3 className="text-primary font-bold text-xl">{team.name}</h3>
              <div className="status flex items-center mt-2">
                <span className="h-3 w-3 rounded-full bg-highlight mr-2 animate-pulse"></span>
                <span className="text-sm text-primary opacity-75 font-medium">Ready to play</span>
              </div>
            </div>
            <div className="ml-4 text-sm text-primary opacity-70 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              2m ago
            </div>
          </div>
        ))}
      </div>
      
      {/* Waiting text */}
      <div className="waiting-text text-center text-accent opacity-80 mb-6 bg-primary bg-opacity-40 py-3 px-6 rounded-lg inline-block mx-auto">
        <div className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Waiting for host to start the game...
        </div>
      </div>
      
      {/* Game code display */}
      <div className="game-code-display mt-auto">
        <h3 className="text-center text-lg font-semibold text-accent mb-2">
          Game Code
        </h3>
        <div className="code-display bg-secondary px-6 py-3 rounded-md text-2xl font-bold text-center text-white font-caviar tracking-wider mb-2 shadow-md mx-auto max-w-xs">
          {gameCode}
        </div>
        <p className="text-center text-accent text-sm opacity-75 max-w-md mx-auto">
          Skenirajte QR kod svojim mobilnim uređajem da biste se pridružili kvizu
        </p>
      </div>
      
      {/* Decorative background */}
      <AnimatedBackground density="low" color="primary" />
    </div>
  );
};

export default LobbyPage; 