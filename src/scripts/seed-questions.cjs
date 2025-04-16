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
  // Geography questions
  {
    id: "q1",
    text: "Koja država ima najviše susednih država u Africi?",
    options: ["Egipat", "Sudan", "Demokratska Republika Kongo", "Čad"],
    correctAnswer: "Demokratska Republika Kongo",
    correctAnswerIndex: 2,
    category: "Ko zna Zna?"
  },
  {
    id: "q2",
    text: "Koji je najmanje naseljen kontinent (ne računajući Antarktik)?",
    options: ["Australija", "Evropa", "Južna Amerika", "Azija"],
    correctAnswer: "Australija",
    correctAnswerIndex: 0,
    category: "Ko zna Zna?"
  },
  {
    id: "q3",
    text: "U kojem okeanu se nalazi najdublja tačka Zemlje – Marijanski rov?",
    options: ["Atlantski", "Tihi", "Indijski", "Južni"],
    correctAnswer: "Tihi",
    correctAnswerIndex: 1,
    category: "Ko zna Zna?"
  },
  {
    id: "q4",
    text: "Koji grad se smatra najsevernijim glavnim gradom sveta?",
    options: ["Oslo", "Rejkjavik", "Helsinki", "Nuuk"],
    correctAnswer: "Rejkjavik",
    correctAnswerIndex: 1,
    category: "Ko zna Zna?"
  },
  {
    id: "q5",
    text: "Koja država ima najvišu prosečnu nadmorsku visinu?",
    options: ["Nepal", "Butan", "Bolivija", "Švajcarska"],
    correctAnswer: "Bolivija",
    correctAnswerIndex: 2,
    category: "Ko zna Zna?"
  },
  {
    id: "q6",
    text: "Koja reka čini prirodnu granicu između SAD i Meksika?",
    options: ["Kolorado", "Misisipi", "Rio Grande", "Yukon"],
    correctAnswer: "Rio Grande",
    correctAnswerIndex: 2,
    category: "Ko zna Zna?"
  },
  {
    id: "q7",
    text: "Koja je najsušnija nenaseljena pustinja na svetu?",
    options: ["Atakama", "Sahara", "Gobi", "Kalahari"],
    correctAnswer: "Atakama",
    correctAnswerIndex: 0,
    category: "Ko zna Zna?"
  },
  {
    id: "q8",
    text: "Koja planina nije deo planinskog lanca Himalaja?",
    options: ["K2", "Annapurna", "Kangchenjunga", "Ararat"],
    correctAnswer: "Ararat",
    correctAnswerIndex: 3,
    category: "Ko zna Zna?"
  },
  
  // Movie questions
  {
    id: "q9",
    text: "Koji reditelj je najviše puta osvojio Oskara za režiju?",
    options: ["Martin Scorsese", "Steven Spielberg", "John Ford", "Billy Wilder"],
    correctAnswer: "John Ford",
    correctAnswerIndex: 2,
    category: "Koji film/serija je u pitanju?"
  },
  {
    id: "q10",
    text: "U kojem filmu se pojavljuje izmišljeni jezik \"Na'vi\"?",
    options: ["Interstellar", "Avatar", "Dune", "Ender's Game"],
    correctAnswer: "Avatar",
    correctAnswerIndex: 1,
    category: "Koji film/serija je u pitanju?"
  },
  {
    id: "q11",
    text: "Koji film je najduži (po trajanju) dobitnik Oskara za najbolji film?",
    options: ["Lawrence of Arabia", "Gone with the Wind", "The Godfather Part II", "Titanic"],
    correctAnswer: "Gone with the Wind",
    correctAnswerIndex: 1,
    category: "Koji film/serija je u pitanju?"
  },
  {
    id: "q12",
    text: "Ko je tumačio lik Hannibala Lectera u filmu \"Manhunter\" iz 1986?",
    options: ["Anthony Hopkins", "Brian Cox", "Mads Mikkelsen", "Richard Harris"],
    correctAnswer: "Brian Cox",
    correctAnswerIndex: 1,
    category: "Koji film/serija je u pitanju?"
  },
  {
    id: "q13",
    text: "Koji film je imao radni naziv \"Blue Harvest\" tokom produkcije?",
    options: ["Alien", "Empire Strikes Back", "Return of the Jedi", "Raiders of the Lost Ark"],
    correctAnswer: "Return of the Jedi",
    correctAnswerIndex: 2,
    category: "Koji film/serija je u pitanju?"
  },
  {
    id: "q14",
    text: "Koji glumac NIJE bio u filmu \"The Thin Red Line\"?",
    options: ["Sean Penn", "John Travolta", "George Clooney", "Tom Hanks"],
    correctAnswer: "Tom Hanks",
    correctAnswerIndex: 3,
    category: "Koji film/serija je u pitanju?"
  },
  {
    id: "q15",
    text: "Koji film je osvojio Zlatnu palmu u Kanu 2019. godine?",
    options: ["Joker", "Parasite", "1917", "Roma"],
    correctAnswer: "Parasite",
    correctAnswerIndex: 1,
    category: "Koji film/serija je u pitanju?"
  },
  {
    id: "q16",
    text: "U kom filmu postoji lik po imenu Keyser Söze?",
    options: ["Heat", "The Usual Suspects", "Memento", "American Psycho"],
    correctAnswer: "The Usual Suspects",
    correctAnswerIndex: 1,
    category: "Koji film/serija je u pitanju?"
  },
  
  // Gaming questions
  {
    id: "q17",
    text: "Koja igrica je prva koristila sistem proceduralno generisanog sveta?",
    options: ["Minecraft", "Rogue", "Elite", "Diablo"],
    correctAnswer: "Elite",
    correctAnswerIndex: 2,
    category: "Ko živi ovde?"
  },
  {
    id: "q18",
    text: "U kojoj igri se pojavljuje lik po imenu Arthas Menethil?",
    options: ["Diablo", "World of Warcraft", "The Elder Scrolls", "Dark Souls"],
    correctAnswer: "World of Warcraft",
    correctAnswerIndex: 1,
    category: "Ko živi ovde?"
  },
  {
    id: "q19",
    text: "Koja kompanija je razvila igru \"Hollow Knight\"?",
    options: ["Supergiant Games", "Team Cherry", "Devolver Digital", "Motion Twin"],
    correctAnswer: "Team Cherry",
    correctAnswerIndex: 1,
    category: "Ko živi ovde?"
  },
  {
    id: "q20",
    text: "Koji FPS serijal je započeo kao mod za Half-Life?",
    options: ["Call of Duty", "Counter-Strike", "Battlefield", "Doom"],
    correctAnswer: "Counter-Strike",
    correctAnswerIndex: 1,
    category: "Ko živi ovde?"
  },
  {
    id: "q21",
    text: "Koji RPG je poznat po sistemu \"V.A.T.S.\"?",
    options: ["Cyberpunk 2077", "Fallout", "Dragon Age", "The Witcher"],
    correctAnswer: "Fallout",
    correctAnswerIndex: 1,
    category: "Ko živi ovde?"
  },
  {
    id: "q22",
    text: "U kojoj igri se prvi put pojavio Mario?",
    options: ["Mario Bros", "Donkey Kong", "Super Mario World", "Super Mario 64"],
    correctAnswer: "Donkey Kong",
    correctAnswerIndex: 1,
    category: "Ko živi ovde?"
  },
  {
    id: "q23",
    text: "Koja je najprodavanija konzolna igra svih vremena?",
    options: ["Grand Theft Auto V", "Wii Sports", "Red Dead Redemption 2", "The Last of Us"],
    correctAnswer: "Wii Sports",
    correctAnswerIndex: 1,
    category: "Ko živi ovde?"
  },
  {
    id: "q24",
    text: "Koja igra se odigrava u izmišljenom gradu Rapture?",
    options: ["Prey", "System Shock", "Bioshock", "Half-Life 2"],
    correctAnswer: "Bioshock",
    correctAnswerIndex: 2,
    category: "Ko živi ovde?"
  },
  
  // IT questions
  {
    id: "q25",
    text: "Koji programerski jezik je poznat po tzv. \"white space-sensitive\" sintaksi?",
    options: ["Java", "Python", "C++", "Ruby"],
    correctAnswer: "Python",
    correctAnswerIndex: 1,
    category: "Pogodite crtani"
  },
  {
    id: "q26",
    text: "Koja je maksimalna vrednost za 32-bitni bezpredznakovni integer?",
    options: ["2^31 - 1", "2^32 - 1", "2^32", "2^64 - 1"],
    correctAnswer: "2^32 - 1",
    correctAnswerIndex: 1,
    category: "Pogodite crtani"
  },
  {
    id: "q27",
    text: "Koji operativni sistem koristi \"XNU\" kao kernel?",
    options: ["Linux", "Windows", "macOS", "Android"],
    correctAnswer: "macOS",
    correctAnswerIndex: 2,
    category: "Pogodite crtani"
  },
  {
    id: "q28",
    text: "Šta predstavlja skraćenica RAID u kontekstu skladištenja podataka?",
    options: ["Random Access Indexed Data", "Redundant Array of Independent Disks", "Rapid Application and Integration Deployment", "Real-time Access Interface Design"],
    correctAnswer: "Redundant Array of Independent Disks",
    correctAnswerIndex: 1,
    category: "Pogodite crtani"
  },
  {
    id: "q29",
    text: "Koja mrežna adresa se koristi za broadcast u IPv4?",
    options: ["192.168.1.1", "127.0.0.1", "255.255.255.255", "0.0.0.0"],
    correctAnswer: "255.255.255.255",
    correctAnswerIndex: 2,
    category: "Pogodite crtani"
  },
  {
    id: "q30",
    text: "Koja je osnovna razlika između TCP i UDP protokola?",
    options: ["TCP je brži", "UDP je pouzdaniji", "TCP ima potvrdu prijema, UDP ne", "UDP koristi više portova"],
    correctAnswer: "TCP ima potvrdu prijema, UDP ne",
    correctAnswerIndex: 2,
    category: "Pogodite crtani"
  },
  {
    id: "q31",
    text: "Ko je tvorac GNU projekta?",
    options: ["Linus Torvalds", "Steve Wozniak", "Richard Stallman", "Dennis Ritchie"],
    correctAnswer: "Richard Stallman",
    correctAnswerIndex: 2,
    category: "Pogodite crtani"
  },
  {
    id: "q32",
    text: "Koji je najčešće korišćen port za HTTP protokol?",
    options: ["21", "22", "80", "443"],
    correctAnswer: "80",
    correctAnswerIndex: 2,
    category: "Pogodite crtani"
  },
  {
    id: 'q33',
    text: 'Pogodite crtani',
    correctAnswer: 'Andjela Anakonda',
    category: 'Pogodite crtani',
    imageUrl: '/assets/questions/Andjela_Anakonda.jpg'
  },
  {
    id: 'q34',
    text: 'Pogodite crtani',
    correctAnswer: 'Galakticki fudbal',
    category: 'Pogodite crtani',
    imageUrl: '/assets/questions/Galakticki_fudbal.jpg'
  },
  {
    id: 'q35',
    text: 'Pogodite crtani',
    correctAnswer: 'Hajdi',
    category: 'Pogodite crtani',
    imageUrl: '/assets/questions/Hajdi.jpg'
  },
  {
    id: 'q36',
    text: 'Pogodite crtani',
    correctAnswer: 'Kod lioko',
    category: 'Pogodite crtani',
    imageUrl: '/assets/questions/Kod_lioko.jpg'
  },
  {
    id: 'q37',
    text: 'Pogodite crtani',
    correctAnswer: 'Kraljevstvo macaka',
    category: 'Pogodite crtani',
    imageUrl: '/assets/questions/Kraljevstvo_macaka.jpg'
  },
  {
    id: 'q38',
    text: 'Pogodite crtani',
    correctAnswer: 'Nodi',
    category: 'Pogodite crtani',
    imageUrl: '/assets/questions/Nodi.jpg'
  },
  {
    id: 'q39',
    text: 'Pogodite crtani',
    correctAnswer: 'Pingvini sa Madagaskara',
    category: 'Pogodite crtani',
    imageUrl: '/assets/questions/Pingvini_sa_madagaskara.jpg'
  },
  {
    id: 'q40',
    text: 'Pogodite crtani',
    correctAnswer: 'Super spijunke',
    category: 'Pogodite crtani',
    imageUrl: '/assets/questions/Super_spijunke.jpg'
  },
  {
    id: 'q41',
    text: 'Pogodite fonisovca',
    correctAnswer: 'Danica Zivkovic',
    category: 'Pogodite fonisovca',
    imageUrl: '/assets/questions/Danica_Zivkovic.jpg'
  },
  {
    id: 'q42',
    text: 'Pogodite fonisovca',
    correctAnswer: 'Danny',
    category: 'Pogodite fonisovca',
    imageUrl: '/assets/questions/Danny.jpg'
  },
  {
    id: 'q43',
    text: 'Pogodite fonisovca',
    correctAnswer: 'Filip Lazarevic',
    category: 'Pogodite fonisovca',
    imageUrl: '/assets/questions/Filip_Lazarevic.jpg'
  },
  {
    id: 'q44',
    text: 'Pogodite fonisovca',
    correctAnswer: 'Jovana Gole',
    category: 'Pogodite fonisovca',
    imageUrl: '/assets/questions/Jovana_Gole.jpg'
  },
  {
    id: 'q45',
    text: 'Pogodite fonisovca',
    correctAnswer: 'Kosta Acimovic',
    category: 'Pogodite fonisovca',
    imageUrl: '/assets/questions/Kosta_Acimovic.jpg'
  },
  {
    id: 'q46',
    text: 'Pogodite fonisovca',
    correctAnswer: 'Matija Vujic',
    category: 'Pogodite fonisovca',
    imageUrl: '/assets/questions/Matija_Vujic.jpg'
  },
  {
    id: 'q47',
    text: 'Pogodite fonisovca',
    correctAnswer: 'Mihajlo Dunjic',
    category: 'Pogodite fonisovca',
    imageUrl: '/assets/questions/Mihajlo_Dunjic.jpg'
  },
  {
    id: 'q48',
    text: 'Pogodite fonisovca',
    correctAnswer: 'Zeljana Kosanin',
    category: 'Pogodite fonisovca',
    imageUrl: '/assets/questions/Zeljana_Kosanin.jpg'
  },
  // Pogodi Pesmu na osnovu Emoji-a
  {
    id: 'q49',
    text: 'Pogodi Pesmu na osnovu Emoji-a',
    correctAnswer: 'Rodjena sa vukovima',
    category: 'Pogodi Pesmu na osnovu Emoji-a',
    imageUrl: '/assets/questions/Rodjena sa vukovima.PNG'
  },
  {
    id: 'q50',
    text: 'Pogodi Pesmu na osnovu Emoji-a',
    correctAnswer: 'Poker u dvoje',
    category: 'Pogodi Pesmu na osnovu Emoji-a',
    imageUrl: '/assets/questions/Poker u dvoje.jpg'
  },
  {
    id: 'q51',
    text: 'Pogodi Pesmu na osnovu Emoji-a',
    correctAnswer: 'Poker face',
    category: 'Pogodi Pesmu na osnovu Emoji-a',
    imageUrl: '/assets/questions/Poker face.jpg'
  },
  {
    id: 'q52',
    text: 'Pogodi Pesmu na osnovu Emoji-a',
    correctAnswer: 'Maskarada',
    category: 'Pogodi Pesmu na osnovu Emoji-a',
    imageUrl: '/assets/questions/Maskarada.jpg'
  },
  {
    id: 'q53',
    text: 'Pogodi Pesmu na osnovu Emoji-a',
    correctAnswer: 'Ledena',
    category: 'Pogodi Pesmu na osnovu Emoji-a',
    imageUrl: '/assets/questions/Ledena.PNG'
  },
  {
    id: 'q54',
    text: 'Pogodi Pesmu na osnovu Emoji-a',
    correctAnswer: 'Kisa je padala a ja sam plakao za njom',
    category: 'Pogodi Pesmu na osnovu Emoji-a',
    imageUrl: '/assets/questions/Kisa je padala a ja sam plakao za njom.jpg'
  },
  {
    id: 'q55',
    text: 'Pogodi Pesmu na osnovu Emoji-a',
    correctAnswer: 'Harem',
    category: 'Pogodi Pesmu na osnovu Emoji-a',
    imageUrl: '/assets/questions/Harem.jpg'
  },
  {
    id: 'q56',
    text: 'Pogodi Pesmu na osnovu Emoji-a',
    correctAnswer: 'Daj joj moje haljine',
    category: 'Pogodi Pesmu na osnovu Emoji-a',
    imageUrl: '/assets/questions/Daj joj moje haljine.PNG'
  },
  // FON FON FONIS category
  {
    id: 'q57',
    text: 'Kako ide ceo naziv FONIS-a?',
    options: ['Fakultetska organizacija novih informacionih sistema', 'Forum organizacionih nauka i informacionih sistema', 'Udruženje studenata informatike Fakulteta organizacionih nauka', 'Fakultetska organizacija za napredne IT sisteme'],
    correctAnswerIndex: 2, // c) - (zero indexed)
    category: 'FON FON FONIS'
  },
  {
    id: 'q58',
    text: 'Kada je osnovano udruženje FONIS, studentska IT organizacija na FON-u?',
    options: ['2000. godine', '2004. godine', '2008. godine', '2011. godine'],
    correctAnswerIndex: 0, // a) - (zero indexed)
    category: 'FON FON FONIS'
  },
  {
    id: 'q59',
    text: 'Koja je tačna adresa Fakulteta organizacionih nauka (FON)?',
    options: ['Vojvode Stepe 134', 'Jove Ilića 154', 'Vojvode Stepe 154', 'Jove Ilića 134'],
    correctAnswerIndex: 1, // b) - (zero indexed)
    category: 'FON FON FONIS'
  },
  {
    id: 'q60',
    text: 'Koliko sati nedeljno treba da se uči ekonomija da bi se dobila desetka, po rečima Dragane Kragulj?',
    options: ['20', '40', '25', '15'],
    correctAnswerIndex: 2, // 25 (assuming based on position)
    category: 'FON FON FONIS'
  },
  {
    id: 'q61',
    text: 'Koji od sledećih alata ne postoji i ne može da koristi student FON-a?',
    options: ['Google Chrome Extension Puskice.fon', 'FON GPT – digitalni AI asistent', 'FONflix – platforma za strimovanje predavanja', 'FON Office 365 – pristup Microsoft alatima'],
    correctAnswerIndex: 2, // c) - (zero indexed)
    category: 'FON FON FONIS'
  },
  {
    id: 'q62',
    text: 'Kada je osnovan Fakultet organizacionih nauka (FON)?',
    options: ['1964. godine', '1969. godine', '1974. godine', '1980. godine'],
    correctAnswerIndex: 1, // b) - (zero indexed)
    category: 'FON FON FONIS'
  },
  {
    id: 'q63',
    text: 'Koja od sledećih žurki koju organiziju FON-ovci, zapravo ne postoji?',
    options: ['FONight', 'FONcy', 'FONove', 'FONergy'],
    correctAnswerIndex: 3, // d) - (zero indexed)
    category: 'FON FON FONIS'
  },
  {
    id: 'q64',
    text: 'Koji je bio prvi osnovani smer na FON-u?',
    options: ['Proizvodno-kibernetski', 'Industrijsko inženjerstvo', 'Proizvodni menadžment', 'Uslužni menadžment'],
    correctAnswerIndex: 0, // a) - (zero indexed)
    category: 'FON FON FONIS'
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