import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: "AIzaSyBS5gnw4eO8jqAaCW5cNeVTjhUFMXQC140",
  authDomain: "kahoot-clone-b8034.firebaseapp.com",
  databaseURL: "https://kahoot-clone-b8034-default-rtdb.firebaseio.com",
  projectId: "kahoot-clone-b8034",
  storageBucket: "kahoot-clone-b8034.firebasestorage.app",
  messagingSenderId: "486709016032",
  appId: "1:486709016032:web:699b6739bab04f22782785",
  measurementId: "G-JQVLMKD96K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Reset function
async function resetDatabase() {
  try {
    console.log('Resetting database...');
    
    // Reset game state
    await set(ref(db, 'game'), {
      isActive: false,
      currentRound: 0,
      currentQuestion: null,
      currentCategory: '',
      status: 'waiting',
      totalRounds: 8,
      startedAt: null
    });
    console.log('Game state reset');
    
    // Clear all answers
    await set(ref(db, 'answers'), null);
    console.log('Answers cleared');
    
    // Reset team points (but keep the teams)
    // Note: Uncomment this if you want to remove all teams
    // await set(ref(db, 'teams'), null);
    // console.log('Teams cleared');
    
    console.log('Database reset successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
}

// Run the reset function
resetDatabase(); 