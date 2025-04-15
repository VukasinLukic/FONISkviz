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
  },
  // Pitanja za kategoriju "Koji film/serija je u pitanju?"
  {
    id: 'q25',
    text: 'Koji film/serija je u pitanju?',
    options: ['Ćari', 'Buffy the Vampire Slayer', 'Sabrina the Teenage Witch', 'Witches of East End'],
    correctAnswerIndex: 0, // Ćari (Charmed)
    category: 'Koji film/serija je u pitanju?',
    imageUrl: '/assets/questions/Cari.jpg'
  },
  {
    id: 'q26',
    text: 'Koji film/serija je u pitanju?',
    options: ['Harry Potter i odaja tajni', 'Fantastične zveri i gde ih naći', 'Harry Potter i kamen mudrosti', 'Harry Potter i zatočenik Azkabana'],
    correctAnswerIndex: 0, // Harry Potter i odaja tajni
    category: 'Koji film/serija je u pitanju?',
    imageUrl: '/assets/questions/Harry_Potter_2.jpg'
  },
  {
    id: 'q27',
    text: 'Koji film/serija je u pitanju?',
    options: ['Lajanje na zvezde', 'Munje!', 'Sedam i po', 'Mala noćna muzika'],
    correctAnswerIndex: 0, // Lajanje na zvezde
    category: 'Koji film/serija je u pitanju?',
    imageUrl: '/assets/questions/Lajanje_na_zvezde.jpg'
  },
  {
    id: 'q28',
    text: 'Koji film/serija je u pitanju?',
    options: ['Ljubav, navika, panika', 'Porodično blago', 'Lisice', 'Mješoviti brak'],
    correctAnswerIndex: 0, // Ljubav, navika, panika
    category: 'Koji film/serija je u pitanju?',
    imageUrl: '/assets/questions/Ljubav_navika_panika.jpg'
  },
  {
    id: 'q29',
    text: 'Koji film/serija je u pitanju?',
    options: ['Mi nismo anđeli', 'Munje!', 'Mrtav ladan', 'Sedam i po'],
    correctAnswerIndex: 0, // Mi nismo anđeli
    category: 'Koji film/serija je u pitanju?',
    imageUrl: '/assets/questions/Mi_nismo_andjeli.jpg'
  },
  {
    id: 'q30',
    text: 'Koji film/serija je u pitanju?',
    options: ['Otvorena vrata', 'Porodično blago', 'Stižu dolari', 'Kursadžije'],
    correctAnswerIndex: 0, // Otvorena vrata
    category: 'Koji film/serija je u pitanju?',
    imageUrl: '/assets/questions/Otvorena_vrata.jpg'
  },
  {
    id: 'q31',
    text: 'Koji film/serija je u pitanju?',
    options: ['Pretty Little Liars', 'Gossip Girl', 'Riverdale', 'The Vampire Diaries'],
    correctAnswerIndex: 0, // Pretty Little Liars
    category: 'Koji film/serija je u pitanju?',
    imageUrl: '/assets/questions/Pretty_little_liars.jpg'
  },
  {
    id: 'q32',
    text: 'Koji film/serija je u pitanju?',
    options: ['White Chicks', 'Norbit', 'Big Momma\'s House', 'The Hot Chick'],
    correctAnswerIndex: 0, // White Chicks
    category: 'Koji film/serija je u pitanju?',
    imageUrl: '/assets/questions/White_chicks.jpg'
  },
  // Pitanja za kategoriju "Pogodite crtani"
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
  // Pitanja za kategoriju "Pogodite fonisovca"
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
    text: 'Koliko sati dnevno treba da se uci ekonomija da bi se dobila desetka, po recima Dragane Kragulj?',
    options: ['20', '40', '25', '15'],
    correctAnswerIndex: 1, // 40 (assuming based on position)
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
    text: 'Koja od sledećih žurki ne postoji na FON-u?',
    options: ['FONight', 'FONcy', 'FONove', 'FONergy'],
    correctAnswerIndex: 3, // d) - (zero indexed)
    category: 'FON FON FONIS'
  },
  {
    id: 'q64',
    text: 'Koji je bio prvi osnovan smer na FON-u?',
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