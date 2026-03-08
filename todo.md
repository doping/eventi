# EventiPro - TODO List

## Database & Schema
- [ ] Tabella eventi con campi completi (titolo, descrizione, data, luogo, coordinate, categoria, immagine, stato approvazione)
- [ ] Tabella categorie biglietti con prezzi e disponibilità per evento
- [ ] Tabella ordini con relazione utente e stato pagamento
- [ ] Tabella biglietti con QR code univoco e stato validazione
- [ ] Tabella commissioni configurabili per partner
- [ ] Tabella transazioni per tracking pagamenti Stripe
- [ ] Estensione tabella users con ruoli (admin, partner, user)

## Integrazione Stripe
- [x] Configurazione Stripe con webdev_add_feature
- [x] Setup chiavi API Stripe (test e production)
- [x] Implementazione checkout session per pagamenti
- [x] Gestione webhook Stripe per conferma pagamenti
- [x] Sistema di refund per cancellazioni

## Backend API - Eventi
- [x] API creazione evento (admin e partner)
- [x] API modifica evento con controllo permessi
- [x] API eliminazione evento
- [x] API lista eventi pubblici con filtri (categoria, data, luogo, ricerca)
- [x] API dettaglio evento singolo
- [x] API approvazione eventi partner (solo admin)
- [x] API statistiche vendite per evento

## Backend API - Ordini e Biglietti
- [x] API creazione ordine con carrello
- [x] API checkout e creazione sessione Stripe
- [x] API conferma ordine post-pagamento
- [x] API generazione biglietti PDF con QR code
- [x] API lista ordini utente
- [x] API dettaglio ordine con biglietti
- [x] API validazione biglietto tramite QR code
- [x] API prevenzione duplicati validazione

## Backend API - Sistema Commissioni
- [x] API configurazione commissioni globali (admin)
- [x] API calcolo commissioni per evento partner
- [x] API report guadagni partner
- [x] API report commissioni admin

## Frontend - Interfaccia Pubblica
- [ ] Homepage elegante con eventi in evidenza
- [ ] Catalogo eventi con card design raffinato
- [ ] Filtri avanzati (categoria, data, luogo, prezzo)
- [ ] Barra ricerca testuale eventi
- [ ] Pagina dettaglio evento con tutte le informazioni
- [ ] Selezione categoria biglietto e quantità
- [ ] Visualizzazione mappa location evento

## Frontend - Carrello e Checkout
- [ ] Carrello con riepilogo biglietti selezionati
- [ ] Modifica quantità e rimozione dal carrello
- [ ] Pagina checkout con form dati utente
- [ ] Integrazione Stripe Elements per pagamento
- [ ] Pagina conferma ordine con riepilogo
- [ ] Download immediato biglietti PDF

## Frontend - Dashboard Amministratore
- [ ] Layout dashboard admin con sidebar
- [ ] Panoramica vendite globali con grafici
- [ ] Lista tutti gli eventi con filtri
- [ ] Gestione approvazione eventi partner
- [ ] Configurazione commissioni sistema
- [ ] Scanner QR code per validazione biglietti
- [ ] Report vendite e analytics
- [ ] Gestione utenti e ruoli

## Frontend - Dashboard Partner
- [ ] Layout dashboard partner con sidebar
- [ ] Form creazione nuovo evento
- [ ] Lista eventi propri con stato approvazione
- [ ] Modifica eventi esistenti
- [ ] Statistiche vendite per evento
- [ ] Report guadagni con dettaglio commissioni
- [ ] Calendario eventi pubblicati

## Frontend - Area Utente
- [ ] Pagina profilo con dati personali
- [ ] Storico ordini completo
- [ ] Dettaglio ordine con lista biglietti
- [ ] Download/ristampa biglietti PDF
- [ ] Gestione preferenze notifiche

## Sistema Email Automatiche
- [ ] Template email conferma ordine
- [ ] Email con allegato biglietti PDF
- [ ] Email promemoria evento 24h prima
- [ ] Notifica admin per nuovo evento partner
- [ ] Alert admin per milestone vendite
- [ ] Sistema scheduling email promemoria

## Mappe Interattive
- [ ] Integrazione Google Maps per location eventi
- [ ] Visualizzazione marker evento su mappa
- [ ] Indicazioni stradali verso venue
- [ ] Ricerca venue nelle vicinanze
- [ ] Preview satellite del luogo

## Analisi Predittiva LLM
- [ ] Integrazione LLM per analisi vendite
- [ ] Suggerimenti pricing ottimale per eventi
- [ ] Identificazione trend eventi popolari
- [ ] Report insights automatici
- [ ] Dashboard analytics con AI insights

## Design e UX
- [ ] Palette colori elegante per contesto culturale
- [ ] Typography raffinata (font serif per titoli)
- [ ] Componenti UI personalizzati
- [ ] Animazioni fluide e transizioni
- [ ] Responsive design completo
- [ ] Dark mode opzionale

## Testing e Ottimizzazioni
- [ ] Test unitari backend API
- [ ] Test integrazione Stripe
- [ ] Test generazione PDF e QR code
- [ ] Test validazione biglietti
- [ ] Test email automatiche
- [ ] Ottimizzazione performance query database
- [ ] Ottimizzazione caricamento immagini eventi

## Documentazione
- [ ] README con istruzioni setup
- [ ] Documentazione API
- [ ] Guida utente per admin
- [ ] Guida utente per partner
- [ ] Istruzioni deployment e configurazione


## Completati
- [x] Tabella eventi con campi completi (titolo, descrizione, data, luogo, coordinate, categoria, immagine, stato approvazione)
- [x] Tabella categorie biglietti con prezzi e disponibilità per evento
- [x] Tabella ordini con relazione utente e stato pagamento
- [x] Tabella biglietti con QR code univoco e stato validazione
- [x] Tabella commissioni configurabili per partner
- [x] Tabella transazioni per tracking pagamenti Stripe
- [x] Estensione tabella users con ruoli (admin, partner, user)


## Testing e Dati di Esempio
- [x] Script seed per popolare database con eventi finti
- [x] Verifica visualizzazione eventi nel catalogo


## Pagine Frontend Mancanti
- [x] Pagina dettaglio evento con selezione biglietti
- [x] Carrello e checkout con Stripe
- [x] Pagina conferma ordine e generazione biglietti
- [x] Pagina "I Miei Biglietti" con storico ordini
- [x] Registrazione route in App.tsx

## Dashboard Admin
- [x] Pagina dashboard admin con statistiche vendite globali
- [x] Gestione eventi (lista, approvazione partner, modifica, eliminazione)
- [x] Gestione ordini e biglietti
- [x] Validazione biglietti tramite QR code
- [x] Gestione utenti e ruoli
- [x] Route /admin registrata in App.tsx

## Gestione Completa Eventi
- [x] API modifica evento (titolo, descrizione, data, luogo, immagine, stato)
- [x] API creazione/modifica/eliminazione categorie biglietti (nome, prezzo, quantità disponibile)
- [x] Pagina /events/:id/edit con form completo modifica evento
- [x] Sezione gestione categorie biglietti nella pagina modifica evento
- [x] Pulsante "Modifica" nella dashboard admin tabella eventi
- [x] Dashboard partner /partner con lista eventi propri e form creazione
- [x] Route /partner e /events/:id/edit in App.tsx

## Bug Fix - Pagina Conferma Ordine
- [x] Creazione pagina /checkout/success con dettagli ordine e biglietti
- [x] Visualizzazione QR code per ogni biglietto acquistato
- [x] Pulsante download PDF biglietto
- [x] Correzione URL success Stripe che punta a /checkout/success
- [x] Route /checkout/success e /checkout/cancel in App.tsx

## Bug Fix - Download PDF Biglietti
- [x] Fix errore download PDF (generazione lato browser con jsPDF)
- [x] PDF elegante con QR code, dettagli evento e dati biglietto
- [x] Fix Link annidati in tutte le pagine (Home, MyTickets, AdminDashboard, EventEdit, PartnerDashboard, CheckoutSuccess)

## Fix UI - Navbar Responsive
- [x] Menu hamburger a comparsa su mobile
- [x] Navbar non sfonda su schermi piccoli
- [x] Componente Navbar riutilizzabile creato

## Fix Flusso Post-Acquisto
- [x] Pulizia DB: eliminazione ordini falliti/in attesa
- [x] Tabella orderItems per tracciare articoli carrello
- [x] Fix mutation confirm: genera biglietti automaticamente post-pagamento
- [x] Mostrare solo ordini completati in "I Miei Biglietti"
- [x] Generazione PDF automatica al caricamento pagina CheckoutSuccess
- [x] Notifica admin Manus per ogni nuovo ordine completato
