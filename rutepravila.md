Ispod je detaljan pregled **ruta (putanja)** i **flow-a** za naš kviz sistem, podeljen prema ulozi koju korisnik ima. U aplikaciji postoje dve osnovne putanje:

1. **`/admin`** – za **laptop/projektor** (host i glavni ekran kviza)  
2. **`/player`** – za **telefon/e timova** (igrači koji odgovaraju na pitanja)

> Napomena: U praksi je najbolje da svaka od ovih ruta ima svoje child-rute (npr. `/admin/lobby`, `/player/join`), kako bi kod bio modularan i lako održiv.

---

## **1) Admin (Laptop / Projektor) rute**

Ovo je prikaz ekrana koji se projektuje na platno ili prati na glavnom laptopu gde je host kviza. Svaki od ovih ekrana je deo toka igre.

### A. `/admin/splash` (ili samo `/admin`)
- **Opis**: Početni ekran kada se pokrene kviz (maska, animacija, brendiranje).
- **Elementi**:  
  - Animacija maskote (npr. FONIS logo).  
  - Dugme “Create Game” / “Start New Quiz”.  
- **Kada se prelazi**: Nakon inicijalnog učitavanja aplikacije (ili kada se završi prethodna igra pa se kreće nova).  
- **Sledeća ruta**: `/admin/qr` (ili `/admin/qr-code`).

### B. `/admin/qr` (QR code page)
- **Opis**: Ekran generiše *kod igre* (npr. “OC0YMH”) i prikazuje QR kod koji timovi skeniraju telefonom.  
- **Elementi**:  
  - Veliki QR kod (ili samo text code).  
  - Uputstvo za timove: “Skenirajte kod ili ukucajte ID da biste se pridružili igri”.  
- **Kada prelazimo**: Host kreira novu igru → dobija jedinstveni gameId.  
- **Sledeća ruta**: `/admin/lobby`.

### C. `/admin/lobby`
- **Opis**: Ekran čekaonicе. Prikazuje sve registrovane timove, njihov naziv i maskotu.  
- **Elementi**:  
  - Spisak timova (ime, maskota, možda i status).  
  - Broj prijavljenih timova.  
  - Dugme “Start Game” (vidi ga samo host).  
- **Kada prelazimo**: Čim host odobri start (klik na “Start Game”).  
- **Sledeća ruta**: `/admin/question`.

### D. `/admin/question`
- **Opis**: Glavni prikaz pitanja na projektoru.  
- **Elementi**:  
  - Veliki tekst pitanja.  
  - Četiri odgovora (A, B, C, D).  
  - Timer bar (15s ili 20s).  
  - Diskretna animacija maskote / brending (opciono).  
- **Kada prelazimo**:  
  - Kada se vreme za odgovore završi (timer istekne) **ili** svi timovi pošalju odgovor.  
  - Prelazimo na `/admin/answer` ili direktno na `/admin/leaderboard` zavisno od logike (ali obično ide “prikaži tačan odgovor” pre leaderboard-a).

### E. `/admin/answer` (AnswerToQuestion)
- **Opis**: Ekran za prikaz tačnog odgovora na glavni ekran.  
- **Elementi**:  
  - Velika indikacija tačnog odgovora (npr. ako je A tačan, polje A pozeleni).  
  - Lista ili animacija timova koji su odgovorili tačno (npr. maskote + ime tima).  
  - Kratki zvučni efekti (isplivavanje +100 poena, netačni odgovori crveni).  
- **Kada prelazimo**: 2-3 sekunde nakon prikaza ili kad host klikne “Nastavi”.  
- **Sledeća ruta**: Ako je ovo bilo npr. 8. pitanje u jednoj rundi, prelazi se na `/admin/leaderboard`, inače natrag na novo `/admin/question`.

### F. `/admin/leaderboard`
- **Opis**: Kratki pregled rang-liste (može posle svake runde ili određene grupe pitanja).  
- **Elementi**:  
  - Top 3 tima (velike kartice s bodovima).  
  - Ostali timovi prikazani manjim fontom u listi ispod.  
  - Timer 5–10s do sledeće runde ili do narednog pitanja.  
- **Kada prelazimo**: Nakon što istekne taj timer ili host klikne “Next Round”.  
- **Sledeća ruta**: `/admin/question` (sledeća kategorija pitanja) ili `/admin/winners` (ako je kviz završen).

### G. `/admin/winners`
- **Opis**: Krajnji ekran. Proglašenje pobednika.  
- **Elementi**:  
  - Veliko “Čestitamo!” / “Winners”.  
  - Prvo, drugo, treće mesto, konfete.  
  - Dugme “Play Again” ili “Exit”.  
- **Kada prelazimo**: Kada kviz dođe do samog kraja.  
- **Sledeća ruta**: Može ponovo na `/admin/splash` ako se kreira nova igra.

---

## **2) Player (Telefon tima) rute**

Ove stranice prikazuje **svaki tim na svom telefonu**. Oni nemaju potrebu za punim prikazom, već fokus na interakciju (odgovori, bodovi…).

### A. `/player/join`
- **Opis**: Gde tim unosi kod igre **ili** skenira QR kod i upisuje svoj timski naziv, bira maskotu.  
- **Elementi**:  
  - Tekst polje “Game ID”.  
  - Tekst polje “Team Name”.  
  - Moguće dugme za odabir maskote ili emodžija.  
  - Dugme “Join Game” (disabled dok nisu uneta sva polja).  
- **Kada prelazimo**: Tim klikne “Join” → prelazi na `/player/waiting` (ili `/player/lobby`, zavisno od implementacije).

### B. `/player/waiting` (ili `/player/lobby`)
- **Opis**: Tim čeka da host pokrene igru.  
- **Elementi**:  
  - “Waiting for host to start…” poruka.  
  - Moguća lista ostalih timova (opciono).  
  - Moguće animacije / brending.  
- **Kada prelazimo**: Kad `gameState.status` postane `"question"`, tim prelazi na `/player/question`.

### C. `/player/question`
- **Opis**: Na telefonu se vide samo **tasteri za odgovor** (A, B, C, D) i **eventualno** kratka verzija pitanja (može i skraćeno).  
- **Elementi**:
  - Četiri dugmeta: A, B, C, D.  
  - Kada tim pritisne odgovor, to se snimi u bazu (npr. `teamAnswer`). Dugmad postaju disabled.  
  - **NAPOMENA**: Igrač može da vidi mali tajmer ili bar koji ističe.  
- **Kada prelazimo**:  
  - Kada istekne vreme za odgovor ili kada je odgovor registrovan, prelazi se na `/player/waiting-answer`.

### D. `/player/waiting-answer` (nakon odgovora)
- **Opis**: Telefonski ekran pokazuje “Vaš odgovor je zabeležen. Sačekajte rezultate…”.  
- **Elementi**:
  - Kratka animacija maskote ili info “Odgovorili ste: B”.  
  - “Čekamo ostale timove…” ili “Vreme ističe…”.  
- **Kada prelazimo**: Kada host prelazi na `/admin/answer`, i istekne timer, igrač prelazi na `/player/answers` ili `/player/how-many-points`.  
  - U nekim implementacijama odmah prelazi na “Rezultat” ekran.

### E. `/player/answers` (AnswerPage) ili `/player/how-many-points`
- **Opis**: Telefonski ekran pokazuje da li je tim odgovorio tačno i koliko je poena dobio.  
- **Elementi**:  
  - “+100 poena” ili “0 poena”.  
  - Eventualno kratak pregled tačnog odgovora.  
- **Kada prelazimo**: Posle 2-3 sekunde prelazimo na `/player/waiting` **ili** `/player/team-points`, zavisno od toga da li sledi leaderboard.

### F. `/player/team-points` (TeamPoints)
- **Opis**: Može biti isto što i “Leaderboard” na telefonu ili skraćeno obaveštenje.  
- **Elementi**:
  - Aktuelni skor tima.  
  - Poredak tima u odnosu na ostale (opcioni detalj).  
- **Kada prelazimo**: Kada host na projektoru pređe na `/admin/leaderboard`, igrači ovde mogu samo da čekaju.  
- **Sledeća ruta**: Kad krene sledeće pitanje (`/admin/question`), telefon se vraća na `/player/question`.

### G. `/player/winners` (Final Screen na telefonu)
- **Opis**: Kada se kviz završi, telefon pokazuje: “Kviz je gotov. Hvala na igri!”  
- **Elementi**:
  - Istaknuto mesto koje je tim zauzeo (npr. “Vi ste 5. od 10 ekipa”).  
  - Dugme “Nazad na početni ekran” (može da resetuje app → `/player/join`).  
- **Kada prelazimo**: Kada host dođe do `/admin/winners`.

---

## **3) Kratki pregled (Timeline)**

1. **Admin rute**:  
   - `/admin/splash` → admin kreira novu igru → prelazi na  
   - `/admin/qr` → generiše kod + QR → prelazi na  
   - `/admin/lobby` → čeka da se timovi pridruže → klik na “Start Game” → prelazi na  
   - `/admin/question` → prikazuje pitanje + timer → vreme istekne → prelazi na  
   - `/admin/answer` (ili `AnswerToQuestion`) → prikazuje tačan odgovor → prelazi na  
   - `/admin/question` (sledeće pitanje) ili `/admin/leaderboard` (kad završi runda) → nakon leaderboard-a → prelazi na  
   - `/admin/winners` (finalni ekran) → kraj igre.

2. **Player rute**:  
   - `/player/join` → unesu kod, ime, maskotu → prelazi na  
   - `/player/waiting` (Lobby ekvivalent) → kad admin startuje igru i `status=question` → prelazi na  
   - `/player/question` → kliknu odgovor → prelazi na  
   - `/player/waiting-answer` (dok ne prođe timer) → prelazi na  
   - `/player/answers` (tačno/netačno + poeni) → prelazi na  
   - `/player/team-points` (rezime bodova) → čeka sledeće pitanje ili runda → na kraju →  
   - `/player/winners` (finalni ekran)

---

## **4) Kako sve to treba da funkcioniše?**

1. **Firebase / Real-time**  
   - Svi admin i player ekrani prate jedan glavni `gameState`:  
     ```json
     {
       "status": "lobby" | "question" | "answer" | "leaderboard" | "final",
       "currentQuestionId": "q2",
       "timerEnd": 1681312345678
     }
     ```  
   - Telefoni (player) i projektor (admin) u zavisnosti od `status` prikazuju različite stranice.  

2. **Logika prelaza**  
   - Admin (ili sistem) menja `status` u “question” → Svi telefoni prelaze na `/player/question`.  
   - Timer istekne → admin prelazi `status` u “answer” → na projektoru `/admin/answer`, a telefoni → `/player/answers`.  
   - Kad je vreme da se prikažu rezultati za čitavu rundu, `status` = “leaderboard” → Admin vidi `/admin/leaderboard`, telefoni vide `/player/team-points`.  
   - Kad kviz završi, `status` = “final” → Svi prelaze na winners screen (`/admin/winners` + `/player/winners`).

3. **Synch**  
   - Timovi šalju svoje odgovore u `teams/[teamId]/answer`.  
   - Kada admin prebacuje igru na “answer”, sistem sabira bodove, upisuje u `teams/[teamId]/score`.  
   - Sve se dešava u real-time-u, pa igrači odmah vide ažurirani skor.

---

## **5) Zaključak**

- **`/admin/*`** rute kontrolišu **host** i glavni prikaz.  
- **`/player/*`** rute kontrolišu **igrači** i imaju fokus na input.  
- **Status** (ili faza igre) je jedinstven “kompas” za sve ekrane.  
- **Najvažnije** je da i admin i player ekrani osluškuju isti `gameState` i na osnovu njega prikazuju odgovarajući korak.

Tako dobijaš jasan, konzistentan i sinhronizovan **flow** između svih ekrana i uređaja, bez petljanja i konfuzije.