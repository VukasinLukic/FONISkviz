import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';

interface DevControlsProps {
  visible?: boolean;
}

const DevControls: React.FC<DevControlsProps> = ({ visible = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [viewType, setViewType] = useState<'mobile' | 'laptop'>('mobile');
  
  if (!visible) return null;
  
  // Simulirano upravljanje tokom igre
  const playerRoutes = [
    { path: '/player', label: 'Join' },
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

  // Ovde ćemo kasnije dodati admin rute
  const adminRoutes = [
    { path: '/admin', label: 'Admin Home' },
  ];

  // Odabir koje rute prikazujemo bazirano na viewType
  const routesToShow = viewType === 'mobile' ? playerRoutes : adminRoutes;

  return (
    <div className="fixed top-0 left-0 right-0 bg-gray-800 text-white p-2 z-50 overflow-x-auto">
      <div className="flex justify-between items-center mb-2">
        <p className="text-xs">Dev Controls (samo za testiranje)</p>
        <div className="flex space-x-2">
          <button 
            onClick={() => setViewType('mobile')}
            className={`text-xs px-2 py-1 rounded ${viewType === 'mobile' ? 'bg-secondary' : 'bg-gray-600'}`}
          >
            📱 Mobilni
          </button>
          <button 
            onClick={() => setViewType('laptop')}
            className={`text-xs px-2 py-1 rounded ${viewType === 'laptop' ? 'bg-secondary' : 'bg-gray-600'}`}
          >
            💻 Admin
          </button>
        </div>
      </div>
      
      <div className="flex space-x-2 overflow-x-auto pb-1">
        {routesToShow.map((route) => (
          <button
            key={route.path}
            onClick={() => navigate(route.path)}
            className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
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
  );
};

export default DevControls; 