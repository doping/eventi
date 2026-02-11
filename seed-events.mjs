import { drizzle } from 'drizzle-orm/mysql2';
import { events, ticketCategories, commissionSettings, users } from './drizzle/schema.js';
import 'dotenv/config';

const db = drizzle(process.env.DATABASE_URL);

async function seedEvents() {
  console.log('🌱 Seeding database with sample events...');

  try {
    // Get or create admin user (owner)
    const adminUsers = await db.select().from(users).where({ role: 'admin' }).limit(1);
    let adminId;
    
    if (adminUsers.length === 0) {
      console.log('⚠️  No admin user found. Please login first to create admin user.');
      process.exit(1);
    } else {
      adminId = adminUsers[0].id;
      console.log(`✓ Using admin user: ${adminUsers[0].name} (ID: ${adminId})`);
    }

    // Set default commission for partners (15%)
    await db.insert(commissionSettings).values({
      partnerId: null,
      commissionPercentage: '15.00',
      isActive: true,
    }).onDuplicateKeyUpdate({ set: { isActive: true } });
    console.log('✓ Default commission set to 15%');

    // Sample events data
    const sampleEvents = [
      {
        title: 'La Traviata - Giuseppe Verdi',
        description: 'Una delle opere più amate di Verdi, la storia di Violetta Valéry e del suo tragico amore. Orchestra Sinfonica Nazionale diretta dal Maestro Carlo Rizzi.',
        category: 'lirica',
        eventDate: new Date('2026-03-15T20:00:00'),
        venueName: 'Teatro alla Scala',
        venueAddress: 'Via Filodrammatici, 2',
        venueCity: 'Milano',
        venueLatitude: '45.4673',
        venueLongitude: '9.1899',
        imageUrl: 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800&q=80',
        status: 'approved',
        organizerId: adminId,
        isPartnerEvent: false,
        ticketCategories: [
          { name: 'Platea', description: 'Posti in platea centrale', price: 120, quantity: 200 },
          { name: 'Palco', description: 'Palchi laterali', price: 150, quantity: 80 },
          { name: 'Galleria', description: 'Posti in galleria', price: 60, quantity: 300 },
        ],
      },
      {
        title: 'Concerto di Capodanno - Orchestra Filarmonica',
        description: 'Il tradizionale concerto di Capodanno con le più belle melodie di Johann Strauss, Brahms e Mozart. Direttore: Riccardo Muti.',
        category: 'classica',
        eventDate: new Date('2026-01-01T18:00:00'),
        venueName: 'Auditorium Parco della Musica',
        venueAddress: 'Viale Pietro de Coubertin, 30',
        venueCity: 'Roma',
        venueLatitude: '41.9344',
        venueLongitude: '12.4656',
        imageUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&q=80',
        status: 'approved',
        organizerId: adminId,
        isPartnerEvent: false,
        ticketCategories: [
          { name: 'Poltronissima', description: 'Prime file centrali', price: 90, quantity: 150 },
          { name: 'Poltrona', description: 'Posti centrali', price: 65, quantity: 250 },
          { name: 'Tribuna', description: 'Posti laterali', price: 40, quantity: 200 },
        ],
      },
      {
        title: 'Il Barbiere di Siviglia - Rossini',
        description: 'La celebre opera buffa di Gioachino Rossini in una nuova produzione moderna e coinvolgente. Regia di Davide Livermore.',
        category: 'lirica',
        eventDate: new Date('2026-04-20T20:30:00'),
        venueName: 'Teatro Regio',
        venueAddress: 'Piazza Castello, 215',
        venueCity: 'Torino',
        venueLatitude: '45.0703',
        venueLongitude: '7.6869',
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
        status: 'approved',
        organizerId: adminId,
        isPartnerEvent: false,
        ticketCategories: [
          { name: 'Platea', description: 'Posti in platea', price: 85, quantity: 180 },
          { name: 'Palco I ordine', description: 'Palchi primo ordine', price: 110, quantity: 60 },
          { name: 'Loggione', description: 'Posti in loggione', price: 35, quantity: 250 },
        ],
      },
      {
        title: 'Le Quattro Stagioni - Vivaldi',
        description: 'Il capolavoro di Antonio Vivaldi eseguito da I Solisti Veneti. Un viaggio attraverso le stagioni con strumenti barocchi originali.',
        category: 'classica',
        eventDate: new Date('2026-02-28T21:00:00'),
        venueName: 'Teatro La Fenice',
        venueAddress: 'Campo San Fantin, 1965',
        venueCity: 'Venezia',
        venueLatitude: '45.4336',
        venueLongitude: '12.3336',
        imageUrl: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800&q=80',
        status: 'approved',
        organizerId: adminId,
        isPartnerEvent: false,
        ticketCategories: [
          { name: 'Platea', description: 'Posti in platea centrale', price: 75, quantity: 160 },
          { name: 'Palchi', description: 'Palchi laterali', price: 95, quantity: 70 },
          { name: 'Galleria', description: 'Posti in galleria', price: 45, quantity: 220 },
        ],
      },
      {
        title: 'Aida - Giuseppe Verdi',
        description: 'La monumentale opera di Verdi ambientata nell\'antico Egitto. Produzione con scenografie spettacolari e oltre 200 artisti in scena.',
        category: 'lirica',
        eventDate: new Date('2026-05-10T20:00:00'),
        venueName: 'Arena di Verona',
        venueAddress: 'Piazza Bra, 1',
        venueCity: 'Verona',
        venueLatitude: '45.4390',
        venueLongitude: '10.9943',
        imageUrl: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&q=80',
        status: 'approved',
        organizerId: adminId,
        isPartnerEvent: false,
        ticketCategories: [
          { name: 'Poltronissima Gold', description: 'Prime file centrali', price: 180, quantity: 100 },
          { name: 'Poltronissima', description: 'Posti centrali premium', price: 140, quantity: 200 },
          { name: 'Poltrona', description: 'Posti centrali', price: 90, quantity: 400 },
          { name: 'Gradinata', description: 'Gradinate', price: 50, quantity: 800 },
        ],
      },
      {
        title: 'Sinfonia n. 9 - Beethoven',
        description: 'La maestosa Nona Sinfonia di Beethoven con l\'Inno alla Gioia. Orchestra e Coro del Teatro Comunale di Bologna.',
        category: 'classica',
        eventDate: new Date('2026-03-25T20:30:00'),
        venueName: 'Teatro Comunale',
        venueAddress: 'Largo Respighi, 1',
        venueCity: 'Bologna',
        venueLatitude: '44.4949',
        venueLongitude: '11.3426',
        imageUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&q=80',
        status: 'approved',
        organizerId: adminId,
        isPartnerEvent: false,
        ticketCategories: [
          { name: 'Platea', description: 'Posti in platea', price: 70, quantity: 180 },
          { name: 'Palco', description: 'Palchi', price: 85, quantity: 80 },
          { name: 'Galleria', description: 'Posti in galleria', price: 40, quantity: 200 },
        ],
      },
      {
        title: 'Romeo e Giulietta - Balletto di Prokofiev',
        description: 'Il celebre balletto di Sergej Prokofiev interpretato dal Corpo di Ballo del Teatro San Carlo. Coreografia di Kenneth MacMillan.',
        category: 'danza',
        eventDate: new Date('2026-04-05T19:30:00'),
        venueName: 'Teatro San Carlo',
        venueAddress: 'Via San Carlo, 98',
        venueCity: 'Napoli',
        venueLatitude: '40.8378',
        venueLongitude: '14.2491',
        imageUrl: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=800&q=80',
        status: 'approved',
        organizerId: adminId,
        isPartnerEvent: false,
        ticketCategories: [
          { name: 'Platea', description: 'Posti in platea', price: 80, quantity: 200 },
          { name: 'Palco', description: 'Palchi', price: 100, quantity: 90 },
          { name: 'Loggione', description: 'Posti in loggione', price: 35, quantity: 280 },
        ],
      },
      {
        title: 'Concerto di Pianoforte - Chopin e Liszt',
        description: 'Serata dedicata ai grandi compositori romantici con il pianista Maurizio Pollini. Programma: Ballate di Chopin e Rapsodie Ungheresi di Liszt.',
        category: 'classica',
        eventDate: new Date('2026-06-12T21:00:00'),
        venueName: 'Sala Verdi del Conservatorio',
        venueAddress: 'Via Conservatorio, 12',
        venueCity: 'Milano',
        venueLatitude: '45.4627',
        venueLongitude: '9.1943',
        imageUrl: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800&q=80',
        status: 'approved',
        organizerId: adminId,
        isPartnerEvent: false,
        ticketCategories: [
          { name: 'Platea', description: 'Posti in platea', price: 55, quantity: 150 },
          { name: 'Galleria', description: 'Posti in galleria', price: 30, quantity: 180 },
        ],
      },
    ];

    // Insert events and their ticket categories
    for (const eventData of sampleEvents) {
      const { ticketCategories: categories, ...eventInfo } = eventData;
      
      // Insert event
      const result = await db.insert(events).values(eventInfo);
      const eventId = Number(result[0].insertId);
      
      console.log(`✓ Created event: ${eventInfo.title}`);

      // Insert ticket categories for this event
      for (const category of categories) {
        await db.insert(ticketCategories).values({
          eventId,
          name: category.name,
          description: category.description,
          price: category.price.toString(),
          totalQuantity: category.quantity,
          availableQuantity: category.quantity,
        });
      }
      
      console.log(`  → Added ${categories.length} ticket categories`);
    }

    console.log('\n✅ Database seeded successfully!');
    console.log(`📊 Created ${sampleEvents.length} events with ticket categories`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

seedEvents();
