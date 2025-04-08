import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';

interface DevControlsProps {
  visible?: boolean;
}

const DevControls: React.FC<DevControlsProps> = ({ visible = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [viewType, setViewType] = useState<'mobile' | 'admin'>('mobile');
  const [isOpen, setIsOpen] = useState(false);
  
  if (!visible) return null;
  
  // Simulirano upravljanje tokom igre
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

  // Admin rute za lakšu navigaciju
  const adminRoutes = [
    { path: '/admin', label: 'Splash' },
    { path: '/admin/qrcode', label: 'QR Code' },
    { path: '/admin/lobby', label: 'Lobby' },
    { path: '/admin/category', label: 'Category' },
    { path: '/admin/answers', label: 'Answers' },
    { path: '/admin/tension', label: 'Tension' },
    { path: '/admin/points', label: 'Points' },
    { path: '/admin/winners', label: 'Winners' }
  ];

  // Odabir koje rute prikazujemo bazirano na viewType
  const routesToShow = viewType === 'mobile' ? playerRoutes : adminRoutes;

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-2 right-2 z-50 bg-gray-800 text-white p-2 rounded-full shadow-lg"
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-gray-800 text-white p-4 z-40 overflow-auto">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm">Dev Controls</p>
            <div className="flex space-x-2">
              <button 
                onClick={() => setViewType('mobile')}
                className={`text-xs px-2 py-1 rounded ${viewType === 'mobile' ? 'bg-secondary' : 'bg-gray-600'}`}
              >
                📱 Mobilni
              </button>
              <button 
                onClick={() => setViewType('admin')}
                className={`text-xs px-2 py-1 rounded ${viewType === 'admin' ? 'bg-secondary' : 'bg-gray-600'}`}
              >
                💻 Admin
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {routesToShow.map((route) => (
              <button
                key={route.path}
                onClick={() => {
                  navigate(route.path);
                  setIsOpen(false);
                }}
                className={`text-xs px-2 py-1 rounded ${
                  location.pathname === route.path 
                    ? 'bg-secondary' 
                    : 'bg-gray-600'
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