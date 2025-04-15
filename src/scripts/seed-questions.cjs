// Zahtevamo direktno Firebase module koristeći CommonJS sintaksu
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set } = require('firebase/database');

// Firebase konfiguracija - hardkodirana za skriptu
const firebaseConfig = {
  apiKey: "AIzaSyBpxuN0VWuQXtb5pY9sFzUV7NCH_so3jzM",
  authDomain: "bazafoniskviz.firebaseapp.com",
  databaseURL: "https://bazafoniskviz-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "bazafoniskviz",
  storageBucket: "bazafoniskviz.appspot.com", 
  messagingSenderId: "435595469992",
  appId: "1:435595469992:web:95c67ae54ce4c6a6ef62ae",
  measurementId: "G-Y9QP0XZ0CK"
};

// Inicijalizacija Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
console.log('Firebase initialized successfully.');

// Test pitanja za kviz
const testQuestions = [
  {
    id: 'q1',
    text: 'Sa kojom od sledećih boginja Zevs nije spavao:',
    options: ['Hera', 'Demetra', 'Afrodita', 'Metida'],
    correctAnswerIndex: 2, // Afrodita
    category: 'Ko zna Zna?'
  },
  {
    id: 'q2',
    text: 'Kako glasi ime i prezime pevačice koja izvodi pesmu "Kralj ponoći"?',
    options: ['Lepava Lukić', 'Nada Polić', 'Fahreta Živojinović', 'Snežana Babić'],
    correctAnswerIndex: 1, // Nada Polić
    category: 'Ko zna Zna?'
  },
  {
    id: 'q3',
    text: 'Kroz koju državu protiče reka Amu Darja?',
    options: ['Avganistan', 'Indiju', 'Siriju', 'Gruziju'],
    correctAnswerIndex: 0, // Avganistan
    category: 'Ko zna Zna?'
  },
  {
    id: 'q4',
    text: 'Koji fiktivni lik se odriče svoje duše u potrazi za neograničenim znanjem?',
    options: ['Ahil', 'Dorijan Grej', 'Faust', 'Doktor Džekil'],
    correctAnswerIndex: 2, // Faust
    category: 'Ko zna Zna?'
  },
  {
    id: 'q5',
    text: 'Koliko približno iznosi verovatnoća da, nakon tri sina, isti roditelji kao četvrto dete dobiju ćerku?',
    options: ['12.5%', '75%', '80%', '50%'],
    correctAnswerIndex: 3, // 50%
    category: 'Ko zna Zna?'
  },
  {
    id: 'q6',
    text: 'Koja od sledećih država se prostire kroz najviše vremenskih zona?',
    options: ['UK', 'SAD', 'Rusija', 'Francuska'],
    correctAnswerIndex: 3, // Francuska
    category: 'Ko zna Zna?'
  },
  {
    id: 'q7',
    text: 'Iz kog jezika potiče reč parazit?',
    options: ['engleskog', 'grčkog', 'latinskog', 'arapskog'],
    correctAnswerIndex: 1, // grčkog
    category: 'Ko zna Zna?'
  },
  {
    id: 'q8',
    text: 'Koji je najtrofejniji klub u istoriji Lige šampiona?',
    options: ['Barselona', 'Borusija', 'Real Madrid', 'Arsenal'],
    correctAnswerIndex: 2, // Real Madrid
    category: 'Ko zna Zna?'
  },
  {
    id: 'q9',
    text: 'Prosečan čovek može da zadrži pažnju duže od zlatne ribice.',
    options: ['Tačno', 'Netačno'],
    correctAnswerIndex: 1, // Netačno
    category: 'Istina ili Laž'
  },
  {
    id: 'q10',
    text: 'Možeš ubediti svoj mozak da si pijan tako što se ponašaš kao da si pio — čak i bez alkohola.',
    options: ['Tačno', 'Netačno'],
    correctAnswerIndex: 0, // Tačno
    category: 'Istina ili Laž'
  },
  {
    id: 'q11',
    text: 'Ljudi bolje prepoznaju laži dok žvaću žvaku.',
    options: ['Tačno', 'Netačno'],
    correctAnswerIndex: 1, // Netačno
    category: 'Istina ili Laž'
  },
  {
    id: 'q12',
    text: 'Veća je verovatnoća da ćeš se složiti s nekim ako piješ neki topli napitak dok pričate.',
    options: ['Tačno', 'Netačno'],
    correctAnswerIndex: 0, // Tačno
    category: 'Istina ili Laž'
  },
  {
    id: 'q13',
    text: 'Muzika može uticati na to kako doživljavamo ukus hrane.',
    options: ['Tačno', 'Netačno'],
    correctAnswerIndex: 0, // Tačno
    category: 'Istina ili Laž'
  },
  {
    id: 'q14',
    text: 'Neki ljudi razmišljaju bolje u toaletu.',
    options: ['Tačno', 'Netačno'],
    correctAnswerIndex: 0, // Tačno
    category: 'Istina ili Laž'
  },
  {
    id: 'q15',
    text: 'Mozak se "resetuje" svaki put kad kinemo.',
    options: ['Tačno', 'Netačno'],
    correctAnswerIndex: 1, // Netačno
    category: 'Istina ili Laž'
  },
  {
    id: 'q16',
    text: 'Kad pričamo sami sa sobom, postajemo pametniji.',
    options: ['Tačno', 'Netačno'],
    correctAnswerIndex: 0, // Tačno
    category: 'Istina ili Laž'
  },
  {
    id: 'q17',
    text: 'Ko živi ovde?',
    options: ['Carrie Bradshaw', 'Rachel Green', 'Jess Day', 'Mindy Lahiri'],
    correctAnswerIndex: 0, // Carrie Bradshaw
    category: 'Ko živi ovde?',
    imageUrl: '/assets/questions/Carrie_sex_i_grad.jpg'
  },
  {
    id: 'q18',
    text: 'Ko živi ovde?',
    options: ['Charlie Harper', 'Chandler Bing', 'Barney Stinson', 'Jake Peralta'],
    correctAnswerIndex: 0, // Charlie Harper
    category: 'Ko živi ovde?',
    imageUrl: '/assets/questions/Charlie_Dva_ipo_muskarca.jpg'
  },
  {
    id: 'q19',
    text: 'Ko živi ovde?',
    options: ['Hannah Montana', 'Lizzie McGuire', 'Raven Baxter', 'Alex Russo'],
    correctAnswerIndex: 0, // Hannah Montana
    category: 'Ko živi ovde?',
    imageUrl: '/assets/questions/Hannah_Montana.jpg'
  },
  {
    id: 'q20',
    text: 'Ko živi ovde?',
    options: ['Frodo Baggins', 'Harry Potter', 'Lucy Pevensie', 'Percy Jackson'],
    correctAnswerIndex: 0, // Frodo Baggins
    category: 'Ko živi ovde?',
    imageUrl: '/assets/questions/Hobit_Gospodar_prstenova.jpg'
  },
  {
    id: 'q21',
    text: 'Ko živi ovde?',
    options: ['Lorelai Gilmore', 'Sarah Braverman', 'Tami Taylor', 'Rebecca Pearson'],
    correctAnswerIndex: 0, // Lorelai Gilmore
    category: 'Ko živi ovde?',
    imageUrl: '/assets/questions/Lorelai_Gilmore_girls.jpg'
  },
  {
    id: 'q22',
    text: 'Ko živi ovde?',
    options: ['The Addams Family', 'Casper the Friendly Ghost', 'Beetlejuice', 'Ghostbusters'],
    correctAnswerIndex: 0, // The Addams Family
    category: 'Ko živi ovde?',
    imageUrl: '/assets/questions/Porodica_Adams.jpg'
  },
  {
    id: 'q23',
    text: 'Ko živi ovde?',
    options: ['Serena van der Woodsen', 'Elena Gilbert', 'Aria Montgomery', 'Marissa Cooper'],
    correctAnswerIndex: 0, // Serena van der Woodsen
    category: 'Ko živi ovde?',
    imageUrl: '/assets/questions/Serena_Gossip_girl.jpg'
  },
  {
    id: 'q24',
    text: 'Ko živi ovde?',
    options: ['Ted Mosby', 'Ross Geller', 'Nick Miller', 'Jim Halpert'],
    correctAnswerIndex: 0, // Ted Mosby
    category: 'Ko živi ovde?',
    imageUrl: '/assets/questions/Ted_How_I_met_your_mother.jpg'
  }
];

// Funkcija za upisivanje pitanja u bazu podataka
async function seedQuestions() {
  console.log('Starting to seed questions...');
  try {
    // Koristimo Promise.all da sačekamo da se sve operacije pisanja završe
    const writePromises = testQuestions.map(question => {
      console.log(`Preparing to add/update question ${question.id}: ${question.text}`);
      return set(ref(database, `questions/${question.id}`), question);
    });
    
    await Promise.all(writePromises);
    
    console.log('Successfully added/updated all questions in the database!');
  } catch (error) {
    console.error('Error seeding questions:', error);
    throw error;
  }
}

// Izvršavamo funkciju za seed i hendlujemo izlaz
(async () => {
  try {
    await seedQuestions();
    console.log('Finished seeding the database with questions.');
    process.exit(0); // Uspešno završeno
  } catch (err) {
    console.error('Seeding script failed.');
    process.exit(1); // Izlaz sa greškom
  }
})(); 