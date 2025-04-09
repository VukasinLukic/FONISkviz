import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, push } from 'firebase/database';
import { Question } from '../lib/firebase';

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

// Sample questions
const questions: Omit<Question, 'id'>[] = [
  // Istorija
  {
    text: 'Koje godine je počeo Prvi svetski rat?',
    options: {
      A: '1914',
      B: '1918',
      C: '1939',
      D: '1945'
    },
    correctAnswer: 'A',
    category: 'Istorija',
    timeLimit: 20
  },
  {
    text: 'Ko je osnovao Microsoft?',
    options: {
      A: 'Steve Jobs',
      B: 'Bill Gates',
      C: 'Mark Zuckerberg',
      D: 'Jeff Bezos'
    },
    correctAnswer: 'B',
    category: 'Istorija',
    timeLimit: 15
  },
  
  // Geografija
  {
    text: 'Koja je najveća država na svetu po površini?',
    options: {
      A: 'Kina',
      B: 'SAD',
      C: 'Rusija',
      D: 'Kanada'
    },
    correctAnswer: 'C',
    category: 'Geografija',
    timeLimit: 15
  },
  {
    text: 'Koja reka protiče kroz Beograd?',
    options: {
      A: 'Sava',
      B: 'Dunav',
      C: 'Sava i Dunav',
      D: 'Morava'
    },
    correctAnswer: 'C',
    category: 'Geografija',
    timeLimit: 15
  },
  
  // Nauka
  {
    text: 'Šta označava hemijski simbol H2O?',
    options: {
      A: 'Vodonik',
      B: 'Kiseonik',
      C: 'Voda',
      D: 'Ugljen-dioksid'
    },
    correctAnswer: 'C',
    category: 'Nauka',
    timeLimit: 15
  },
  {
    text: 'Koja je najbliža planeta Suncu?',
    options: {
      A: 'Venera',
      B: 'Merkur',
      C: 'Mars',
      D: 'Zemlja'
    },
    correctAnswer: 'B',
    category: 'Nauka',
    timeLimit: 15
  },
  
  // Sport
  {
    text: 'U kom sportu se dodeljuje Zlatna lopta?',
    options: {
      A: 'Košarka',
      B: 'Fudbal',
      C: 'Tenis',
      D: 'Odbojka'
    },
    correctAnswer: 'B',
    category: 'Sport',
    timeLimit: 15
  },
  {
    text: 'Koliko igrača ima fudbalski tim?',
    options: {
      A: '10',
      B: '11',
      C: '9',
      D: '12'
    },
    correctAnswer: 'B',
    category: 'Sport',
    timeLimit: 15
  },
  
  // Umetnost
  {
    text: 'Ko je naslikao Mona Lizu?',
    options: {
      A: 'Vincent van Gogh',
      B: 'Pablo Picasso',
      C: 'Leonardo da Vinci',
      D: 'Michelangelo'
    },
    correctAnswer: 'C',
    category: 'Umetnost',
    timeLimit: 15
  },
  {
    text: 'Koji instrument svira violinista?',
    options: {
      A: 'Violinu',
      B: 'Violu',
      C: 'Violončelo',
      D: 'Kontrabas'
    },
    correctAnswer: 'A',
    category: 'Umetnost',
    timeLimit: 15
  },
  
  // Zabava
  {
    text: 'Ko glumi glavnu ulogu u filmu "Matrix"?',
    options: {
      A: 'Brad Pitt',
      B: 'Keanu Reeves',
      C: 'Tom Cruise',
      D: 'Will Smith'
    },
    correctAnswer: 'B',
    category: 'Zabava',
    timeLimit: 15
  },
  {
    text: 'Koja pevačica izvodi pesmu "Bad Guy"?',
    options: {
      A: 'Ariana Grande',
      B: 'Taylor Swift',
      C: 'Billie Eilish',
      D: 'Lady Gaga'
    },
    correctAnswer: 'C',
    category: 'Zabava',
    timeLimit: 15
  },
  
  // Tehnologija
  {
    text: 'Šta znači skraćenica HTML?',
    options: {
      A: 'Hypertext Markup Language',
      B: 'High Technology Modern Language',
      C: 'Hybrid Text Machine Learning',
      D: 'Hypertext Multiple Links'
    },
    correctAnswer: 'A',
    category: 'Tehnologija',
    timeLimit: 15
  },
  {
    text: 'Koje godine je osnovan FONIS?',
    options: {
      A: '2000',
      B: '2005',
      C: '2010',
      D: '2015'
    },
    correctAnswer: 'B',
    category: 'Tehnologija',
    timeLimit: 15
  },
  
  // Opšte znanje
  {
    text: 'Koja životinja ima najduži vrat?',
    options: {
      A: 'Slon',
      B: 'Žirafa',
      C: 'Kamila',
      D: 'Nilski konj'
    },
    correctAnswer: 'B',
    category: 'Opšte znanje',
    timeLimit: 15
  },
  {
    text: 'Koliko dana ima mesec februar u prestupnoj godini?',
    options: {
      A: '28',
      B: '29',
      C: '30',
      D: '31'
    },
    correctAnswer: 'B',
    category: 'Opšte znanje',
    timeLimit: 15
  }
];

// Seed function
async function seedQuestions() {
  console.log('Starting to seed questions...');
  const questionsRef = ref(db, 'questions');
  
  for (const question of questions) {
    const newQuestionRef = push(questionsRef);
    const questionId = newQuestionRef.key;
    
    if (questionId) {
      await set(newQuestionRef, {
        ...question,
        id: questionId
      });
      console.log(`Added question: ${question.text}`);
    }
  }
  
  console.log('Questions seeded successfully!');
  process.exit(0);
}

// Run the seed function
seedQuestions().catch(error => {
  console.error('Error seeding questions:', error);
  process.exit(1);
}); 