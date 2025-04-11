// ES module seed script
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, push } from 'firebase/database';

// Firebase configuration - hardcoded for direct seeding
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
const app = initializeApp(firebaseConfig, 'seed-app');
const db = getDatabase(app);

// 6 Categories with 8 questions each
const questions = [
  // KATEGORIJA 1: ISTORIJA - 8 pitanja
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
    text: 'Ko je bio prvi predsednik SAD?',
    options: {
      A: 'John Adams',
      B: 'Thomas Jefferson',
      C: 'George Washington',
      D: 'Abraham Lincoln'
    },
    correctAnswer: 'C',
    category: 'Istorija',
    timeLimit: 20
  },
  {
    text: 'Koje godine je pao Berlinski zid?',
    options: {
      A: '1985',
      B: '1989',
      C: '1991',
      D: '1995'
    },
    correctAnswer: 'B',
    category: 'Istorija',
    timeLimit: 20
  },
  {
    text: 'Ko je bio vođa Oktobarske revolucije u Rusiji?',
    options: {
      A: 'Josif Staljin',
      B: 'Vladimir Lenjin',
      C: 'Lav Trocki',
      D: 'Mihail Gorbačov'
    },
    correctAnswer: 'B',
    category: 'Istorija',
    timeLimit: 20
  },
  {
    text: 'U kom veku je bila Francuska revolucija?',
    options: {
      A: '17. vek',
      B: '18. vek',
      C: '19. vek',
      D: '20. vek'
    },
    correctAnswer: 'B',
    category: 'Istorija',
    timeLimit: 20
  },
  {
    text: 'Ko je bio faraon za kojeg se vezuje najveća piramida u Gizi?',
    options: {
      A: 'Keops',
      B: 'Tutankamon',
      C: 'Ramzes II',
      D: 'Kleopatra'
    },
    correctAnswer: 'A',
    category: 'Istorija',
    timeLimit: 20
  },
  {
    text: 'Koje godine je Kolumbo otkrio Ameriku?',
    options: {
      A: '1392',
      B: '1492',
      C: '1592',
      D: '1692'
    },
    correctAnswer: 'B',
    category: 'Istorija',
    timeLimit: 20
  },
  {
    text: 'Ko je napisao "O poreklu vrsta"?',
    options: {
      A: 'Isaac Newton',
      B: 'Charles Darwin',
      C: 'Albert Einstein',
      D: 'Nikola Tesla'
    },
    correctAnswer: 'B',
    category: 'Istorija',
    timeLimit: 20
  },
  
  // KATEGORIJA 2: GEOGRAFIJA - 8 pitanja
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
    timeLimit: 20
  },
  {
    text: 'Koji je najveći okean na svetu?',
    options: {
      A: 'Atlantski okean',
      B: 'Indijski okean',
      C: 'Tihi okean',
      D: 'Severni ledeni okean'
    },
    correctAnswer: 'C',
    category: 'Geografija',
    timeLimit: 20
  },
  {
    text: 'Koja reka protiče kroz Pariz?',
    options: {
      A: 'Temza',
      B: 'Sena',
      C: 'Rajna',
      D: 'Dunav'
    },
    correctAnswer: 'B',
    category: 'Geografija',
    timeLimit: 20
  },
  {
    text: 'Koja je najviša planina na svetu?',
    options: {
      A: 'K2',
      B: 'Mont Everest',
      C: 'Kilimandžaro',
      D: 'Mont Blank'
    },
    correctAnswer: 'B',
    category: 'Geografija',
    timeLimit: 20
  },
  {
    text: 'Koji je glavni grad Australije?',
    options: {
      A: 'Sidnej',
      B: 'Melburn',
      C: 'Kanbera',
      D: 'Brizbejn'
    },
    correctAnswer: 'C',
    category: 'Geografija',
    timeLimit: 20
  },
  {
    text: 'Koja reka protiče kroz najveći broj zemalja?',
    options: {
      A: 'Dunav',
      B: 'Nil',
      C: 'Amazonka',
      D: 'Misisipi'
    },
    correctAnswer: 'A',
    category: 'Geografija',
    timeLimit: 20
  },
  {
    text: 'U kojoj državi se nalazi grad Marakeš?',
    options: {
      A: 'Egipat',
      B: 'Maroko',
      C: 'Alžir',
      D: 'Tunis'
    },
    correctAnswer: 'B',
    category: 'Geografija',
    timeLimit: 20
  },
  {
    text: 'Koliko država ima u Evropskoj uniji nakon Bregzita?',
    options: {
      A: '25',
      B: '26',
      C: '27',
      D: '28'
    },
    correctAnswer: 'C',
    category: 'Geografija',
    timeLimit: 20
  },
  
  // KATEGORIJA 3: NAUKA - 8 pitanja
  {
    text: 'Šta označava hemijska formula H2O?',
    options: {
      A: 'Vodonik',
      B: 'Kiseonik',
      C: 'Voda',
      D: 'Ugljen-dioksid'
    },
    correctAnswer: 'C',
    category: 'Nauka',
    timeLimit: 20
  },
  {
    text: 'Koja je osnovna jedinica za merenje električne struje?',
    options: {
      A: 'Volt',
      B: 'Vat',
      C: 'Om',
      D: 'Amper'
    },
    correctAnswer: 'D',
    category: 'Nauka',
    timeLimit: 20
  },
  {
    text: 'Koja planeta u Sunčevom sistemu ima najviše prirodnih satelita?',
    options: {
      A: 'Jupiter',
      B: 'Saturn',
      C: 'Uran',
      D: 'Neptun'
    },
    correctAnswer: 'B',
    category: 'Nauka',
    timeLimit: 20
  },
  {
    text: 'Koji element u periodnom sistemu ima simbol Fe?',
    options: {
      A: 'Fluor',
      B: 'Ferum (Gvožđe)',
      C: 'Fosfor',
      D: 'Fermijum'
    },
    correctAnswer: 'B',
    category: 'Nauka',
    timeLimit: 20
  },
  {
    text: 'Koliko kostiju ima odrasla osoba u svom telu?',
    options: {
      A: '106',
      B: '186',
      C: '206',
      D: '306'
    },
    correctAnswer: 'C',
    category: 'Nauka',
    timeLimit: 20
  },
  {
    text: 'Šta proučava paleontologija?',
    options: {
      A: 'Fosile',
      B: 'Pećine',
      C: 'Planete',
      D: 'Parazite'
    },
    correctAnswer: 'A',
    category: 'Nauka',
    timeLimit: 20
  },
  {
    text: 'Ko je formulisao teoriju relativiteta?',
    options: {
      A: 'Isaac Newton',
      B: 'Albert Einstein',
      C: 'Nikola Tesla',
      D: 'Stephen Hawking'
    },
    correctAnswer: 'B',
    category: 'Nauka',
    timeLimit: 20
  },
  {
    text: 'Koja je najmanja čestica hemijskog elementa koja zadržava njegova svojstva?',
    options: {
      A: 'Elektron',
      B: 'Atom',
      C: 'Molekul',
      D: 'Proton'
    },
    correctAnswer: 'B',
    category: 'Nauka',
    timeLimit: 20
  },
  
  // KATEGORIJA 4: SPORT - 8 pitanja
  {
    text: 'Koji sport se igra na Vimbldonu?',
    options: {
      A: 'Fudbal',
      B: 'Tenis',
      C: 'Golf',
      D: 'Kriket'
    },
    correctAnswer: 'B',
    category: 'Sport',
    timeLimit: 20
  },
  {
    text: 'Koji tim je najviše puta osvajao UEFA Ligu šampiona?',
    options: {
      A: 'Barcelona',
      B: 'Bayern Minhen',
      C: 'Liverpool',
      D: 'Real Madrid'
    },
    correctAnswer: 'D',
    category: 'Sport',
    timeLimit: 20
  },
  {
    text: 'Koliko igrača ima košarkaški tim na terenu?',
    options: {
      A: '4',
      B: '5',
      C: '6',
      D: '7'
    },
    correctAnswer: 'B',
    category: 'Sport',
    timeLimit: 20
  },
  {
    text: 'U kojem sportu se dodeljuje Zlatna lopta?',
    options: {
      A: 'Košarka',
      B: 'Fudbal',
      C: 'Tenis',
      D: 'Odbojka'
    },
    correctAnswer: 'B',
    category: 'Sport',
    timeLimit: 20
  },
  {
    text: 'Koji sportista ima najviše olimpijskih zlatnih medalja?',
    options: {
      A: 'Usain Bolt',
      B: 'Michael Phelps',
      C: 'Carl Lewis',
      D: 'Simone Biles'
    },
    correctAnswer: 'B',
    category: 'Sport',
    timeLimit: 20
  },
  {
    text: 'U kom sportu se koristi termin "as"?',
    options: {
      A: 'Fudbal',
      B: 'Košarka',
      C: 'Tenis',
      D: 'Hokej'
    },
    correctAnswer: 'C',
    category: 'Sport',
    timeLimit: 20
  },
  {
    text: 'Koje godine su održane prve moderne Olimpijske igre?',
    options: {
      A: '1886',
      B: '1896',
      C: '1906',
      D: '1916'
    },
    correctAnswer: 'B',
    category: 'Sport',
    timeLimit: 20
  },
  {
    text: 'Koji sport se igra na Roland Garrosu?',
    options: {
      A: 'Tenis',
      B: 'Golf',
      C: 'Fudbal',
      D: 'Biciklizam'
    },
    correctAnswer: 'A',
    category: 'Sport',
    timeLimit: 20
  },
  
  // KATEGORIJA 5: KULTURA - 8 pitanja
  {
    text: 'Ko je naslikao "Mona Lizu"?',
    options: {
      A: 'Vincent van Gogh',
      B: 'Pablo Picasso',
      C: 'Leonardo da Vinci',
      D: 'Michelangelo'
    },
    correctAnswer: 'C',
    category: 'Kultura',
    timeLimit: 20
  },
  {
    text: 'Koji je glavni grad Srbije?',
    options: {
      A: 'Niš',
      B: 'Novi Sad',
      C: 'Kragujevac',
      D: 'Beograd'
    },
    correctAnswer: 'D',
    category: 'Kultura',
    timeLimit: 20
  },
  {
    text: 'Koji muzički instrument ima 88 tipki?',
    options: {
      A: 'Violina',
      B: 'Gitara',
      C: 'Klavir',
      D: 'Harmonika'
    },
    correctAnswer: 'C',
    category: 'Kultura',
    timeLimit: 20
  },
  {
    text: 'Ko je napisao "Romeo i Julija"?',
    options: {
      A: 'Charles Dickens',
      B: 'William Shakespeare',
      C: 'Jane Austen',
      D: 'Ernest Hemingway'
    },
    correctAnswer: 'B',
    category: 'Kultura',
    timeLimit: 20
  },
  {
    text: 'Koji je tradicionalni ples Srbije?',
    options: {
      A: 'Valcer',
      B: 'Polka',
      C: 'Kolo',
      D: 'Tango'
    },
    correctAnswer: 'C',
    category: 'Kultura',
    timeLimit: 20
  },
  {
    text: 'Šta je Akropolj?',
    options: {
      A: 'Drevni grad',
      B: 'Hram',
      C: 'Utvrđenje na uzvišenju',
      D: 'Pozorište'
    },
    correctAnswer: 'C',
    category: 'Kultura',
    timeLimit: 20
  },
  {
    text: 'Ko je režirao film "Kum"?',
    options: {
      A: 'Steven Spielberg',
      B: 'Martin Scorsese',
      C: 'Francis Ford Coppola',
      D: 'Quentin Tarantino'
    },
    correctAnswer: 'C',
    category: 'Kultura',
    timeLimit: 20
  },
  {
    text: 'U kojoj zemlji je rođen Mozart?',
    options: {
      A: 'Nemačka',
      B: 'Italija',
      C: 'Austrija',
      D: 'Švajcarska'
    },
    correctAnswer: 'C',
    category: 'Kultura',
    timeLimit: 20
  },
  
  // KATEGORIJA 6: TEHNOLOGIJA - 8 pitanja
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
    timeLimit: 20
  },
  {
    text: 'Ko je osnovao kompaniju Microsoft?',
    options: {
      A: 'Steve Jobs',
      B: 'Bill Gates',
      C: 'Mark Zuckerberg',
      D: 'Jeff Bezos'
    },
    correctAnswer: 'B',
    category: 'Tehnologija',
    timeLimit: 20
  },
  {
    text: 'Koje godine je lansiran prvi iPhone?',
    options: {
      A: '2005',
      B: '2007',
      C: '2009',
      D: '2011'
    },
    correctAnswer: 'B',
    category: 'Tehnologija',
    timeLimit: 20
  },
  {
    text: 'Koji programski jezik je razvijen u Google-u za sistemsko programiranje?',
    options: {
      A: 'Go',
      B: 'Python',
      C: 'Ruby',
      D: 'Swift'
    },
    correctAnswer: 'A',
    category: 'Tehnologija',
    timeLimit: 20
  },
  {
    text: 'Koja kompanija je vlasnik Android operativnog sistema?',
    options: {
      A: 'Apple',
      B: 'Microsoft',
      C: 'Google',
      D: 'Samsung'
    },
    correctAnswer: 'C',
    category: 'Tehnologija',
    timeLimit: 20
  },
  {
    text: 'Koja je najčešće korišćena društvena mreža na svetu?',
    options: {
      A: 'Twitter',
      B: 'Instagram',
      C: 'Facebook',
      D: 'LinkedIn'
    },
    correctAnswer: 'C',
    category: 'Tehnologija',
    timeLimit: 20
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
    timeLimit: 20
  },
  {
    text: 'Koji je najčešće korišćeni pretraživač na internetu?',
    options: {
      A: 'Bing',
      B: 'Yahoo',
      C: 'Google',
      D: 'DuckDuckGo'
    },
    correctAnswer: 'C',
    category: 'Tehnologija',
    timeLimit: 20
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
}

// Run the seed function
seedQuestions()
  .then(() => {
    console.log('All questions have been seeded!');
    setTimeout(() => process.exit(0), 3000); // Allow time for Firebase operations to complete
  })
  .catch((error) => {
    console.error('Error seeding questions:', error);
    process.exit(1);
  }); 