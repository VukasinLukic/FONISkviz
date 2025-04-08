import Routes from './Routes';
import './index.css';
import { GameProvider } from './context/GameContext';

function App() {
  return (
    <GameProvider>
      <div className="min-h-screen bg-accent">
        <Routes />
      </div>
    </GameProvider>
  );
}

export default App;
