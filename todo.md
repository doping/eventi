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

## Nuove Funzionalità - Sprint 3
- [x] Sistema validazione QR code con URL pubblico /verify/:qrCode
- [x] Pagina pubblica di verifica biglietto con stato (non verificato / già usato)
- [x] Prevenzione doppia scansione con messaggio di errore
- [x] Supporto eventi multi-data (stesso evento, date/orari diversi)
- [x] Schema DB: tabella eventDates separata per le date
- [x] UI gestione date aggiuntive in EventEdit
- [x] Pannello admin personalizzazione sito /site-settings
- [x] Tabella siteSettings nel DB per configurazioni
- [x] API per lettura/scrittura impostazioni sito (getAll, get, set, setBulk)
- [x] Link Impostazioni Sito nella navbar per admin (desktop + mobile)

## Sprint 4 - Upload Immagini, Nuovo Evento, Filtro Passati
- [x] API upload immagini su S3 (endpoint /api/upload/image)
- [x] Componente ImageUpload riutilizzabile con drag&drop e preview
- [x] Pagina /events/new per creazione evento da zero
- [x] Link "Crea Evento" nella navbar per admin/partner
- [x] Sostituzione campo URL immagine con upload in EventEdit
- [x] Sostituzione campo URL logo con upload in SiteSettings
- [x] Filtro eventi passati dalla homepage (solo eventi futuri)
- [x] Aggiornamento date eventi seed al futuro (2026)
- [x] API pubblica filtra per data >= oggi

## Bug Fix - Impostazioni Sito Non Applicate
- [x] Context globale SiteSettings che carica impostazioni dal DB
- [x] Applicazione dinamica colori CSS via CSS variables
- [x] Logo dinamico nella navbar dal DB
- [x] Nome sito dinamico nella navbar

## Sprint 5 - Admin Dashboard e Impostazioni Dinamiche
- [x] Spostare "Crea Evento" dalla navbar alla Dashboard Admin
- [x] Form creazione evento funzionante nella Dashboard Admin
- [x] Rimuovere link "Crea Evento" e "I Miei Eventi" dalla navbar (sono funzioni admin)
- [x] SiteSettingsContext globale che carica impostazioni dal DB all'avvio
- [x] Applicazione dinamica colori CSS via CSS variables (--color-primary ecc.)
- [x] Logo dinamico nella navbar dal DB
- [x] Nome sito dinamico nella navbar

## Sprint 6 - Email Automatiche Post-Acquisto
- [ ] Campo "Email notifiche admin" nelle siteSettings (chiave: notification_email)
- [ ] Helper emailSender.ts con Nodemailer per invio email HTML
- [ ] Template email HTML per acquirente: conferma ordine + lista biglietti + QR code
- [ ] Template email HTML per admin: notifica nuovo ordine con dettagli
- [ ] Invio email acquirente nella mutation confirm (dopo generazione biglietti)
- [ ] Invio copia email all'indirizzo fisso configurato in siteSettings
- [ ] Campo email notifiche nel pannello /site-settings (tab Contatti)
- [ ] Gestione errori email (non blocca il flusso se email fallisce)

## Sprint 7 - Nuove Funzionalità (Richiesta Utente)

### UX Acquisto
- [x] Bottone "Acquista da €XX" sticky in basso su mobile (stile PayPal, blu arrotondato)
- [x] Bottone visibile sempre durante lo scroll della pagina evento

### Filtri e Ricerca
- [x] Filtro eventi per nome/titolo evento
- [x] Filtro per data con calendario (date picker)
- [x] Combinazione filtri data + categoria + ricerca testo

### Dati Cliente al Checkout
- [x] Campo Nome obbligatorio al checkout
- [x] Campo Email obbligatorio al checkout
- [x] Campo Paese obbligatorio al checkout (select con lista paesi)
- [x] Salvataggio dati cliente nell'ordine
- [x] Email conferma acquirente con voucher PDF allegato (o link download)
- [x] Email notifica all'indirizzo aziendale configurabile

### Landing Page Contatti (modificabili da admin)
- [x] Pagina /eventi-privati con form contatto + testo modificabile da admin
- [x] Pagina /sei-una-location con form contatto + testo modificabile da admin
- [x] Pagina /sei-un-artista con form contatto + testo modificabile da admin
- [x] Pagina /sei-un-creator con form contatto + testo modificabile da admin
- [x] Pagina /lavora-con-noi con form contatto + testo modificabile da admin
- [x] Tabella contactPages nel DB per testi modificabili
- [x] Link a queste pagine nel footer del sito e nel menu Navbar (dropdown "Collabora")

### Newsletter
- [x] Form iscrizione newsletter (nome + email) nel footer del sito
- [x] Tabella newsletter_subscribers nel DB
- [x] API iscrizione newsletter (publicProcedure)

### Recensioni
- [x] Tabella reviews nel DB (userId, eventId, rating 1-5, testo, data)
- [x] API creazione recensione
- [x] API lista recensioni per evento (pubblica)
- [x] Sezione recensioni nella pagina dettaglio evento
- [x] Stelle interattive per votazione

### Termini e Condizioni / FAQ
- [x] Pagina /termini-e-condizioni con T&C e FAQ accordion
- [x] Contenuto T&C e FAQ modificabile da admin via siteSettings
- [x] Link nel footer e nel menu Navbar

### Contatti Aziendali
- [x] Link Termini & FAQ nel footer e navbar

### Eventi Ricorrenti
- [x] Opzione "tipo evento" nel form creazione evento (singolo / date multiple / location multiple)
- [x] Tipo 1: stesso evento, location diversa (UI per aggiungere location aggiuntive)
- [x] Tipo 2: stesso evento, date diverse (usa tabella eventDates, aggiunge date automaticamente)
- [x] UI per aggiungere date/location multiple nel form creazione evento
- [x] Pagina /orders per storico ordini utente

## Sprint 8 - Fix UX e Performance

- [x] Errori form tradotti in italiano leggibile (no stringhe tecniche Zod)
- [x] Campo "Indirizzo" reso opzionale nel backend (venueAddress)
- [x] Timer carrello 5 minuti con conto alla rovescia e urgenza marketing
- [x] Upload immagine con indicazioni formato/dimensioni visibili
- [x] Ottimizzazione immagini: conversione WebP + thumbnail mobile al momento dell'upload
- [x] Indicatore qualità immagine caricata (dimensioni, formato, peso)

## Sprint 9 - Branding, Bug Fix, Multilingua, Admin Avanzato

### Branding OperaMix
- [ ] Sostituire "EventiPro" con "OperaMix" in tutti i file frontend/backend
- [ ] Aggiornare VITE_APP_TITLE a "OperaMix"
- [ ] Aggiornare meta title/description nelle pagine HTML
- [ ] Evitare flash "EVENTIPRO" durante caricamento (favicon, title tag)

### Bug Critici Checkout
- [ ] Fix bottone "Acquista" mobile: deve scrollare ai biglietti (anchor), non aprire checkout
- [ ] Fix errori casuali "Procedi acquisto" (anche da admin/utente loggato)
- [ ] Fix bug quantità biglietti: + e - non aggiungono più di 1 per categoria
- [ ] Dopo login, tornare al carrello/evento precedente (non homepage)
- [ ] Fix 404 su URL /orders/330001 dopo pagamento — gestire pagina thank you

### Guest Checkout
- [ ] Permettere acquisto senza account
- [ ] Form ospite: nazione, nome, cognome, email, conferma email
- [ ] Campo conferma email: bloccare copia-incolla (onPaste preventDefault)
- [ ] Validazione email corrispondenti lato frontend e backend

### Filtri Homepage
- [ ] Fix filtro date: includere la data finale (es. 10 luglio incluso)
- [ ] Calendario: aprire il mese della data già selezionata, altrimenti mese corrente

### SEO Slug URL
- [ ] Generare slug leggibile per ogni evento (nome-data-location)
- [ ] Aggiungere colonna slug nella tabella events
- [ ] Route /eventi/:slug invece di /eventi/:id
- [ ] Redirect da vecchi URL /eventi/:id ai nuovi slug
- [ ] Meta tags Open Graph per ogni evento

### Newsletter GDPR
- [x] Aggiungere checkbox consenso privacy nel form iscrizione newsletter
- [x] Salvare timestamp consenso nel DB
- [x] Pannello admin: lista iscritti newsletter con data iscrizione e consenso
- [x] Export CSV iscritti newsletter dall'admin
- [x] Aggiungere sezione GDPR/Privacy nelle FAQ

### Admin Avanzato
- [x] Pagina admin: log errori sito (tabella errorLogs nel DB)
- [x] Sezione admin: gestione categorie eventi (crea/modifica/elimina)
- [x] Sezione admin: modifica testi pagine contatto (eventi privati, location, artisti, ecc.)
- [x] Sezione admin: modifica FAQ e T&C
- [x] Export intero DB in formato JSON per backup

### Multilingua
- [x] Implementare i18n con react-i18next
- [x] Lingue: Italiano (default), English, Español, Русский
- [x] Selettore lingua nella navbar (bandierine + codice)
- [x] Tradurre tutte le stringhe UI principali
- [x] Rilevamento automatico lingua browser con fallback italiano

### PayPal
- [x] Verificato: PayPal Orders API v2 compatibile con Express/Node.js
- [x] Documentato cosa serve per configurare PayPal
- [ ] Integrazione PayPal (rimandato a sprint successivo)
- [ ] Scelta metodo pagamento pre-checkout Stripe/PayPal (rimandato)

## Sprint 10 - SEO Slug Avanzato

- [ ] Slug generato solo alla creazione evento (non si aggiorna se cambia il titolo)
- [ ] Campo slug modificabile manualmente in EventEdit
- [ ] Tabella slugRedirects nel DB per tracciare i vecchi slug
- [ ] Redirect 301 server-side quando si visita un vecchio slug
- [ ] Aggiornare tutti i link /events/:id → /eventi/:slug nel frontend
- [ ] Generare slug retroattivi per eventi esistenti senza slug
- [ ] Sitemap.xml dinamica con tutti gli eventi
- [ ] robots.txt aggiornato con link alla sitemap

## Sprint 10 - SEO Slug + Multilingua Fix (COMPLETATO)

- [x] Slug generato una sola volta alla creazione evento (non si aggiorna se cambia il titolo)
- [x] Campo slug modificabile manualmente in EventEdit
- [x] Tabella slugRedirects nel DB per redirect 301 quando lo slug cambia
- [x] Backend: salva redirect automaticamente quando admin cambia slug manualmente
- [x] Route GET /sitemap.xml dinamica con tutti gli eventi pubblicati
- [x] Route GET /robots.txt con link alla sitemap
- [x] Endpoint /api/seo/check-redirect/:slug per controllo redirect lato frontend
- [x] Fix multilingua: useTranslation integrato in Navbar e Home
- [x] Tutte le stringhe principali UI tradotte in IT/EN/ES/RU
- [x] Calendario date usa locale corretto in base alla lingua selezionata
