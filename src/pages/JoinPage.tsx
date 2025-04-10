import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useGameContext } from '../context/GameContext';
import MainButton from '../components/MainButton';

const JoinPage: React.FC = () => {
  const [teamName, setTeamName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [qrScanned, setQrScanned] = useState(false);
  const [gameCode, setGameCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { registerTeam, resetGame } = useGameContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // Function to handle resetting the game state
  const handleReset = () => {
    resetGame();
    // Also reset local component state
    setQrScanned(false);
    setGameCode('');
    setTeamName('');
    setError(null);
    // Force page reload to ensure clean state
    window.location.reload();
  };
  
  // Check for game code in URL parameter
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setGameCode(codeFromUrl);
      
      // Store the gameCode in localStorage immediately
      localStorage.setItem('latestGameCode', codeFromUrl);
      
      setQrScanned(true); // Skip scanner if we have a code
    }
  }, [searchParams]);
  
  // Detektujemo da li smo na player/* ruti
  const isPlayerRoute = location.pathname.startsWith('/player');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    
    if (teamName.trim() && !isLoading) {
      setIsLoading(true);
      try {
        // Ensure we have a gameCode
        if (!gameCode) {
          // Try to get from localStorage as fallback
          const savedCode = localStorage.getItem('latestGameCode');
          if (savedCode) {
            setGameCode(savedCode);
          } else {
            throw new Error("No game code available. Please scan the QR code again.");
          }
        }
        
        console.log(`Registering team "${teamName}" with game code: ${gameCode}`);
        await registerTeam(teamName.trim(), 1, gameCode);
        
        console.log("Team registered successfully, navigating to mascot selection");
        // Always navigate to player/mascot since that's the correct route
        navigate('/player/mascot');
      } catch (error) {
        console.error('Error registering team:', error);
        setError(error instanceof Error ? error.message : "Failed to register team. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleScanQRCode = () => {
    // Check if the browser supports the camera API
    if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      setShowScanner(true);
    } else {
      alert('Vaš pretraživač ne podržava pristup kameri.');
    }
  };

  // Use useEffect to start scanner when showScanner state changes
  useEffect(() => {
    if (showScanner) {
      const startScanner = () => {
        // Request camera access when the component mounts
        const video = document.getElementById('qr-video') as HTMLVideoElement;
        
        if (video) {
          navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(stream => {
              video.srcObject = stream;
              video.play();
              
              // Process video frames to detect QR code (this would need a QR code library)
              // For now we'll just mock this functionality with a button
              // In production, you would use a library like jsQR or QR Scanner
            })
            .catch(err => {
              console.error("Error accessing camera:", err);
              alert("Greška pri pristupu kameri: " + err.message);
              setShowScanner(false);
            });
        }
      };
      
      // Small timeout to ensure the video element is rendered
      setTimeout(startScanner, 100);
    }
  }, [showScanner]);

  const closeScanner = () => {
    // Close the camera stream when closing the scanner
    const video = document.getElementById('qr-video') as HTMLVideoElement;
    if (video && video.srcObject) {
      const stream = video.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      video.srcObject = null;
    }
    setShowScanner(false);
  };

  // Mock function to simulate scanning a code
  const mockScanCompleted = () => {
    closeScanner();
    
    // In a real implementation, you would parse the QR code value
    // and extract the game code
    const mockGameCode = "GAME" + Math.floor(Math.random() * 10000);
    setGameCode(mockGameCode);
    
    // Store the gameCode in localStorage immediately
    localStorage.setItem('latestGameCode', mockGameCode);
    
    setQrScanned(true);
  };

  // Process URL directly if loaded with a code in the URL
  const enterGameCodeManually = () => {
    const code = prompt("Enter the game code:", "");
    if (code && code.trim() !== "") {
      const upperCode = code.trim().toUpperCase();
      setGameCode(upperCode);
      
      // Store the gameCode in localStorage immediately
      localStorage.setItem('latestGameCode', upperCode);
      
      setQrScanned(true);
    }
  };

  return (
    <div className="min-h-screen bg-accent p-4 flex flex-col items-center justify-center">
      {/* Reset button at the top */}
      <div className="absolute top-4 right-4">
        <button 
          onClick={handleReset}
          className="bg-primary text-white text-sm px-3 py-1 rounded-full shadow-md"
        >
          Resetuj
        </button>
      </div>
      
      <img 
        src="/assets/logo.svg" 
        alt="Kviz Logo" 
        className="w-48 mb-8"
      />
      
      {showScanner ? (
        <div className="fixed inset-0 z-50 bg-primary bg-opacity-90 flex flex-col items-center justify-center p-4">
          <div className="bg-accent rounded-lg p-4 w-full max-w-md flex flex-col items-center">
            <h2 className="text-primary font-bold text-2xl mb-4 font-basteleur">Skeniraj QR kod</h2>
            
            <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden mb-4">
              <video id="qr-video" className="absolute inset-0 w-full h-full object-cover"></video>
              <div className="absolute inset-0 border-2 border-secondary rounded-lg pointer-events-none"></div>
            </div>
            
            <div className="flex gap-4 w-full">
              <button 
                onClick={closeScanner}
                className="flex-1 py-3 px-4 bg-primary text-white font-bold rounded-lg"
              >
                Zatvori
              </button>
              
              {/* This button is just for demo purposes, in a real app the QR scanning would happen automatically */}
              <button 
                onClick={mockScanCompleted}
                className="flex-1 py-3 px-4 bg-secondary text-white font-bold rounded-lg"
              >
                Test Scan
              </button>
            </div>
          </div>
        </div>
      ) : qrScanned ? (
        <>
          <div className="w-full max-w-md mb-6 text-center">
            <h2 className="text-primary font-bold text-2xl mb-2 font-basteleur">Kod igre: {gameCode}</h2>
            <p className="text-primary">Uspešno ste skenirali QR kod. Unesite ime vašeg tima da biste se pridružili kvizu.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="w-full max-w-md">
            <div className="mb-6">
              <label htmlFor="teamName" className="block text-primary mb-2 font-bold text-3xl text-center font-basteleur">
                unesite ime tima:
              </label>
              <input
                type="text"
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full p-3 border-2 border-secondary rounded-lg focus:outline-none focus:border-primary bg-accent text-primary font-caviar"
                placeholder="ime tima..."
                required
                disabled={isLoading}
              />
            </div>

            {/* Display error message if any */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            
            <MainButton type="submit" disabled={!teamName.trim() || isLoading}>
              <span className="font-caviar">{isLoading ? 'učitavanje...' : 'pridruži se kvizu'}</span>
            </MainButton>
          </form>
        </>
      ) : (
        <div className="w-full max-w-md flex flex-col items-center justify-center">
          <h2 className="text-primary font-bold text-3xl mb-8 text-center font-basteleur">
            Pridruži se FONIS kvizu
          </h2>
          
          <button 
            onClick={handleScanQRCode}
            className="w-full p-4 bg-secondary text-white rounded-lg font-bold font-caviar flex items-center justify-center text-xl mb-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Skeniraj QR kod
          </button>
          
          <button 
            onClick={enterGameCodeManually}
            className="w-full p-3 border-2 border-primary text-primary rounded-lg font-bold font-caviar flex items-center justify-center mb-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Unesi kod ručno
          </button>
          
          <p className="mt-2 text-primary text-center">
            Skenirajte QR kod koji je prikazan na glavnom ekranu da biste se pridružili kvizu
          </p>
        </div>
      )}
    </div>
  );
};

export default JoinPage; 