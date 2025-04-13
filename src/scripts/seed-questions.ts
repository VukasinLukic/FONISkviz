import { initializeApp, FirebaseApp } from 'firebase/app';
import { getDatabase, ref, set, Database } from 'firebase/database';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Firebase Configuration using process.env
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate essential config keys
if (!firebaseConfig.apiKey || !firebaseConfig.databaseURL || !firebaseConfig.projectId) {
  console.error('Error: Missing essential Firebase configuration in environment variables (VITE_FIREBASE_API_KEY, VITE_FIREBASE_DATABASE_URL, VITE_FIREBASE_PROJECT_ID).');
  process.exit(1);
}

// Initialize Firebase
let app: FirebaseApp;
let database: Database;

try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  console.log('Firebase initialized successfully.');
} catch (initError) {
  console.error('Firebase initialization failed:', initError);
  process.exit(1);
}

// Define the structure of a question
interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex: number;
  category: string;
}

// Test questions for the quiz
const testQuestions: Question[] = [
  {
    id: 'q1',
    text: 'Koje godine je osnovan FONIS?',
    options: ['2002', '2001', '2000', '1999'],
    correctAnswerIndex: 0, // 2002
    category: 'FONIS Istorija'
  },
  {
    id: 'q2',
    text: 'Šta označava skraćenica FONIS?',
    options: [
      'Fakultetski Odbor Naprednih Informatičkih Studenata',
      'Fakultetski Odbor Najboljih Informatičkih Studenata',
      'Fakultetski Organizovani Napredni Informatički Studenti',
      'Fakultetski Organizovani Napredni Informatički Savez'
    ],
    correctAnswerIndex: 1, // Fakultetski Odbor Najboljih Informatičkih Studenata
    category: 'FONIS Istorija'
  },
  {
    id: 'q3',
    text: 'Koja od sledećih tehnologija nije JavaScript framework?',
    options: ['React', 'Angular', 'Django', 'Vue'],
    correctAnswerIndex: 2, // Django je Python framework
    category: 'Programiranje'
  },
  {
    id: 'q4',
    text: 'Koji od sledećih ne spada u osnovne tipove podataka u TypeScript-u?',
    options: ['number', 'string', 'object', 'function'],
    correctAnswerIndex: 3, // function nije osnovni tip
    category: 'Programiranje'
  },
  {
    id: 'q5',
    text: 'Šta predstavlja "FON Hakaton"?',
    options: [
      'Takmičenje u programiranju koje traje 24 sata',
      'Predavanje o etičkom hakovanju',
      'Kurs o osnovama programiranja',
      'Online kurs mašinskog učenja'
    ],
    correctAnswerIndex: 0, // Takmičenje u programiranju koje traje 24 sata
    category: 'FON Događaji'
  },
  {
    id: 'q6',
    text: 'Koji HTTP status kod označava uspešan odgovor servera?',
    options: ['200', '404', '500', '302'],
    correctAnswerIndex: 0, // 200 OK
    category: 'Web Razvoj'
  },
  {
    id: 'q7',
    text: 'Koji od navedenih nije CSS preprocesor?',
    options: ['Sass', 'Less', 'Stylus', 'Flexbox'],
    correctAnswerIndex: 3, // Flexbox je CSS layout modul
    category: 'Web Razvoj'
  },
  {
    id: 'q8',
    text: 'Koji od navedenih algoritama sortiranja ima najbolju vremensku složenost u najboljem slučaju?',
    options: ['Quick Sort', 'Bubble Sort', 'Merge Sort', 'Insertion Sort'],
    correctAnswerIndex: 0, // Quick Sort - O(n log n)
    category: 'Algoritmi'
  },
  {
    id: 'q9',
    text: 'Koja je od navedenih društvenih mreža najstarija?',
    options: ['Facebook', 'LinkedIn', 'Twitter', 'Instagram'],
    correctAnswerIndex: 1, // LinkedIn (2003, Facebook 2004, Twitter 2006, Instagram 2010)
    category: 'Tehnologija'
  },
  {
    id: 'q10',
    text: 'Šta predstavlja skraćenica "API" u kontekstu razvoja softvera?',
    options: [
      'Application Programming Interface',
      'Advanced Programming Implementation',
      'Automated Program Integration',
      'Application Process Initialization'
    ],
    correctAnswerIndex: 0, // Application Programming Interface
    category: 'Programiranje'
  }
];

// Function to write questions to the database
async function seedQuestions() {
  console.log('Starting to seed questions...');
  try {
    // Use Promise.all to wait for all writes to complete
    const writePromises = testQuestions.map(question => {
      console.log(`Preparing to add/update question ${question.id}: ${question.text}`);
      return set(ref(database, `questions/${question.id}`), question);
    });
    
    await Promise.all(writePromises);
    
    console.log('Successfully added/updated all questions in the database!');
  } catch (error) {
    console.error('Error seeding questions:', error);
    // Throw the error to be caught by the main execution block
    throw error;
  }
}

// Execute the seeding function and handle exit
(async () => {
  try {
    await seedQuestions();
    console.log('Finished seeding the database with questions.');
    process.exit(0); // Exit successfully
  } catch (err) {
    console.error('Seeding script failed.');
    process.exit(1); // Exit with error code
  }
})(); 