import { app, database } from '../firebase';
import { ref, remove } from 'firebase/database';

// Funkcija za resetovanje čvorova baze podataka
async function resetDatabase(resetQuestions = false) {
  console.log('Započeto resetovanje baze podataka...');
  try {
    // Uvek resetujemo game, answers, scores jer su to čvorovi vezani za igru
    console.log('Resetovanje stanja igre (game)...');
    await remove(ref(database, 'game'));
    
    console.log('Resetovanje odgovora (answers)...');
    await remove(ref(database, 'answers'));
    
    console.log('Resetovanje skorova (scores)...');
    await remove(ref(database, 'scores'));
    
    // Timove resetujemo ali pitamo prvo, jer deaktivacija je bolja opcija nego brisanje
    const shouldResetTeams = process.argv.includes('--reset-teams');
    if (shouldResetTeams) {
      console.log('Resetovanje timova (teams)...');
      await remove(ref(database, 'teams'));
    } else {
      console.log('Preskočeno resetovanje timova. Koristi --reset-teams da resetuješ timove.');
    }
    
    // Pitanja resetujemo samo ako je eksplicitno traženo
    if (resetQuestions) {
      console.log('Resetovanje pitanja (questions)...');
      await remove(ref(database, 'questions'));
      console.log('Pitanja su obrisana. Potrebno je ponovo pokrenuti seed-questions.');
    } else {
      console.log('Preskočeno resetovanje pitanja. Koristi --reset-questions da resetuješ pitanja.');
    }
    
    console.log('Baza podataka je uspešno resetovana!');
  } catch (error) {
    console.error('Greška pri resetovanju baze:', error);
  }
}

// Proveri argumente za resetovanje pitanja
const shouldResetQuestions = process.argv.includes('--reset-questions');

// Pokreni funkciju za resetovanje
resetDatabase(shouldResetQuestions).then(() => {
  console.log('Završeno resetovanje baze podataka.');
  process.exit(0);
}).catch(error => {
  console.error('Greška:', error);
  process.exit(1);
}); 