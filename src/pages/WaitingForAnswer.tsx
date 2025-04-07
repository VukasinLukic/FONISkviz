import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface WaitingForAnswerProps {}

const WaitingForAnswer: React.FC<WaitingForAnswerProps> = () => {
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
  
  // Auto-navigacija nakon vremena za čekanje (simulacija)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isPlayerRoute) {
        navigate('/player/points');
      } else {
        navigate('/points');
      }
    }, 3000); // Ovo bi bilo duže u stvarnoj implementaciji
    
    return () => clearTimeout(timer);
  }, [navigate, isPlayerRoute]);

  return (
    <div className="min-h-screen bg-accent p-4 flex flex-col items-center justify-center">
      <h2 className="text-primary text-2xl font-bold mb-8">
        Odgovor je poslat!
      </h2>
      
      <p className="text-primary text-xl mb-8">
        Čekamo da svi timovi odgovore{dots}
      </p>
      
      {/* Ovde bi trebalo da bude animacija maskote */}
      <div className="w-64 h-64 bg-secondary bg-opacity-20 rounded-full flex items-center justify-center">
        <p className="text-primary">Animacija maskote</p>
      </div>
    </div>
  );
};

export default WaitingForAnswer; 