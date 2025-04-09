import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
// Import and initialize Firebase
import { initializeGameState } from './lib/firebase'

// Initialize Firebase game state
initializeGameState()
  .then(() => console.log('Firebase game state initialized'))
  .catch((error) => console.error('Error initializing Firebase game state:', error));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
