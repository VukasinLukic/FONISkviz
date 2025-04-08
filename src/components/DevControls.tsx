import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useGameContext } from '../context/GameContext';

interface DevControlsProps {
  visible?: boolean;
}

const DevControls: React.FC<DevControlsProps> = ({ visible = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { gameState, updateCurrentCategory } = useGameContext();
  const [viewType, setViewType] = useState<'mobile' | 'admin'>('admin');
  const [isOpen, setIsOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  
  if (!visible) return null;
  
  // Player routes for game flow
  const playerRoutes = [
    { path: '/player', label: 'Join' },
    { path: '/player/mascot', label: 'Mascot' },
    { path: '/player/waiting', label: 'Waiting' },
    { path: '/player/quiz-starting', label: 'Quiz Start' },
    { path: '/player/category', label: 'Category' },
    { path: '/player/answers', label: 'Answers' },
    { path: '/player/waiting-answer', label: 'Wait Answer' },
    { path: '/player/points', label: 'Points' },
    { path: '/player/team-points', label: 'Team Points' },
    { path: '/player/final-team-points', label: 'Final Points' },
    { path: '/player/tension', label: 'Tension' },
    { path: '/player/winners', label: 'Winners' }
  ];

  // Admin routes for easier navigation
  const adminRoutes = [
    { path: '/admin', label: 'Splash' },
    { path: '/admin/qrcode', label: 'QR Code' },
    { path: '/admin/lobby', label: 'Lobby' },
    { path: '/admin/category', label: 'Category' },
    { path: '/admin/question', label: 'Question' },
    { path: '/admin/answers', label: 'Answers' },
    { path: '/admin/tension', label: 'Tension' },
    { path: '/admin/points', label: 'Points' },
    { path: '/admin/winners', label: 'Winners' }
  ];

  // Choose which routes to display based on viewType
  const routesToShow = viewType === 'mobile' ? playerRoutes : adminRoutes;

  const handleCategoryUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.trim()) {
      updateCurrentCategory(newCategory.trim());
      setNewCategory('');
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-1 right-1 z-[9999] bg-black/50 text-white p-1 rounded-full shadow-lg hover:bg-black/80 transition-colors w-6 h-6 flex items-center justify-center text-xs"
        title="Dev Controls"
      >
        {isOpen ? '✕' : '⚙️'}
      </button>

      {isOpen && (
        <div className="fixed right-1 top-8 bg-gray-900/90 text-white p-2 z-[9999] rounded-lg shadow-lg overflow-auto max-h-[calc(100vh-40px)] w-64">
          <div className="flex text-xs justify-between items-center mb-2">
            <span className="font-semibold">Dev Controls</span>
            <div className="flex space-x-1">
              <button 
                onClick={() => setViewType('mobile')}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${viewType === 'mobile' ? 'bg-secondary text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
              >
                📱
              </button>
              <button 
                onClick={() => setViewType('admin')}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${viewType === 'admin' ? 'bg-secondary text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
              >
                💻
              </button>
            </div>
          </div>
          
          {/* Game State Controls */}
          <div className="mb-3 bg-gray-800 p-2 rounded text-xs">
            <h3 className="font-semibold mb-1">Game State</h3>
            <div className="mb-2">
              <div className="flex justify-between mb-1">
                <span>Current Category:</span>
                <span className="font-bold">{gameState.currentCategory || "None"}</span>
              </div>
              <form onSubmit={handleCategoryUpdate} className="flex gap-1">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="New category name"
                  className="flex-1 px-2 py-1 bg-gray-700 rounded text-white text-xs"
                />
                <button 
                  type="submit"
                  className="bg-secondary hover:bg-opacity-80 px-2 rounded text-white"
                >
                  Set
                </button>
              </form>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-1">
            {routesToShow.map((route) => (
              <button
                key={route.path}
                onClick={() => {
                  navigate(route.path);
                  setIsOpen(false);
                }}
                className={`text-xs py-1 rounded transition-colors ${
                  location.pathname === route.path 
                    ? 'bg-secondary text-white' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {route.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default DevControls; 