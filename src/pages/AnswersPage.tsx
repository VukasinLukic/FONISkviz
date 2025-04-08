import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AnswerButton from '../components/AnswerButton';

interface AnswersPageProps {}

const AnswersPage: React.FC<AnswersPageProps> = () => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Detektujemo da li smo na player/* ruti
  const isPlayerRoute = location.pathname.startsWith('/player');
  
  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    // Ovde bismo normalno poslali odgovor na Firebase
    // Za sada samo simuliramo prelazak na sledeću stranicu nakon odgovora
    setTimeout(() => {
      if (isPlayerRoute) {
        navigate('/player/waiting-answer');
      } else {
        navigate('/waiting-answer');
      }
    }, 500);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isPlayerRoute) {
        navigate('/player/points');
      } else {
        navigate('/points');
      }
    }, 30000); // 30 seconds to match the timer animation

    return () => clearTimeout(timer);
  }, [navigate, isPlayerRoute]);

  return (
    <div className="min-h-screen bg-accent p-4 flex flex-col items-center justify-center">
      <div className="mb-8 w-full">
        <div className="w-full h-2 bg-secondary bg-opacity-30 rounded-full overflow-hidden">
          <div className="h-full bg-secondary animate-timer" style={{ width: '100%' }}></div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        <AnswerButton 
          answer="A" 
          selected={selectedAnswer === 'A'} 
          onClick={() => handleAnswerSelect('A')}
          color="highlight"
        />
        <AnswerButton 
          answer="B" 
          selected={selectedAnswer === 'B'} 
          onClick={() => handleAnswerSelect('B')}
          color="special"
        />
        <AnswerButton 
          answer="C" 
          selected={selectedAnswer === 'C'} 
          onClick={() => handleAnswerSelect('C')}
          color="secondary"
        />
        <AnswerButton 
          answer="D" 
          selected={selectedAnswer === 'D'} 
          onClick={() => handleAnswerSelect('D')}
          color="primary"
        />
      </div>
    </div>
  );
};

export default AnswersPage; 