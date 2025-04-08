import Routes from './Routes';
import './index.css';
import { GameProvider } from './context/GameContext';

function App() {
  return (
    <GameProvider>
      <div className="min-h-screen max-h-screen h-screen overflow-hidden bg-accent">
        <Routes />
      </div>
    </GameProvider>
  );
}

export default App;
