import { app, database } from '../firebase';
import { ref, set } from 'firebase/database';

// Testna pitanja za kviz
const testQuestions = [
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

// Funkcija za zapisivanje pitanja u bazu
async function seedQuestions() {
  console.log('Započeto popunjavanje pitanja...');
  
  try {
    // Sačuvaj svako pitanje pod svojim ID-jem
    for (const question of testQuestions) {
      console.log(`Dodavanje pitanja ${question.id}: ${question.text}`);
      await set(ref(database, `questions/${question.id}`), question);
    }
    
    console.log('Uspešno dodata sva pitanja!');
  } catch (error) {
    console.error('Greška pri dodavanju pitanja:', error);
  }
}

// Pokreni funkciju za popunjavanje
seedQuestions().then(() => {
  console.log('Završeno popunjavanje baze pitanjima.');
  process.exit(0);
}).catch(error => {
  console.error('Greška:', error);
  process.exit(1);
}); 