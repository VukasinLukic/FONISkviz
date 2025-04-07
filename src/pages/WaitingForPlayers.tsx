import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface WaitingForPlayersProps {}

const WaitingForPlayers: React.FC<WaitingForPlayersProps> = () => {
  const [teamName] = useState('Vaš Tim'); // Ovo bi trebalo da dođe iz konteksta ili URL-a
  const [dots, setDots] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  
  // Detektujemo da li smo na player/* ruti
  const isPlayerRoute = location.pathname.startsWith('/player');

  // Simuliramo animaciju tačkica za čekanje
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  // Simulacija auto-navigacije kada "admin" pokrene kviz
  useEffect(() => {
    // Ovo bi u stvarnosti bilo triggterovano od strane Firebase-a ili nekog drugog servisa
    const timer = setTimeout(() => {
      if (isPlayerRoute) {
        navigate('/player/quiz-starting');
      } else {
        navigate('/quiz-starting');
      }
    }, 10000); // 10 sekundi za demo, u stvarnosti bi bilo kada admin pokrene kviz
    
    return () => clearTimeout(timer);
  }, [navigate, isPlayerRoute]);

  return (
    <div className="min-h-screen bg-accent p-4 flex flex-col items-center justify-center">
      <div className="mb-8 text-center">
        <h1 className="text-primary text-2xl font-bold mb-2">
          {teamName}
        </h1>
        <p className="text-primary text-xl">
          Čekamo da svi timovi budu spremni{dots}
        </p>
      </div>
      
      {/* Ovde bi trebalo da bude prikaz maskote tima */}
      <div className="w-64 h-64 bg-secondary bg-opacity-20 rounded-full flex items-center justify-center">
        <p className="text-primary">Maskota tima</p>
      </div>
    </div>
  );
};

export default WaitingForPlayers; 