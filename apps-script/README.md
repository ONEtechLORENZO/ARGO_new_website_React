# Modulo "Richiedi Demo" → email con Google Apps Script

Il sito invia ogni richiesta a questo script, che spedisce:

1. **a sales@otech.one** — tutti i dati (Azienda, Nome Referente, Email, Telefono / WhatsApp, Settore, Ruolo, Interesse, Messaggio). Premendo *Rispondi* si scrive direttamente al cliente.
2. **al cliente** — la conferma "Gentile *nome*, grazie per aver richiesto una demo di ARGO…" (in inglese se ha usato il sito in inglese). Se risponde, la risposta va a sales@otech.one.

## Installazione (una volta sola, ~5 minuti)

Fare tutto **con l'account Google da cui devono partire le email** (idealmente sales@otech.one o un account Google Workspace di One Tech).

1. Vai su <https://script.google.com> → **Nuovo progetto**. Rinominalo, es. *ARGO – Richiedi Demo*.
2. Cancella il contenuto di `Code.gs` e incolla tutto il file [`Code.gs`](./Code.gs).
3. **Impostazioni progetto** (icona ingranaggio) → **Proprietà script** → **Aggiungi proprietà**:
   - Proprietà: `DEMO_SECRET`
   - Valore: una stringa lunga e casuale, es. generata con un password manager (40+ caratteri). Copiala: serve al punto 6.
4. Torna all'editor, seleziona la funzione **`testSend`** e premi **Esegui**. Google chiede i permessi (invio email per tuo conto): concedili.
   Arrivano due email di prova: una a sales@otech.one e la conferma al tuo indirizzo.
5. **Esegui il deployment → Nuovo deployment** → tipo **App web**:
   - Esegui come: **Me**
   - Chi ha accesso: **Chiunque**
   - **Esegui il deployment** e copia l'**URL dell'app web** (termina con `/exec`).
6. Nel sito, crea (o modifica) il file `.env.local` nella cartella principale del progetto:

   ```
   DEMO_WEBHOOK_URL=https://script.google.com/macros/s/…/exec
   DEMO_WEBHOOK_SECRET=la-stessa-stringa-del-punto-3
   ```

   Riavvia il sito (`npm run dev` / `npm start`), oppure imposta le stesse due variabili nel pannello del tuo hosting.

Fatto: da ora ogni richiesta inviata dal sito arriva via email.

## Note

- **Modifiche allo script**: dopo ogni modifica serve *Esegui il deployment → Gestisci deployment → Modifica → Nuova versione*, altrimenti l'URL continua a usare la versione precedente.
- **Sicurezza**: lo script accetta solo richieste con il segreto giusto; ricontrolla tutti i campi; il testo inserito dagli utenti viene reso innocuo prima di finire nell'HTML; massimo 3 richieste ogni 10 minuti per lo stesso indirizzo email.
- **Limiti di invio di Google**: circa 100 email al giorno con un account Gmail gratuito, 1.500 con Google Workspace (ogni richiesta ne usa 2).
- **Immagini delle email**: le intestazioni sono quelle del template Canva (`canva-cdn.email`). Se un giorno smettessero di caricarsi, basta caricarle sul sito (es. `public/email/…`) e aggiornare gli indirizzi in `CONFIG.IMAGES`.
- **Errori**: in caso di problemi il sito mostra all'utente "Invio non riuscito… scrivici a sales@otech.one"; i dettagli sono in Apps Script → **Esecuzioni**.
