/**
 * Seed script - Populates database with sample data
 * Run: node seed.js
 */

require('dotenv').config();
const { initDatabase, getDb } = require('./services/database');
const { v4: uuidv4 } = require('uuid');

console.log('🌱 Seeding Galilee Connect database...\n');

initDatabase();
const db = getDb();

// Sample members
const members = [
    { first: 'Mary', last: 'Johnson', email: 'mary.johnson@example.com', phone: '(256) 555-0101', birthday: '03-15', anniversary: '06-20' },
    { first: 'James', last: 'Williams', email: 'james.williams@example.com', phone: '(256) 555-0102', birthday: '07-22', anniversary: null },
    { first: 'Dorothy', last: 'Brown', email: 'dorothy.brown@example.com', phone: '(256) 555-0103', birthday: '01-08', anniversary: '09-14' },
    { first: 'Robert', last: 'Davis', email: 'robert.davis@example.com', phone: '(256) 555-0104', birthday: '11-30', anniversary: null },
    { first: 'Patricia', last: 'Wilson', email: 'patricia.wilson@example.com', phone: '(256) 555-0105', birthday: '05-12', anniversary: '12-25' },
    { first: 'Michael', last: 'Anderson', email: 'michael.anderson@example.com', phone: '(256) 555-0106', birthday: '08-03', anniversary: null },
    { first: 'Linda', last: 'Thomas', email: 'linda.thomas@example.com', phone: '(256) 555-0107', birthday: '02-14', anniversary: '02-14' },
    { first: 'William', last: 'Jackson', email: 'william.jackson@example.com', phone: '(256) 555-0108', birthday: '10-19', anniversary: '04-10' },
    { first: 'Barbara', last: 'White', email: 'barbara.white@example.com', phone: '(256) 555-0109', birthday: '06-01', anniversary: null },
    { first: 'Richard', last: 'Harris', email: 'richard.harris@example.com', phone: '(256) 555-0110', birthday: '04-28', anniversary: '08-15' },
    { first: 'Susan', last: 'Martin', email: 'susan.martin@example.com', phone: '(256) 555-0111', birthday: '12-03', anniversary: null },
    { first: 'Joseph', last: 'Thompson', email: 'joseph.thompson@example.com', phone: '(256) 555-0112', birthday: '09-07', anniversary: '11-22' },
    { first: 'Margaret', last: 'Garcia', email: 'margaret.garcia@example.com', phone: null, birthday: '01-25', anniversary: null },
    { first: 'Charles', last: 'Robinson', email: 'charles.robinson@example.com', phone: '(256) 555-0114', birthday: '07-04', anniversary: null },
    { first: 'Elizabeth', last: 'Clark', email: 'elizabeth.clark@example.com', phone: '(256) 555-0115', birthday: '03-21', anniversary: '05-30' },
];

// Add a member with today's birthday for testing
const today = new Date();
const todayMMDD = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
members.push({
    first: 'Grace',
    last: 'Today',
    email: 'grace.today@example.com',
    phone: '(256) 555-0116',
    birthday: todayMMDD,
    anniversary: todayMMDD
});

const insertMember = db.prepare(`
    INSERT OR IGNORE INTO members (uuid, first_name, last_name, email, phone, birthday, anniversary, join_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, date('now', '-' || abs(random() % 365) || ' days'))
`);

let inserted = 0;
for (const m of members) {
    try {
        insertMember.run(uuidv4(), m.first, m.last, m.email, m.phone, m.birthday, m.anniversary);
        inserted++;
        console.log(`  ✅ ${m.first} ${m.last}`);
    } catch (err) {
        console.log(`  ⚠️  ${m.first} ${m.last}: ${err.message}`);
    }
}

// Add some sample message log entries
const sampleMessages = [
    { type: 'bible_verse', name: 'Mary Johnson', channel: 'email', subject: '📖 Daily Verse: Psalm 118:24', body: 'Psalm 118:24', status: 'sent' },
    { type: 'bible_verse', name: 'James Williams', channel: 'email', subject: '📖 Daily Verse: Psalm 118:24', body: 'Psalm 118:24', status: 'sent' },
    { type: 'birthday', name: 'Dorothy Brown', channel: 'email', subject: '🎂 Happy Birthday, Dorothy!', body: 'Happy Birthday!', status: 'sent' },
    { type: 'anniversary', name: 'Linda Thomas', channel: 'email', subject: '💒 Happy Anniversary, Linda!', body: 'Happy Anniversary!', status: 'sent' },
    { type: 'manual', name: 'All Members', channel: 'email', subject: 'Sunday Service Reminder', body: 'See you this Sunday!', status: 'sent' },
];

const insertLog = db.prepare(`
    INSERT INTO message_log (member_id, member_name, channel, message_type, subject, body, status, sent_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '-' || ? || ' hours'))
`);

for (let i = 0; i < sampleMessages.length; i++) {
    const m = sampleMessages[i];
    try {
        insertLog.run(i + 1, m.name, m.channel, m.type, m.subject, m.body, m.status, i * 6);
    } catch (err) {
        // Ignore
    }
}

console.log(`\n✅ Seeded ${inserted} members and ${sampleMessages.length} message log entries`);
console.log(`🎂 Grace Today has today's birthday (${todayMMDD}) for testing\n`);
console.log('🙏 Done! Start the server with: npm start');
