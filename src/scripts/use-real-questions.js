/* 
 * This script loads the questions from seed-questions.ts into Firebase
 * Run it with: node --experimental-specifier-resolution=node --experimental-modules src/scripts/use-real-questions.js
 */

// Import required modules
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { register } from 'ts-node';
import { getDatabase, ref, remove } from 'firebase/database';
import { initializeApp } from 'firebase/app';

// Load environment variables
config();

// Setup __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Enable TypeScript execution
register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs'
  }
});

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
  .then(async () => {
    console.log('Successfully removed existing questions');
    
    // Now run the seed-questions.ts file to add the new questions
    console.log('Adding new questions from seed-questions.ts...');
    // We need to import dynamically because it's a TypeScript file
    try {
      const seedPath = resolve(__dirname, './seed-questions.ts');
      await import(seedPath);
      console.log('Questions imported successfully!');
    } catch (err) {
      console.error('Error importing seed-questions.ts:', err);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Error removing existing questions:', error);
    process.exit(1);
  }); 