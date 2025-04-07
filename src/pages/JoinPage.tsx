import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MainButton from '../components/MainButton';

interface JoinPageProps {}

const JoinPage: React.FC<JoinPageProps> = () => {
  const [teamName, setTeamName] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  
  // Detektujemo da li smo na player/* ruti
  const isPlayerRoute = location.pathname.startsWith('/player');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName.trim()) {
      // Navigiramo na odgovarajuću rutu u zavisnosti od toga gde smo
      if (isPlayerRoute) {
        navigate('/player/waiting');
      } else {
        navigate('/waiting');
      }
    }
  };

  return (
    <div className="min-h-screen bg-accent p-4 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold text-primary mb-8">Dobrodošli na Kviz!</h1>
      
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <div className="mb-6">
          <label htmlFor="teamName" className="block text-primary mb-2 font-bold">
            Unesite ime tima:
          </label>
          <input
            type="text"
            id="teamName"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="w-full p-3 border-2 border-secondary rounded-lg focus:outline-none focus:border-primary"
            placeholder="Ime tima..."
            required
          />
        </div>
        
        <MainButton type="submit" disabled={!teamName.trim()}>
          Pridruži se kvizu
        </MainButton>
      </form>
    </div>
  );
};

export default JoinPage;
