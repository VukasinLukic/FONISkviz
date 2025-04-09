import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameContext } from '../context/GameContext';
import MainButton from '../components/MainButton';

const JoinPage: React.FC = () => {
  const [teamName, setTeamName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { registerTeam } = useGameContext();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Detektujemo da li smo na player/* ruti
  const isPlayerRoute = location.pathname.startsWith('/player');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName.trim() && !isLoading) {
      setIsLoading(true);
      try {
        await registerTeam(teamName.trim());
        if (isPlayerRoute) {
          navigate('/player/mascot');
        } else {
          navigate('/mascot');
        }
      } catch (error) {
        console.error('Error registering team:', error);
        // TODO: Prikazati error poruku korisniku
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-accent p-4 flex flex-col items-center justify-center">
      <img 
        src="/assets/logo.svg" 
        alt="Kviz Logo" 
        className="w-48 mb-8"
      />
      
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
        
        <MainButton type="submit" disabled={!teamName.trim() || isLoading}>
          <span className="font-caviar">{isLoading ? 'učitavanje...' : 'pridruži se kvizu'}</span>
        </MainButton>
      </form>
    </div>
  );
};

export default JoinPage;
