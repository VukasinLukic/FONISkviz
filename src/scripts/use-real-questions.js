/* 
 * This script loads the questions from seed-questions.ts into Firebase
 * Run it with: node src/scripts/use-real-questions.js
 */

// Load environment variables
require('dotenv').config();

// Enable TypeScript execution
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs'
  }
});

// First clear existing questions from the database
const { getDatabase, ref, remove } = require('firebase/database');
const { initializeApp } = require('firebase/app');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyBS5gnw4eO8jqAaCW5cNeVTjhUFMXQC140",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "kahoot-clone-b8034.firebaseapp.com",
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL || "https://kahoot-clone-b8034-default-rtdb.firebaseio.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "kahoot-clone-b8034",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "kahoot-clone-b8034.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "486709016032",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:486709016032:web:699b6739bab04f22782785",
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || "G-JQVLMKD96K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// First remove existing questions
console.log('Removing existing questions...');
remove(ref(db, 'questions'))
  .then(() => {
    console.log('Successfully removed existing questions');
    
    // Now run the seed-questions.ts file to add the new questions
    console.log('Adding new questions from seed-questions.ts...');
    require('./seed-questions.ts');
  })
  .catch(error => {
    console.error('Error removing existing questions:', error);
    process.exit(1);
  }); 