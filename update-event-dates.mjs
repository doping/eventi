import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Update all events to future dates (2026)
const updates = [
  { id: 1, date: '2026-05-15 20:30:00' },
  { id: 2, date: '2026-06-20 21:00:00' },
  { id: 3, date: '2026-07-10 21:00:00' },
  { id: 4, date: '2026-12-31 21:00:00' },
  { id: 5, date: '2026-08-05 21:00:00' },
  { id: 6, date: '2026-09-18 20:30:00' },
  { id: 7, date: '2026-10-22 20:30:00' },
  { id: 8, date: '2026-11-14 20:00:00' },
];

for (const u of updates) {
  await conn.execute('UPDATE events SET eventDate = ? WHERE id = ?', [u.date, u.id]);
  console.log(`Updated event ${u.id} to ${u.date}`);
}

await conn.end();
console.log('All event dates updated!');
