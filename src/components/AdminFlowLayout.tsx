import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AnimatedBackground from './AnimatedBackground';
import { motion, AnimatePresence } from 'framer-motion';

// AdminFlowLayout moved to its own component file
const AdminFlowLayout: React.FC = () => {
  const location = useLocation();
  const [bgColor, setBgColor] = useState('bg-accent'); // Default for Splash
  const [backgroundKey, setBackgroundKey] = useState('splash'); // Key to trigger background changes

  // Determine background color and animation based on route
  useEffect(() => {
    const path = location.pathname;
    console.log("AdminFlowLayout Path:", path);
    if (path === '/admin' || path === '/splash') { // Treat /admin and /splash as splash screen
      setBgColor('bg-accent');
      setBackgroundKey('splash');
    } else if (path === '/admin/qrcode' || path === '/admin/lobby') {
      setBgColor('bg-primary');
      setBackgroundKey('main');
    } 
    // Add conditions for other admin pages if needed
    else {
      setBgColor('bg-primary'); // Default for other admin pages?
      setBackgroundKey('default');
    }
  }, [location.pathname]);

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-700 ${bgColor}`}>
      {/* Persistent Animated Background */}
      <AnimatePresence initial={false}>
        <motion.div
          key={backgroundKey} // Change key to force re-render/transition if needed
          className="absolute inset-0 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
        >
          <AnimatedBackground 
            // Use same density for consistency during transition
            density={'medium'} 
            color={backgroundKey === 'splash' ? 'accent' : 'primary'}
            animated={true} 
          />
        </motion.div>
      </AnimatePresence>

      {/* Render the specific page content */}
      {/* z-index ensures content is above background */}
      <div className="relative z-20 h-full">
         {/* Outlet Content */}
        <Outlet /> 
      </div>
    </div>
  );
};

export default AdminFlowLayout; 