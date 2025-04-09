import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from 'react-router-dom';
import { router } from './Routes'
// Import and initialize Firebase
import { initializeGameState } from './lib/firebase'

// Initialize Firebase game state
initializeGameState()
  .then(() => console.log('Firebase game state initialized'))
  .catch((error) => console.error('Error initializing Firebase game state:', error));

// Render the application using the router from Routes.tsx
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
